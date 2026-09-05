import { defineHandler } from "nitro";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const result = await pool.query('SELECT * FROM "MediaJob" ORDER BY "createdAt" DESC');
  
  // Map fields to match the frontend expectations since some were dropped
  const jobs = result.rows.map(row => ({
    ...row,
    source: row.source || 'manual', // Frontend expects source
    recipient: row.whatsappNumber, // Frontend expects recipient
    imageUrl: row.imageUrl || null,
    errorLog: row.errorLog || null
  }));
  
  return jobs;
});
