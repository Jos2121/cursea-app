import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import fs from "fs";
import path from "path";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const id = body?.id;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }

  const result = await pool.query(`SELECT * FROM "MediaJob" WHERE id = $1`, [id]);
  const job = result.rows[0];

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: "Job not found" });
  }

  // Delete physical files
  const publicDir = path.resolve(process.cwd(), 'public');
  
  if (job.audioUrl) {
    const audioPath = path.join(publicDir, job.audioUrl.replace('/media/', 'media/'));
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
  
  if (job.videoUrl) {
    const videoPath = path.join(publicDir, job.videoUrl.replace('/media/', 'media/'));
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
  }

  // Delete from DB
  await pool.query(`DELETE FROM "MediaJob" WHERE id = $1`, [id]);

  return { ok: true, message: "Job deleted successfully" };
});
