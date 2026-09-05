import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  const jobId = randomUUID();
  const timestamp = Date.now();
  const fileName = `audio_${timestamp}.mp3`;
  const relativeUrl = `/media/${fileName}`;
  
  // 1. Asegurar que la carpeta public/media exista (usamos process.cwd() para soportar Docker y Local)
  const mediaDir = path.resolve(process.cwd(), 'public/media');
  fs.mkdirSync(mediaDir, { recursive: true });

  // 2 y 3. Descargar el archivo de prueba y guardarlo en el disco
  try {
    const response = await fetch('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    if (!response.ok) throw new Error("Failed to fetch MP3");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filePath = path.join(mediaDir, fileName);
    fs.writeFileSync(filePath, buffer);
  } catch (error) {
    console.error("Error downloading sample audio:", error);
    throw createError({ statusCode: 500, statusMessage: "Error generating/downloading audio file" });
  }

  // 4 y 5. Insertar en la BD y retornar el trabajo
  const result = await pool.query(
    `INSERT INTO "MediaJob" (id, prompt, status, "audioUrl", "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
    [jobId, body.prompt, 'audio_ready', relativeUrl]
  );

  return { ok: true, job: result.rows[0] };
});
