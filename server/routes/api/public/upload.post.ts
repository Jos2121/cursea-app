import { defineHandler } from "nitro";
import { readMultipartFormData, createError } from "nitro/h3";
import fs from "node:fs/promises";
import path from "node:path";

export default defineHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  // Find the file in the multipart form data
  const fileField = formData.find((field) => field.name === "file" || field.filename);

  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, statusMessage: "No file found in request" });
  }

  const MAX_SIZE = 6 * 1024 * 1024; // 6MB
  if (fileField.data.length > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: "File size exceeds 6MB limit" });
  }

  // Ensure public/media directory exists
  const publicMediaDir = path.join(process.cwd(), "public", "media");
  await fs.mkdir(publicMediaDir, { recursive: true }).catch(() => {});

  // Generate a unique filename based on the current timestamp
  const fileName = `cover_${Date.now()}.jpg`;
  const filePath = path.join(publicMediaDir, fileName);

  await fs.writeFile(filePath, fileField.data);

  return {
    url: `/media/${fileName}`
  };
});
