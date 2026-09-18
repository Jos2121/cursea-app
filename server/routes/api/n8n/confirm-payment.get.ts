import { defineHandler } from "nitro";
import { getQuery, setResponseHeader, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const jobId = query?.jobId as string;

  if (!jobId) {
    setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Cursea Digital</title>
  <style>body { font-family: system-ui, sans-serif; background: #FAF7F2; text-align: center; padding: 40px; color: #1c1917; } .card { background: white; padding: 32px; border-radius: 24px; max-width: 440px; margin: 0 auto; border: 1px solid #fecdd3; }</style>
</head>
<body><div class="card"><h1>Error 400</h1><p>El parámetro <code>jobId</code> es requerido en la URL.</p></div></body>
</html>`;
  }

  // Verificar job
  const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
  if (jobResult.rows.length === 0) {
    setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>No Encontrado - Cursea Digital</title>
  <style>body { font-family: system-ui, sans-serif; background: #FAF7F2; text-align: center; padding: 40px; color: #1c1917; } .card { background: white; padding: 32px; border-radius: 24px; max-width: 440px; margin: 0 auto; border: 1px solid #fecdd3; }</style>
</head>
<body><div class="card"><h1>Error 404</h1><p>El pedido no fue encontrado en la base de datos.</p></div></body>
</html>`;
  }

  const job = jobResult.rows[0];
  const currentGeneraciones = Number(job.generaciones || 0);

  if (currentGeneraciones >= 2) {
    setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Límite de Generaciones - Cursea Digital</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #FAF7F2; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; padding: 32px; border-radius: 24px; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #fecdd3; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #8B1F32; font-size: 20px; margin: 0 0 10px; }
    p { color: #78716c; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Límite de Generaciones Alcanzado</h1>
    <p>Este pedido (<code>${jobId}</code>) ya cuenta con ${currentGeneraciones} / 2 generaciones y no puede procesarse nuevamente.</p>
  </div>
</body>
</html>`;
  }

  // EJECUCIÓN EN SEGUNDO PLANO
  Promise.resolve().then(async () => {
    try {
      console.log(`[ConfirmPayment GET] Iniciando procesamiento en segundo plano para job ${jobId}`);

      // a) Ejecuta el UPDATE: SET pago = 'Realizado', generaciones = COALESCE(generaciones, 0) + 1
      await pool.query(
        `UPDATE "MediaJob" 
         SET pago = 'Realizado', 
             generaciones = COALESCE(generaciones, 0) + 1,
             status = 'generating_audio',
             "updatedAt" = NOW() 
         WHERE id = $1`,
        [jobId]
      );

      const mediaDir = path.resolve(process.cwd(), "public/media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // b) Cadena de creación: Audio con Lyria en OpenRouter
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY no está configurada");
      }

      const model = process.env.OPENROUTER_MODEL || "google/lyria-3-pro-preview";
      const referer = process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency";

      console.log(`[ConfirmPayment GET] Generando audio con modelo ${model} para job ${jobId}...`);
      
      let audioResponse: Response | undefined;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          audioResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              messages: [
                {
                  role: "user",
                  content: job.prompt || "Canción personalizada especial"
                }
              ]
            })
          });

          if (audioResponse.ok) break;

          const errText = await audioResponse.text();
          console.error(`[ConfirmPayment GET] Intento ${attempts} fallido OpenRouter:`, errText);
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 3000));
          } else {
            throw new Error(`OpenRouter audio request failed: ${audioResponse.status}`);
          }
        } catch (err: any) {
          if (attempts >= maxAttempts) throw err;
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!audioResponse || !audioResponse.body) {
        throw new Error("No se recibió body de respuesta de audio");
      }

      let fullBase64Audio = "";
      const reader = audioResponse.body.getReader();
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
            if (!trimmed.startsWith("data: ")) continue;
            if (trimmed === "data: [DONE]") continue;

            try {
              const chunkJson = JSON.parse(trimmed.slice(6));
              const audioData = chunkJson.choices?.[0]?.delta?.audio?.data;
              if (audioData) {
                fullBase64Audio += audioData;
              }
            } catch (e) {
              // Ignorar fragmentos parciales
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullBase64Audio) {
        throw new Error("El stream de audio finalizó sin datos");
      }

      const audioBuffer = Buffer.from(fullBase64Audio, "base64");
      const audioFileName = `audio_${Date.now()}.mp3`;
      const audioFilePath = path.join(mediaDir, audioFileName);
      fs.writeFileSync(audioFilePath, audioBuffer);

      const relativeAudioUrl = `/media/${audioFileName}`;
      console.log(`[ConfirmPayment GET] Audio guardado en ${relativeAudioUrl}`);

      await pool.query(
        `UPDATE "MediaJob" SET "audioUrl" = $1, status = 'audio_ready', "updatedAt" = NOW() WHERE id = $2`,
        [relativeAudioUrl, jobId]
      );

      // c) Fusión con FFmpeg (`child_process`)
      const targetImage = job.userPhotoUrl || job.imageUrl || job.photoUrl;
      const targetBg = job.backgroundUrl || "image_f840ac.jpg";

      let finalImagePath = "";
      let tempImagePath = "";
      let tempBgPath = "";

      // Descargar o verificar foto de usuario
      if (targetImage && targetImage.startsWith("http")) {
        const imgRes = await fetch(targetImage);
        if (!imgRes.ok) throw new Error(`Fallo al descargar imagen: ${targetImage}`);
        tempImagePath = path.join(mediaDir, `temp_photo_${Date.now()}.jpg`);
        fs.writeFileSync(tempImagePath, Buffer.from(await imgRes.arrayBuffer()));
        finalImagePath = tempImagePath;
      } else if (targetImage && targetImage.startsWith("/media/")) {
        finalImagePath = path.join(mediaDir, path.basename(targetImage));
      } else if (targetImage) {
        const localCheck = path.join(mediaDir, path.basename(targetImage));
        if (fs.existsSync(localCheck)) {
          finalImagePath = localCheck;
        }
      }

      // Si no existe foto, generar placeholder
      if (!finalImagePath || !fs.existsSync(finalImagePath)) {
        console.warn(`[ConfirmPayment GET] Imagen no encontrada (${targetImage}), creando placeholder`);
        tempImagePath = path.join(mediaDir, `temp_placeholder_${Date.now()}.png`);
        await execPromise(`ffmpeg -y -f lavfi -i color=c=gray:s=820x820 -vframes 1 "${tempImagePath}"`);
        finalImagePath = tempImagePath;
      }

      // Descargar o verificar fondo
      if (targetBg && targetBg.startsWith("http")) {
        try {
          const bgRes = await fetch(targetBg);
          if (bgRes.ok) {
            tempBgPath = path.join(mediaDir, `temp_bg_${Date.now()}.jpg`);
            fs.writeFileSync(tempBgPath, Buffer.from(await bgRes.arrayBuffer()));
          }
        } catch (e) {
          console.warn("[ConfirmPayment GET] No se pudo descargar fondo remoto:", e);
        }
      } else if (targetBg) {
        const localBg = path.join(mediaDir, path.basename(targetBg));
        if (fs.existsSync(localBg)) {
          tempBgPath = localBg;
        }
      }

      // Configuración y textos
      let parsedConfig = job.config;
      if (typeof parsedConfig === "string") {
        try {
          parsedConfig = JSON.parse(parsedConfig);
          if (typeof parsedConfig === "string") parsedConfig = JSON.parse(parsedConfig);
        } catch (e) {
          parsedConfig = null;
        }
      }

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

      const titulo = sanitize(job.titulo || "");
      const artista = sanitize(job.artista || "");
      const dedicatoria = wrapText(sanitize(job.dedicatoria || ""));

      const t = parsedConfig || {
        photo: { x: 130, y: 180, w: 820, h: 820 },
        titulo: { x: 130, y: 1040, fontSize: 42, color: "white", align: "left" },
        artista: { x: 130, y: 1095, fontSize: 30, color: "#B3B3B3", align: "left" },
        dedicatoria: { x: 540, y: 1620, fontSize: 28, color: "#E5E5E5", align: "center" }
      };

      const photoW = Number(parsedConfig?.photoWidth ?? t.photo?.w ?? 820);
      const photoH = Number(parsedConfig?.photoHeight ?? t.photo?.h ?? 820);
      const photoX = Number(parsedConfig?.photoX ?? t.photo?.x ?? 130);
      const photoY = Number(parsedConfig?.photoY ?? t.photo?.y ?? 180);

      const dedicatoriaY = Number(parsedConfig?.dedicatoriaY ?? t.dedicatoria?.y ?? 1620);
      const dedicatoriaSize = Number(parsedConfig?.dedicatoriaSize ?? t.dedicatoria?.fontSize ?? 28);
      const dedicatoriaColor = t.dedicatoria?.color || "white";

      const bgInput = tempBgPath && fs.existsSync(tempBgPath)
        ? `-loop 1 -framerate 1 -i "${tempBgPath}"`
        : `-f lavfi -i color=c=black:s=1080x1920:r=1`;

      let filter = `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2[bg_base];`;
      filter += `[0:v]scale=w=${photoW}:h=${photoH}:force_original_aspect_ratio=increase,crop=${photoW}:${photoH}:(in_w-${photoW})/2:(in_h-${photoH})/2[photo];`;
      filter += `[bg_base][photo]overlay=x=${photoX}:y=${photoY}[v1]`;

      let lastV = "v1";
      let vIndex = 2;

      if (titulo) {
        const xPos = t.titulo?.align === "center" ? "(w-text_w)/2" : (parsedConfig?.tituloX ?? t.titulo?.x ?? 130);
        const yPos = Number(parsedConfig?.tituloY ?? t.titulo?.y ?? 1040);
        const fSize = Number(parsedConfig?.tituloSize ?? t.titulo?.fontSize ?? 42);
        filter += `;[${lastV}]drawtext=text='${titulo}':fontcolor=${t.titulo?.color || "white"}:fontsize=${fSize}:x=${xPos}:y=${yPos}[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }

      if (artista) {
        const xPos = t.artista?.align === "center" ? "(w-text_w)/2" : (parsedConfig?.artistaX ?? t.artista?.x ?? 130);
        const yPos = Number(parsedConfig?.artistaY ?? t.artista?.y ?? 1095);
        const fSize = Number(parsedConfig?.artistaSize ?? t.artista?.fontSize ?? 30);
        filter += `;[${lastV}]drawtext=text='${artista}':fontcolor=${t.artista?.color || "#B3B3B3"}:fontsize=${fSize}:x=${xPos}:y=${yPos}[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }

      if (dedicatoria) {
        filter += `;[${lastV}]drawtext=text='${dedicatoria}':fontcolor=${dedicatoriaColor}:fontsize=${dedicatoriaSize}:x=(w-text_w)/2:y=${dedicatoriaY}:line_spacing=${Math.round(dedicatoriaSize * 0.4)}[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }

      const videoFileName = `video_${Date.now()}.mp4`;
      const videoPath = path.join(mediaDir, videoFileName);

      const ffmpegCommand = `ffmpeg -y -loop 1 -framerate 1 -i "${finalImagePath}" ${bgInput} -i "${audioFilePath}" -filter_complex "${filter}" -map "[${lastV}]" -map 2:a -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;

      console.log(`[ConfirmPayment GET] Ejecutando FFmpeg para fusionar audio y video...`);
      await execPromise(ffmpegCommand);

      const relativeVideoUrl = `/media/${videoFileName}`;

      // d) Actualizar estado final a video_ready
      await pool.query(
        `UPDATE "MediaJob" 
         SET "videoUrl" = $1, 
             status = 'video_ready', 
             "updatedAt" = NOW() 
         WHERE id = $2`,
        [relativeVideoUrl, jobId]
      );

      console.log(`[ConfirmPayment GET] Proceso completado exitosamente para job ${jobId}. Video: ${relativeVideoUrl}`);

      // Limpieza de archivos temporales
      if (tempImagePath && fs.existsSync(tempImagePath) && tempImagePath.includes("temp_")) {
        try { fs.unlinkSync(tempImagePath); } catch (e) {}
      }
      if (tempBgPath && fs.existsSync(tempBgPath) && tempBgPath.includes("temp_bg_")) {
        try { fs.unlinkSync(tempBgPath); } catch (e) {}
      }

    } catch (bgError: any) {
      console.error(`[ConfirmPayment GET Error] Error en segundo plano para job ${jobId}:`, bgError);
      try {
        await pool.query(
          `UPDATE "MediaJob" SET status = 'error', "errorLog" = $1, "updatedAt" = NOW() WHERE id = $2`,
          [bgError?.message || "Error durante generación automática", jobId]
        );
      } catch (dbErr) {
        console.error("[ConfirmPayment GET Error] No se pudo registrar error en BD:", dbErr);
      }
    }
  });

  // RESPUESTA AL NAVEGADOR (HTML INMEDIATO)
  setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Confirmado - Cursea Digital</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #FAF7F2; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; padding: 36px; border-radius: 24px; max-width: 460px; text-align: center; box-shadow: 0 12px 30px rgba(139,31,50,0.08); border: 1px solid #F5EADC; }
    .icon { font-size: 52px; margin-bottom: 16px; }
    h1 { color: #8B1F32; font-size: 22px; margin: 0 0 12px; font-weight: 800; }
    p { color: #57534e; font-size: 16px; line-height: 1.6; margin-bottom: 0; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <div class="badge">Pago Confirmado</div>
    <h1>¡Generación en Proceso!</h1>
    <p>El proceso de generación ha comenzado. El video se enviará por WhatsApp en unos momentos. <b>Ya puedes cerrar esta pestaña.</b></p>
  </div>
</body>
</html>`;
});
