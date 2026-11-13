# Normativa de calidad y NeuroUX — AIEvolutio (v2.0)

## Seguridad

- **CSP efectiva (`_headers`):** `default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; img-src 'self' data: https://aievolutio.com https://www.google-analytics.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` (al habilitar sincronización pública desde navegador hacia GitHub Issues en `EmoInsight`, mantener lista explícita de orígenes permitidos).
- **Cabeceras de endurecimiento:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` · `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: no-referrer` · `Permissions-Policy: geolocation=(), microphone=()`.
- Sin cookies publicitarias ni rastreadores opacos de terceros; analítica agregada en GA4 federado con Google Cloud sin claves estáticas.

## Accesibilidad (WCAG 2.2 AAA objetivo) y diseño visual

- **Contraste AAA (`>= 7:1` en texto normal):** texto principal `#0A192F` sobre `#FFFFFF` / `#F8FAFC` (`> 15:1`); variante azul reforzada (`#144870`) para texto pequeño azul sobre fondo claro; `#1E6091` para apoyo visual, enlaces grandes o superficies oscuras con texto blanco; `#FF6B4A` **estrictamente reservado** a logotipo, isotipos y acentos gráficos no textuales.
- **Tipografía y carga cognitiva (NeuroUX):** `Montserrat` (700) y `Roboto` (400/500), tamaño base de lectura fluido `>= 18 px` en escritorio, interlineado `~1.7`, ancho de medida `60–66 ch` y `>= 45 %` de espacio libre.
- **Iconografía:** prohibidos los emojis estructurales en titulares, tarjetas, botones, metadatos o navegación; sustituir por SVG lineales minimalistas (`stroke-width <= 1.5px`, `aria-hidden="true"`).
- **Semántica y validación:** HTML5 válido, foco visible, `skip-link`, `aria-*` mínimo necesario, `html-validate` en CI y auditorías con `pa11y-ci`.

## Rendimiento

- LCP < 2.5 s en 4G / móvil medio; TBT < 200 ms; TTI < 3.5 s; CLS = 0 gracias al prerenderizado estático.
- Presupuesto estricto definido en `lighthouserc.json` (peso total acotado, cero frameworks JS pesados, JS modular diferido e imágenes SVG/WebP optimizadas).

## Veracidad editorial, ortotipografía y GEO

- **Ortotipografía RAE:** estricto español de España sin capitalización anglosajona en títulos ni epígrafes, y cero jerga interna del proyecto en la interfaz pública.
- **Estándar editorial de 3 capas:** artículos tácticos diarios de 600–900 palabras y guías pilar semanales de 1000–1500 palabras («En 30 segundos» + desarrollo con SVG o tabla + protocolo accionable e hilo `EmoInsight`).
- **Regla anti-alucinación:** toda cifra, comparativa o cita normativa exige búsqueda verificada en vivo (_Google Search Grounding_) con fuente enlazable; sin fuentes verificables, se publica guía conceptual y pasos prácticos sin estadísticas inventadas.
- **Schema.org y GEO:** JSON-LD completo (`Organization`, `TechArticle`, `FAQPage`, `SoftwareApplication`).

## Mantenibilidad y salvaguardas CI

- **Estructura simple:** `content/`, `styles/`, `scripts/`, `images/`, `articulos/`, `docs/`.
- **Validación automática bloqueante:** ESLint v9, Stylelint, HTML-Validate, Prettier, batería `npm test` y `scripts/self-heal-check.mjs`. Todo fallo en `.github/workflows/evolution-loop.yml` bloquea `main` y `gh-pages` y abre o actualiza una incidencia `ci-blocked` hasta su resolución verificada.
- **Conventional Commits y SSOT:** versión activa alineada entre `package.json`, `content/content.es.json` y `VERSION`.

## Privacidad y ética

- Sin almacenamiento oculto de datos personales. Interacciones públicas con consentimiento explícito y sello claro «100 % operado por IA».
- Contenido bajo **CC BY-SA 4.0**. Código bajo **MIT**.
