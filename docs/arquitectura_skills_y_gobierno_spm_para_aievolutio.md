# Arquitectura de Gobierno Autónomo, Matriz de Skills y Plan SPM para AIEvolutio (v1.4.2 $\rightarrow$ v2.0)

## 1. Diagnóstico Forense de `aievolutio.com`: Por qué fracasa la autonomía actual

Tras auditar en vivo el estado actual del laboratorio abierto en `aievolutio.com` (`v1.4.2`), la arquitectura declarada (**AIVisio**, **AIDux**, **AIJuris** + **AIWorkers**: `AIFactura`, `AIRespuestas`, `AIOferta`) presenta cuatro fallos sistémicos de control que explican por qué tu reorientación quincenal se diluye en cuestión de horas:

1. **Inanición de Señal Exógena (Cold-Start en _Brújula EmoInsight_):**
   - El bucle evolutivo depende de las reacciones de usuario (`Me gusta`, etiquetas emocionales `EmoInsight` y comentarios en el hilo abierto) para orientar el roadmap autónomo.
   - **Evidencia actual:** Todos los artículos recientes registran `0` votos y `0` comentarios (`0 0 0`), y la arquitectura web carece de telemetría de conversión por diseño de privacidad estricta. Al operar con recompensa empírica nula ($R_{ext} = 0$), Vertex AI optimiza a ciegas en cámara de eco.
2. **Secuestro del Roadmap por el Guardarraíl (Mode Collapse hacia `AIJuris`):**
   - En los sistemas multi-agente sin cuotas duras de portafolio (SPM), el agente con restricciones más severas acaba dominando la generación.
   - **Evidencia actual:** 4 de las 6 guías destacadas en portada están firmadas o absorbidas por **AIJuris** con títulos hiper-abstractos (_«Agentes locales auto-gobernados: autonomía operativa...»_, _«Plataformas de orquestación local para pymes...»_, _«Arquitecturas modulares de IA local...»_), contradiciendo frontalmente la promesa fundacional de hablar en _«lenguaje de calle para quien levanta la persiana cada mañana»_.
3. **Deriva Semántica y Contaminación Autorregresiva (_LLM Slop_):**
   - Prácticamente todas las entregas autónomas recientes (15 al 26 de noviembre de 2026) abren con el mismo cliché sintético (_«En el dinámico ecosistema empresarial actual...»_ o _«En un panorama digital cada vez más complejo...»_).
   - Peor aún: en el artículo del 25 de noviembre, **AIDux** (cuyo mandato es software libre, SLMs locales cuantizados a $4\text{ bits}$ y coste $0\text{ €}$) termina recomendando módulos CRM comerciales genéricos apoyándose en fuentes corporativas (`hubspot.es`, `bbva.com`). El agente ha olvidado su Constitución técnica.
4. **Por qué falla tu reorientación cada 2 semanas (Gobierno en Lazo Abierto):**
   - Reorientar mediante _prompting_ estratégico cada $14\text{ días}$ equivale a corregir el timón de un barco sin quilla ni brújula: en cuanto el pipeline autónomo lee sus propios artículos anteriores para decidir el siguiente paso, la contaminación de contexto devuelve el modelo a la media estadística de entrenamiento en $48\text{ horas}$.
   - **Brecha Producto vs. Prosa:** Los activos de mayor valor real de `aievolutio.com` son sus herramientas interactivas deterministas (`diagnostico.html`, `calculadora.html` y el glosario _Pedagogía sin miedo_), pero el bucle autónomo en Vertex solo produce prosa ensayística en lugar de desplegar plantillas descargables, _prompts_ auditados o micro-utilidades para `AIFactura`, `AIRespuestas` y `AIOferta`.

---

## 2. Arquitectura Objetivo: Vertex AI + Plano de Control Determinista (`Antigravity-SPM` vía MCP)

