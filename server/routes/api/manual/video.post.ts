import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.jobId || !body.imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "jobId and imageUrl are required" });
  }

  const videoUrl = `/media/video_${Date.now()}.mp4`; // simulated

  const result = await pool.query(
    `UPDATE "MediaJob" 
     SET status = $1, "videoUrl" = $2, "updatedAt" = NOW() 
     WHERE id = $3 RETURNING *`,
    ['video_ready', videoUrl, body.jobId]
  );

  return { ok: true, job: result.rows[0] };
});
