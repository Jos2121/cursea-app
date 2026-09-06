import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  const { jobId, backgroundUrl, userPhotoUrl, imageUrl, titulo, artista, dedicatoria } = body;

  if (!jobId || (!userPhotoUrl && !imageUrl)) {
    throw createError({ statusCode: 400, statusMessage: "jobId and either userPhotoUrl or imageUrl are required" });
  }

  // Aseguramos que existan las nuevas columnas en la BD
  try {
    await pool.query(`
      ALTER TABLE "MediaJob"
        ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "userPhotoUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "titulo" TEXT,
        ADD COLUMN IF NOT EXISTS "artista" TEXT,
        ADD COLUMN IF NOT EXISTS "dedicatoria" TEXT;
    `);
  } catch (e) {
    // Ignore schema errors
  }

  // 1. Obtener información del trabajo
  const result = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
  const job = result.rows[0];

  if (!job || !job.audioUrl) {
    throw createError({ statusCode: 400, statusMessage: "Job not found or missing audioUrl" });
  }

  // 2. Localizar archivos y descargar imagen
  const mediaDir = path.resolve(process.cwd(), "public/media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const audioPath = path.join(mediaDir, path.basename(job.audioUrl));

  if (!fs.existsSync(audioPath)) {
    throw createError({ statusCode: 400, statusMessage: "Audio file not found on disk" });
  }

  let tempPhotoPath = "";
  let tempBgPath = "";
  
  try {
    const finalPhotoUrl = userPhotoUrl || imageUrl;
    const finalBgStr = backgroundUrl || 'image_f840ac.jpg';

    // Download user photo
    const imageRes = await fetch(finalPhotoUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from ${finalPhotoUrl}`);
    }
    const arrayBuffer = await imageRes.arrayBuffer();
    tempPhotoPath = path.join(mediaDir, `temp_photo_${Date.now()}.jpg`);
    fs.writeFileSync(tempPhotoPath, Buffer.from(arrayBuffer));

    // Handle background (download if URL, otherwise check local file)
    if (finalBgStr.startsWith('http')) {
      const bgRes = await fetch(finalBgStr);
      if (bgRes.ok) {
        tempBgPath = path.join(mediaDir, `temp_bg_${Date.now()}.jpg`);
        fs.writeFileSync(tempBgPath, Buffer.from(await bgRes.arrayBuffer()));
      }
    } else {
      const localBgPath = path.join(mediaDir, finalBgStr);
      if (fs.existsSync(localBgPath)) {
        tempBgPath = localBgPath;
      }
    }

    // 3. Ejecutar FFmpeg
    const videoFileName = `video_${Date.now()}.mp4`;
    const videoPath = path.join(mediaDir, videoFileName);
    
    let ffmpegCommand = "";

    // Si tenemos campos de plantilla o userPhotoUrl, aplicamos la composición 9:16
    if (titulo || artista || dedicatoria || backgroundUrl || userPhotoUrl) {
      // Función para escapar caracteres de forma segura para el drawtext de FFmpeg
      const sanitize = (str: string) => {
        if (!str) return "";
        // Reemplazamos comillas simples por tipográficas, escapamos dos puntos, y eliminamos saltos/retornos.
        return str.replace(/:/g, "\\:").replace(/'/g, "\u2019").replace(/"/g, "\u201D").replace(/[\n\r]/g, " ");
      };
      
      const safeTitulo = sanitize(titulo);
      const safeArtista = sanitize(artista);
      const safeDedicatoria = sanitize(dedicatoria);

      const isExternalOrTempBg = tempBgPath.includes('temp_bg_');
      let bgInput = tempBgPath ? `-loop 1 -framerate 1 -i "${tempBgPath}"` : `-f lavfi -i color=c=black:s=1080x1920:r=1`;

      let filter = `[1:v]scale=1080:1920[bg];`;
      filter += `[0:v]scale=w=820:h=820:force_original_aspect_ratio=increase,crop=820:820:(in_w-820)/2:(in_h-820)/2[photo];`;
      filter += `[bg][photo]overlay=x=(W-w)/2:y=180[v1]`;

      let lastV = 'v1';
      let vIndex = 2;
      
      if (safeTitulo) {
        filter += `;[${lastV}]drawtext=text='${safeTitulo}':fontcolor=white:fontsize=42:x=130:y=1040[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }
      if (safeArtista) {
        filter += `;[${lastV}]drawtext=text='${safeArtista}':fontcolor=#B3B3B3:fontsize=30:x=130:y=1095[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }
      if (safeDedicatoria) {
        filter += `;[${lastV}]drawtext=text='${safeDedicatoria}':fontcolor=#E5E5E5:fontsize=28:x=(w-text_w)/2:y=1620[v${vIndex}]`;
        lastV = `v${vIndex}`;
        vIndex++;
      }

      ffmpegCommand = `ffmpeg -y -loop 1 -framerate 1 -i "${tempPhotoPath}" ${bgInput} -i "${audioPath}" -filter_complex "${filter}" -map "[${lastV}]" -map 2:a -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;

    } else {
      // Comportamiento base uniendo la imagen directa
      ffmpegCommand = `ffmpeg -y -loop 1 -framerate 1 -i "${tempPhotoPath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;
    }

    await execPromise(ffmpegCommand);

    // 4. Actualizar base de datos
    const relativeVideoUrl = `/media/${videoFileName}`;
    const updateResult = await pool.query(
      `UPDATE "MediaJob"
       SET status = 'video_ready',
           "videoUrl" = $1,
           "imageUrl" = $2,
           "backgroundUrl" = $3,
           "userPhotoUrl" = $4,
           "titulo" = $5,
           "artista" = $6,
           "dedicatoria" = $7,
           "updatedAt" = NOW()
       WHERE id = $8 RETURNING *`,
      [
        relativeVideoUrl,
        finalPhotoUrl,
        backgroundUrl || null,
        userPhotoUrl || null,
        titulo || null,
        artista || null,
        dedicatoria || null,
        jobId
      ]
    );

    return { ok: true, job: updateResult.rows[0] };
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to generate video: " + error.message });
  } finally {
    // Eliminar archivos temporales
    if (tempPhotoPath && fs.existsSync(tempPhotoPath)) {
      fs.unlinkSync(tempPhotoPath);
    }
    if (tempBgPath && tempBgPath.includes('temp_bg_') && fs.existsSync(tempBgPath)) {
      fs.unlinkSync(tempBgPath);
    }
  }
});
