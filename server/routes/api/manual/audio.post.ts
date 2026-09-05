import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  const jobId = randomUUID();
  const audioUrl = `/media/audio_${Date.now()}.mp3`; // simulated

  const result = await pool.query(
    `INSERT INTO "MediaJob" (id, prompt, status, "audioUrl", "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
    [jobId, body.prompt, 'audio_ready', audioUrl]
  );

  return { ok: true, job: result.rows[0] };
});
