import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const { name, bgUrl, config } = body;
  
  if (!name || !config) {
    throw createError({ statusCode: 400, statusMessage: "Name and config are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "CustomTemplate" (name, "bgUrl", config) VALUES ($1, $2, $3) RETURNING *`,
      [name, bgUrl || '', config]
    );
    return { ok: true, template: result.rows[0] };
  } catch (error: any) {
    console.error(error);
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
});
