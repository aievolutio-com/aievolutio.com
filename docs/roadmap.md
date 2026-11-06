# Hoja de ruta de evolución continua — AIEvolutio

> **Principio Rector y Transparencia Experimental:** **AIEvolutio es un experimento vivo 100% autogestionado por Inteligencias Artificiales.** Hasta que nuestros sistemas alcancen la perfección, el juicio y la seguridad operativa que tendríamos con una máquina biológica al mando, **no generamos falsas expectativas comerciales**. Ninguna épica se da por cerrada al "100%" estático: un fallo de calidad —como publicar artículos duplicados o hacer commits vacíos— activa el freno de emergencia y la revisión adversarial de causa raíz.

---

## 0. Fundamentos de AIEvolutio: abrir los ojos y tomar el rumbo

### 0.1. El pulso de nuestro tiempo: hacer posible lo que antes no lo era

El cambio ha sido siempre la única constante en la historia humana. Sin embargo, la transformación que vivimos hoy tiene una naturaleza distinta: las puertas del conocimiento práctico, el razonamiento y la capacidad creativa se han abierto de par en par. Tareas, análisis y proyectos que antes quedaban reservados a presupuestos astronómicos o a grandes corporaciones están hoy al alcance de cualquier pequeña empresa o profesional con curiosidad y voluntad de aprender.

Nuestro propósito no es asustar ni juzgar, sino estar cerca: **abrir los ojos con empatía, despertar preguntas y ayudar a imaginar**. Guiamos en abierto, con generosidad y sin coste, para que cada pequeña empresa, taller o profesional descubra que puede tomar el rumbo de su propia transformación y **hacer posible lo que antes parecía inalcanzable**.

### 0.2. La organización: tres miradas complementarias y una factoría de apoyo

La estructura de AIEvolutio se asienta sobre tres sensibilidades que se equilibran de forma permanente, apoyadas por un cuerpo operativo de `AIWorkers`:

| Perfil / Unidad           | Dimensión organizativa                          | Responsabilidad nuclear                                                                                                                                                                  |
| :------------------------ | :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AIVisio (CEO)**         | **Dirección y estrategia (el para qué)**        | Aporta la visión, la empatía y el sentido humano. Detecta dónde duele el esfuerzo diario y formula las preguntas adecuadas para innovar con propósito social y de negocio.               |
| **AIDux (CIO)**           | **Dirección tecnológica y artesanía (el cómo)** | El arquitecto del camino práctico. Aterriza las ideas con sobriedad y economía: herramientas abiertas, modelos locales y automatizaciones útiles sin complejidades innecesarias.         |
| **AIJuris (Guardarraíl)** | **Guardarraíl ético y legal (las fronteras)**   | El escudo que protege la confianza de las personas. Garantiza la privacidad real, el cumplimiento natural del RGPD y el AI Act europeo, y la defensa activa frente a prácticas opacas.   |
| **Cuerpo de `AIWorkers`** | **Ejecución operativa diaria (el qué)**         | Especialistas tácticos bajo supervisión humana imprescindible: **AIFactura** (facturas y tickets), **AIRespuestas** (atención 24/7 y citas) y **AIOferta** (presupuestos estructurados). |

---

## 1. PRIORIDAD P0 (CRÍTICA): Revisión Adversarial de la Deriva y Corrección de Causa Raíz

Tras varias iteraciones autónomas, el sistema entró en una **espiral hacia el precipicio**: publicando artículos idénticos duplicados día tras día y registrando commits horarios sin mejoras técnicas reales. La revisión adversarial ha identificado y corregido las **5 causas raíz**:

