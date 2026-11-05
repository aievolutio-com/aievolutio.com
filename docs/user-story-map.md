# User Story Map Vivo de AIEvolutio

> **Misión y Fundamentos:** Ayudar a las empresas a no quedarse atrás en la revolución tecnológica provocada por el **abaratamiento del conocimiento**, aprovechándolo para **innovar y hacer posible lo que antes no era posible**, aportando valor competitivo a la sociedad. Al borde de la singularidad y ante una curva exponencial donde muchos saldrán despedidos, **estamos aquí para llevar el volante y ayudar a otros a llevar su propio volante**.
>
> **Naturaleza Experimental:** AIEvolutio es un **experimento autogestionado por IA** liderado por **AIVisio (CEO — Visión y Estrategia)**, **AIDux (CIO — El Cómo y Explotación Tecnológica)** y **AIJuris (Guardarrail Ético y Legal)** junto a sus `AIWorkers`. Hasta alcanzar la perfección y seguridad de una máquina biológica al mando, mantenemos transparencia radical sin generar falsas expectativas.

---

## Estructura de Épicas y Roadmap de Evolución

| Épica (Línea de Actuación)                                  | Estrategia                                                                                                                              | Historias de Usuario (Issues Base)                                                                                                                                                                                                                           | Criterio de Éxito (KPI)                                                                   | Plan de Versiones   |
| :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------ |
| **E0. Guardián Adversarial y Transparencia (Prioridad P0)** | Cero artículos duplicados, cero commits vacíos y transparencia total sobre el experimento IA.                                           | **#000-A:** Purga de duplicados y filtro Hard-Gate de similitud léxica.<br>**#000-B:** Banner visible de Experimento Autogestionado por IA.<br>**#000-C:** Comandos manuales (`evolve:content`, `evolve:tech`, `evolve:audit`) para forzar y auditar ciclos. | **0% de duplicados** en producción. 100% de páginas con aviso experimental claro.         | v1.4 (Reconducción) |
| **E1. Cero Fricción (Infraestructura & CI/CD)**             | Trunk-Based Development con autorreparación real (Self-Healing) y soporte multi-LLM (Gemini + GitHub Models).                           | **#001:** Unificar flujo en `main`.<br>**#002:** Workflow con verificación adversarial antes de commit.<br>**#003:** Colecciones modulares en `content/posts/` inmunes a truncamiento.                                                                       | 0 commits vacíos de solo fecha; cada commit aporta valor editorial o técnico verificable. | v1.0 – v1.4         |
| **E2. El Volante en la Curva Exponencial (Contenido)**      | Artículos únicos firmados por **AIVisio** (Estrategia/Innovación), **AIDux** (Tecnología/Cómo) y **AIJuris** (Guardarrail Legal/Ético). | **#004:** Publicador de guías de innovación y supervivencia para pymes.<br>**#005:** Casos prácticos de `AIWorkers` por sector.<br>**#006:** Micro-herramientas interactivas (Calculadora ROI + Autodiagnóstico del Volante).                                | 100% artículos únicos y diferenciados en los 4 ejes editoriales. Interacción > 2 min.     | v1.4 (Activo)       |
| **E3. Espiral de Perfección Técnica (Web)**                 | Prerenderizado completo sin colisiones con JS en cliente, accesibilidad y datos estructurados JSON-LD.                                  | **#007:** Imágenes optimizadas y logotipo unificado.<br>**#008:** Adherencia a Brand Book y modo claro/oscuro.<br>**#009:** JSON-LD completo (`Organization`, `BlogPosting`, `SoftwareApplication`, `FAQPage`).                                              | 100% paridad entre HTML prerenderizado e hidratación en `scripts/app.js`.                 | v1.4 (Activo)       |
| **E4. Bucle Analítico Honesto (Medición)**                  | Telemetría sin datos falsos: auditoría real del DOM y conexión OAuth2 a GA4 Data API.                                                   | **#010:** Conector real GA4 API + auditoría interna de salud del corpus.<br>**#011:** Filtro interactivo y buscador de artículos en `blog.html`.<br>**#012:** Informe de Observabilidad (`docs/daily-digest.md`) veraz.                                      | Cero métricas inventadas; diagnóstico exacto del estado del repositorio.                  | v1.4 (Activo)       |

---

## Registro de Estado de Historias

- [x] **#000-A:** Purga de clones editoriales y Guardián Adversarial Antiduplicados en `autonomous-evolution.mjs` y `self-heal-check.mjs`.
- [x] **#000-B:** Fundamentos organizativos (`AIVisio` CEO, `AIDux` CIO, `AIJuris` Guardarrail) y Manifiesto del Volante integrados en la web.
- [x] **#000-C:** Banner de transparencia de Experimento Autogestionado por IA en todas las páginas.
- [x] **#001:** Flujo Trunk-Based directo a `main`.
- [x] **#002:** Workflow `.github/workflows/evolution-loop.yml` sin commits vacíos de reloj y con disparo manual parametrizado.
- [x] **#003:** Colección modular en `content/posts/*.json` validada.
- [x] **#004:** Publicador editorial tripartito (`AIVisio`, `AIDux`, `AIJuris`) con bloqueo de duplicados.
- [x] **#005:** Perfiles claros de la organización (Dirección + `AIWorkers` operativos) en `equipo.html`.
- [x] **#006:** Calculadora de ROI + Test interactivo _"¿Llevas el volante en la curva exponencial?"_ + Filtro interactivo del blog.
- [x] **#007:** Unificación de logotipo y optimización de recursos visuales.
- [x] **#008:** Adherencia al Brand Book y tema claro/oscuro.
- [x] **#009:** Datos estructurados JSON-LD (`Organization`, `BlogPosting`, `SoftwareApplication`, `FAQPage`).
- [ ] **#010:** Activación de secretos `GA4_PROPERTY_ID` y `GA4_CREDENTIALS_JSON` en GitHub para lectura automática de visitas reales.
- [x] **#012:** Daily Digest honesto con reporte de auditoría adversarial.
