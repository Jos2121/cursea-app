import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.names) {
    throw createError({ statusCode: 400, statusMessage: "Names are required" });
  }

  // Generamos un slug a partir de los nombres o usamos un UUID corto
  let slug = body.names.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  slug = `${slug}-${Math.floor(Math.random() * 10000)}`;

  const id = randomUUID();

  try {
    const result = await pool.query(
      `INSERT INTO "GiftSite" (
        id, slug, names, "startDate", photos, "youtubeLink", "mainMessage", 
        qualities, "thingsToDo", "mapPins", "loveVouchers", "rouletteQuestions", 
        "finalQuestionEnabled", theme, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *`,
      [
        id, slug, body.names, body.startDate || null, 
        JSON.stringify(body.photos || []), body.youtubeLink, body.mainMessage,
        JSON.stringify(body.qualities || []), JSON.stringify(body.thingsToDo || []),
        JSON.stringify(body.mapPins || []), JSON.stringify(body.loveVouchers || []),
        JSON.stringify(body.rouletteQuestions || []), body.finalQuestionEnabled || false,
        body.theme || 'indigo'
      ]
    );

    return { ok: true, gift: result.rows[0], slug };
  } catch (error: any) {
    console.error("Error creating gift:", error);
    throw createError({ statusCode: 500, statusMessage: "Failed to create gift site" });
  }
});