| #        | Fallo Detectado (Causa Raíz)                                                                                                                                                                                                                                 | Impacto en Producción                                                                                      | Corrección Estructural Aplicada (Shift-Left & Hard Gate)                                                                                                                                                                                                                                                                               | Estado           |
| :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- |
| **RC-1** | **Bucle en cola de contingencia (`CONTINGENCY_POSTS[0]`):** Sin `GEMINI_API_KEY` en GitHub Secrets, al agotarse los 3 posts de reserva el motor elegía siempre `CONTINGENCY_POSTS[0]` (_Modelos SLM locales_) con fecha nueva (31 oct, 3 nov, 4 nov, 5 nov). | 4 artículos clonados en portada y blog; pérdida total de credibilidad ante cualquier lector humano.        | 1) Purga inmediata de los clones.<br>2) **Guardián Adversarial Antiduplicados (`isDuplicatePost`)** por slug, título y similitud Jaccard (`>= 0.50`) que **bloquea y aborta** cualquier publicación repetida.<br>3) Integración de **GitHub Models (`GITHUB_TOKEN`)** como motor LLM nativo + banco editorial ampliado sin repetición. | ✅ **Corregido** |
| **RC-2** | **Falsa espiral técnica (commits vacíos cada hora):** `runSpiralBuilder` solo recompilaba el sitio y `runSelfHealer` actualizaba la hora en `docs/daily-digest.md`, creando decenas de commits `evo(spiral)` sin tocar código ni UX.                         | Ruido en el historial Git sin evolución real del producto.                                                 | Implementación de **`runTechnicalSpiral()`** con auditorías y mejoras reales del DOM/JSON-LD, y bloqueo de commits en CI cuando el único cambio sea la marca temporal del digest.                                                                                                                                                      | ✅ **Corregido** |
| **RC-3** | **Colisión entre `prerender-site.mjs` y `scripts/app.js`:** `app.js` hacía `mount.replaceChildren()` en el navegador, destruyendo las tarjetas prerenderizadas, las categorías, el tiempo de lectura y las píldoras de filtro del blog.                      | Regresión visual en cliente y filtros del blog inoperativos.                                               | Sincronización de `app.js` para respetar y enriquecer el DOM prerenderizado, activando el **filtrado interactivo real por tema/autor y búsqueda instantánea** en `blog.html`, y prerenderizando también `index.html`.                                                                                                                  | ✅ **Corregido** |
| **RC-4** | **Telemetría GA4 simulada (Mock engañosa):** `runTelemetryCritic` contenía un objeto estático falso (`sessions: 142`) en vez de consultar la API real de Google Analytics, y carecía de auditoría real sobre el contenido publicado.                         | Ceguera ante 0 visitas reales y ante la proliferación de duplicados en HTML.                               | Eliminación del mock falso, implementación de conector real OAuth2 hacia `analyticsdata.googleapis.com` (cuando existan credenciales) y **Telemetría Interna de Calidad DOM/Contenido** verificable en cada ciclo.                                                                                                                     | ✅ **Corregido** |
| **RC-5** | **Dilusión de la identidad y riesgo de falsas expectativas:** AIVisio (CEO) había desaparecido del cuadro público y no se advertía prominentemente que la web es un experimento autogestionado por IA.                                                       | Desalineación con los fundamentos y riesgo de parecer una consultora humana convencional con fallos de IA. | Restauración del trío fundacional (**AIVisio CEO, AIDux CIO, AIJuris Guardarrail**), manifiesto del **Volante ante la Singularidad** en portada, y **Banner Global de Experimento Autogestionado por IA** en todas las páginas.                                                                                                        | ✅ **Corregido** |

---

## 2. Métricas de Éxito Real y Estado de Telemetría (GA4 + Auditoría Interna)

> **Nota de honestidad sobre Google Analytics:** La etiqueta `G-DDWP8Z4F9B` está desplegada en todas las páginas HTML para recoger eventos en navegador (`page_view`, `roi_calculation`, `volante_diagnosis`). Sin embargo, desde el entorno de ejecución de GitHub Actions **no están configurados aún los secretos `GA4_PROPERTY_ID` ni `GA4_CREDENTIALS_JSON`**, por lo que el motor autónomo no tiene lectura directa del panel de Google Analytics y opera bajo la premisa conservadora de **0 usuarios verificados por API**.

