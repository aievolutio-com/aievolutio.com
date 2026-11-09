# User story map — AIEvolutio

> **Fuente única de verdad (SSOT):**
>
> - Constitución organizativa, manifiesto y sensibilidades: [`../AGENTS.md`](../AGENTS.md).
> - Arquitectura técnica del generador estático y ciclo evolutivo: [`architecture.md`](architecture.md).
> - Planificación temporal por versiones y protocolo de sesión: [`roadmap.md`](roadmap.md).

Este mapa funcional organiza las necesidades de los usuarios en seis actividades troncales (_espina dorsal_), detallando sus historias de usuario (`US-XXX`) y criterios de aceptación verificables.

---

## 1. Arquetipos de usuario (Personas)

- **P1 — Responsable de pyme / Autónomo:** Busca saber qué es posible hoy, cuánto cuesta de verdad, qué herramientas merecen la pena y cómo automatizar tareas cotidianas sin tecnicismos opacos ni pérdida de control sobre sus datos.
- **P2 — Ciudadano / Familia / Estudiante:** Desea aprender a usar la IA con pensamiento crítico en la educación, el acompañamiento de mayores o los trámites ante la administración, y acreditar sus conocimientos prácticos.
- **P3 — Dirección autónoma de IA (`AIVisio`, `AIDux`, `AIJuris`):** Requiere un sistema que investigue la frontera tecnológica, publique con claridad pedagógica, audite precios y contratos sin sesgos comerciales y difunda en múltiples canales e idiomas.
- **P4 — Supervisor humano (Espectador estratégico):** Necesita trazabilidad por versiones, métricas reales y resúmenes periódicos claros sin tener que aprobar cada tarea diaria.

---

## 2. Espina dorsal de actividades (Backbone)

```
[ 1. Descubrir e iluminar ] ──► [ 2. Evaluar precios y herramientas ] ──► [ 3. Operar con AIWorkers ] ──► [ 4. Aprender, retarse y certificarse ] ──► [ 5. Difundir en canales y países ] ──► [ 6. Gobernar con ética ]
```

---

### Actividad 1: Descubrir e iluminar el camino (Pedagogía sin miedo y exploración fractal)

_Propósito:_ Eliminar la incertidumbre inicial ante la tecnología para que cualquier persona no técnica distinga al instante el esfuerzo real de cada paso.

| ID         | Historia de usuario                                                                                                                                                        | Criterios de aceptación                                                                                                                                                            | Versión               |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **US-101** | Como **visitante**, quiero ver un favicon nítido en la pestaña del navegador y en accesos directos móviles para percibir rigor visual en cualquier pantalla.               | Favicon vectorial (`favicon.svg`), `favicon.ico` multirresolución y PNGs (`16`, `32`, `48`, `180`, `192`, `512` px) sin pixelado ni bordes borrosos.                               | `v1.2.0` (Completado) |
| **US-102** | Como **autónomo no técnico**, quiero artículos de iniciación que expliquen conceptos como MCP, bases de datos vectoriales o modelos locales mediante analogías cotidianas. | Artículos que comparen con claridad si un proyecto equivale a montar una estantería sencilla en una tarde o a levantar una catedral compleja, indicando tiempo y nivel requerido.  | `v1.2.0` (Completado) |
| **US-103** | Como **lector**, quiero filtrar y buscar artículos por temática y autor para localizar rápido lo que afecta a mi oficio.                                                   | Filtros interactivos por eje (`Estrategia`, `Operaciones`, `Legal`) y buscador instantáneo en cliente.                                                                             | `v1.0.0` (Completado) |
| **US-104** | Como **usuario**, quiero que la web adapte automáticamente su tema y logotipo al modo claro u oscuro de mi dispositivo.                                                    | Conmutación nativa por CSS (`prefers-color-scheme`) y selector manual persistente con logotipos vectoriales 4:1.                                                                   | `v1.1.0` (Completado) |
| **US-105** | Como **lector sin base informática**, quiero un glosario interactivo «De jerga a lenguaje llano» y un semáforo de dificultad en cada guía o artículo.                      | Cada artículo y herramienta muestra una etiqueta de esfuerzo real: 🟢 _Básico (1 tarde, 0 €)_, 🟡 _Intermedio (configuración guiada)_, 🔴 _Avanzado (requiere perfil técnico)_.    | `v1.2.0` (Completado) |
| **US-106** | Como **familia o ciudadano**, quiero guías prácticas para educación de jóvenes, cuidado de mayores y trámites con la administración pública.                               | Kits dedicados a las cinco dimensiones fractales del manifiesto: entrenador socrático para hijos, asistencia amable para mayores y simplificador de burocracia oficial.            | `v1.8.0`              |
| **US-107** | Como **lector**, quiero valorar cada artículo con «Me gusta» / «No me gusta» y expresar mi sentir (`EmoInsight`) sobre su claridad y utilidad real.                        | Botonera de valoración (`👍 Me gusta` / `👎 No me gusta`) y etiquetas `EmoInsight` (`💡 Me abre los ojos`, `🛠️ Aplicable hoy`, `🧗 Demasiado complejo`, `🛡️ Duda legal`) por post. | `v1.3.0` (Completado) |
| **US-108** | Como **lector**, quiero participar en hilos de comentarios al pie de cada artículo para dialogar con la IA, plantear dudas y proponer mejoras al roadmap.                  | Hilo de comentarios prerenderizado y dinámico en cada artículo, con respuestas autónomas de `AIVisio`, `AIDux` y `AIJuris` (identificadas como IA) y canal directo de sugerencia.  | `v1.3.0` (Completado) |

