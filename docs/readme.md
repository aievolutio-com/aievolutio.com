# AIEvolutio — Static Web Starter (v0.1)

Comunidad sociotécnica (no empresa). Sitio **100% estático**, accesible, seguro y rápido.

## Estructura
- `content/` — JSON (texto visible). Validado con `content.schema.json`.
- `styles/` — tokens + estilos base.
- `scripts/` — JS vanilla para renderizar secciones desde JSON.
- `assets/` — logo SVG.
- `quality.md` — normativa de seguridad, accesibilidad, rendimiento y mantenibilidad.
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
Lee `copilot-instructions.md` para guiar sugerencias.
# aievolutio.com

Repositorio del sitio web estático con CI/CD para GitHub Pages, dos ramas (`pre` y `main`), versionado semántico y plantillas de colaboración.

## Descripción

Este proyecto es un sitio estático (HTML/CSS/imagenes) sin dependencias ni build. Incluye workflows para validar y desplegar a GitHub Pages.

## Estructura

- `/` – Raíz del sitio (`index.html`, config)
- `assets/` – Logos e íconos (por ej. `assets/logo.svg`)
- `styles/` – CSS del sitio (`tokens.css`, `main.css`)
- `scripts/` – JS del sitio (`app.js`)
- `images/` – Recursos gráficos (fotos)
- `.github/workflows/` – CI/CD, previews y automatizaciones
- `docs/` – Guías y documentación

Si aún no existe `index.html`, crea uno en la raíz para comenzar.

## Uso local

- Abrir directamente: haz doble clic en `index.html` (si ya existe) para verlo en el navegador.
- Servir con un servidor local (opcional):
	- Python 3:

		```powershell
		python -m http.server 8080
		```

	- Node (http-server):

		```powershell
		npm run dev
		```

## Estándares y convenciones

- Mantén los estilos en `css/` y las imágenes optimizadas en `images/`.
- Usa nombres de archivos en minúsculas y con guiones (`mi-archivo.css`, `logo.svg`).
- Optimiza imágenes (SVG preferido cuando sea posible; comprime PNG/JPG).

## Flujo de ramas y despliegue

Ramas:

- `pre`: integración previa. Cada push y PR ejecuta CI.
- `main`: producción. Cada push despliega a GitHub Pages.

Este sitio puede publicarse en cualquier hosting estático. Actualmente: gh-pages branch con `peaceiris/actions-gh-pages`.

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

