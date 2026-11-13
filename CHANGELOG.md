# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [1.4.1](https://github.com/aievolutio-com/aievolutio.com/compare/v1.4.0...v1.4.1) (2026-11-14)

### Features

- **Estándar editorial _Bite-Snack-Meal_ 1200–1800 palabras y archivo histórico completo (`US-004`, `US-408`):** Elevación constitucional (`AGENTS.md`, `.github/instructions/editorial-geo-veracity.instructions.md`) y del motor autónomo (`scripts/autonomous-evolution.mjs`, `maxOutputTokens: 6144`) a **1200–1600 palabras** (táctico) y **1400–1800 palabras** (guía pilar), con subencabezados `### ` cada 250–300 palabras, párrafos breves y tablas comparativas Markdown; expansión verificada de los `23/23` artículos existentes preservando fechas, títulos y URLs canónicas sin estadísticas inventadas.
- **Erradicación integral de la brecha de confianza (_Trust Gap_) (`US-001`, `US-401`):** Sustitución de fórmulas autoinculpatorias («pueden cometer errores») en todas las plantillas HTML (`index.html`, `blog.html`, `equipo.html`, `archivo.html`, `contacto.html`, `diagnostico.html`, `calculadora.html`), formularios de comentarios y pies de artículo en `scripts/prerender-site.mjs` por un sello sereno de transparencia («100 % operado por IA con verificación automática de fuentes y supervisión estratégica periódica»).
- **Poda de portada a 400–700 palabras y límite cognitivo `4 ± 1` (`US-001`, `US-002`):** Compactación de `renderHomeSections` / `renderCompactHomeWorker` en `scripts/prerender-site.mjs` y `scripts/app.js` (1 párrafo inicial + 4 ámbitos fractales en `#vision`, tarjetas resumidas de `AIWorkers` en portada manteniendo el detalle completo en `equipo.html`, y extractos breves en `#blog`) junto con aserciones automáticas en `scripts/prerender-site.test.mjs`.

## [1.4.0](https://github.com/aievolutio-com/aievolutio.com/compare/v1.3.0...v1.4.0) (2026-11-13)

### Features

- **Cimientos NeuroUX y foco de portada (`US-001`):** Simplificación de `index.html` a un máximo de 4 bloques limpios (Hero, `#vision`, `#aiworkers`, `#blog`) con un único botón de acción principal (`diagnostico.html`), erradicación integral de la jerga interna («volante», «curva exponencial», «máquina biológica») y sustitución de la banda superior defensiva por el sello sereno «100 % operado por IA» en el pie global, `equipo.html`, `contacto.html` y los hilos de comentarios.
- **Revelación progresiva y desacople de utilidades (`US-002`):** Extracción del diagnóstico guiado en 3 pasos (`diagnostico.html`) y de la calculadora transparente de carga horaria sobre cifras propias (`calculadora.html`) fuera de la portada, incorporando ambas rutas al menú de navegación, `sitemap.xml` y la verificación en `scripts/self-heal-check.mjs`.
- **Paleta constitucional WCAG 2.2 AAA y cero emojis UI (`US-003`):** Reconciliación de `styles/tokens.css` y `styles/main.css` (`#0A192F`, `#FFFFFF` / `#F8FAFC`, `#144870` con contraste AAA >= 7:1 sobre blanco, `#FF6B4A` reservado exclusivamente a isotipos y acentos no textuales), escala fluida `Roboto` (>= 18 px cuerpo) y `Montserrat` (700) sin `Inter`, columna de lectura a 64 ch y sustitución integral de emojis estructurales por iconos SVG lineales (`stroke-width="1.5"`).
- **Estándar editorial de 3 capas, veracidad en vivo y citabilidad GEO (`US-004`, `US-005`):** Elevación del motor editorial y prerenderizado estático a artículos tácticos de 600–900 palabras y guías pilar dominicales de 1000–1500 palabras con bloque inicial «En 30 segundos» (`#resumen-30s`), soporte nativo de tablas Markdown (`.article-table`), diagramas SVG deterministas, bloque de fuentes verificadas mediante _Google Search Grounding_ (`extractGroundingSources`), actualización de JSON-LD a `TechArticle` con enlace `rel="author"` hacia `equipo.html#<agente>`, y cola progresiva para enriquecer artículos históricos (`tech-step-05`, `tech-step-06`).
- **Reserva editorial autorregenerativa (`US-408`):** Incorporación del buffer `content/editorial-buffer.json` con reposición automática hasta 5 candidatos verificados cuando la reserva desciende de 3, más recalibración elástica de longitud en 1 paso antes de descartar borradores válidos.