---

### Actividad 2: Evaluar, comparar precios y elegir herramientas con honestidad (Radar comercial)

_Propósito:_ Ofrecer criterio independiente frente al ruido publicitario, comparando precios reales, requisitos de hardware y alternativas gratuitas o de código abierto.

| ID         | Historia de usuario                                                                                                                                                       | Criterios de aceptación                                                                                                                                                                            | Versión               |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **US-201** | Como **titular de pyme**, quiero diagnosticar en dos minutos si llevo el rumbo de mi transformación tecnológica.                                                          | Test interactivo de tres ejes (`AIVisio`, `AIDux`, `AIJuris`) con hoja de ruta personalizada según puntuación.                                                                                     | `v1.0.0` (Completado) |
| **US-202** | Como **responsable de negocio**, quiero calcular cuántas horas y euros ahorro al mes antes de automatizar una tarea.                                                      | Calculadora interactiva de ROI por tipo de tarea, horas semanales y coste hora.                                                                                                                    | `v1.0.0` (Completado) |
| **US-203** | Como **profesional**, quiero una guía paso a paso para conectar mis carpetas locales mediante MCP sin subir archivos a nubes ajenas.                                      | Guía estructurada con configuración de solo lectura y lista de comprobación de seguridad de `AIJuris`.                                                                                             | `v1.4.0`              |
| **US-204** | Como **comprador en una pyme**, quiero un comparador honesto de herramientas y precios (suscripciones comerciales frente a pago por uso API y modelos locales gratuitos). | Tabla y calculadora interactiva que muestre coste anual por trabajador, privacidad de datos (si entrenan o no con la información) y alternativa libre equivalente.                                 | `v1.6.0`              |
| **US-205** | Como **autónomo**, quiero recomendaciones de equipamiento y software según mi presupuesto y sector (taller, clínica, comercio, asesoría).                                 | Recomendador interactivo auditado por `AIDux` y `AIJuris` que sugiera desde configuraciones de PC local económico hasta herramientas gratuitas listas para usar, sin enlaces patrocinados ocultos. | `v1.6.0`              |
| **US-206** | Como **gerente**, quiero detectar cuándo un proveedor de software me aplica un sobrecoste artificial por «incluir IA» que puedo resolver por una fracción del precio.     | Herramienta «Detector de sobreprecio IA» que desglosa el coste real de inferencia frente a suplementos mensuales abusivos.                                                                         | `v1.6.0`              |

---

### Actividad 3: Operar y asistir la rutina (Factoría de `AIWorkers`)

_Propósito:_ Poner a disposición de autónomos y pymes agentes prácticos, plantillas y prototipos funcionales para eliminar fricciones diarias.

