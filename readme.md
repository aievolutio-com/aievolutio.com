# aievolutio.com

Repositorio del sitio estático con CI/CD en GitHub Actions, flujo de ramas `pre` → `main` y publicación en GitHub Pages (rama `gh-pages`).

Estado actual (fuente de verdad)
- `pre`: OK (rutas relativas, sin CNAME).
- `main`: alineado cuando merges el PR "ci: sync pre -> main".
- `gh-pages`: artefacto de despliegue (se sobreescribe desde `pre`/`main`).

URL de la web (sin DNS):
https://aievolutio-com.github.io/aievolutio.com/

## Estructura

- `index.html` – Home del sitio (usa rutas relativas: `assets/...`, `styles/...`, `scripts/...`).
- `assets/`, `images/` – Recursos estáticos.
- `styles/` – CSS (`tokens.css`, `main.css`).
- `scripts/` – JS (`app.js`).
- `content/` – Contenido JSON (`content.es.json`).
- `.github/workflows/` – CI/CD (lint, checks, auto‑PRs, deploy).
- `docs/` – Guías operativas (véase Operaciones más abajo).

## Ejecutar en local

- Abrir directamente `index.html` o usar servidor simple:

```powershell
npm run dev
# ó
python -m http.server 8080
```

## Flujo de ramas

- `feature/*` → PR automático a `pre` (título semántico). Auto‑merge cuando CI está verde.
- `pre` → PR automático a `main` ("ci: sync pre -> main"). Auto‑merge cuando CI está verde.
- `gh-pages` → rama de publicación (no editar a mano).

Protecciones: sólo mediante PRs a `main`.

## Despliegue (Deploy)

Workflow: `.github/workflows/gh-pages.yml` (nombre: "Deploy site"/"Deploy to gh‑pages").

- Manual: Actions → Deploy → Run workflow →
	- Use workflow from: `pre` (o `main`)
	- ref: la misma rama
- Automático: en cada push a `pre`/`main`.

El deploy reescribe `gh-pages` con `force_orphan` y excluye `CNAME`.

## Operaciones (playbook)

1) Rutas absolutas rompen en GitHub Pages. Usa rutas relativas en HTML/JS.
2) Si `gh-pages` publica mal o aparece CNAME:
	 - Settings → Pages → Custom domain vacío.
	 - Actions → Deploy → Use workflow from `pre`, ref `pre`.
3) Conflictos en PR `pre` → `main` demasiado grandes para la web:
	 - Estrategia segura:
		 - En local: `git checkout pre && git fetch`.
		 - `git merge -s ours origin/main -m "ci: sync pre -> main (resolve via pre)"`.
		 - `git push origin pre`.
	 - Esto deja el PR listo para "Squash and merge" (manteniendo el contenido de `pre`).
4) Títulos de PR (Conventional Commits): usa prefijos como `feat:`, `fix:`, `docs:`, `chore:`, `ci:`.

## Estilo y validaciones

- ESLint, Stylelint, html-validate, lychee, html5validator, Pa11y, Lighthouse.
- Política de nombres: minúsculas y sin espacios (excepciones: `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `CHANGELOG.md`, `VERSION`, `_headers`).

## Documentación adicional

- Guía rápida de operaciones: `docs/operaciones.md`
- Cómo contribuir (breve): `docs/contributing.md`

## Licencia

MIT (si no indicas lo contrario).

