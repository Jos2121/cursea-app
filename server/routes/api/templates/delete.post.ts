import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  try {
    const body = await readBody(event);
    const id = body?.id || body?.templateId;

    if (!id) {
      console.error("Delete failed: No ID provided in body");
      throw createError({ statusCode: 400, statusMessage: "El ID de la plantilla es obligatorio" });
    }

    const result = await pool.query('DELETE FROM "CustomTemplate" WHERE id = $1 RETURNING id', [String(id)]);

    if ((result.rowCount ?? 0) === 0) {
      console.warn(`Delete failed: ID ${id} not found in DB.`);
      throw createError({ statusCode: 404, statusMessage: "La plantilla no existe en la base de datos" });
    }

    return { ok: true, deletedId: id };
  } catch (err: any) {
    console.error("Database deletion error:", err);
    throw createError({ statusCode: 500, statusMessage: err.statusMessage || "Error interno del servidor" });
  }
});
