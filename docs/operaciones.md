# Operaciones

Esta guía apunta al contexto operativo canónico en [`ai-agent-playbook.md`](ai-agent-playbook.md)
y a las instrucciones comunes de agentes en [`../AGENTS.md`](../AGENTS.md).

## Desarrollo local

```powershell
npm ci
npm run dev
```

## Publicación diaria

`.github/workflows/autonomous-ai-team.yml` es el único flujo editorial
programado. Sus misiones, cadencia, validaciones y recuperación están
documentadas en [`ai-agent-playbook.md`](ai-agent-playbook.md). Consulta la
ejecución `Autonomous AI Team` en Actions y verifica el SHA, CI, despliegue y
contenido servido antes de afirmar que hubo publicación.

## Ramas y despliegue

- Trabaja desde una rama de cambio y abre el PR que corresponda a `pre`.
- `pre` valida y despliega el commit validado a GitHub Pages.
- `main` se integra mediante PR desde `pre`.
- No edites `gh-pages` a mano ni fuerces la rama `pre`.
- Usa rutas relativas para los recursos estáticos.
