import { defineHandler } from "nitro";
import { getQuery, createError } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const jobId = query?.jobId as string;

  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: "jobId es requerido" });
  }

  // Verificar job
  const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
  if (jobResult.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "MediaJob no encontrado" });
  }

  const job = jobResult.rows[0];
  const currentGeneraciones = Number(job.generaciones || 0);

  if (currentGeneraciones >= 2) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Límite de Generaciones - Cursea Digital</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #FAF7F2; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; padding: 32px; border-radius: 24px; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #fecdd3; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #8B1F32; font-size: 20px; margin: 0 0 10px; }
    p { color: #78716c; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Límite de Generaciones Alcanzado</h1>
    <p>Este pedido (<code>${jobId}</code>) ya cuenta con ${currentGeneraciones} / 2 generaciones y no puede procesarse nuevamente.</p>
  </div>
</body>
</html>`;
  }

  // Llamar internamente al POST o ejecutar la confirmación delegando al webhook POST
  try {
    const baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${baseUrl.replace(/\/$/, "")}/api/n8n/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId })
    });
  } catch (err) {
    console.error("[confirm-payment.get proxy error]", err);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Confirmado - Cursea Digital</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #FAF7F2; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; padding: 36px; border-radius: 24px; max-width: 460px; text-align: center; box-shadow: 0 12px 30px rgba(139,31,50,0.08); border: 1px solid #F5EADC; }
    .icon { font-size: 52px; margin-bottom: 16px; }
    h1 { color: #8B1F32; font-size: 22px; margin: 0 0 12px; font-weight: 800; }
    p { color: #57534e; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <div class="badge">Pago Verificado</div>
    <h1>¡Generación en Proceso!</h1>
    <p>El pago para el pedido <code>${jobId}</code> ha sido confirmado exitosamente.<br/>La canción y el video se están procesando en segundo plano con Lyria y FFmpeg.</p>
  </div>
</body>
</html>`;
});
