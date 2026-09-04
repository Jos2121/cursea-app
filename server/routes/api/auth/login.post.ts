import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  // Simple password check for demo purposes
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  if (body.password === adminPassword) {
    return { ok: true, token: "admin-token-123" };
  }
  
  throw createError({ statusCode: 401, statusMessage: "Invalid password" });
});
