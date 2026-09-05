import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "OPENROUTER_API_KEY is not configured" });
  }

  const model = process.env.OPENROUTER_MODEL || "google/lyria-3-pro-preview";
  const referer = process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency";

  let response;
  let responseData;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "VideoFlow"
        },
        body: JSON.stringify({
          model: model,
          modalities: ["text", "audio"],
          audio: { voice: "alloy", format: "mp3" },
          messages: [
            {
              role: "user",
              content: body.prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter Error Body (Attempt ${attempts}):`, errorText);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          throw createError({ statusCode: response.status, statusMessage: "Failed to generate audio from OpenRouter" });
        }
      }

      responseData = await response.json();
      break;
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        console.error("OpenRouter Fetch Error:", err);
        throw createError({ statusCode: 500, statusMessage: err.message || "Failed to contact OpenRouter" });
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const audioBase64 = responseData?.choices?.[0]?.message?.audio?.data;
  if (!audioBase64) {
    throw createError({ statusCode: 500, statusMessage: "No audio data received from OpenRouter" });
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  
  const mediaDir = path.resolve(process.cwd(), "public/media");
  fs.mkdirSync(mediaDir, { recursive: true });
  
  const jobId = randomUUID();
  const fileName = `audio_${Date.now()}.mp3`;
  const relativeUrl = `/media/${fileName}`;
  const filePath = path.join(mediaDir, fileName);
  
  fs.writeFileSync(filePath, buffer);

  const result = await pool.query(
    `INSERT INTO "MediaJob" (id, prompt, status, "audioUrl", "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
    [jobId, body.prompt, 'audio_ready', relativeUrl]
  );

  return { ok: true, job: result.rows[0] };
});
