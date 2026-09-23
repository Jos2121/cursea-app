import { defineHandler } from "nitro";
import { readBody, createError, setResponseStatus } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body || !body.whatsappNumber) {
    throw createError({ statusCode: 400, statusMessage: "whatsappNumber is required" });
  }

  const { 
    backgroundUrl, userPhotoUrl, titulo, artista, dedicatoria, whatsappNumber, config,
    paraQuien, ocasion, estiloMusical, tipoVoz, tono, nombreDedicado, historia 
  } = body;
  
  const cleanPhone = whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');

  // 1. Buscamos el trabajo existente limpiando el número
  const result = await pool.query(
    `SELECT * FROM "MediaJob" 
     WHERE REPLACE(REPLACE("whatsappNumber", '+', ''), ' ', '') LIKE $1 
     ORDER BY "createdAt" DESC LIMIT 1`,
    [`%${cleanPhone}%`]
  );

  const job = result.rows[0];

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: "Petición original no encontrada. Asegúrate de usar el mismo número de WhatsApp." });
  }

  if (job.generaciones >= 2) {
    throw createError({ statusCode: 403, statusMessage: "Límite de 2 generaciones alcanzado." });
  }

  // Generamos el nuevo prompt
  const promptGenerado = `Actúa como un productor musical de talla mundial y un letrista galardonado. Tu objetivo es componer y producir una pista de calidad de estudio basada en los siguientes metadatos.

[DIRECCIÓN ACÚSTICA Y MUSICAL]
- Género y Estilo: ${estiloMusical}.
- Calidad de Producción: Alta fidelidad, mezcla estéreo inmersiva, instrumentación profesional, masterización estándar de radio.
- Atmósfera General: ${tono}.
- Pista Vocal: Voz ${tipoVoz}, interpretación profundamente emotiva, dicción cristalina, afinación perfecta, presencia frontal en la mezcla.

[CONTEXTO DE LA LETRA]
- Destinatario: ${paraQuien} (Nombre: ${nombreDedicado}).
- Ocasión / Motivo Central: ${ocasion}.
- Material Fuente (Nuestra Historia): "${historia}".

[DIRECTRICES DE COMPOSICIÓN]
1. Transformación Poética: Extrae los sentimientos, anécdotas y detalles del "Material Fuente" y conviértelos en metáforas visuales. No hagas un resumen o una lista de hechos; crea una declaración natural y emocional.
2. Sinergia Rítmica: Adapta la métrica de los versos para que fluya naturalmente con el tempo y los patrones rítmicos típicos del género ${estiloMusical}.
3. Estructura Obligatoria: Formatea la letra utilizando corchetes para guiar la generación musical. Debes incluir:
[Intro] (Establece el ambiente musical)
[Verse 1] (Introduce la historia de forma sutil)
[Pre-Chorus] (Construye la emoción)
[Chorus] (El clímax pegadizo que resalta el motivo de la canción)
[Verse 2] (Profundiza en un detalle específico de la historia)
[Chorus]
[Bridge] (Pico emocional y variación melódica)
[Chorus]
[Outro] (Cierre musical gradual)`;

  // Actualizamos el job existente sumando a generaciones y actualizando datos
  const updateResult = await pool.query(
    `UPDATE "MediaJob" 
     SET generaciones = COALESCE(generaciones, 0) + 1, 
         prompt = $2, 
         "userPhotoUrl" = $3, 
         "backgroundUrl" = $4,
         titulo = $5,
         artista = $6,
         dedicatoria = $7,
         config = $8,
         status = 'processing',
         "updatedAt" = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      job.id,
      promptGenerado,
      userPhotoUrl || null,
      backgroundUrl || null,
      titulo || null,
      artista || null,
      dedicatoria || null,
      config ? JSON.stringify(config) : null
    ]
  );

  const updatedJob = updateResult.rows[0];

  // Responde INMEDIATAMENTE al frontend
  setResponseStatus(event, 202);
  
  // Start background process
  processJob(updatedJob).catch((err) => {
    console.error("Background processing failed for retry job:", updatedJob.id, err);
    pool.query(`UPDATE "MediaJob" SET status = 'error', "updatedAt" = NOW() WHERE id = $1`, [updatedJob.id]).catch(console.error);
  });

  return {
    ok: true,
    id: updatedJob.id,
    message: "Segundo intento en proceso",
    paymentWhatsappNumber: process.env.VITE_WHATSAPP_PAYMENT_NUMBER || process.env.WHATSAPP_PAYMENT_NUMBER || ''
  };
});

async function processJob(job: any) {
  const { id: jobId, titulo, artista, dedicatoria, userPhotoUrl, backgroundUrl, config, prompt } = job;

  // Ensure media dir exists
  const mediaDir = path.resolve(process.cwd(), "public/media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  // 2. GENERATE AUDIO via OpenRouter (Lyria)
  // Utilizamos el prompt maestro si existe, si no, uno simple
  const lyriaPrompt = prompt || `Una canción titulada "${titulo || 'Sin Título'}" por ${artista || 'Artista Desconocido'} con la dedicatoria: ${dedicatoria || ''}`;
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  
  const model = process.env.OPENROUTER_MODEL || "google/lyria-3-pro-preview";
  const referer = process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency";

  let response;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "Cursea Digital"
        },
        body: JSON.stringify({
          model: model,
          modalities: ["text", "audio"],
          audio: { voice: "alloy", format: "mp3" },
          stream: true,
          messages: [{ role: "user", content: lyriaPrompt }]
        })
      });

      if (response.ok) break;
      
      const errorText = await response.text();
      console.error(`OpenRouter Error Body (Attempt ${attempts}):`, errorText);
      if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 3000));
      else throw new Error("Failed to generate audio from OpenRouter");
    } catch (err: any) {
      if (attempts >= maxAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  if (!response || !response.body) throw new Error("No response body received from OpenRouter");

  let fullBase64Audio = "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let bufferStr = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bufferStr += decoder.decode(value, { stream: true });
      const lines = bufferStr.split("\n");
      bufferStr = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;

        try {
          const chunkJson = JSON.parse(trimmed.slice(6));
          const audioData = chunkJson.choices?.[0]?.delta?.audio?.data;
          if (audioData) fullBase64Audio += audioData;
        } catch (e) {
          // ignore parse errors for partial chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullBase64Audio) throw new Error("Stream ended without audio data");

  const audioBuffer = Buffer.from(fullBase64Audio, 'base64');
  const audioFileName = `audio_${Date.now()}.mp3`;
  const relativeAudioUrl = `/media/${audioFileName}`;
  const audioPath = path.join(mediaDir, audioFileName);
  
  fs.writeFileSync(audioPath, audioBuffer);

  await pool.query(
    `UPDATE "MediaJob" SET "audioUrl" = $1, status = 'audio_ready', "updatedAt" = NOW() WHERE id = $2`,
    [relativeAudioUrl, jobId]
  );

  // 3. GENERATE VIDEO via FFmpeg
  let tempPhotoPath = "";
  let tempBgPath = "";

  const finalPhotoUrl = userPhotoUrl;
  const finalBgStr = backgroundUrl || 'image_f840ac.jpg';

  // Download user photo
  if (finalPhotoUrl) {
    const isLocalPath = finalPhotoUrl.startsWith('/media/');
    if (isLocalPath) {
      tempPhotoPath = path.join(mediaDir, finalPhotoUrl.replace('/media/', ''));
    } else if (finalPhotoUrl.startsWith('http')) {
      const imageRes = await fetch(finalPhotoUrl);
      if (imageRes.ok) {
        tempPhotoPath = path.join(mediaDir, `temp_photo_${Date.now()}.jpg`);
        fs.writeFileSync(tempPhotoPath, Buffer.from(await imageRes.arrayBuffer()));
      }
    }
  }

  // Handle background
  if (finalBgStr.startsWith('http')) {
    const bgRes = await fetch(finalBgStr);
    if (bgRes.ok) {
      tempBgPath = path.join(mediaDir, `temp_bg_${Date.now()}.jpg`);
      fs.writeFileSync(tempBgPath, Buffer.from(await bgRes.arrayBuffer()));
    }
  } else {
    const localBgPath = path.join(mediaDir, finalBgStr.replace('/media/', ''));
    if (fs.existsSync(localBgPath)) tempBgPath = localBgPath;
  }

  const videoFileName = `video_${Date.now()}.mp4`;
  const videoPath = path.join(mediaDir, videoFileName);

  const sanitize = (str: string) => {
    if (!str) return "";
    return str.replace(/:/g, "\\:").replace(/'/g, "\u2019").replace(/"/g, "\u201D").replace(/[\n\r]/g, " ");
  };
  
  const wrapText = (str: string, maxCharsPerLine = 34) => {
    if (!str) return "";
    const words = str.trim().split(/\s+/);
    let lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  };

  const safeTitulo = sanitize(titulo);
  const safeArtista = sanitize(artista);
  const escapedDedicatoria = wrapText(sanitize(dedicatoria));

  const t = config || {
    photo: { x: 130, y: 180, w: 820, h: 820 },
    titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
    artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
    dedicatoria: { x: 'center', y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' }
  };

  const dedicatoriaX = t.dedicatoria?.x !== 'center' ? Number(t.dedicatoria?.x) : 540;
  const dedicatoriaY = Number(t.dedicatoria?.y) || 1620;
  const dedicatoriaSize = Number(t.dedicatoria?.fontSize) || 28;
  const dedicatoriaColor = t.dedicatoria?.color || 'white';

  const photoW = Number(t.photo?.w) || 820;
  const photoH = Number(t.photo?.h) || 820;
  const photoX = Number(t.photo?.x) || 130;
  const photoY = Number(t.photo?.y) || 180;

  const bgInput = tempBgPath ? `-loop 1 -framerate 1 -i "${tempBgPath}"` : `-f lavfi -i color=c=black:s=1080x1920:r=1`;

  let filter = `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2[bg_base];`;
  
  if (tempPhotoPath) {
    filter += `[0:v]scale=w=${photoW}:h=${photoH}:force_original_aspect_ratio=increase,crop=${photoW}:${photoH}:(in_w-${photoW})/2:(in_h-${photoH})/2[photo];`;
    filter += `[bg_base][photo]overlay=x=${photoX}:y=${photoY}[v1]`;
  } else {
    filter += `[bg_base]copy[v1]`;
  }

  let lastV = 'v1';
  let vIndex = 2;
  
  if (safeTitulo) {
    const xPos = t.titulo.align === 'center' ? '(w-text_w)/2' : t.titulo.x;
    filter += `;[${lastV}]drawtext=text='${safeTitulo}':fontcolor=${t.titulo.color}:fontsize=${t.titulo.fontSize}:x=${xPos}:y=${t.titulo.y}[v${vIndex}]`;
    lastV = `v${vIndex}`;
    vIndex++;
  }
  
  if (safeArtista) {
    const xPos = t.artista.align === 'center' ? '(w-text_w)/2' : t.artista.x;
    filter += `;[${lastV}]drawtext=text='${safeArtista}':fontcolor=${t.artista.color}:fontsize=${t.artista.fontSize}:x=${xPos}:y=${t.artista.y}[v${vIndex}]`;
    lastV = `v${vIndex}`;
    vIndex++;
  }
  
  if (escapedDedicatoria) {
    filter += `;[${lastV}]drawtext=text='${escapedDedicatoria}':fontcolor=${dedicatoriaColor}:fontsize=${dedicatoriaSize}:x=(w-text_w)/2:y=${dedicatoriaY}:line_spacing=${Math.round(dedicatoriaSize * 0.4)}[v${vIndex}]`;
    lastV = `v${vIndex}`;
    vIndex++;
  }

  const inputs = tempPhotoPath ? `-i "${tempPhotoPath}" ${bgInput}` : `-f lavfi -i color=c=black:s=1x1 ${bgInput}`;
  
  const ffmpegCommand = `ffmpeg -y -loop 1 -framerate 1 ${inputs} -i "${audioPath}" -filter_complex "${filter}" -map "[${lastV}]" -map 2:a -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;

  await execPromise(ffmpegCommand);

  const relativeVideoUrl = `/media/${videoFileName}`;
  
  await pool.query(
    `UPDATE "MediaJob" SET "videoUrl" = $1, status = 'video_ready', "updatedAt" = NOW() WHERE id = $2`,
    [relativeVideoUrl, jobId]
  );

  // 4. SEND via YCloud
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency").replace(/\/$/, "");
  const fullVideoUrl = `${appUrl}${relativeVideoUrl}`;
  const fullAudioUrl = `${appUrl}/media/${audioFileName}`;
  const target = job.whatsappNumber.trim();
  const ycloudApiKey = process.env.YCLOUD_API_KEY;
  
  if (!ycloudApiKey) throw new Error("YCLOUD_API_KEY is not configured");

  const isUsername = target.startsWith("PE.");
  const destinationKey = isUsername ? "recipient" : "to";
  
  const payload: any = {
    from: process.env.YCLOUD_FROM,
    [destinationKey]: target,
    type: "video",
    video: {
      link: fullVideoUrl,
      caption: `¡Aquí tienes tu video del segundo intento! 🎵\n\nPuedes escuchar y descargar tu canción original desde este enlace:\n${fullAudioUrl}`
    }
  };

  const ycloudRes = await fetch("https://api.ycloud.com/v2/whatsapp/messages/sendDirectly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ycloudApiKey
    },
    body: JSON.stringify(payload)
  });

  if (!ycloudRes.ok) {
    const errorData = await ycloudRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || errorData?.message || "Error al enviar mensaje por YCloud");
  }

  await pool.query(
    'UPDATE "MediaJob" SET status = \'sent\', "updatedAt" = NOW() WHERE id = $1',
    [jobId]
  );
}
