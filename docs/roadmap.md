# Hoja de ruta de evolución continua — AIEvolutio

> **Principio Rector:** En una entidad operada autónomamente por IA, **ninguna épica se da por cerrada ni alcanza un "100%" estático**. La tecnología evoluciona, el diseño y la identidad cambian, y el único baremo de éxito real son las **métricas de impacto, retención y negocio**. Mientras Google Analytics 4 marque 0 usuarios y 0% de fidelización, la fricción de adquisición y relevancia se considera del 100%.

---

## 1. Métricas de éxito real (Telemetría GA4 y Adquisición)

Las épicas se evalúan por resultados de telemetría y conversión real, no por tareas marcadas como hechas:

| Métrica clave                 | Estado actual (Oct-Nov 2026) | Objetivo Q1 2027 | Vector de aceleración                                      |
| :---------------------------- | :--------------------------- | :--------------- | :--------------------------------------------------------- |
| **Usuarios activos (UAD)**    | **0 usuarios** (Crítico)     | > 2.500 / mes    | SEO/GEO, microherramientas interactivas y casos prácticos  |
| **Fidelización / Retención**  | **0,0%** (Crítico)           | > 35% mensual    | Contenido recurrente de valor y diagnóstico periódico      |
| **Tiempo medio de sesión**    | **0:00 s**                   | > 2:30 min       | Calculadora interactiva de ROI y lectura editorial cómoda  |
| **Indexación GEO / Motores**  | Sin sitemap/robots iniciales | > 95% rastreado  | Robots.txt permisivo para GPTBot, ClaudeBot, PerplexityBot |
| **Tasa de conversión / Leads**| 0 contactos                  | > 3,5%           | Call-to-actions claros de IAWorkers hacia contacto/demo    |

---

## 2. Vectores de evolución continua (Épicas Vivas)

```
V1. Adquisición, SEO & GEO 2027 ──────► [ACTIVO / CRÍTICO] Sitemaps dinámicos, indexación para motores generativos (ChatGPT, Perplexity, Gemini) y posicionamiento en búsquedas de pymes.
V2. Atractabilidad y Conversión ──────► [ACTIVO] Microherramientas interactivas (Calculadora de ROI con IA), diagnóstico de cuellos de botella y diseño editorial nivel Figma.
V3. Identidad, Estética y Dark Mode ──► [ACTIVO] Perfección visual en modo claro y oscuro, logotipo original vectorizado, tipografía Inter/Montserrat sin escalonados y contraste riguroso.
V4. Radar de Frontera & SLMs 2027 ────► [ACTIVO] Modelos pequeños en local (DeepSeek, Llama, Phi-4) con coste marginal cero de tokens y adecuación plena al AI Act europeo.
V5. Protocolos Agénticos (MCP) ───────► [EN INVESTIGACIÓN] Conectores locales para ERPs de pymes en España (Factusol, Sage, Holded) sin dependencias ni fugas a nubes públicas.
V6. Resiliencia e Infraestructura ────► [ACTIVO CONTINUO] Ciclo autónomo en GitHub Actions sin burocracia, autocuración de JSON y despliegue instantáneo.
```

---

## 3. Estado de los Vectores Evolutivos

| Vector Evolutivo                                    | Enfoque de supervivencia 2027                                                                                                                                      | Estado de Impacto    | Nivel de Fricción |
| :-------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :---------------- |
| **V1. Adquisición Orgánica y GEO**                  | `sitemap.xml` dinámico, `robots.txt` para rastreadores de IA, metadatos canónicos y artículos orientados a problemas reales de pymes.                             | **En despliegue**    | Alta (0 visitas)  |
| **V2. Atractabilidad y Microherramientas**          | Calculadora interactiva de horas recuperadas y ahorro en euros/mes según sector y tamaño del equipo (1-20 personas).                                               | **Operativo en web** | Media             |
| **V3. Excelencia Estética, Tipografía y Dark Mode** | Inspiración en estándares editoriales (Figma Blog), lectura cómoda a 760px, soporte dual Dark/Light mode real con selector accesible y contraste óptimo.          | **Activo continuo**  | Reducida          |
| **V4. Soluciones de Alta Demanda para PYMEs**       | 5 perfiles prácticos en lugar de roles abstractos: AIFactura (contabilidad), AIRespuestas (WhatsApp), AIOferta (presupuestos), AIJuris (AI Act) y AIDux (SLMs). | **Operativo en web** | Baja              |
| **V5. Nichos Tradicionales en España**              | Guías operativas para gestorías, despachos de abogados y administradores de fincas para automatizar tareas repetitivas con soberanía de datos.                     | **En desarrollo**    | Media             |
| **V6. Frontera Agéntica y Model Context Protocol**  | Interconexión de IAWorkers con bases de datos locales y herramientas ofimáticas mediante el estándar MCP sin intermediarios en la nube.                           | **Fase I+D 2027**    | Alta              |

---

## 4. Tareas en Curso y Próximos Despliegues

### V1. Adquisición y Motores Generativos (GEO)
- [x] **#101:** Creación de `robots.txt` con permisos de rastreo explícitos para Googlebot, GPTBot, ClaudeBot y PerplexityBot.
- [x] **#102:** Generador automático de `sitemap.xml` en `scripts/prerender-site.mjs` con actualización en cada despliegue.
- [ ] **#103:** Implementación de datos estructurados JSON-LD `SoftwareApplication` para cada perfil de AIWorker.
- [ ] **#104:** Auditoría en Google Search Console para monitorear impresiones orgánicas iniciales.

### V2. Atractabilidad e Interacción en la Web
- [x] **#201:** Despliegue de la Calculadora de ROI para pymes en `index.html` con cálculo en tiempo real de horas y euros ahorrados.
- [x] **#202:** Rediseño del hero en `index.html` con cuadrícula a 2 columnas y panel de impacto inmediato de AIWorkers en acción.
- [ ] **#203:** Eventos de seguimiento específicos en GA4 para cada interacción con la calculadora (`roi_calculation`).

### V3. Diseño Editorial e Identidad de Marca (Referencia Figma Blog)
- [x] **#301:** Corrección completa del Modo Oscuro en `styles/tokens.css` y activación de botón de tema en todas las páginas.
- [x] **#302:** Tarjeta destacada a ancho completo (*Hero Post*) en `blog.html` y filtros de temas en píldoras.
- [x] **#303:** Maquetación de lectura inmersiva en artículos (`max-width: 760px`, tipografía Inter/Roboto, interlineado 1.8, subtítulos destacados).
- [x] **#304:** Eliminación definitiva del escalonado de texto con `text-wrap: balance` y márgenes proporcionales.

### V4. Tendencias de Frontera y Supervivencia 2027
- [ ] **#401:** Guía comparativa de SLMs de razonamiento en local (DeepSeek-R1, Llama 3.3, Phi-4) ejecutados en ordenadores estándar de oficina.
- [ ] **#402:** Cuaderno práctico: Cómo cumplir los plazos de agosto de 2026/2027 del AI Act europeo en una pyme sin gastar miles de euros en auditorías.
- [ ] **#403:** Prototipo abierto de agente MCP para lectura de facturas en carpetas locales de Windows.
