# Guía para colaborador (ChatGPT)

Objetivo: Mantener contexto y consistencia al comenzar una nueva sesión.

## Principios
- Prioriza seguridad, simplicidad y mantenibilidad.
- Usa versionado semántico (SemVer): MAJOR.MINOR.PATCH.
- Sigue Conventional Commits para mensajes de commit y generación de changelog.

## Flujo de trabajo
1. Trabaja en la rama `pre` para cambios y revisiones.
2. Crea Pull Requests desde `pre` hacia `main`.
3. Los PRs ejecutan CI (validaciones) y, al mergearse a `main`, se despliega a GitHub Pages.
4. Actualiza `CHANGELOG.md` con cambios relevantes si aún no hay automatización.

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

## Seguridad
- No incluir secretos en el repo.
- Evitar dependencias innecesarias; sitio estático sin build por defecto.

## Checklist por sesión
- Revisar issues y PRs abiertos.
- Verificar que la estructura se mantiene limpia.
- Ejecutar una vista local del sitio si hay cambios en HTML/CSS.

