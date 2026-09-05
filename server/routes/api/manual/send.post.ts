import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.jobId || !body.recipient) {
    throw createError({ statusCode: 400, statusMessage: "jobId and recipient are required" });
  }

  const result = await pool.query(
    `UPDATE "MediaJob" 
     SET "whatsappNumber" = $1, status = $2, "updatedAt" = NOW() 
     WHERE id = $3 RETURNING *`,
    [body.recipient, 'sent', body.jobId]
  );

  return { ok: true, job: result.rows[0] };
});
