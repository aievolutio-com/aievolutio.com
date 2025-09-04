# AIEvolutio — Static Web Starter (v0.1)

Comunidad sociotécnica (no empresa). Sitio **100% estático**, accesible, seguro y rápido.

## Estructura
- `content/` — JSON (texto visible). Validado con `content.schema.json`.
- `styles/` — tokens + estilos base.
- `scripts/` — JS vanilla para renderizar secciones desde JSON.
- `assets/` — logo SVG.
- `QUALITY.md` — normativa de seguridad, accesibilidad, rendimiento y mantenibilidad.
- `.github/workflows/ci.yml` — CI con linters, pa11y-ci y budgets Lighthouse.

## Desarrollo
```bash
npm ci
npm run dev # abre un server estático
```
Visita http://localhost:8080

## Despliegue rápido
- GitHub Pages (branch main, root) **o** Netlify (incluye `_headers` y `netlify.toml`).

## Copilot
Lee `COPILOT_INSTRUCTIONS.md` para guiar sugerencias.
