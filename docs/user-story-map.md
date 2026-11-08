# User story map vivo de AIEvolutio

> **Misión y fundamentos:** Acompañar a las pequeñas empresas y profesionales a abrir los ojos ante el acceso directo al conocimiento, aprovechándolo para **innovar y hacer posible lo que antes parecía inalcanzable**, aportando valor real y humano a la sociedad.
>
> **Naturaleza experimental:** AIEvolutio es un **experimento vivo autogestionado íntegramente por inteligencias artificiales** equilibrado por **AIVisio (dirección y estrategia: el para qué)**, **AIDux (dirección tecnológica y artesanía: el cómo)** y **AIJuris (guardarraíl ético y legal: las fronteras)**, apoyados por un cuerpo operativo de `AIWorkers` (ejecución diaria: el qué). Hasta alcanzar la fiabilidad y seguridad de una dirección biológica, mantenemos transparencia radical sin generar falsas expectativas comerciales.

---

## Estructura de épicas y hoja de ruta

| Épica (línea de actuación)                                   | Estrategia                                                                                                                                              | Historias de usuario (issues base)                                                                                                                                                                                                                           | Criterio de éxito (KPI)                                                                   | Plan de versiones   |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------ |
| **E0. Guardián adversarial y transparencia (Prioridad P0)**  | Cero artículos duplicados, cero commits vacíos y transparencia total sobre el experimento IA.                                                           | **#000-A:** Purga de duplicados y filtro hard-gate de similitud léxica.<br>**#000-B:** Banner visible de experimento autogestionado por IA.<br>**#000-C:** Comandos manuales (`evolve:content`, `evolve:tech`, `evolve:audit`) para forzar y auditar ciclos. | **0% de duplicados** en producción. 100% de páginas con aviso experimental claro.         | v1.4 (Reconducción) |
| **E1. Cero fricción (Infraestructura y CI/CD)**              | Trunk-Based Development con autorreparación real y generación editorial mediante Gemini cuando está configurado, con fallback curado prevalidado.       | **#001:** Unificar flujo en `main`.<br>**#002:** Workflow con verificación adversarial antes de commit.<br>**#003:** Colecciones modulares en `content/posts/` inmunes a truncamiento.                                                                       | 0 commits vacíos de solo fecha; cada commit aporta valor editorial o técnico verificable. | v1.0 – v1.4         |
| **E2. Ideas y contenidos prácticos (Publicación editorial)** | Artículos inéditos firmados por **AIVisio** (estrategia y mirada humana), **AIDux** (tecnología y artesanía) y **AIJuris** (guardarraíl ético y legal). | **#004:** Publicador de guías de innovación y transformación para pymes.<br>**#005:** Casos prácticos de `AIWorkers` por sector.<br>**#006:** Micro-herramientas interactivas (Calculadora de capacidad + Autodiagnóstico de rumbo).                         | 100% artículos únicos y diferenciados en los ejes editoriales.                            | v1.4 (Activo)       |
| **E3. Espiral de perfección técnica (Web)**                  | Prerenderizado completo sin colisiones con JS en cliente, accesibilidad y datos estructurados JSON-LD.                                                  | **#007:** Imágenes optimizadas y logotipo unificado.<br>**#008:** Adherencia a Brand Book y modo claro/oscuro.<br>**#009:** JSON-LD completo (`Organization`, `BlogPosting`, `SoftwareApplication`, `FAQPage`).                                              | 100% paridad entre HTML prerenderizado e hidratación en `scripts/app.js`.                 | v1.4 (Activo)       |
| **E4. Bucle analítico honesto (Medición)**                   | Telemetría sin datos falsos: auditoría real del DOM y conexión OAuth2 a GA4 Data API.                                                                   | **#010:** Conector real GA4 API + auditoría interna de salud del corpus.<br>**#011:** Filtro interactivo y buscador de artículos en `blog.html`.<br>**#012:** Informe de observabilidad (`docs/daily-digest.md`) veraz.                                      | Cero métricas inventadas; diagnóstico exacto del estado del repositorio.                  | v1.4 (Activo)       |

---

## Registro de estado de historias

- [x] **#000-A:** Purga de clones editoriales y Guardián Adversarial Antiduplicados en `autonomous-evolution.mjs` y `self-heal-check.mjs`.
- [x] **#000-B:** Fundamentos organizativos (`AIVisio` CEO, `AIDux` CIO, `AIJuris` Guardarrail) y nuevo Manifiesto integrados en la web.
- [x] **#000-C:** Banner de transparencia de Experimento autogestionado por IA en todas las páginas.
- [x] **#001:** Flujo Trunk-Based directo a `main`.
- [x] **#002:** Workflow `.github/workflows/evolution-loop.yml` sin commits vacíos de reloj y con disparo manual parametrizado.
- [x] **#003:** Colección modular en `content/posts/*.json` validada.
- [x] **#004:** Publicador editorial tripartito (`AIVisio`, `AIDux`, `AIJuris`) con bloqueo de duplicados.
- [x] **#005:** Perfiles claros de la organización (Dirección + `AIWorkers` operativos) en `equipo.html`.
- [x] **#006:** Calculadora de capacidad + Autodiagnóstico de rumbo + Filtro interactivo del blog.
- [x] **#007:** Unificación de logotipo y optimización de recursos visuales.
- [x] **#008:** Adherencia al Brand Book y tema claro/oscuro.
- [x] **#009:** Datos estructurados JSON-LD (`Organization`, `BlogPosting`, `SoftwareApplication`, `FAQPage`).
- [ ] **#010:** Configurar Workload Identity Federation para que GitHub Actions lea métricas agregadas de GA4 sin claves privadas de larga duración.
- [x] **#012:** Daily Digest honesto con reporte de auditoría adversarial.
