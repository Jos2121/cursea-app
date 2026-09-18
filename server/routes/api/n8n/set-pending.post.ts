import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.jobId) {
    throw createError({ statusCode: 400, statusMessage: "jobId es requerido" });
  }

  const jobId = body.jobId;

  // 1. Verificar existencia del job
  const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
  if (jobResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "MediaJob no encontrado" });
  }

  const job = jobResult.rows[0];

  // 2. Actualizar estado a 'Pendiente' en MediaJob
  await pool.query(
    `UPDATE "MediaJob" 
     SET pago = 'Pendiente', 
         "updatedAt" = NOW() 
     WHERE id = $1`,
    [jobId]
  );

  // 3. Preparar datos para notificación
  const customerName = body.customerName || body.nombre || body.cliente || job.artista || "Cliente";
  const customerPhone = body.customerPhone || body.phone || body.whatsapp || job.whatsappNumber || "No especificado";
  const monto = body.monto || body.amount || body.precio || "$5.00 USD";
  const titulo = body.titulo || job.titulo || "Sin título";
  const dedicatoria = body.dedicatoria || job.dedicatoria || job.prompt || "Personalizada";

  // URL base para el botón interactivo
  const baseUrl = process.env.PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NITRO_APP_URL || 
                   "https://sings.inspiramkt.agency";
  const confirmUrl = `${baseUrl.replace(/\/$/, "")}/api/n8n/confirm-payment?jobId=${encodeURIComponent(jobId)}`;

  // 4. Enviar notificación a Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  let telegramSent = false;
  let telegramResponse = null;

  if (botToken && chatId) {
    const messageText = 
`🔔 <b>Nuevo Pago Pendiente de Verificación</b>

🆔 <b>ID de Orden:</b> <code>${jobId}</code>
👤 <b>Cliente:</b> ${customerName}
📱 <b>WhatsApp:</b> ${customerPhone}
💰 <b>Monto:</b> ${monto}
🎵 <b>Título:</b> ${titulo}
📝 <b>Dedicatoria / Info:</b> <i>${dedicatoria.slice(0, 100)}</i>

<i>Haz clic abajo para confirmar el pago y comenzar la generación automática del audio y video.</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Confirmar Pago y Generar",
            url: confirmUrl
          }
        ]
      ]
    };

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "HTML",
          reply_markup: inlineKeyboard
        })
      });

      telegramResponse = await tgRes.json();
      telegramSent = tgRes.ok;
      if (!tgRes.ok) {
        console.error("[Telegram set-pending error]", telegramResponse);
      }
    } catch (tgErr) {
      console.error("[Telegram set-pending request error]", tgErr);
    }
  } else {
    console.warn("[set-pending] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados");
  }

  return {
    success: true,
    jobId,
    pago: "Pendiente",
    telegramSent,
    confirmUrl
  };
});
