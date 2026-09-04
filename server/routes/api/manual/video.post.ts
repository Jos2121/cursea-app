import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { prisma } from "../../../utils/prisma";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.jobId || !body.imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "jobId and imageUrl are required" });
  }

  const job = await prisma.mediaJob.update({
    where: { id: body.jobId },
    data: {
      imageUrl: body.imageUrl,
      status: 'video_ready',
      videoUrl: `/media/video_${Date.now()}.mp4` // simulated
    }
  });

  return { ok: true, job };
});
