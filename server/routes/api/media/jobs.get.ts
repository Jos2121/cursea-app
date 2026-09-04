import { defineHandler } from "nitro";
import { prisma } from "../../../utils/prisma";

export default defineHandler(async (event) => {
  const jobs = await prisma.mediaJob.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return jobs;
});