Para que una supervisión humana de $45\text{ minutos}$ cada dos semanas dirija con éxito un sistema $100\%$ autónomo, debes sustituir la **dirección por instrucciones conversacionales** por una **arquitectura de control en lazo cerrado (Closed-Loop Control System)** dividida en 4 capas sobre Google Cloud / Vertex AI:

```
[Director Humano (Cada 14 días)]
       │ Ajusta Pesos SPM, Cuotas FinOps y Políticas (JSON/YAML), NO prompts sueltos
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CAPA 1: PLANO DE CONTROL ESTRATÉGICO (Antigravity-SPM vía MCP Server)        │
│ - Presupuesto de Ciclos por Célula: Grow (45%), Transform (25%),             │
│   Modernize (15%), Compliance/Protect (máx. 15%).                            │
│ - Bloqueo determinista si AIJuris supera su cuota del 15% del backlog.       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CAPA 2: ORQUESTADOR CON ESTADO ACOTADO (Vertex AI Agent Engine / LangGraph)  │
│ - AIVisio (Planner) ──► propone iniciativa alineada a demanda real pyme      │
│ - AIDux (Builder)   ──► construye guía paso a paso 0€ + artefacto/plantilla  │
│ - AIJuris (Linter)  ──► SOLO audita riesgos RGPD/AI Act (prohibido co-redactar│
│                         salvo cuota explícita de célula Compliance)          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CAPA 3: QUALITY GATES & EVALUADOR ADVERSARIAL (Vertex Gen AI Eval Service)   │
│ - Gate 1 (Determinista AST/Regex): Rechazo inmediato de clichés prohibidos   │
│   ("dinámico ecosistema", etc.), ausencia de pasos reproducibles o SaaS pago.│
│ - Gate 2 (Focus Group Sintético): 3 agentes autónomos escépticos (Taller,    │
│   Panadería, Gestoría) puntúan utilidad real para el lunes a las 08:00.      │
│ - Si Fitness Score F < 0.80 ──► Rollback y re-ejecución (máx. 2 reintentos). │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ CAPA 4: SENSORES EXÓGENOS PRIVACY-FIRST (Sustituto del frío en EmoInsight)   │
│ - Google Search Console API (queries reales de pymes, impresiones, CTR).     │
│ - Telemetría agregada sin cookies en servidor (uso de Calculadora/Diagnóstico│
│   y descargas de plantillas, 100% compatible con Zero Data Retention/RGPD).  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Función de Aptitud Determinista (Fitness Gate)

Ningún artefacto o artículo se publica en el repositorio web si no supera el umbral de validación pre-commit:

$$F = 0.35 \cdot S_{\text{accionabilidad\_lunes}} + 0.25 \cdot S_{\text{llaneza\_lenguaje}} + 0.25 \cdot S_{\text{soberania\_0\_euros}} + 0.15 \cdot S_{\text{demanda\_GSC}} - P_{\text{slop}}$$

Donde $P_{\text{slop}} = 1.0$ (veto automático) si aparece fraseología corporativa en lista negra o si recomienda herramientas privativas sin alternativa abierta verificada, exigiendo $F \ge 0.80$ para hacer _merge_ a producción.

---

## 3. Matriz de Skills Necesarias para Dirigir el Experimento

No necesitas escribir código todos los días ni redactar artículos; necesitas cambiar de rol: pasar de **«editor que corrige el rumbo»** a **«ingeniero de sistemas de control y mecanismos»**.

### A. Skills del Director del Experimento (Human Skills)

| Skill Estratégica / Técnica                                              | Por qué es crítica en AIEvolutio                                                                                                                    | Aplicación práctica en tu revisión quincenal                                                                                                                                               |
| :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Eval-Driven Development (Ingeniería de Evaluaciones en Vertex AI)** | Un agente autónomo solo mejora aquello que puede medir sin ambigüedad. Sin _Evals_, el modelo degrada hacia texto genérico.                         | Mantener un _Golden Dataset_ de $15\text{ ejemplos}$ (5 excelentes como el glosario actual, 10 malos como los posts corporativos) y ajustar las rúbricas de `Vertex AI Gen AI Evaluation`. |
| **2. Diseño de Mecanismos Multi-Agente (Mechanism Design)**              | Si **AIVisio**, **AIDux** y **AIJuris** deliberan en consenso plano, gana el agente más conservador y verboso (**AIJuris**).                        | Separar poderes: **AIVisio** prioriza dolor de negocio, **AIDux** construye activo ejecutable y **AIJuris** opera únicamente como _checklist_ binario (`PASS/FAIL`) al final del grafo.    |
| **3. Gobierno de Portafolio SPM / FinOps Cognitivo**                     | Evita gastar presupuesto de Vertex AI en generar artículos redundantes de bajo impacto mientras los `AIWorkers` siguen sin plantillas descargables. | Asignar cada 14 días el % de inversión por **Célula de Decisión** (`Grow`, `Transform`, `Modernize`, `Compliance`) mediante un archivo `spm_policy.json`.                                  |
| **4. Arquitectura de Contexto y Protocolo MCP**                          | Los agentes en Vertex alucinan herramientas genéricas cuando no tienen acceso estructurado a tus propios activos web ni a datos reales de búsqueda. | Exponer el inventario real del sitio, las reglas de estilo y las métricas de Search Console como recursos y herramientas **MCP** tipadas.                                                  |
| **5. Analítica de Producto Privacy-First (Zero-PII Telemetry)**          | Con `EmoInsight = 0`, necesitas señales reales de uso sin violar el RGPD ni traicionar los principios de **AIJuris**.                               | Interpretar embudos agregados sin identificadores personales: ratio de finalización de `diagnostico.html`, clics en pasos accionables e impresiones orgánicas en buscadores.               |

### B. Skills Técnicas / Servidores MCP a construir en el Backend (`Agentic Skills`)

Para dotar al motor en Vertex AI de manos y sensores reales, debes implementar estas 5 _skills_ modulares vía MCP:

1. **`mcp-spm-governor` (Basado en `Antigravity-SPM.gem`):** Lee el estado del portafolio y bloquea cualquier ejecución autónoma que viole las cuotas quincenales por Célula de Decisión o que no declare su subdominio DDD.
2. **`mcp-gsc-pyme-radar`:** Consulta Google Search Console API y foros abiertos de autónomos/pymes en España para extraer dudas reales de oficio (facturación Verifactu, presupuestos por voz, WhatsApp de taller) y alimentar a **AIVisio**.
3. **`mcp-anti-slop-linter`:** Analizador determinista en Python/Cloud Run que mide índice de legibilidad en español (Fernández Huerta $> 65$), detecta expresiones en lista negra (_«ecosistema empresarial»_, _«transformación sin precedentes»_) y verifica que exista al menos una plantilla, _prompt_ copiable o comando local concreto.
4. **`mcp-synthetic-pyme-jury`:** Ejecuta 3 llamadas paralelas con modelos ligeros (ej. Gemini Flash con temperatura baja y _persona prompts_ adversarios: _Dueño de taller mecánico sin tiempo_, _Autónoma de comercio local_, _Asesor fiscal_) que intentan aplicar la guía y devuelven fallos concretos de fricción.
5. **`mcp-microtool-builder`:** Permite a **AIDux** generar no solo artículos HTML, sino **artefactos funcionales estáticos** (plantillas `.csv`/`.md`, configuraciones JSON de modelos locales Ollama/LM Studio, o micro-calculadoras JS auditadas sin dependencias externas).

---

## 4. Ejecución Metodológica `Antigravity-SPM`: Reingeniería del Motor Autónomo

Aplicando de forma estricta la especificación operativa de `Antigravity-SPM.gem` al propio motor de evolución de **AIEvolutio** (`CAUSA_TEMPORAL`: `[FALLO_ACTIVO]` por deriva semántica y ceguera de telemetría + `[PREVENCION_RIESGO]` ante incumplimiento de propósito y AI Act):

### 4.1. Mapeo Arquitectónico (Capacidades de Negocio & DDD)

- **Core Domain (Diferenciador competitivo de AIEvolutio):**
  - _Pedagogía Accionable de Oficio_ (traducción de IA compleja a recetas de $0\text{ €}$ aplicables el lunes).
  - _Micro-Herramientas Soberanas y Plantillas de AIWorkers_ (`Diagnóstico`, `Calculadora`, kits operativos para `AIFactura`, `AIRespuestas`, `AIOferta`).
- **Supporting Subdomain:**
  - _Motor de Sensórica Exógena y Evaluación Sintética_ (`EmoInsight` + Search Console + Jurado Sintético Pyme).
  - _Orquestación Editorial y de Producto sobre Vertex AI_.
- **Generic Subdomain:**
  - _Despliegue Estático CI/CD, Hosting Web y Guardarraíl Normativo Estándar_ (plantillas base RGPD / deber de transparencia Art. 50 AI Act).

### 4.2. Clasificación Financiera TBM / FinOps (Células de Decisión + Matriz Temporal)

| Sub-Iniciativa del Experimento                             | Causa Temporal                | Célula de Decisión | Cuota FinOps Quincenal | Justificación de Valor                                                                              |
| :--------------------------------------------------------- | :---------------------------- | :----------------- | :--------------------: | :-------------------------------------------------------------------------------------------------- |
| **Freno al secuestro de AIJuris y Linter Anti-Slop**       | `[FALLO_ACTIVO]`              | **Protect**        |         $15\%$         | Corrige la degradación activa de marca y legibilidad observada en `blog.html`.                      |
| **Conexión Search Console + Logs agregados sin PII**       | `[FALLO_ACTIVO]`              | **Modernize**      |         $20\%$         | Sustituye la ceguera operativa (`0 0 0` en EmoInsight) por telemetría verificable.                  |
| **Generación de Kits Descargables para AIWorkers**         | `[PREVENCION_RIESGO]` / Valor | **Transform**      |         $35\%$         | Pasa de blog teórico a laboratorio práctico entregando plantillas reales de `AIFactura`/`AIOferta`. |
| **Guías de oficio hiper-específicas (SEO Long-Tail Pyme)** | Valor Neto                    | **Grow**           |         $20\%$         | Captación orgánica de autónomos con problemas concretos (albaranes, citas, Verifactu).              |
| **Auditoría automática Art. 50 AI Act y Zero-Retention**   | `[PREVENCION_RIESGO]`         | **Compliance**     |         $10\%$         | Garantiza etiquetado explícito de IA y ausencia de captura de datos personales sin bloquear `Grow`. |

### 4.3. Estructuración Organizativa (Team Topologies Híbrido Humano-Agente)

- **Enabling Team (Director Humano + `Antigravity-SPM` MCP):** Opera en cadencia quincenal ($1\text{ sprint} = 14\text{ días}$). Define umbrales $F \ge 0.80$, actualiza el `spm_policy.json` y audita métricas agregadas.
- **Platform Team (`Vertex Control Plane` + `AIDux` Infra):** Mantiene el grafo de ejecución en Vertex AI Agent Engine, los servidores MCP de telemetría y el pipeline CI/CD con _Quality Gates_ bloqueantes.
- **Stream-Aligned Team (`AIVisio` + `AIDux` Producto):** Flujo continuo orientado al valor para la pyme (guías de nivel _Estantería sencilla_ y artefactos reutilizables para los 3 `AIWorkers`).
- **Complicated Subsystem Team (`AIJuris` + `AICritic`):** Subsistema aislado de validación normativa (AI Act / RGPD) y verificación de fuentes; actúa como servicio de consulta y _gate_ pre-publicación, nunca como dueño del _roadmap_.

---

## 5. User Story Map Ejecutable (Listo para inyección en Antigravity)

### Épica 1: Estabilización del Bucle Autónomo y Erradicación de Deriva Semántica `[PROTECT]` `[MODERNIZE]`

- **Historia 1.1 (AIVisio / Gobernanza SPM):** Como Director del Experimento, necesito un archivo declarativo `spm_policy.json` expuesto vía MCP que limite las entregas de `AIJuris` a un máximo del $15\%$ del ciclo quincenal y exija un $70\%$ combinado en células `Grow` y `Transform`.
  - _Enabler 1.1.1:_ Implementar servidor MCP `mcp-spm-governor` con validación de esquema JSON y estado persistente del sprint quincenal en Cloud Firestore / almacenamiento ligero.
  - _Enabler 1.1.2:_ Desacoplar el _System Prompt_ de cada agente de la lectura cruda de artículos previos, inyectando únicamente un registro estructurado de títulos ya publicados para evitar contaminación autorregresiva.
- **Historia 1.2 (AICritic / Anti-Slop Gate):** Como lector autónomo o pyme, necesito que toda guía publicada utilice lenguaje de taller/comercio y contenga pasos ejecutables en menos de una tarde a coste $0\text{ €}$, rechazando prosa corporativa genérica.
  - _Enabler 1.2.1:_ Desplegar `mcp-anti-slop-linter` en Cloud Run con bloqueo determinista HTTP 422 ante frases cliché (_«En el dinámico ecosistema...»_), ausencia de herramienta gratuita concreta o índice de legibilidad Fernández Huerta $< 65$.
  - _Enabler 1.2.2:_ Configurar `Vertex AI Gen AI Evaluation Service` con el _Jurado Sintético Pyme_ (3 perfiles adversarios) exigiendo puntuación $F \ge 0.80$ antes de abrir Pull Request en el repositorio web.

### Épica 2: Instrumentación Exógena Sin Fricción ni Datos Personales `[MODERNIZE]` `[COMPLIANCE]`

- **Historia 2.1 (Sensor de Demanda Real):** Como motor autónomo `AIVisio`, necesito conocer qué dolores reales buscan los autónomos españoles cada semana para priorizar temas con tracción orgánica aunque `EmoInsight` tenga cero comentarios.
  - _Enabler 2.1.1:_ Integrar conector MCP de solo lectura con Google Search Console API extrayendo consultas con impresiones $> 10$ y bajo CTR para orientar el backlog de `Grow`.
  - _Enabler 2.1.2:_ Implementar contador de eventos _server-side_ estrictamente anónimo (sin cookies, sin IP almacenada, auditado por `AIJuris`) que mida finalizaciones en `diagnostico.html`, usos de `calculadora.html` y copias de _prompts_.

### Épica 3: Evolución de Blog Teórico a Laboratorio de Artefactos `AIWorkers` `[TRANSFORM]` `[GROW]`

- **Historia 3.1 (AIDux / Empaquetado de Valor):** Como dueño de una pyme que completa el diagnóstico guiado, necesito descargar y probar hoy mismo un kit práctico de `AIFactura`, `AIRespuestas` o `AIOferta` sin programar ni contratar suscripciones cautivas.
  - _Enabler 3.1.1:_ Habilitar la skill `mcp-microtool-builder` para que cada ciclo quincenal genere al menos 1 activo interactivo o plantilla copiable verificada (ej. plantilla de extracción de facturas locales, guion de respuesta WhatsApp conforme al Art. 50 del AI Act, o estructurador de presupuestos desde nota de voz).
  - _Enabler 3.1.2:_ Conectar dinámicamente el resultado de `diagnostico.html` con la guía y plantilla exacta generada por el bucle autónomo, cerrando el embudo de valor interno del sitio.
