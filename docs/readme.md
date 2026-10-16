# Guía rápida del repositorio

El proyecto es un sitio estático con HTML en la raíz y contenido en
`content/*.json`. La fuente de contexto compartida para agentes y colaboradores
es [`../AGENTS.md`](../AGENTS.md); las normas de calidad están en
[`quality.md`](quality.md).

## Desarrollo

```powershell
npm ci
npm run dev
```

## Automatización editorial

El único flujo editorial programado es el equipo autónomo de Vertex AI:
`.github/workflows/autonomous-ai-team.yml`. Consulta
[`ai-agent-playbook.md`](ai-agent-playbook.md) para conocer sus dos misiones
(artículo y mejora acotada del sitio), controles, límites y recuperación.
Google Sheets y su sincronización no forman parte del proceso.

## Validación y publicación

GitHub Actions ejecuta CI para los cambios y publica en Pages solo el commit
validado. Consulta [`operaciones.md`](operaciones.md) para el procedimiento
vigente.

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
