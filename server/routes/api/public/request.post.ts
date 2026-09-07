import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "Body is required" });
  }

  const { 
    backgroundUrl, userPhotoUrl, titulo, artista, dedicatoria, whatsappNumber, config,
    paraQuien, ocasion, estiloMusical, tipoVoz, tono, nombreDedicado, historia 
  } = body;
  
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
  
  // Create prompt from questionnaire answers
  const promptGenerado = `Actúa como un productor musical de talla mundial y un letrista galardonado. Tu objetivo es componer y producir una pista de calidad de estudio basada en los siguientes metadatos.

[DIRECCIÓN ACÚSTICA Y MUSICAL]
- Género y Estilo: ${estiloMusical}.
- Calidad de Producción: Alta fidelidad, mezcla estéreo inmersiva, instrumentación profesional, masterización estándar de radio.
- Atmósfera General: ${tono}.
- Pista Vocal: Voz ${tipoVoz}, interpretación profundamente emotiva, dicción cristalina, afinación perfecta, presencia frontal en la mezcla.

[CONTEXTO DE LA LETRA]
- Destinatario: ${paraQuien} (Nombre: ${nombreDedicado}).
- Ocasión / Motivo Central: ${ocasion}.
- Material Fuente (Nuestra Historia): "${historia}".

[DIRECTRICES DE COMPOSICIÓN]
1. Transformación Poética: Extrae los sentimientos, anécdotas y detalles del "Material Fuente" y conviértelos en metáforas visuales. No hagas un resumen o una lista de hechos; crea una declaración natural y emocional.
2. Sinergia Rítmica: Adapta la métrica de los versos para que fluya naturalmente con el tempo y los patrones rítmicos típicos del género ${estiloMusical}.
3. Estructura Obligatoria: Formatea la letra utilizando corchetes para guiar la generación musical. Debes incluir:
[Intro] (Establece el ambiente musical)
[Verse 1] (Introduce la historia de forma sutil)
[Pre-Chorus] (Construye la emoción)
[Chorus] (El clímax pegadizo que resalta el motivo de la canción)
[Verse 2] (Profundiza en un detalle específico de la historia)
[Chorus]
[Bridge] (Pico emocional y variación melódica)
[Chorus]
[Outro] (Cierre musical gradual)`;
  
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
        promptGenerado, // prompt maestro guardado directamente
      ]
    );

    return { ok: true, id };
  } catch (error: any) {
    console.error("Error inserting MediaJob:", error);
    throw createError({ statusCode: 500, statusMessage: "Error saving request" });
  }
});