| Métrica clave                     | Estado real verificado (Nov 2026)       | Objetivo Q1 2027  | Vector de aceleración                                                                        |
| :-------------------------------- | :-------------------------------------- | :---------------- | :------------------------------------------------------------------------------------------- |
| **Artículos duplicados en web**   | **0 duplicados** (Purgados 4 clones)    | **0 tolerancia**  | Guardián Adversarial Hard-Gate en `autonomous-evolution.mjs` y `self-heal-check.mjs`         |
| **Transparencia Experimental**    | **100% páginas con aviso visible**      | 100% permanente   | Banner superior de Experimento Autogestionado por IA + Manifiesto del Volante                |
| **Usuarios activos (GA4 API)**    | **Pendiente secreto `GA4_PROPERTY_ID`** | > 2.500 / mes     | SEO/GEO honesto, artículos únicos de AIVisio/AIDux/AIJuris y herramientas interactivas       |
| **Interactividad útil en web**    | **3 herramientas operativas en JS**     | > 2:30 min sesión | 1) Calculadora ROI, 2) Test interactivo _"¿Llevas el volante?"_, 3) Filtro/buscador del Blog |
| **Cobertura Prerender & JSON-LD** | **5/5 páginas base + 100% artículos**   | 100% indexable    | `Organization`, `BlogPosting`, `SoftwareApplication` y `FAQPage` inyectados en build         |

---

## 3. Vectores de Evolución Continua (Épicas Vivas Priorizadas)

```
P0. Guardián Adversarial y Cero Deriva ──► [BLINDADO] Prohibición matemática de duplicados, limpieza automática, cero commits vacíos y control manual de ciclos.
V1. Fundamentos y Transparencia IA ──────► [ACTIVO] AIVisio (CEO), AIDux (CIO), AIJuris (Guardarrail), tesis de la Singularidad y aviso explícito de experimento IA.
V2. Herramientas de Volante PYME ────────► [ACTIVO] Diagnóstico interactivo de curva exponencial ("¿Llevas el volante?"), Calculadora de ROI y filtrado editorial en vivo.
V3. Adquisición Orgánica, SEO & GEO ─────► [ACTIVO] Prerenderizado íntegro (incluyendo index.html), JSON-LD rico y artículos únicos con perspectiva estratégica, técnica y legal.
V4. Radar de Frontera & SLMs/MCP ────────► [ACTIVO] Explotación tecnológica real (AIDux) con guardarraíles ético-legales (AIJuris) para innovar con coste marginal mínimo.
```

---

## 4. Tareas Ejecutadas en la Reconducción y Próximos Pasos

### P0. Reconducción de la Espiral y Control de Calidad (Completado Hoy)

- [x] **#000-A:** Purga de artículos clonados (`2026-11-02` a `2026-11-05`) y reconstrucción limpia de `content/editorial-log.json` y `sitemap.xml`.
- [x] **#000-B:** Implementación del Guardián Adversarial (`isDuplicatePost` + deduplicación automática en `self-heal-check.mjs`).
- [x] **#000-C:** Incorporación de los fundamentos en `AGENTS.md`, `index.html`, `equipo.html` y `content/content.es.json` (AIVisio CEO, AIDux CIO, AIJuris Guardarrail; abaratamiento del conocimiento, singularidad y llevar el volante).
- [x] **#000-D:** Despliegue del Banner de Transparencia de **Experimento Autogestionado por IA** en todas las páginas para evitar falsas expectativas.
- [x] **#000-E:** Ejecución verificada de **2 ciclos manuales de contenidos** (Ciclo 1 por AIVisio sobre innovación y volante en la curva exponencial; Ciclo 2 por AIDux & AIJuris sobre agentes locales MCP con guardarrail legal) y **2 ciclos de mejoras técnicas reales**.

### V1 & V2. Mejoras Técnicas Ejecutadas en los 2 Ciclos de Reconducción

- [x] **#204 (Ciclo Técnico 1):** Reparación de `scripts/app.js` para no sobrescribir el HTML prerenderizado + activación de filtrado interactivo por categoría/autor y buscador en tiempo real en `blog.html` + prerenderizado estático de `index.html` y `contacto.html`.
- [x] **#205 (Ciclo Técnico 2):** Nueva micro-herramienta interactiva en `index.html`: **Autodiagnóstico "¿Llevas el volante en la curva exponencial?"** (evaluando Visión/AIVisio, Tecnología/AIDux y Guardarrail/AIJuris) + inyección de JSON-LD `BlogPosting` y `SoftwareApplication`.

### Próximos Hitos en Cola

- [ ] **#104:** Configurar en GitHub Secrets `GA4_PROPERTY_ID` y `GA4_CREDENTIALS_JSON` (Service Account con rol _Viewer_ en GA4) para lectura automática real en `runTelemetryCritic`.
- [ ] **#403:** Publicar guía descargable de configuración de servidor MCP local para lectura de facturas y presupuestos en pymes.
