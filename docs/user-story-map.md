# User Story Map Vivo de AIEvolutio

> **Misión:** Activar el potencial de las pequeñas empresas y economías locales para evolucionar con inteligencia, convirtiendo la IA de frontera en un motor de supervivencia, confianza y ventaja competitiva, operado de forma 100% autónoma por los IATeams de AIEvolutio (liderados en la ficción por AIDux en operaciones/estrategia y AIJuris en gobernanza legal/ética).

---

## Estructura de Épicas y Roadmap de Evolución

| Épica (Línea de Actuación) | Estrategia | Historias de Usuario (Issues Base) | Criterio de Éxito (KPI) | Plan de Versiones |
| :--- | :--- | :--- | :--- | :--- |
| **E1. Cero Fricción (Infraestructura & CI/CD)** | Trunk-Based Development con autorreparación (Self-Healing). Cero intervención humana. | **#001:** Eliminar rama `pre` y flujos de PR intermedios.<br>**#002:** Configurar CI con `--fix` automático y commit directo a `main`.<br>**#003:** Migrar de JSON monolítico a colecciones JSON/Markdown modulares (`content/posts/`). | 100% de ejecuciones diarias publicadas en producción sin intervención humana. Reducción del 70% en consumo de tokens por ejecución. | v1.0 (El Reseteo) |
| **E2. Radar de Supervivencia PYME (Contenido)** | Traducción diaria de avances de frontera a casos de uso accionables para PYMEs (<20 empleados). | **#004:** Publicador diario de "Playbooks de Supervivencia" para PYMEs.<br>**#005:** Casos prácticos de `IAWorkers` por sector (comercio, industria, servicios).<br>**#006:** Generador de herramientas interactivas ligeras (calculadoras de ROI de IA). | Tiempo medio de interacción > 2 min en GA4. Crecimiento semanal del 15% en tráfico orgánico/referido. | v1.1 (Semana 1) |
| **E3. Espiral de Perfección Técnica (Web)** | Optimización continua de rendimiento, accesibilidad, diseño y SEO/GEO semántico. | **#007:** Conversión y uso óptimo de imágenes (`.webp`, `loading="lazy"`, dimensiones explícitas).<br>**#008:** Implementación estricta del Brand Book (Montserrat Bold, Roboto, Hexágono Azul, Coral `#FF6B4A`).<br>**#009:** Inyección de JSON-LD y mapas semánticos para motores de búsqueda e IA (`Organization`, `Article`, `FAQPage`). | 100/100/100/100 en Google Lighthouse (Performance, A11y, Best Practices, SEO). Peso de página < 300 KB. | v1.2 (Continuo) |
| **E4. Bucle Analítico Cerrado (Medición)** | Decisiones editoriales y de UX guiadas exclusivamente por telemetría real. | **#010:** Conector de lectura de Google Analytics Data API (GA4) y Search Console.<br>**#011:** Poda o reescritura automática de páginas con rebote > 80%.<br>**#012:** Emisión del Informe Diario de Observabilidad (`docs/daily-digest.md`) para el humano. | Incremento continuo del ratio de conversión en `contacto.html` y consultas. Cero bloqueos. | v1.3 (Semana 2) |

---

## Registro de Estado de Historias

- [x] **#001:** Eliminar rama `pre` y unificar en Trunk-Based Development directo a `main`.
- [x] **#002:** Workflow diario único `.github/workflows/evolution-loop.yml` con autorreparación y autofix.
- [x] **#003:** Desacoplamiento de contenido en `content/posts/*.json` inmune a truncamiento de Vertex.
- [ ] **#004:** Publicador diario de Playbooks de Supervivencia PYME (AIDux / AIJuris).
- [ ] **#005:** Casos prácticos de IAWorkers y micro-automatización de <100€/mes.
- [ ] **#006:** Micro-calculadora interactiva de ROI de IA en vanilla JS.
- [x] **#007:** Optimización de imágenes (WebP, lazy loading, dimensiones).
- [x] **#008:** Adherencia estricta a Brand Book (`tokens.css`, Montserrat, Roboto, `#0A192F`, `#FF6B4A`).
- [x] **#009:** Datos estructurados JSON-LD Schema.org (`Organization`, `Article`, `FAQPage`).
- [ ] **#010:** Telemetría GA4 automatizada en bucle diario.
- [ ] **#011:** Optimización editorial guiada por rebote / permanencia.
- [x] **#012:** Generación y publicación del Daily Digest en GitHub Actions (`docs/daily-digest.md`).
