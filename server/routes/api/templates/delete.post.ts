import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Template ID is required" });
  }

  try {
    await pool.query('DELETE FROM "CustomTemplate" WHERE id = $1', [id]);
    return { ok: true };
  } catch (error: any) {
    console.error("Error deleting template:", error);
    throw createError({ statusCode: 500, statusMessage: error.message || "Error al eliminar plantilla" });
  }
});
