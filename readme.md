# aievolutio.com

Repositorio del sitio web estático con CI/CD para GitHub Pages, dos ramas (`pre` y `main`), versionado semántico y plantillas de colaboración.

## Descripción

Este proyecto es un sitio estático (HTML/CSS/imagenes) sin dependencias ni build. Incluye workflows para validar y desplegar a GitHub Pages.

## Estructura

- `/` – Raíz del sitio (por ej. `index.html`, favicon, etc.)
- `css/` – Hojas de estilo del sitio
- `images/` – Recursos gráficos e íconos
 - `.github/workflows/` – CI y despliegue a Pages
 - `docs/` – Guías y documentación

Si aún no existe `index.html`, crea uno en la raíz para comenzar.

## Uso local

- Abrir directamente: haz doble clic en `index.html` (si ya existe) para verlo en el navegador.
- Servir con un servidor local (opcional):
	- Con Python 3:

		```powershell
		python -m http.server 8080
		```

		Luego visita http://localhost:8080

## Estándares y convenciones

- Mantén los estilos en `css/` y las imágenes optimizadas en `images/`.
- Usa nombres de archivos en minúsculas y con guiones (`mi-archivo.css`, `logo.svg`).
- Optimiza imágenes (SVG preferido cuando sea posible; comprime PNG/JPG).

## Flujo de ramas y despliegue

Ramas:

- `pre`: integración previa. Cada push y PR ejecuta CI.
- `main`: producción. Cada push despliega a GitHub Pages.

Este sitio puede publicarse en cualquier hosting estático (por ejemplo, GitHub Pages, Netlify o Vercel). Aquí usamos Pages con el workflow `pages.yml`.

- GitHub Pages (rama `gh-pages` o configuración de Pages apuntando a la raíz del repo).
- Netlify: conecta el repositorio y elige despliegue sin build.
- Vercel: importa el repositorio como “Static Site”.

## Próximos pasos sugeridos

- Añadir `index.html` y, si aplica, páginas adicionales (`about.html`, etc.).
- Crear una hoja de estilos base en `css/` (por ejemplo, `styles.css`).
- Agregar un favicon y metaetiquetas (SEO, Open Graph, viewport).
- Configurar despliegue automático desde el repositorio.
 - Adoptar Conventional Commits (feat, fix, docs, chore, etc.) para historial limpio.
 - Generar releases con SemVer y mantener `CHANGELOG.md`.

## Licencia

Si no se especifica lo contrario, todos los derechos reservados. Agrega un archivo `LICENSE` si deseas usar una licencia abierta.

