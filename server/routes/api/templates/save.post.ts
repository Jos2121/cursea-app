import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const name = body.name?.trim() || `Plantilla ${new Date().toLocaleDateString()}`;
  const config = body.config || body;
  const templateId = body.id || randomUUID();

  try {
    const result = await pool.query(
      `INSERT INTO "CustomTemplate" (id, name, config, "createdAt")
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [templateId, name, typeof config === "string" ? config : JSON.stringify(config)]
    );
    return { ok: true, template: result.rows[0] };
  } catch (err: any) {
    console.error("Error guardando plantilla en DB:", err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Error al guardar en base de datos"
    });
  }
});
