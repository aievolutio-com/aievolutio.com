# Contribuir (versión simple)

## Cómo trabajo una tarea

1. Crea una rama: `feature/mi-cambio`.
2. Haz commits con títulos tipo Conventional Commits:
   - `feat: …` nuevas funciones
   - `fix: …` corregir errores
   - `docs: …` solo documentación
   - `chore:` o `ci:` mantenimiento/CI
3. Empuja la rama. Se abrirá un PR a `pre` automáticamente.
4. Cuando los checks estén en verde, se fusiona el PR (ideal: Squash and merge).
5. Se abrirá un PR `ci: sync pre -> main`. Fusiónalo cuando pase CI.

## Reglas de código

- HTML/CSS/JS simples. Rutas relativas (sin `/` inicial).
- Nombres de archivos en minúsculas y con guiones.
- Evita archivos grandes sin necesidad.

## Validaciones automáticas

- ESLint, Stylelint, html-validate, lychee, html5validator, Pa11y, Lighthouse.
- Política de nombres: minúsculas y sin espacios.
  - Excepciones: `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `CHANGELOG.md`, `VERSION`, `_headers`.

## Despliegue

- Automático al fusionar en `pre`/`main`.
- Manual: Actions → Deploy → `Use workflow from: pre` (o `main`), `ref` igual.

## Contexto común y publicaciones autónomas

- Sigue [`../AGENTS.md`](../AGENTS.md) y el [`ai-agent-playbook.md`](ai-agent-playbook.md) para los flujos vigentes.
- Vertex AI ejecuta el único flujo editorial programado; consulta el playbook para sus misiones y límites.
- El contenido se mantiene en `content/*.json`; no se usa Google Sheets ni un CSV externo para publicar.
- Solo se despliega el commit que supera CI. No fuerces pushes ni afirmes que producción cambió sin verificar el despliegue.

## Problemas frecuentes

- "No veo estilos en GitHub Pages": revisa que las rutas no empiecen por `/` y redepliega desde `pre`.
- "Redirige a mi dominio": borra el Custom domain en Settings → Pages y redepliega desde `pre`.

## Gracias

Sigue estos pasos y todo debería ir fluido. Cualquier duda, abre un issue.
