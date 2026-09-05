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
  
  if (!body.jobId || !body.imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "jobId and imageUrl are required" });
  }

  // 1. Obtener información del trabajo
  const result = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [body.jobId]);
  const job = result.rows[0];

  if (!job || !job.audioUrl) {
    throw createError({ statusCode: 400, statusMessage: "Job not found or missing audioUrl" });
  }

  // 2. Localizar archivos y descargar imagen
  const mediaDir = path.resolve(process.cwd(), "public/media");
  const audioPath = path.join(mediaDir, path.basename(job.audioUrl));

  if (!fs.existsSync(audioPath)) {
    throw createError({ statusCode: 400, statusMessage: "Audio file not found on disk" });
  }

  let tempImagePath = "";
  
  try {
    const imageRes = await fetch(body.imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from ${body.imageUrl}`);
    }
    
    const arrayBuffer = await imageRes.arrayBuffer();
    tempImagePath = path.join(mediaDir, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempImagePath, Buffer.from(arrayBuffer));

    // 3. Ejecutar FFmpeg
    const videoFileName = `video_${Date.now()}.mp4`;
    const videoPath = path.join(mediaDir, videoFileName);
    
    const ffmpegCommand = `ffmpeg -y -loop 1 -framerate 1 -i "${tempImagePath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;
    
    await execPromise(ffmpegCommand);

    // 4. Actualizar base de datos
    const relativeVideoUrl = `/media/${videoFileName}`;
    const updateResult = await pool.query(
      `UPDATE "MediaJob" 
       SET status = 'video_ready', "videoUrl" = $1, "imageUrl" = $2, "updatedAt" = NOW() 
       WHERE id = $3 RETURNING *`,
      [relativeVideoUrl, body.imageUrl, body.jobId]
    );

    return { ok: true, job: updateResult.rows[0] };
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to generate video: " + error.message });
  } finally {
    // Eliminar archivo temporal de la imagen
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
  }
});
