import { defineHandler } from "nitro";
import { readBody, createError, setResponseStatus } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body?.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  const jobId = randomUUID();
  const whatsappNumber = body.recipient || body.whatsappNumber || null;
  
  // Insert raw job
  await pool.query(
    `INSERT INTO "MediaJob" (id, prompt, status, "whatsappNumber", "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [jobId, body.prompt, 'pending', whatsappNumber]
  );

  // Acknowledge immediately
  setResponseStatus(event, 202);
  
  // Start background process asynchronously without waiting
  processJob(jobId, body).catch(console.error);

  return { ok: true, jobId: jobId, message: "Job accepted and processing started in background" };
});

async function processJob(jobId: string, data: any) {
  try {
    // 1. Simulate audio download
    await pool.query(
      `UPDATE "MediaJob" SET status = $1, "audioUrl" = $2, "updatedAt" = NOW() WHERE id = $3`, 
      ['audio_ready', `/media/audio_${jobId}.mp3`, jobId]
    );
    
    await new Promise(r => setTimeout(r, 2000));

    // 2. Simulate video generation
    await pool.query(
      `UPDATE "MediaJob" SET status = $1, "videoUrl" = $2, "updatedAt" = NOW() WHERE id = $3`,
      ['video_ready', `/media/video_${jobId}.mp4`, jobId]
    );

    await new Promise(r => setTimeout(r, 2000));

    // 3. Simulate WhatsApp send
    await pool.query(
      `UPDATE "MediaJob" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      ['sent', jobId]
    );
  } catch (error: any) {
    await pool.query(
      `UPDATE "MediaJob" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      ['error', jobId]
    );
  }
}
