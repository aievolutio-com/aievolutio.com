# Guía rápida del repositorio

AIEvolutio es un sitio estático con HTML, estilos, scripts y contenido en
`content/*.json`. El build genera las páginas de equipo y los artículos para
su publicación en GitHub Pages.

## Desarrollo local

```powershell
npm ci
npm run dev
```

## Validación y publicación

GitHub Actions ejecuta `.github/workflows/ci.yml` en cada cambio de `pre` o
`main`, valida el sitio y publica el mismo commit únicamente si las
comprobaciones pasan. Para repetirlo manualmente, ejecuta `CI` desde `pre` o
`main`; no se admite elegir una referencia arbitraria para publicar.

Configura reglas de rama en GitHub para exigir PR y el check `check` en `pre` y
`main`. El workflow `audit-main-branch.yml` solo detecta un push directo después
de que ocurre; no sustituye la protección de ramas.

La publicación diaria la gestiona
`.github/workflows/autonomous-ai-team.yml`; la auditoría visual independiente
cada ocho horas la gestiona `.github/workflows/autonomous-site-review.yml`.
Ambos ciclos de Vertex comparten el bloqueo de concurrencia. Sigue
[`ai-agent-playbook.md`](ai-agent-playbook.md) para Vertex AI, sus límites y el
procedimiento de recuperación. Los motivos de cambios web efectivos se
conservan en [`improvement-log.md`](improvement-log.md). Los artículos nuevos
no se publican si no se genera y valida su imagen; antes de habilitar la
publicación diaria hay que configurar un modelo Imagen verificado en la variable
de repositorio `VERTEX_AI_IMAGE_MODEL`.

Consulta [`../AGENTS.md`](../AGENTS.md) para las instrucciones compartidas,
[`quality.md`](quality.md) para los controles de calidad y
[`contributing.md`](contributing.md) para colaborar.
