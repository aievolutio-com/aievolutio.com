# aievolutio.com

Sitio web estático de AIEvolutio. Se valida mediante GitHub Actions y se
publica en GitHub Pages.

- Web: <https://aievolutio.com>
- URL de Pages: <https://aievolutio-com.github.io/aievolutio.com/>

## Estructura

- HTML en la raíz; estilos en `styles/` y JavaScript en `scripts/`.
- Contenido y navegación en `content/*.json`.
- Automatización, CI y despliegue en `.github/workflows/`.
- Guías de trabajo en `docs/`.

## Desarrollo local

```powershell
npm ci
npm run dev
```

## Publicación editorial autónoma

El único flujo editorial programado es
`.github/workflows/autonomous-ai-team.yml`, ejecutado con Vertex AI. El
contenido se mantiene en los JSON del repositorio; no se usa Google Sheets ni
una fuente CSV externa. Consulta el playbook para sus misiones, horarios,
validaciones y recuperación, evitando duplicar aquí las reglas operativas.

Consulta [`AGENTS.md`](AGENTS.md) para las instrucciones compartidas y
[`docs/ai-agent-playbook.md`](docs/ai-agent-playbook.md) para el proceso y el
runbook de recuperación.

## Ramas y despliegue

- Los cambios se integran mediante PR según los flujos activos del repositorio.
- CI valida los cambios y despliega a Pages el commit validado.
- `gh-pages` es un artefacto de publicación; no se edita manualmente.
- No fuerces actualizaciones de `pre` y no afirmes que producción se actualizó
  sin verificar el despliegue y el contenido servido.

Más información: [`docs/operaciones.md`](docs/operaciones.md) y
[`docs/contributing.md`](docs/contributing.md).
