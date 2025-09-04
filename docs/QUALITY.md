# Normativa de Calidad — AIEvolutio (v0.1)

## Seguridad
- **CSP** estricta: `default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.
- **Headers**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` · `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: no-referrer` · `Permissions-Policy: geolocation=(), microphone=()`.
- Sin cookies de terceros. Sin trackers. Códigos externos, cero.

## Accesibilidad (WCAG 2.2 AA)
- Semántica correcta, orden lógico, foco visible, contraste ≥ 4.5:1, `skip-link`, labels, `aria-*` solo cuando haga falta.
- Validación CI con **pa11y-ci** y **html-validate**.

## Rendimiento
- LCP < 2.5 s en 4G/ móvil medio; TBT < 200 ms; TTI < 3.5 s.
- Presupuesto: JS < 50 KB gzip, CSS < 50 KB gzip, imágenes < 200 KB por recurso.
- Preload crítico (CSS tokens), diferir JS, imágenes SVG/WEBP.

## Mantenibilidad
- Estructura simple: `content/`, `styles/`, `scripts/`, `assets/`.
- Linting (ESLint, Stylelint, html-validate), formato con Prettier.
- Convencional Commits; PR template con checklist.

## Privacidad y Ética
- Sin almacenamiento personal. Formularios opcionales → email público y consentimiento explícito.
- Contenido con **CC BY-SA 4.0**. Código con **MIT**.
