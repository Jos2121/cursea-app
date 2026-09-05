import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  const rawTarget = body.whatsappNumber || body.recipient;
  
  if (!body.jobId || !rawTarget) {
    throw createError({ statusCode: 400, statusMessage: "jobId and whatsappNumber are required" });
  }

  const target = rawTarget.trim();

  // 1. Validar registro
  const result = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [body.jobId]);
  const job = result.rows[0];

  if (!job || !job.videoUrl) {
    throw createError({ statusCode: 400, statusMessage: "Job not found or missing videoUrl" });
  }

  // 2. Construir URL pública
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sings.inspiramkt.agency").replace(/\/$/, "");
  const fullVideoUrl = `${appUrl}${job.videoUrl}`;

  // 3. Petición a YCloud
  const apiKey = process.env.YCLOUD_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "YCLOUD_API_KEY is not configured" });
  }

  const isUsername = target.startsWith("PE.");
  const destinationKey = isUsername ? "recipient" : "to";
  
  const payload: any = {
    [destinationKey]: target,
    type: "video",
    video: {
      link: fullVideoUrl,
      caption: "¡Aquí tienes tu video generado!"
    }
  };

  if (process.env.YCLOUD_FROM) {
    payload.from = process.env.YCLOUD_FROM;
  }

  try {
    const ycloudRes = await fetch("https://api.ycloud.com/v2/whatsapp/messages/sendDirectly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!ycloudRes.ok) {
      const errorData = await ycloudRes.json().catch(() => ({}));
      console.error("YCloud Error Response:", JSON.stringify(errorData));
      throw createError({
        statusCode: ycloudRes.status,
        statusMessage: errorData?.error?.message || errorData?.message || "Error al enviar mensaje por YCloud"
      });
    }
  } catch (error: any) {
    console.error("YCloud Fetch Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Failed to contact YCloud API"
    });
  }

  // 4. Actualizar tabla
  const updateResult = await pool.query(
    `UPDATE "MediaJob"
     SET "whatsappNumber" = $1, status = $2, "updatedAt" = NOW()
     WHERE id = $3 RETURNING *`,
    [target, 'sent', body.jobId]
  );

  return { ok: true, job: updateResult.rows[0] };
});
