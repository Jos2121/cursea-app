import { defineHandler } from "nitro";
import { getRouterParam, createError, setHeader, sendStream } from "nitro/h3";
import fs from "fs";
import path from "path";

export default defineHandler(async (event) => {
  const file = getRouterParam(event, 'file');
  
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "Filename is required" });
  }

  // Prevenir ataques de path traversal asegurándonos de que solo se tome el nombre del archivo
  const safeFile = path.basename(file);
  const filePath = path.resolve(process.cwd(), "public/media", safeFile);

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  // Asignar el Content-Type adecuado según la extensión
  const ext = path.extname(safeFile).toLowerCase();
  if (ext === '.mp3') {
    setHeader(event, 'Content-Type', 'audio/mpeg');
  } else if (ext === '.mp4') {
    setHeader(event, 'Content-Type', 'video/mp4');
  } else {
    setHeader(event, 'Content-Type', 'application/octet-stream');
  }

  // Enviar el archivo como un stream binario
  return sendStream(event, fs.createReadStream(filePath));
});