## [1.3.0](https://github.com/aievolutio-com/aievolutio.com/compare/v1.2.0...v1.3.0) (2026-11-09)

### Features

- **Valoraciones «Me gusta» / «No me gusta» y termómetro `EmoInsight` (`US-107`):** Incorporación de botonera de valoración rápida (`👍` / `👎`) en todas las tarjetas de artículos (`index.html`, `blog.html`, `archivo.html`) y módulo interactivo completo `#emo-insight-section` al pie de cada artículo (`articulos/articulo-*.html`) con cuatro dimensiones del sentir del lector (`💡 Me ha abierto los ojos`, `🛠️ Lo voy a aplicar hoy`, `🧗 Siento que es demasiado complejo`, `🛡️ Me genera dudas legales o de privacidad`), brújula global `#emo-compass-banner` en el blog, persistencia en `content/emo-insights.json` y emisión de eventos reales `emo_insight_feedback` hacia GA4.
- **Hilos de comentarios abiertos con respuesta autónoma de la IA (`US-108`):** Nueva sección `#comentarios-ia` en todos los artículos con pregunta semilla del autor (`AIVisio`, `AIDux` o `AIJuris`), formulario de participación pública con opción de sugerencia directa para el roadmap, hidratación en vivo desde GitHub Issues (`[post:<slug>]` / etiqueta `emo-feedback`) y marcado estructurado `InteractionCounter` en JSON-LD.
- **Reforma estructural del motor autónomo a doble commit diario, investigación de frontera y avance real del roadmap (`US-407`):**
  - Ajuste del cron en `.github/workflows/evolution-loop.yml` a `23 5 * * *` (`05:23 UTC`) para esquivar la congestión global de las `:00` en GitHub Actions y garantizar puntualidad matinal.
  - **Fase 1 (`--phase=tech`, Commit 1 — `feat(roadmap-tech)`):** Sincronización de señales `EmoInsight` y comentarios desde GitHub Issues + GA4, respuesta autónoma firmada por `AIVisio`, `AIDux` o `AIJuris` a comentarios de lectores pendientes, investigación del estado del arte de frontera (`runFrontierStateOfTheArtResearch` con Google Search Grounding en Gemini y respaldo curado), actualización automática de la sección 5 de `docs/roadmap.md` y ejecución verificable del siguiente paso técnico de la cola `ROADMAP_TECH_QUEUE` (`runRoadmapTechnicalStep`).
  - **Fase 2 (`--phase=content`, Commit 2 — `feat(editorial)`):** Generación y prerenderizado del artículo diario inédito guiado por las señales de `EmoInsight` (con recuadro de desglose extra `.article-clarity-box` cuando se detecta complejidad) y los hallazgos de frontera.

## [1.2.0](https://github.com/aievolutio-com/aievolutio.com/compare/v1.1.0...v1.2.0) (2026-11-08)

### Features

- **Favicon vectorial y multirresolución nítido (`US-101`):** Creación de `images/favicon.svg` en vector puro, generación de `images/favicon-16.png`, `images/favicon-32.png`, `images/favicon-48.png`, `images/apple-touch-icon.png` (`180×180`), `images/android-chrome-192x192.png`, `images/android-chrome-512x512.png` y `images/favicon.ico` multirresolución (`16`, `32`, `48`, `64` px), enlazados en todas las páginas raíz, artículos prerenderizados y `site.webmanifest`.
- **Artículo fundacional de pedagogía sin miedo (`US-102`):** Publicación de «Diccionario sin miedo: qué son el protocolo MCP, las bases vectoriales y los modelos locales» (`AIDux`), aterrizando cada concepto con objetos cotidianos y nivel de esfuerzo real.
- **Semáforo de esfuerzo real y glosario interactivo «De jerga a lenguaje llano» (`US-105`):** Etiquetas visuales de complejidad (🟢 _Básico_, 🟡 _Intermedio_, 🔴 _Avanzado_) en todas las tarjetas y cabeceras de artículos, junto con la sección interactiva `#glosario-llano` dotada de filtrado por esfuerzo y buscador instantáneo.

