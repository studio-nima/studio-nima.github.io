# Studio Nima — portafolio

Sitio que reúne todos los proyectos publicados en GitHub Pages desde la cuenta
[studio-nima](https://github.com/studio-nima). HTML/CSS/JS vanilla, sin build.

## Dos versiones

- `/` — portafolio de estudio (oscuro, editorial).
- `/sitios/` — versión sencilla y cercana, pensada para dueños de negocios
  (claro, lenguaje directo, qué incluye, preguntas frecuentes). Usa los mismos
  datos (`js/sites.js`) y capturas. Si se llena `NIMA.whatsapp`, sus botones
  abren WhatsApp en lugar del correo.

## Agregar un sitio

1. **Automático** — basta con publicar el repo en GitHub Pages desde studio-nima:
   el portafolio lo detecta (API de GitHub) y lo muestra con vista previa en vivo.
2. **Ficha completa** — agregar un objeto en `js/sites.js` (esquema documentado
   arriba del archivo) y generar las capturas:

   ```bash
   npm i -D playwright && npx playwright install chromium   # una sola vez
   node tools/capture.mjs <repo>
   ```

El orden de `SITES` es el orden de aparición. Los repos a ocultar van en `NIMA.exclude`.

## Probar en local

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

Consola: `debug.state`, `debug.go('casa-flora')`, `debug.rediscover()`.
