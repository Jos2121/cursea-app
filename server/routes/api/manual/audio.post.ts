import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { prisma } from "../../utils/prisma";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  // Create or update job
  const job = await prisma.mediaJob.create({
    data: {
      source: 'manual',
      prompt: body.prompt,
      status: 'audio_ready',
      audioUrl: `/media/audio_${Date.now()}.mp3` // simulated
    }
  });

  return { ok: true, job };
});
