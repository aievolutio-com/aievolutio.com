# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

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
