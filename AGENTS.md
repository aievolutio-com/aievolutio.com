# Instrucciones para agentes

Este archivo es la entrada común para los agentes que trabajan en el
repositorio. Copilot y Antigravity deben seguir estas mismas instrucciones;
sus archivos de configuración solo apuntan aquí.

## Fuentes de contexto

- [`docs/ai-agent-playbook.md`](docs/ai-agent-playbook.md) es la fuente única
  de propósito, voz, evidencia, publicación autónoma y recuperación.
- [`docs/website-roadmap.md`](docs/website-roadmap.md) contiene las prioridades
  de experiencia y las hipótesis que deben validarse con personas.
- [`docs/quality.md`](docs/quality.md) define calidad, accesibilidad,
  rendimiento y privacidad.

Si otro documento contradice estas fuentes, corrige la información obsoleta;
no propagues ambas versiones.

## Sitio y publicación

- El sitio es estático. El contenido se mantiene en `content/*.json`; las
  publicaciones no se alimentan desde hojas de cálculo.
- `.github/workflows/autonomous-ai-team.yml` es el único flujo editorial
  programado. Sigue `docs/ai-agent-playbook.md` para las misiones, cadencia,
  límites y recuperación de Vertex AI.
- Publica únicamente cambios validados por CI; ningún fallo autoriza a saltarse
  controles.
- No reintroduzcas sincronización desde Sheets ni otra fuente de contenido
  externa salvo petición explícita y actualización de esta fuente de contexto.
- No afirmes que producción se actualizó sin comprobar CI, despliegue y el
  contenido servido.

## Cambios

- Trabaja desde `pre`; respeta los cambios concurrentes y no fuerces pushes.
- Mantén las rutas de edición de Vertex limitadas a las que valida
  `scripts/autonomous-ai-team.mjs`.
- Ejecuta las validaciones pertinentes y actualiza la documentación si cambia
  un flujo.
