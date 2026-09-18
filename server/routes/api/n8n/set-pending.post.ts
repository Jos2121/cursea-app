import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event) || {};

  const jobIdInput = body.jobId;
  const whatsappNumber = body.whatsappNumber || body.wa_id || body.whatsapp;
  const metodo = body.metodo || "Desconocido";
  const nombre = body.nombre || body.customerName || body.cliente;
  const monto = body.monto || body.amount || body.precio || "$5.00 USD";

  let targetJobId = jobIdInput;
  let job: any = null;

  if (targetJobId) {
    const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [targetJobId]);
    if (jobResult.rows.length > 0) {
      job = jobResult.rows[0];
    }
  } else if (whatsappNumber) {
    const jobResult = await pool.query(
      'SELECT * FROM "MediaJob" WHERE "whatsappNumber" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [whatsappNumber]
    );
    if (jobResult.rows.length > 0) {
      job = jobResult.rows[0];
      targetJobId = job.id;
    }
  }

  if (!targetJobId || !job) {
    throw createError({ statusCode: 404, statusMessage: "No se encontró un trabajo para este identificador o número" });
  }

  // Actualizar estado a 'Pendiente'
  await pool.query(
    `UPDATE "MediaJob" 
     SET pago = 'Pendiente', 
         "updatedAt" = NOW() 
     WHERE id = $1`,
    [targetJobId]
  );

  // Preparar datos para notificación
  const customerName = nombre || job.artista || "Cliente";
  const customerPhone = whatsappNumber || job.whatsappNumber || "No especificado";
  const titulo = job.titulo || "Sin título";
  const dedicatoria = job.dedicatoria || job.prompt || "Personalizada";

  // URL base para el botón interactivo
  const baseUrl = process.env.PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NITRO_APP_URL || 
                   "https://sings.inspiramkt.agency";
  const confirmUrl = `${baseUrl.replace(/\/$/, "")}/api/n8n/confirm-payment?jobId=${encodeURIComponent(targetJobId)}`;

  // Enviar notificación a Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const messageText = 
`🔔 <b>Nuevo Pago Pendiente de Verificación</b>

🆔 <b>ID de Orden:</b> <code>${targetJobId}</code>
👤 <b>Cliente:</b> ${customerName}
📱 <b>WhatsApp:</b> ${customerPhone}
💰 <b>Monto:</b> ${monto}
💳 <b>Método:</b> ${metodo}
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

      if (!tgRes.ok) {
        const telegramResponse = await tgRes.json();
        console.error("[Telegram set-pending error]", telegramResponse);
      }
    } catch (tgErr) {
      console.error("[Telegram set-pending request error]", tgErr);
    }
  } else {
    console.warn("[set-pending] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados");
  }

  return {
    ok: true,
    message: "Estado actualizado a Pendiente",
    jobId: targetJobId
  };
});
