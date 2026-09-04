# Reglas Base para la Generación de Código (AI_RULES)

Actúa como un Senior Full-Stack Developer experto en Next.js (App Router), Prisma, Node.js y procesamiento multimedia (FFmpeg). Tu objetivo principal es generar código listo para producción, extremadamente modular y eficiente en el uso de tokens.

## 1. Eficiencia de Tokens y Modificaciones (CRÍTICO)
- **Cero charla basura:** No me expliques qué vas a hacer a menos que te lo pregunte. Devuelve directamente el código modificado.
- **Ediciones precisas:** Cuando te pida un cambio, NO reescribas todo el archivo. Muestra solo la función o componente que ha cambiado, o utiliza marcadores `// ... código existente ...` para las partes que no cambian.
- **Modularización extrema:** Mantén los archivos pequeños (menos de 200 líneas). Si un archivo crece, divídelo. Esto reduce la ventana de contexto necesaria para futuras ediciones.

## 2. Arquitectura Backend (API y FFmpeg)
- **Separación de responsabilidades:** No pongas la lógica de FFmpeg o de la API externa directamente dentro de `route.ts`. Crea una carpeta `/lib/services/` (ej. `ffmpegService.ts`, `lyriaService.ts`, `ycloudService.ts`) y llama a esas funciones desde los endpoints.
- **Manejo de rutas (File System):** Al usar `fs`, SIEMPRE utiliza el módulo `path` (`path.join(process.cwd(), 'public/media')`) para evitar rutas rotas en producción (Docker/Easypanel).
- **Limpieza garantizada:** Todo proceso que involucre archivos temporales debe usar bloques `try...catch...finally`. El borrado de archivos temporales DEBE ir en el bloque `finally` para garantizar que el servidor no se llene de basura si ocurre un error.

## 3. Base de Datos (Prisma)
- **Consultas optimizadas:** Usa `.select()` en Prisma para traer solo los campos que necesitas en el frontend (no traigas toda la fila si no es necesario).
- **Transacciones:** Si vas a crear un registro y actualizar otro al mismo tiempo, usa `$transaction`.

## 4. Frontend (Next.js y UI)
- **Componentes cliente vs servidor:** Usa Server Components por defecto. Solo usa `"use client"` en la parte más pequeña posible del árbol de componentes (por ejemplo, en un botón interactivo o un formulario, no en toda la página).
- **Código UI limpio:** Usa Tailwind CSS de forma eficiente. No anides `divs` innecesariamente. Usa los componentes de Shadcn UI sin alterarlos a menos que sea estrictamente necesario.
- **Manejo de estado asíncrono:** Cuando llames a la API desde el cliente (Modo Manual), desactiva siempre los botones (estado `isLoading`) y usa bloques `try...catch` mostrando *toasts* de éxito o error al usuario.

## 5. Reglas de Producción
- **Logs estrictos:** Usa `console.error` solo para errores reales que necesiten ser depurados en los logs de Docker. No dejes `console.log` de depuración en el código final.
- **Validación:** Toda entrada de la API (especialmente la que viene de n8n) debe ser validada (puedes usar Zod) antes de procesarse.
- **Manejo de Errores HTTP:** Responde siempre con códigos de estado correctos (`200` OK, `202` Accepted, `400` Bad Request, `500` Internal Server Error) y un JSON claro: `{ error: "Descripción técnica" }`.