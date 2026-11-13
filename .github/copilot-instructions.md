# Instrucciones del repositorio AIEvolutio

La fuente única de gobernanza operativa, diseño NeuroUX, estándares editoriales y autonomía 100 % por IA reside en [`AGENTS.md`](../AGENTS.md).

Antes de proponer o aplicar cualquier cambio en este repositorio:

1. Leer y cumplir [`AGENTS.md`](../AGENTS.md) como constitución operativa y marco de garantías (`AIVisio`, `AIDux`, `AIJuris`).
2. Aplicar las instrucciones específicas de ámbito en [`.github/instructions/`](instructions/):
   - [Reglas de NeuroUX, identidad visual y accesibilidad AAA](instructions/neuroux-accessibility.instructions.md)
   - [Reglas editoriales, GEO y veracidad técnica](instructions/editorial-geo-veracity.instructions.md)
   - [Reglas de diagramas Mermaid](instructions/mermaid.instructions.md)
3. Consultar el alcance vigente en [`docs/roadmap.md`](../docs/roadmap.md) y [`docs/user-story-map.md`](../docs/user-story-map.md) sin duplicar contenido ni inventar métricas.
4. Ejecutar antes de confirmar cambios la verificación completa: `npm run build:site`, `npm test`, `npm run lint:js`, `npm run lint:css`, `npm run lint:html` y `node scripts/self-heal-check.mjs`.
