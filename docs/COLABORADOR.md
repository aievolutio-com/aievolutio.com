# Guía para colaborador (ChatGPT)

Objetivo: Mantener contexto y consistencia al comenzar una nueva sesión.

## Principios
- Prioriza seguridad, simplicidad y mantenibilidad.
- Usa versionado semántico (SemVer): MAJOR.MINOR.PATCH.
- Sigue Conventional Commits para mensajes de commit y generación de changelog.
 - Documenta cada cambio relevante (README/docs) y procura que el título del PR sea semántico.

## Flujo de trabajo
1. Trabaja en la rama `pre` para cambios y revisiones.
2. Crea Pull Requests desde `pre` hacia `main`.
3. Los PRs ejecutan CI (validaciones) y, al mergearse a `main`, se despliega a GitHub Pages.
4. `release-please` generará PRs de versión y actualizará `CHANGELOG.md`. Si no aplica, actualiza `CHANGELOG.md` manualmente.
5. Cada PR publica un preview en `https://aievolutio.com/previews/pr-<numero>/`.

## Convenciones
- Estructura del sitio: HTML en la raíz, estilos en `css/`, imágenes en `images/`.
- Nombres en minúsculas con guiones.
- Optimiza imágenes y usa SVG cuando sea posible.

## Tareas comunes
- Crear/editar `index.html` y estilos en `css/styles.css`.
- Actualizar documentación en `docs/`.
- Mantener `.gitignore` actualizado.
- Preparar notas de versión en `CHANGELOG.md`.

## Ramas
- `main`: producción (despliegue a Pages).
- `pre`: integración previa (staging/preview).

Protecciones recomendadas (GitHub > Settings > Branches > Rules):
- En `main` exigir:
	- Pull request obligatorio (sin pushes directos).
	- Checks requeridos: CI, link check y preview (si aplica) deben estar en verde.
	- 1 review como mínimo (opcional).
	- Habilitar auto-merge (squash) para cuando todo esté verde.
- En `pre`, opcional: permitir pushes pero ejecutar CI siempre.

Automatización: cada push a `pre` abre/actualiza un PR `pre` → `main` y activa auto-merge (sólo se completa si los checks y reglas lo permiten).

## Seguridad
- No incluir secretos en el repo.
- Evitar dependencias innecesarias; sitio estático sin build por defecto.

## Checklist por sesión
- Revisar issues y PRs abiertos.
- Verificar que la estructura se mantiene limpia.
- Ejecutar una vista local del sitio si hay cambios en HTML/CSS.
- Verificar que el PR cumpla el formato SemVer/Conventional Commits y que la documentación se haya actualizado.
 - Revisar el preview automático del PR.

## GitHub Pages y permisos (si falla el deploy)
- En el repositorio: Settings > Pages > Build and deployment > Source: selecciona "GitHub Actions".
- En el repositorio: Settings > Actions > General > Workflow permissions: "Read and write permissions".
- En organizaciones: Organization settings > Pages: habilitar GitHub Pages y permitir despliegue desde Actions.
- Re-ejecutar el workflow "Deploy Pages" (Actions > Deploy Pages > Run workflow).