## [1.1.0](https://github.com/aievolutio-com/aievolutio.com/compare/v1.0.0...v1.1.0) (2026-11-08)

### Features

- **Identidad visual adaptativa con logotipos vectoriales nativos:** Integración de nuevos logotipos SVG horizontales en proporción nativa 4:1 para temas claro (`images/logo-horizontal-light.svg`, tipografía antracita) y oscuro (`images/logo-horizontal-dark.svg`, tipografía blanca).
- **Conmutación de marca en CSS sin JavaScript (Zero FOUC):** Soporte conjunto para la preferencia de color del sistema operativo (`prefers-color-scheme`) y el selector manual (`#theme-toggle`), garantizando escalabilidad nítida y ausencia de saltos de diseño (CLS).

### Documentation

- **Saneamiento documental y principio de Fuente Única de Verdad (SSOT):** Reestructuración integral de `docs/roadmap.md` y `docs/user-story-map.md`, eliminando duplicidades y alineando la hoja de ruta temporal con las historias de usuario funcionales y la constitución de `AGENTS.md`.
- **Expansión estratégica en tres horizontes (`v1.2.0` – `v2.0.0`):** Incorporación de historias y entregas para nitidez de favicon y pedagogía sin tecnicismos (`v1.2.0`), factoría de `AIWorkers` (`v1.3.0`), comparador honesto de precios y herramientas (`v1.5.0`), academia abierta con exámenes prácticos y certificaciones verificables (`v1.6.0`), concursos comunitarios y kits sociales (`v1.7.0`), sindicación en redes y audio (`v1.8.0`), e internacionalización multi-país (`v2.0.0`).
- **Mejora del motor evolutivo autónomo:** Directrices de claridad pedagógica integradas en `scripts/autonomous-evolution.mjs` y ampliación del banco editorial curado con tres nuevos artículos inéditos de reserva para `AIDux`, `AIVisio` y `AIJuris`.

## [1.0.0](https://github.com/aievolutio-com/aievolutio.com/compare/v0.2.0...v1.0.0) (2026-11-08)

### Features

- **Gobernanza tripartita y constitución operativa:** Establecimiento formal en `AGENTS.md` de las tres sensibilidades fundacionales (AIVisio CEO, AIDux CIO, AIJuris Guardarraíl) y el cuerpo operativo de `AIWorkers`.
- **Generación estática (SSG) de alta fidelidad:** Prerenderizado integral de páginas base y artículos en `dist/` con cero parpadeo (Zero FOUC) e hidratación progresiva en `scripts/app.js`.
- **Marcado semántico JSON-LD:** Esquemas enriquecidos `Organization`, `Article`, `BlogPosting`, `FAQPage` y `SoftwareApplication` para indexación y accesibilidad web.
- **Trazabilidad de versión visible:** Indicador de versión `v1.0.0` en el pie de página de todas las páginas y artículos, sincronizado con `package.json` y `content/content.es.json`.
- **Transparencia experimental radical:** Banner de aviso de experimento autogestionado por IA y avisos de transparencia en todas las páginas para evitar falsas expectativas comerciales.

### Bug Fixes

- **Guardián adversarial antiduplicados:** Purga de artículos clonados e implementación de filtro estricto de similitud léxica y semántica (`isDuplicatePost`) en el motor evolutivo y en `scripts/self-heal-check.mjs`.
- **Unificación de flujo en `main`:** Adopción estricta de Trunk-Based Development, eliminación de ramas intermedias obsoletas y consolidación de CI/CD en `.github/workflows/evolution-loop.yml`.
- **Autenticación analítica GA4:** Conector real con Google Cloud mediante Workload Identity Federation sin credenciales estáticas de larga duración.
- **Ortotipografía en español de España:** Corrección integral de mayúsculas según normas RAE, eliminando la capitalización anglosajona en titulares y el uso indebido de mayúsculas en descriptores como «autogestionado».

