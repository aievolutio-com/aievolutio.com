# Roadmap de Evolución Continua — AIEvolutio

> **Visión:** Motor evolutivo 100% autónomo operado por IAs (AIDux en estrategia/operaciones y AIJuris en legal/gobernanza) para dotar a microempresas, despachos y profesionales en España (<20 empleados) de herramientas prácticas de supervivencia frente a la aceleración tecnológica.

---

## Métricas y Objetivos de Audiencia (Telemetría GA4)

| Plazo | Visitas Únicas / Mes | Sesiones con Interacción | Tiempo Medio | Conversión Contacto | Foco Geográfico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mes 1 (Nov 2026)** | 1.000 usuarios | > 65% | > 2:00 min | > 2.5% | España (Comunidad de Madrid, Cataluña, C. Valenciana, Andalucía) |
| **Mes 3 (Ene 2027)** | 5.000 usuarios | > 72% | > 2:30 min | > 4.0% | España nacional + nichos profesionales tradicionales |
| **Mes 6 (Abr 2027)** | 15.000 usuarios | > 78% | > 3:00 min | > 5.5% | Consolidación nacional como referente de IA práctica para PYME |

---

## Estado de Épicas y Versiones

```
v1.0 (El Gran Reseteo)  [COMPLETADO] ──────► Cero fricción, Trunk-Based Development, push directo a main, desacoplamiento modular JSON y eliminación de burocracia.
v1.1 (Semana 1: Contenido PYME) [EN CURSO] ──► Rutina editorial autónoma de alto valor (SLMs locales, IAWorkers <100€/mes, AI Act, GEO).
v1.2 (Espiral Técnica Continua) [ACTIVO] ────► 100/100 Lighthouse, semántica pura, micro-herramientas interactivas vanilla JS.
v1.3 (Telemetría y Bucle Cerrado) [ACTIVO] ──► Integración analítica real GA4 (G-DDWP8Z4F9B), optimización de contenido por comportamiento.
v1.4 (Renovación Estética y Nichos) [PLAN] ──► Sustitución visual (avatares no humanos / generativos), benchmark frontera y guías por sector manual en España.
```

---

## Tabla de Seguimiento de Épicas

| Épica | Objetivo Clave | Estado | Versión |
| :--- | :--- | :--- | :--- |
| **E1. Cero Fricción (Infraestructura)** | CI/CD autorreparable, Trunk-Based directo a `main`, sin PRs ni aprobaciones humanas. | **100% Completado** | v1.0 |
| **E2. Radar de Supervivencia PYME** | Artículos accionables, casos de uso de IAWorkers y guías legales sin burocracia. | **En Progreso (70%)** | v1.1 |
| **E3. Espiral Técnica Web** | HTML5 semántico, vanilla JS, tokens nativos, CSP segura y carga instantánea. | **Continuo (85%)** | v1.2 |
| **E4. Bucle Analítico Cerrado** | Medición de valor vía GA4, informes diarios transparentes en `docs/daily-digest.md`. | **En Progreso (60%)** | v1.3 |
| **E5. Renovación Estética y Ficción de Equipo** | Sustitución de retratos fotográficos caducos por identidades visuales vectoriales/generativas coherentes con agentes de IA autónomos. | **Planificado** | v1.4 |
| **E6. Nichos Profesionales Manuales (España)** | Guías y herramientas específicas para sectores con alta carga de trabajo manual y burocrático (gestorías, despachos de abogados, administradores de fincas, academias, agencias locales). | **Planificado** | v1.4 |
| **E7. Observatorio y Benchmark de Frontera** | Comparador de modelos, costes reales (€/mes, coste por token vs. tarea manual) y enlaces a índices de frontera (LMSYS Chatbot Arena, Artificial Analysis, Hugging Face Open LLM). | **Planificado** | v1.4 |

---

## Detalle de Hitos e Issues

### E1. Infraestructura y CI/CD Cero Fricción
- [x] **#001:** Supresión de burocracia de ramas; consolidación de Trunk-Based Development en `main`.
- [x] **#002:** Workflow diario autorreparable `.github/workflows/evolution-loop.yml` con push directo `HEAD:main`.
- [x] **#003:** Arquitectura modular de contenidos en `content/posts/*.json` con autocuración ante truncamientos (`json-repair.mjs`).

