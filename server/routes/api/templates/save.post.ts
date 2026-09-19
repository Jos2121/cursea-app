import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const name = body.name?.trim() || `Plantilla ${new Date().toLocaleDateString()}`;
  const config = body.config || body;
  
  // Extract bgUrl from config
  const bgUrl = config.backgroundUrl || config.bgUrl || '';

  try {
    // If id starts with db_, it's an existing template
    if (body.id && body.id.startsWith('db_')) {
      const numericId = parseInt(body.id.replace('db_', ''), 10);
      const result = await pool.query(
        `UPDATE "CustomTemplate"
         SET name = $1, config = $2, "bgUrl" = $3
         WHERE id = $4
         RETURNING *`,
        [name, typeof config === "string" ? config : JSON.stringify(config), bgUrl, numericId]
      );
      return { ok: true, template: result.rows[0] };
    } else {
      // Insert new template
      const result = await pool.query(
        `INSERT INTO "CustomTemplate" (name, config, "bgUrl", "createdAt")
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [name, typeof config === "string" ? config : JSON.stringify(config), bgUrl]
      );
      return { ok: true, template: result.rows[0] };
    }
  } catch (err: any) {
    console.error("Error guardando plantilla en DB:", err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Error al guardar en base de datos"
    });
  }
});
