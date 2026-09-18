import { defineHandler } from "nitro";
import { readBody, setResponseStatus, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export default defineHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.jobId) {
    throw createError({ statusCode: 400, statusMessage: "jobId es requerido" });
  }

  const jobId = body.jobId;

  // 1. SELECT a "MediaJob" validando la existencia
  const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);

  if (jobResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "MediaJob no encontrado" });
  }

  const job = jobResult.rows[0];
  const currentGeneraciones = Number(job.generaciones || 0);

  // Validación de límite de generaciones
  if (currentGeneraciones >= 2) {
    throw createError({ statusCode: 403, statusMessage: "Límite de generaciones alcanzado" });
  }

  // 2. Responder INMEDIATAMENTE a n8n con HTTP 202
  setResponseStatus(event, 202);
  const immediateResponse = { status: "processing", message: "Pago confirmado" };

  // 3. EJECUCIÓN EN SEGUNDO PLANO
  Promise.resolve().then(async () => {
    try {
      console.log(`[ConfirmPayment] Iniciando procesamiento en segundo plano para job ${jobId}`);

      // a) Actualizar tabla: pago = 'Realizado', generaciones = generaciones + 1
      await pool.query(
        `UPDATE "MediaJob" 
         SET pago = 'Realizado', 
             generaciones = COALESCE(generaciones, 0) + 1,
             "updatedAt" = NOW() 
         WHERE id = $1`,
        [jobId]
      );

      const mediaDir = path.resolve(process.cwd(), "public/media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // b) Cadena de creación: Audio con Lyria
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY no está configurada");
      }

      const model = process.env.OPENROUTER_MODEL || "google/lyria-3-pro-preview";
      const referer = process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency";

      console.log(`[ConfirmPayment] Generando audio con modelo ${model} para job ${jobId}...`);
      
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
          console.error(`[ConfirmPayment] Intento ${attempts} fallido OpenRouter:`, errText);
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
              // ignore parse errors for partial chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullBase64Audio) {
        throw new Error("El stream finalizó sin datos de audio");
      }

      const audioBuffer = Buffer.from(fullBase64Audio, "base64");
      const audioFileName = `audio_${Date.now()}.mp3`;
      const audioFilePath = path.join(mediaDir, audioFileName);
      fs.writeFileSync(audioFilePath, audioBuffer);

      const relativeAudioUrl = `/media/${audioFileName}`;
      console.log(`[ConfirmPayment] Audio guardado en ${relativeAudioUrl}`);

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

      // Descargar o verificar imagen del usuario
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

      // Si no hay imagen, usar fallback
      if (!finalImagePath || !fs.existsSync(finalImagePath)) {
        console.warn(`[ConfirmPayment] Imagen no encontrada o vacía (${targetImage}), creando placeholder`);
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
          console.warn("[ConfirmPayment] No se pudo descargar fondo remoto:", e);
        }
      } else if (targetBg) {
        const localBg = path.join(mediaDir, path.basename(targetBg));
        if (fs.existsSync(localBg)) {
          tempBgPath = localBg;
        }
      }

      // Configuración de coordenadas
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

      console.log(`[ConfirmPayment] Ejecutando FFmpeg para renderizar video final...`);
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

      console.log(`[ConfirmPayment] Proceso completado exitosamente para job ${jobId}. Video: ${relativeVideoUrl}`);

      // Limpieza de temporales
      if (tempImagePath && fs.existsSync(tempImagePath) && tempImagePath.includes("temp_")) {
        try { fs.unlinkSync(tempImagePath); } catch (e) {}
      }
      if (tempBgPath && fs.existsSync(tempBgPath) && tempBgPath.includes("temp_bg_")) {
        try { fs.unlinkSync(tempBgPath); } catch (e) {}
      }

    } catch (bgError: any) {
      console.error(`[ConfirmPayment Error] Error en segundo plano para job ${jobId}:`, bgError);
      try {
        await pool.query(
          `UPDATE "MediaJob" SET status = 'error', "errorLog" = $1, "updatedAt" = NOW() WHERE id = $2`,
          [bgError?.message || "Error durante generación automática", jobId]
        );
      } catch (dbErr) {
        console.error("[ConfirmPayment Error] No se pudo registrar error en BD:", dbErr);
      }
    }
  });

  return immediateResponse;
});