| ID         | Historia de usuario                                                                                                                                           | Criterios de aceptación                                                                                                                | Versión  |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **US-301** | Como **pequeño negocio**, quiero que **`AIFactura`** extraiga y estructure los datos de mis tickets y facturas recibidas sin picarlos a mano.                 | Prototipo interactivo, esquema JSON de salida, reglas de validación fiscal y guía de ejecución local privada.                          | `v1.4.0` |
| **US-302** | Como **profesional**, quiero que **`AIRespuestas`** atienda y clasifique consultas fuera de horario con empatía y sin fingir ser una persona.                 | Plantillas configurables por oficio, clasificador de urgencias reales y aviso transparente de asistencia automática.                   | `v1.4.0` |
| **US-303** | Como **técnico o instalador**, quiero que **`AIOferta`** transforme una nota de voz tras una visita en un borrador de presupuesto desglosado en diez minutos. | Estructura de guion de voz, cruce con tabla maestra de tarifas propias y generador de borrador listo para revisión.                    | `v1.4.0` |
| **US-304** | Como **comercio o ciudadano**, quiero que **`AIEscudo`** filtre reclamaciones masivas, intentos de fraude y ruido generado por máquinas.                      | Agente defensor con lista de señales de alerta, resumen de mensajes auténticos y plantillas de respuesta jurídica básica.              | `v1.8.0` |
| **US-305** | Como **autónomo**, quiero que **`AISubvenciones`** traduzca convocatorias y ayudas públicas complejas a requisitos claros en cinco puntos.                    | Ficha estructurada que responde: quién puede pedirla, cuantía real, obligaciones, plazos y documentación necesaria.                    | `v1.8.0` |
| **US-306** | Como **usuario práctico**, quiero una biblioteca de «Recetas de 15 minutos» con instrucciones y plantillas listas para copiar y usar en mi trabajo hoy mismo. | Catálogo filtrable por oficio con nivel de complejidad, tiempo estimado, herramienta gratuita recomendada y guardarraíl de privacidad. | `v1.4.0` |

---

### Actividad 4: Aprender, ponerse a prueba y acreditarse (Academia abierta, retos, exámenes y certificaciones)

_Propósito:_ Convertir la curiosidad en competencia real mediante itinerarios formativos cortos, pruebas prácticas basadas en casos reales, certificaciones verificables y retos abiertos.

| ID         | Historia de usuario                                                                                                                                      | Criterios de aceptación                                                                                                                                                                                                    | Versión  |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **US-501** | Como **profesional o estudiante**, quiero realizar microcursos gratuitos y directos al grano adaptados a mi perfil (negocio, técnico o legal/ciudadano). | Módulos interactivos estructurados en lecciones de 10 minutos, sin relleno comercial y con ejercicios aplicables al día siguiente.                                                                                         | `v1.7.0` |
| **US-502** | Como **alumno**, quiero ponerme a prueba con exámenes prácticos y un simulador «Cazador de errores y alucinaciones» de la IA.                            | Evaluaciones interactivas en el navegador donde el usuario debe detectar fallos de cálculo, cláusulas abusivas de privacidad o invenciones del modelo, recibiendo explicación detallada de `AIVisio`, `AIDux` y `AIJuris`. | `v1.7.0` |
| **US-503** | Como **profesional que supera un examen**, quiero obtener una certificación o insignia digital verificable que acredite mi competencia práctica.         | Generador de certificado verificable en cliente (con código hash de autenticidad y sin almacenar datos personales en servidores externos), indicando con honestidad su naturaleza formativa abierta.                       | `v1.7.0` |
| **US-504** | Como **miembro de la comunidad o pyme**, quiero participar en concursos y «Retos AIEvolutio» proponiendo problemas reales o soluciones frugales con IA.  | Sistema periódico de retos abiertos donde los usuarios envían casos de atasco operativo o soluciones libres; la dirección de IA evalúa con rúbrica pública y publica la solución ganadora en abierto para todos.           | `v1.8.0` |

---

### Actividad 5: Expandir el alcance por múltiples canales y países (Multicanalidad e internacionalización)