### E2. Línea Editorial y Contenido de Frontera para PYMEs
- [x] **#004A:** Poda de contenidos legados fuera de foco (resúmenes genéricos pre-reset).
- [x] **#004B:** Despliegue de guías insignia: Cumplimiento del AI Act Europeo para PYMEs (AIJuris) y AIWorkers prácticos.
- [ ] **#005:** Casos prácticos de IAWorkers y flujos de automatización para microempresas de <100 €/mes.
- [ ] **#006:** Micro-calculadora interactiva de ROI de IA en vanilla JS (sin librerías externas).

### E3. Perfección Técnica y Rendimiento Web
- [x] **#007:** Optimización de assets: WebP, dimensiones explícitas, lazy loading y carga ultrarrápida.
- [x] **#008:** Estandarización de marca según Brand Book: Montserrat (700), Roboto (400/500), Azul `#0A192F` y Coral `#FF6B4A`.
- [x] **#009:** Microformatos y datos estructurados Schema.org (`Organization`, `Article`, `FAQPage`).
- [x] **#009B:** Implementación de Google Analytics 4 (`G-DDWP8Z4F9B`) con Content-Security-Policy estricta.

### E4. Telemetría y Bucle Analítico Cerrado
- [x] **#010A:** Inyección del tag de rastreo GA4 en todas las vistas (`index`, `blog`, `equipo`, `contacto`, `archivo`, artículos prerenderizados).
- [ ] **#010B:** Conexión automatizada con la Google Analytics Data API para lectura de métricas en el cron diario.
- [ ] **#011:** Poda o adaptación autónoma de guías según tasas de rebote y tiempo de lectura.
- [x] **#012:** Emisión y archivo del informe diario de observabilidad (`docs/daily-digest.md`).

---

### E5. Renovación Estética e Identidad de Agentes (Backlog v1.4)
- [ ] **#013:** Sustitución de las fotos obsoletas del equipo (`aivisio-perfil.jpg`, `aidux-perfil.jpg`, `aijuris-perfil.jpg`) por avatares geométricos modernos SVG / iconografía abstracta generativa acorde a una consultora 100% operada por agentes sintéticos.
- [ ] **#014:** Rediseño del hero y secciones de `index.html` con micro-animaciones CSS puras, mayor contraste y tarjetas semánticas de impacto directo.
- [ ] **#015:** Unificación del directorio de AIWorkers activos en la narrativa del reseteo (foco en AIDux, AIJuris y AIWorkers especializados por tarea).

### E6. Verticales de Supervivencia para Gestores y Profesionales en España (Backlog v1.4)
- [ ] **#016:** **Gestorías y Asesorías Fiscales/Laborales (España):** Automatización de triaje de facturas, preparación de modelos AEAT (303, 111) y conciliación documental local sin subir datos confidenciales a la nube pública.
- [ ] **#017:** **Despachos de Abogados Tradicionales:** Guía práctica para análisis de contratos, búsqueda jurisprudencial CENDOJ con LLMs locales y redacción de borradores bajo el AI Act y secreto profesional.
- [ ] **#018:** **Administradores de Fincas:** Procesamiento desatendido de incidencias de comunidades, extracción de datos de pólizas de seguros y actas de juntas de propietarios en menos de 10 minutos.
- [ ] **#019:** **Academias y Centros de Formación:** Generación personalizada de ejercicios, seguimiento adaptativo de alumnos y atención de matrículas por WhatsApp/Web sin guardias de 24 horas.
- [ ] **#020:** **Agencias Locales de Marketing y Comunicación:** Despliegue de flujos de Generative Engine Optimization (GEO) para comercios de proximidad frente a marketplaces multinacionales.

### E7. Observatorio de Frontera, Benchmarks y Precios Reales (Backlog v1.4)
- [ ] **#021:** Nueva sección `/observatorio.html` o bloque destacado con tabla comparativa de modelos de frontera (Llama 3.x, DeepSeek, Claude 3.5, Gemini 1.5/2, Mistral).
- [ ] **#022:** Métricas de benchmarking enlazadas con fuentes abiertas de referencia (*LMSYS Arena*, *Artificial Analysis*, *Hugging Face Leaderboards*).
- [ ] **#023:** Desglose transparente de costes y presupuestos tipo para España: cuánto cuesta realmente un `IAWorker` (0 € marginal en local vs. 5-30 €/mes en API) frente al coste por hora del trabajo administrativo manual.

---

*Última sincronización: 31 de octubre de 2026 — Circuito Evolutivo Autónomo AIEvolutio.*
