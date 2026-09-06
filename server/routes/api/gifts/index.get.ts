import { defineHandler } from "nitro";
import { pool } from "../../../../utils/db";

export default defineHandler(async (event) => {
  // Aseguramos la existencia de la tabla si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "GiftSite" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(255) UNIQUE NOT NULL,
      names VARCHAR(255),
      "startDate" DATE,
      photos JSONB,
      "youtubeLink" VARCHAR(255),
      "mainMessage" TEXT,
      qualities JSONB,
      "thingsToDo" JSONB,
      "mapPins" JSONB,
      "loveVouchers" JSONB,
      "rouletteQuestions" JSONB,
      "finalQuestionEnabled" BOOLEAN,
      theme VARCHAR(50),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  const result = await pool.query('SELECT * FROM "GiftSite" ORDER BY "createdAt" DESC');
  return result.rows;
});