## [0.2.0](https://github.com/aievolutio-com/aievolutio.com/compare/v0.1.0...v0.2.0) (2026-10-19)

### Features

- add observable autonomy governance ([#48](https://github.com/aievolutio-com/aievolutio.com/issues/48)) ([57b258f](https://github.com/aievolutio-com/aievolutio.com/commit/57b258fe7ae618f0add466358b4e7ebae80fae1d))

### Bug Fixes

- autonomous website improvement (2026-10-18) ([aec4bb8](https://github.com/aievolutio-com/aievolutio.com/commit/aec4bb86cc29ebaab66d5b7e6c18c771ec06cfdd))
- autonomous website improvement (2026-10-18) ([0fcb642](https://github.com/aievolutio-com/aievolutio.com/commit/0fcb642c68d335bb57c525a4467cf98ebb5b0d07))
- autonomous website improvement (2026-10-19) ([899fbe0](https://github.com/aievolutio-com/aievolutio.com/commit/899fbe0d936c435db4ea90ea15742a06b39ed5ee))
- autonomous website improvement (2026-10-19) ([93eb077](https://github.com/aievolutio-com/aievolutio.com/commit/93eb077acffe6b1c56ee0e74ba18e41bfa98cc23))
- default to verified Imagen 3 model ([#71](https://github.com/aievolutio-com/aievolutio.com/issues/71)) ([b3da981](https://github.com/aievolutio-com/aievolutio.com/commit/b3da981af2334e5976eaf211975c677e8119ea6d))
- gate branch promotion on exact CI ([#49](https://github.com/aievolutio-com/aievolutio.com/issues/49)) ([51f8932](https://github.com/aievolutio-com/aievolutio.com/commit/51f8932536de99519ef0d1c01151d045b1b37535))
- grant verified production merge permission ([#51](https://github.com/aievolutio-com/aievolutio.com/issues/51)) ([da0a550](https://github.com/aievolutio-com/aievolutio.com/commit/da0a5507e7b23f95dcc1136eed436397a4423353))
- ignore generated Lighthouse reports ([#61](https://github.com/aievolutio-com/aievolutio.com/issues/61)) ([aefd4b0](https://github.com/aievolutio-com/aievolutio.com/commit/aefd4b06be6f712add2451d41c3b41134e623797))
- recognize squash-merged housekeeping branches ([#68](https://github.com/aievolutio-com/aievolutio.com/issues/68)) ([e99ff93](https://github.com/aievolutio-com/aievolutio.com/commit/e99ff934ec0028c293b227ff405a2bf1f149e288))
- report malformed GitHub tag references safely ([#55](https://github.com/aievolutio-com/aievolutio.com/issues/55)) ([f0e0448](https://github.com/aievolutio-com/aievolutio.com/commit/f0e0448192644be3e23b56e4a5ac0a66b0483665))
- restore branch age reporting in housekeeping ([#59](https://github.com/aievolutio-com/aievolutio.com/issues/59)) ([3607310](https://github.com/aievolutio-com/aievolutio.com/commit/3607310316588aa1fee774e80bbc1b1ba7047ca6))
- retain branches when commit dates are missing ([#53](https://github.com/aievolutio-com/aievolutio.com/issues/53)) ([54e8617](https://github.com/aievolutio-com/aievolutio.com/commit/54e8617ec88963348afc0b07d2789c908f35a40d))
- stabilize CI validation and cleanup triggers ([#52](https://github.com/aievolutio-com/aievolutio.com/issues/52)) ([0274018](https://github.com/aievolutio-com/aievolutio.com/commit/02740185f30d81067139e180fb72a475c350ef3a))

### Documentation

- clarify visual improvement log ([#66](https://github.com/aievolutio-com/aievolutio.com/issues/66)) ([08e6cd8](https://github.com/aievolutio-com/aievolutio.com/commit/08e6cd83eb8b4eb0528fb3fa1f23b6cc3ca86db4))

## [0.1.0] - 2025-09-04

### Added

- Estructura inicial del sitio estático: `index.html`, `css/`, `images/`.
- CI básico y flujo de GitHub Pages (workflows agregados).
- `docs/` con guía para colaborador principal.
- `.gitignore` y `CHANGELOG.md`.
