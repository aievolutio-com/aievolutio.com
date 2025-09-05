# Operaciones (guía rápida)

Esta guía es la versión corta para trabajar con el sitio.

## Ver la web
- GitHub Pages: https://aievolutio-com.github.io/aievolutio.com/

## Ejecutar en local
```powershell
npm run dev
# ó
python -m http.server 8080
```

## Flujo de trabajo
- Trabaja en una rama (feature/*) → se abre PR a `pre` automáticamente.
- Al fusionar en `pre`, se abre PR a `main` (título: `ci: sync pre -> main`).
- Al fusionar en `main`, se despliega a GitHub Pages.

## Desplegar manualmente (si lo necesitas ya)
1) Actions → "Deploy to gh-pages" (o "Deploy site").
2) Run workflow → "Use workflow from": `pre` (o `main`), campo `ref`: la misma rama.
3) Abrir la web con Ctrl+F5: https://aievolutio-com.github.io/aievolutio.com/

## Recuperación rápida
Si la web redirige a un dominio o no carga estilos:
1) Settings → Pages → Custom domain: vacío → Save.
2) Actions → Deploy → `Use workflow from: pre`, `ref: pre` (limpia `gh-pages` y quita CNAME).

## Reglas importantes
- En `index.html` y JS usa rutas relativas (sin `/` inicial):
  - `assets/logo.svg`, `styles/main.css`, `scripts/app.js`.
- No edites la rama `gh-pages` a mano (la sobreescribe el deploy).
- Títulos de PR: usa Conventional Commits (ej.: `feat: …`, `fix: …`, `ci: …`).

## PR grande con conflictos (pre → main)
Si GitHub dice que "hay demasiados conflictos para resolver en la web":
1) En local, asegúrate de estar en `pre` actualizado.
2) Ejecuta:
```powershell
git fetch origin
git checkout pre
git reset --hard origin/pre
git merge -s ours origin/main -m "ci: sync pre -> main (resolve via pre)"
git push origin pre
```
3) Vuelve al PR y haz "Squash and merge".

## Contacto
Si algo se rompe, despliega desde `pre` y avisa en el repo.