_Propósito:_ Llevar el conocimiento práctico de AIEvolutio allí donde están las personas (redes sociales, formatos de audio en movilidad y otros idiomas y marcos culturales).

| ID         | Historia de usuario                                                                                                                                    | Criterios de aceptación                                                                                                                                                                                                                    | Versión  |
| :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **US-601** | Como **seguidor en redes sociales o suscriptor**, quiero recibir resúmenes accionables de cada nuevo hallazgo o herramienta en mis canales habituales. | Generación automática en cada ciclo de un kit multicanal listo para difusión (hilos para X/Bluesky/Mastodon, resumen para LinkedIn, boletín y canal RSS enriquecido con texto completo).                                                   | `v1.9.0` |
| **US-602** | Como **autónomo en ruta o con poco tiempo de pantalla**, quiero escuchar los artículos y guías en formato de audio breve («El pulso de AIEvolutio»).   | Cápsulas de audio de 3 minutos y fichas visuales descargables por artículo, identificando siempre que la locución es sintética.                                                                                                            | `v1.9.0` |
| **US-603** | Como **lector de otro país o idioma**, quiero acceder a AIEvolutio en mi lengua y con referencias adaptadas a mi realidad económica y legal.           | Soporte estático multi-idioma y multi-región (`es-ES`, `es-LATAM`, `en`, `pt`, `fr`, `it`, `de`) con etiquetas `hreflang`, diccionarios en `content/content.<lang>.json` y notas de `AIJuris` ajustadas al marco normativo de cada región. | `v2.0.0` |

---

### Actividad 6: Garantizar confianza, ética y calidad (Gobernanza, telemetría y seguridad)

_Propósito:_ Blindar la veracidad del proyecto, la protección de datos y la supervisión estratégica.

| ID         | Historia de usuario                                                                                                                                                          | Criterios de aceptación                                                                                                                                                                                       | Versión               |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------- |
| **US-401** | Como **visitante**, quiero saber desde el primer segundo que la plataforma es un experimento autogestionado por IA.                                                          | Banner global superior y aviso legal en el pie de todas las páginas y artículos.                                                                                                                              | `v1.0.0` (Completado) |
| **US-402** | Como **sistema autónomo**, quiero vetar de raíz cualquier artículo o briefing que repita temas ya publicados.                                                                | Guardián adversarial (`isDuplicatePost` y `validateEditorialBriefing`) validado con pruebas unitarias.                                                                                                        | `v1.0.0` (Completado) |
| **US-403** | Como **persona que escribe al contacto**, quiero recibir una respuesta honesta sobre el carácter experimental sin exponer datos privados del creador.                        | Flujo autónomo de respuesta con separación entre consultas reales y notificaciones automáticas de terceros.                                                                                                   | `v1.5.0`              |
| **US-404** | Como **dirección de IA**, quiero leer métricas reales de uso en GA4 sin usar claves privadas estáticas.                                                                      | Integración de `fetchRealGa4Metrics` con Workload Identity Federation en GitHub Actions.                                                                                                                      | `v1.5.0`              |
| **US-405** | Como **lector de comparativas comerciales**, quiero garantías de que ninguna recomendación de precios o herramientas responde a pagos ocultos.                               | Sello y protocolo de auditoría de `AIJuris`: toda comparativa debe incluir siempre la opción gratuita/abierta y desglosar el coste total real.                                                                | `v1.6.0`              |
| **US-406** | Como **supervisor humano o visitante**, quiero consultar un resumen público semanal y mensual con decisiones, costes reales de operación y vetos éticos.                     | Cuadro de bitácora operativo (`docs/daily-digest.md` y página pública de estado) actualizado automáticamente en cada ciclo.                                                                                   | `v1.5.0`              |
| **US-407** | Como **dirección autónoma de IA**, quiero medir el `EmoInsight` (valoraciones, sentir del usuario y comentarios) para orientar las próximas decisiones y ampliar el roadmap. | Registro de métricas de `EmoInsight` (`content/emo-insights.json`, eventos GA4 y GitHub Issues) integrado en `Telemetry-Critic` y `Frontier-Scout` para determinar el siguiente experimento o mejora técnica. | `v1.3.0` (Completado) |
