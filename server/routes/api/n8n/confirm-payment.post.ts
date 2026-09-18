import { defineHandler } from "nitro";
import { readBody, setResponseStatus } from "nitro/h3";
import { pool } from "../../../utils/db";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body || !body.jobId) {
    setResponseStatus(event, 400);
    return { statusMessage: "jobId es requerido" };
  }
  
  const jobId = body.jobId;

  // 1. Verify job exists and check generation limit
  const jobResult = await pool.query('SELECT * FROM "MediaJob" WHERE id = $1', [jobId]);
  
  if (jobResult.rows.length === 0) {
    setResponseStatus(event, 404);
    return { statusMessage: "MediaJob no encontrado" };
  }
  
  const job = jobResult.rows[0];
  const generaciones = job.generaciones || 0;
  
  if (generaciones >= 2) {
    setResponseStatus(event, 403);
    return { statusMessage: "Límite de generaciones alcanzado" };
  }
  
  // 2. Respond immediately to n8n with HTTP 202
  setResponseStatus(event, 202);
  const responseData = { status: "processing", message: "Pago confirmado, generando producto" };
  
  // 3. Process the generation in background
  Promise.resolve().then(async () => {
    try {
      console.log(`[Webhook] Iniciando background job para ${jobId}. Generación actual: ${generaciones}`);
      
      // Update payment status and increment generation count
      await pool.query(
        `UPDATE "MediaJob" SET pago = 'Realizado', generaciones = COALESCE(generaciones, 0) + 1 WHERE id = $1`,
        [jobId]
      );
      
      // We would ideally call the internal lyria/ffmpeg generation logic here.
      // Since this is a server route, we can do an internal fetch to our own endpoints
      // to reuse the existing generation logic.
      
      const baseUrl = process.env.PUBLIC_URL || "http://localhost:5173";
      
      // Step A: Generate Audio
      console.log(`[Webhook] Solicitando generación de audio para ${jobId}...`);
      const audioRes = await fetch(`${baseUrl}/api/manual/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: job.prompt, jobId: job.id })
      });
      
      if (!audioRes.ok) {
        throw new Error(`Fallo en audio: ${await audioRes.text()}`);
      }
      
      // Wait a moment for DB propagation if needed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step B: Generate Video
      console.log(`[Webhook] Solicitando generación de video para ${jobId}...`);
      let parsedConfig = job.config;
      if (typeof parsedConfig === 'string') {
        try { parsedConfig = JSON.parse(parsedConfig); } catch(e) {}
      }
      
      // Extract template defaults from job
      const videoPayload = {
        jobId: job.id,
        backgroundUrl: job.backgroundUrl || '',
        userPhotoUrl: job.userPhotoUrl || '',
        titulo: job.titulo || '',
        artista: job.artista || '',
        dedicatoria: job.dedicatoria || '',
        templateConfig: parsedConfig || {}
      };
      
      const videoRes = await fetch(`${baseUrl}/api/manual/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoPayload)
      });
      
      if (!videoRes.ok) {
        throw new Error(`Fallo en video: ${await videoRes.text()}`);
      }
      
      console.log(`[Webhook] Job ${jobId} completado exitosamente en background.`);
    } catch (error) {
      console.error(`[Webhook Error] Fallo procesando job en background ${jobId}:`, error);
      // Opcional: Actualizar el status del job a 'error' en caso de fallo crítico
      try {
        await pool.query(`UPDATE "MediaJob" SET status = 'error' WHERE id = $1`, [jobId]);
      } catch (e) {
        console.error("No se pudo actualizar el estado a error", e);
      }
    }
  });

  return responseData;
});
