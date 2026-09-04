import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { prisma } from "../../utils/prisma";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.jobId || !body.recipient) {
    throw createError({ statusCode: 400, statusMessage: "jobId and recipient are required" });
  }

  const job = await prisma.mediaJob.update({
    where: { id: body.jobId },
    data: {
      recipient: body.recipient,
      status: 'sent',
    }
  });

  return { ok: true, job };
});
