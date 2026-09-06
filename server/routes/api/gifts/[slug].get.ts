import { defineHandler } from "nitro";
import { getRouterParam, createError } from "nitro/h3";
import { pool } from "../../../../utils/db";

export default defineHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required" });
  }

  const result = await pool.query('SELECT * FROM "GiftSite" WHERE slug = $1', [slug]);
  const gift = result.rows[0];

  if (!gift) {
    throw createError({ statusCode: 404, statusMessage: "Gift not found" });
  }

  return gift;
});
