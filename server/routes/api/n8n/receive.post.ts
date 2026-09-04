import { defineHandler } from "nitro";
import { readBody, createError, setResponseStatus } from "nitro/h3";
import { prisma } from "../../utils/prisma";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body?.prompt) {
    throw createError({ statusCode: 400, statusMessage: "Prompt is required" });
  }

  // Create job in database
  const job = await prisma.mediaJob.create({
    data: {
      source: 'n8n',
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      recipient: body.recipient,
      status: 'pending',
    }
  });

  // Acknowledge immediately
  setResponseStatus(event, 202);
  
  // Start background process asynchronously without waiting
  // In a real production environment you might use a proper background job queue (e.g. BullMQ)
  // For now, we simulate background processing
  processJob(job.id, body).catch(console.error);

  return { ok: true, jobId: job.id, message: "Job accepted and processing started in background" };
});

async function processJob(jobId: string, data: any) {
  try {
    // 1. Simulate audio download (Lyria API)
    await prisma.mediaJob.update({
      where: { id: jobId },
      data: { status: 'audio_ready', audioUrl: `/media/audio_${jobId}.mp3` }
    });
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 2000));

    // 2. Simulate video generation (ffmpeg)
    await prisma.mediaJob.update({
      where: { id: jobId },
      data: { status: 'video_ready', videoUrl: `/media/video_${jobId}.mp4` }
    });

    // Simulate delay
    await new Promise(r => setTimeout(r, 2000));

    // 3. Simulate WhatsApp send (YCloud API)
    await prisma.mediaJob.update({
      where: { id: jobId },
      data: { status: 'sent' }
    });
  } catch (error: any) {
    await prisma.mediaJob.update({
      where: { id: jobId },
      data: { status: 'error', errorLog: error.message }
    });
  }
}
