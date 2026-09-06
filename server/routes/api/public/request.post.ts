import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "Body is required" });
  }

  const { backgroundUrl, userPhotoUrl, titulo, artista, dedicatoria, whatsappNumber, config } = body;
  
  // Ensure we have the required columns
  try {
    await pool.query(`
      ALTER TABLE "MediaJob"
        ADD COLUMN IF NOT EXISTS "source" TEXT,
        ADD COLUMN IF NOT EXISTS "config" JSONB,
        ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "userPhotoUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "titulo" TEXT,
        ADD COLUMN IF NOT EXISTS "artista" TEXT,
        ADD COLUMN IF NOT EXISTS "dedicatoria" TEXT;
    `);
  } catch (e) {
    // Ignore schema errors, might already exist or lack permissions
    console.error("Migration warning in request.post.ts:", e);
  }

  const id = randomUUID();
  const status = 'pendiente';
  const source = 'landing';
  
  // prompt may be required in some older definitions, we'll set it to null or empty if so. 
  // Wait, if "prompt" is required without a default, it will fail. I will insert an empty string for "prompt" just in case. 
  // "Los campos obligatorios a insertar son: status = 'pendiente', source = 'landing' y los datos recibidos (audioUrl y videoUrl quedarán nulos por ahora)."
  
  try {
    await pool.query(
      `INSERT INTO "MediaJob" (
        id, status, source, "backgroundUrl", "userPhotoUrl", titulo, artista, dedicatoria, "whatsappNumber", config, prompt, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )`,
      [
        id,
        status,
        source,
        backgroundUrl || null,
        userPhotoUrl || null,
        titulo || null,
        artista || null,
        dedicatoria || null,
        whatsappNumber || null,
        config ? JSON.stringify(config) : null,
        '', // prompt fallback
      ]
    );

    return { ok: true, id };
  } catch (error: any) {
    console.error("Error inserting MediaJob:", error);
    throw createError({ statusCode: 500, statusMessage: "Error saving request" });
  }
});
