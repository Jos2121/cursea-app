import { defineHandler } from "nitro";
import { getQuery, setResponseHeader } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export default defineHandler(async (event) => {
  try {
    // Establecer header HTML de forma segura al inicio
    setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");

    const query = getQuery(event);
    const jobId = query?.jobId as string;

    if (!jobId) {
      return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error - Cursea Digital</title><style>body{font-family:system-ui,sans-serif;background:#FAF7F2;text-align:center;padding:40px;color:#1c1917;}.card{background:white;padding:32px;border-radius:24px;max-width:440px;margin:0 auto;border:1px solid #fecdd3;}</style></head>
<body><div class="card"><h1>Error 400</h1><p>El parámetro <code>jobId</code> es requerido en la URL.</p></div></body></html>`;
    }

    // Verificar job
    const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>No Encontrado - Cursea Digital</title><style>body{font-family:system-ui,sans-serif;background:#FAF7F2;text-align:center;padding:40px;color:#1c1917;}.card{background:white;padding:32px;border-radius:24px;max-width:440px;margin:0 auto;border:1px solid #fecdd3;}</style></head>
<body><div class="card"><h1>Error 404</h1><p>El pedido no fue encontrado en la base de datos.</p></div></body></html>`;
    }

    const job = jobResult.rows[0];
    const currentGeneraciones = Number(job.generaciones || 0);

    if (currentGeneraciones >= 2) {
      return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Límite Alcanzado</title><style>body{font-family:system-ui,sans-serif;background:#FAF7F2;color:#1c1917;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}.card{background:white;padding:32px;border-radius:24px;max-width:440px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #fecdd3;}.icon{font-size:48px;margin-bottom:16px;}h1{color:#8B1F32;font-size:20px;margin:0 0 10px;}p{color:#78716c;font-size:14px;line-height:1.5;}</style></head>
<body><div class="card"><div class="icon">⚠️</div><h1>Límite de Generaciones Alcanzado</h1><p>Este pedido (<code>${jobId}</code>) ya cuenta con ${currentGeneraciones} / 2 generaciones y no puede procesarse nuevamente.</p></div></body></html>`;
    }

    // PROCESO EN SEGUNDO PLANO SEGURO (Desvinculado del hilo principal)
    (async () => {
      let tempImagePath = "";
      let tempBgPath = "";
      try {
        console.log(`[ConfirmPayment GET] Background inicializado: ${jobId}`);
        
        await pool.query(
          `UPDATE "MediaJob" SET pago = 'Realizado', generaciones = COALESCE(generaciones, 0) + 1, status = 'generating_audio', "updatedAt" = NOW() WHERE id = $1`,
          [jobId]
        );

        const mediaDir = path.resolve(process.cwd(), "public/media");
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

        const model = process.env.OPENROUTER_MODEL || "google/lyria-3-pro-preview";
        const referer = process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency";

        let audioResponse: Response | undefined;
        for (let attempts = 1; attempts <= 2; attempts++) {
          try {
            audioResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": referer, "X-Title": "Cursea Digital" },
              body: JSON.stringify({ model, modalities: ["text", "audio"], audio: { voice: "alloy", format: "mp3" }, stream: true, messages: [{ role: "user", content: job.prompt || "Canción" }] })
            });
            if (audioResponse.ok) break;
            if (attempts === 2) throw new Error(`OpenRouter request failed: ${audioResponse.status}`);
            await new Promise(r => setTimeout(r, 3000));
          } catch (e) {
            if (attempts === 2) throw e;
            await new Promise(r => setTimeout(r, 3000));
          }
        }

        if (!audioResponse?.body) throw new Error("No se recibió body de respuesta de audio");

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
              if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;
              try {
                const chunk = JSON.parse(trimmed.slice(6));
                if (chunk.choices?.[0]?.delta?.audio?.data) fullBase64Audio += chunk.choices[0].delta.audio.data;
              } catch (e) {} // Ignorar fragmentos no parseables
            }
          }
        } finally {
          reader.releaseLock();
        }

        if (!fullBase64Audio) throw new Error("Stream de audio vacío");

        const audioFileName = `audio_${Date.now()}.mp3`;
        const audioFilePath = path.join(mediaDir, audioFileName);
        fs.writeFileSync(audioFilePath, Buffer.from(fullBase64Audio, "base64"));
        const relativeAudioUrl = `/media/${audioFileName}`;

        await pool.query(
          `UPDATE "MediaJob" SET "audioUrl" = $1, status = 'audio_ready', "updatedAt" = NOW() WHERE id = $2`,
          [relativeAudioUrl, jobId]
        );

        const targetImage = job.userPhotoUrl || job.imageUrl || job.photoUrl;
        const targetBg = job.backgroundUrl || "image_f840ac.jpg";
        let finalImagePath = "";

        if (targetImage?.startsWith("http")) {
          const imgRes = await fetch(targetImage);
          if (imgRes.ok) {
            tempImagePath = path.join(mediaDir, `temp_photo_${Date.now()}.jpg`);
            fs.writeFileSync(tempImagePath, Buffer.from(await imgRes.arrayBuffer()));
            finalImagePath = tempImagePath;
          }
        } else if (targetImage) {
          const localPath = path.join(mediaDir, path.basename(targetImage));
          if (fs.existsSync(localPath)) finalImagePath = localPath;
        }

        if (!finalImagePath) {
          tempImagePath = path.join(mediaDir, `temp_ph_${Date.now()}.png`);
          await execPromise(`ffmpeg -y -f lavfi -i color=c=gray:s=820x820 -vframes 1 "${tempImagePath}"`);
          finalImagePath = tempImagePath;
        }

        if (targetBg?.startsWith("http")) {
          try {
            const bgRes = await fetch(targetBg);
            if (bgRes.ok) {
              tempBgPath = path.join(mediaDir, `temp_bg_${Date.now()}.jpg`);
              fs.writeFileSync(tempBgPath, Buffer.from(await bgRes.arrayBuffer()));
            }
          } catch(e) {}
        } else if (targetBg) {
          const localBg = path.join(mediaDir, path.basename(targetBg));
          if (fs.existsSync(localBg)) tempBgPath = localBg;
        }

        let parsedConfig = null;
        try {
          if (typeof job.config === "string") {
            parsedConfig = JSON.parse(job.config);
            if (typeof parsedConfig === "string") parsedConfig = JSON.parse(parsedConfig);
          } else {
            parsedConfig = job.config;
          }
        } catch(e) {}

        const s = (str: string) => (str || "").replace(/:/g, "\\:").replace(/'/g, "\u2019").replace(/"/g, "\u201D").replace(/[\n\r]/g, " ");
        const titulo = s(job.titulo);
        const artista = s(job.artista);
        let dedicatoria = s(job.dedicatoria);
        
        if (dedicatoria) {
          const words = dedicatoria.split(/\s+/);
          let lines = [], cur = "";
          for (const w of words) {
            if ((cur + " " + w).trim().length <= 34) cur = (cur + " " + w).trim();
            else { if (cur) lines.push(cur); cur = w; }
          }
          if (cur) lines.push(cur);
          dedicatoria = lines.join("\n");
        }

        const t = parsedConfig || { photo: { x: 130, y: 180, w: 820, h: 820 }, titulo: { x: 130, y: 1040, fontSize: 42, color: "white" }, artista: { x: 130, y: 1095, fontSize: 30, color: "#B3B3B3" }, dedicatoria: { x: 540, y: 1620, fontSize: 28, color: "#E5E5E5" } };
        const photoW = Number(parsedConfig?.photoWidth ?? t.photo?.w ?? 820);
        const photoH = Number(parsedConfig?.photoHeight ?? t.photo?.h ?? 820);
        const photoX = Number(parsedConfig?.photoX ?? t.photo?.x ?? 130);
        const photoY = Number(parsedConfig?.photoY ?? t.photo?.y ?? 180);
        const dY = Number(parsedConfig?.dedicatoriaY ?? t.dedicatoria?.y ?? 1620);
        const dSize = Number(parsedConfig?.dedicatoriaSize ?? t.dedicatoria?.fontSize ?? 28);
        
        const bgInput = tempBgPath && fs.existsSync(tempBgPath) ? `-loop 1 -framerate 1 -i "${tempBgPath}"` : `-f lavfi -i color=c=black:s=1080x1920:r=1`;
        
        let filter = `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2[bg_base];[0:v]scale=w=${photoW}:h=${photoH}:force_original_aspect_ratio=increase,crop=${photoW}:${photoH}:(in_w-${photoW})/2:(in_h-${photoH})/2[photo];[bg_base][photo]overlay=x=${photoX}:y=${photoY}[v1]`;
        let lastV = "v1", vIdx = 2;
        
        if (titulo) {
          filter += `;[${lastV}]drawtext=text='${titulo}':fontcolor=${t.titulo?.color || "white"}:fontsize=${Number(parsedConfig?.tituloSize ?? t.titulo?.fontSize ?? 42)}:x=${parsedConfig?.tituloX ?? t.titulo?.x ?? 130}:y=${Number(parsedConfig?.tituloY ?? t.titulo?.y ?? 1040)}[v${vIdx}]`;
          lastV = `v${vIdx++}`;
        }
        if (artista) {
          filter += `;[${lastV}]drawtext=text='${artista}':fontcolor=${t.artista?.color || "#B3B3B3"}:fontsize=${Number(parsedConfig?.artistaSize ?? t.artista?.fontSize ?? 30)}:x=${parsedConfig?.artistaX ?? t.artista?.x ?? 130}:y=${Number(parsedConfig?.artistaY ?? t.artista?.y ?? 1095)}[v${vIdx}]`;
          lastV = `v${vIdx++}`;
        }
        if (dedicatoria) {
          filter += `;[${lastV}]drawtext=text='${dedicatoria}':fontcolor=${t.dedicatoria?.color || "white"}:fontsize=${dSize}:x=(w-text_w)/2:y=${dY}:line_spacing=${Math.round(dSize * 0.4)}[v${vIdx}]`;
          lastV = `v${vIdx++}`;
        }

        const vName = `video_${Date.now()}.mp4`;
        const vPath = path.join(mediaDir, vName);
        const cmd = `ffmpeg -y -loop 1 -framerate 1 -i "${finalImagePath}" ${bgInput} -i "${audioFilePath}" -filter_complex "${filter}" -map "[${lastV}]" -map 2:a -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${vPath}"`;
        
        console.log(`[ConfirmPayment GET] Ejecutando FFmpeg...`);
        await execPromise(cmd);
        
        await pool.query(`UPDATE "MediaJob" SET "videoUrl" = $1, status = 'video_ready', "updatedAt" = NOW() WHERE id = $2`, [`/media/${vName}`, jobId]);
        console.log(`[ConfirmPayment GET] Proceso finalizado. Video en ${vName}`);

        // DOBLE PETICIÓN YCLOUD: Envío de Audio y Video
        const phoneNumber = job.whatsappNumber;
        
        const host = event.node.req.headers.host || "sings.inspiramkt.agency";
        const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
        const baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
        
        const audioUrl = `${baseUrl.replace(/\/$/, "")}${relativeAudioUrl}`;
        const videoUrl = `${baseUrl.replace(/\/$/, "")}/media/${vName}`;

// --- INICIO CÓDIGO DE ENVÍO A YCLOUD ---
const ycloudKey = process.env.YCLOUD_API_KEY;
const ycloudFrom = process.env.YCLOUD_FROM || process.env.YCLOUD_SENDER_NUMBER;

if (ycloudKey && phoneNumber) {
  try {
    console.log("[ConfirmPayment GET] Iniciando envío de AUDIO...");
    const audioPayload: any = {
      to: phoneNumber,
      type: "audio",
      audio: { link: audioUrl }
    };
    
    if (ycloudFrom) {
      audioPayload.from = ycloudFrom;
    }
    
    const audioRes = await fetch("https://api.ycloud.com/v2/whatsapp/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ycloudKey
      },
      body: JSON.stringify(audioPayload)
    });
    
    const audioData = await audioRes.json().catch(() => ({}));
    console.log("[ConfirmPayment GET] Respuesta de YCloud (Audio):", audioData);

    // Pausa estratégica de 2 segundos para evitar bloqueo antispam de WhatsApp
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("[ConfirmPayment GET] Iniciando envío de VIDEO...");
    const videoPayload: any = {
      to: phoneNumber,
      type: "video",
      video: { link: videoUrl }
    };
    
    if (ycloudFrom) {
      videoPayload.from = ycloudFrom;
    }
    
    const videoRes = await fetch("https://api.ycloud.com/v2/whatsapp/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ycloudKey
      },
      body: JSON.stringify(videoPayload)
    });
    
    const videoData = await videoRes.json().catch(() => ({}));
    console.log("[ConfirmPayment GET] Respuesta de YCloud (Video):", videoData);

  } catch (error) {
    console.error("[ConfirmPayment GET] Error crítico en el bloque de envíos a YCloud:", error);
  }
} else {
  console.error("[ConfirmPayment GET] Faltan credenciales de YCloud o número de teléfono.");
}
// --- FIN CÓDIGO DE ENVÍO A YCLOUD ---

      } catch (e: any) {
        console.error(`[ConfirmPayment GET Background Error] ${jobId}:`, e);
        pool.query(`UPDATE "MediaJob" SET status = 'error', "errorLog" = $1, "updatedAt" = NOW() WHERE id = $2`, [e?.message || "Error en background", jobId]).catch(() => {});
      } finally {
        if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
        if (tempBgPath && fs.existsSync(tempBgPath)) fs.unlinkSync(tempBgPath);
      }
    })();

    // RESPUESTA INMEDIATA (Sin bloquearse por el proceso superior)
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

  } catch (error: any) {
    console.error("[ConfirmPayment GET CRITICAL ERROR]", error);
    
    // Si algo crítico falla antes de devolver el HTML, devolvemos un código HTML 500 en lugar de crashear Nitro.
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error del Servidor</title>
  <style>body{font-family:system-ui,sans-serif;background:#FAF7F2;text-align:center;padding:40px;color:#1c1917;}.card{background:white;padding:32px;border-radius:24px;max-width:440px;margin:0 auto;border:1px solid #fecdd3;}</style>
</head>
<body>
  <div class="card">
    <h1>Error 500</h1>
    <p>Hubo un problema interno al procesar la confirmación.</p>
    <p style="font-size: 12px; color: #dc2626;">${error?.message || 'Error desconocido'}</p>
  </div>
</body>
</html>`;
  }
});
