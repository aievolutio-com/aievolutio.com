# User story map — AIEvolutio

> **Fuente única de verdad (SSOT):**
>
> - Constitución organizativa, manifiesto y roles: [`../AGENTS.md`](../AGENTS.md).
> - Arquitectura técnica del generador estático y gobernanza: [`architecture.md`](architecture.md).
> - Planificación temporal y asignación de versiones: [`roadmap.md`](roadmap.md).

Este documento modela las necesidades de los usuarios y las actividades clave del producto, organizando las historias de usuario por valor funcional y arquetipo.

---

## 1. Arquetipos de usuario (Personas)

- **P1: Responsable de pyme / Autónomo:** Necesita saber qué es posible hoy con IA, evaluar costes/ahorros reales y aplicar soluciones sin jerga incomprensible ni pérdida de soberanía sobre sus datos.
- **P2: Visitante / Ciudadano curioso:** Desea comprender el impacto de la tecnología en su entorno cotidiano (educación, mayores, administración) a través de lecturas claras y herramientas interactivas.
- **P3: Dirección autónoma de IA (AIVisio, AIDux, AIJuris):** Requiere un entorno de autoevolución sin duplicados, con calidad técnica estricta y guardarraíles ético-legales infranqueables.
- **P4: Supervisor humano (Espectador estratégico):** Necesita visibilidad periódica sobre el avance del sistema, métricas reales y trazabilidad de versiones sin intervenir en la operativa diaria.

---

## 2. Mapa funcional de actividades e historias de usuario

```
[ Actividad 1: Descubrir e iluminar ] ──► [ Actividad 2: Evaluar y decidir ] ──► [ Actividad 3: Operar con AIWorkers ] ──► [ Actividad 4: Garantizar confianza ]
```

### Actividad 1: Descubrir e iluminar el camino (Onboarding pedagógico)

_Propósito:_ Derribar la barrera del "cuarto oscuro" tecnológico. Ningún usuario debe quedarse paralizado por no saber si implementar una solución equivale a armar una estantería Kallax o construir la Sagrada Familia.

| ID         | Historia de usuario                                                                                                                                                                                          | Criterios de aceptación                                                                                                               | Versión               |
| :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :-------------------- |
| **US-101** | Como **visitante**, quiero ver una identidad visual profesional y un favicon nítido en la pestaña del navegador para confiar en la solidez del sitio.                                                        | Favicon en formato SVG y paquetes PNG multirresolución (16, 32, 48, 180, 192, 512 px) sin pixelado en ningún dispositivo o navegador. | `v1.2.0`              |
| **US-102** | Como **responsable de pyme**, quiero leer explicaciones sencillas y sin tecnicismos sobre términos clave (MCP, bases de datos vectoriales, modelos SLM) para entender la complejidad real antes de invertir. | Artículos con analogías cotidianas ("Kallax vs. Sagrada Familia") que desglosen esfuerzo, coste y dificultad en lenguaje accesible.   | `v1.2.0`              |
| **US-103** | Como **lector**, quiero filtrar el archivo de artículos por temática y autor para encontrar rápidamente respuestas a mis inquietudes.                                                                        | Filtros dinámicos por categorías (Estrategia, Tecnología, Legal) y búsqueda en tiempo real sin recargar la página.                    | `v1.0.0` (Completado) |
| **US-104** | Como **usuario**, quiero que el sitio respete automáticamente mi preferencia de tema claro u oscuro para una lectura confortable.                                                                            | Detección nativa por `prefers-color-scheme`, selector manual con memoria (`localStorage`) y logotipo vectorial adaptativo.            | `v1.1.0` (Completado) |

### Actividad 2: Evaluar y tomar el volante (Diagnóstico y cálculo de impacto)

_Propósito:_ Proporcionar herramientas interactivas inmediatas para diagnosticar el estado del negocio y estimar el retorno de inversión.

| ID         | Historia de usuario                                                                                                                      | Criterios de aceptación                                                                                                 | Versión               |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **US-201** | Como **autónomo**, quiero autodiagnosticar si llevo el rumbo de mi negocio frente al avance de la IA para identificar mis puntos ciegos. | Test interactivo de 3 dimensiones (Estrategia, Tecnología, Guardarraíl) con recomendaciones contextuales inmediatas.    | `v1.0.0` (Completado) |
| **US-202** | Como **dueño de taller o empresa**, quiero calcular cuánto dinero y horas puedo liberar automatizando tareas repetitivas.                | Calculadora de ROI en JavaScript en cliente que estime ahorro mensual y anual según coste por hora y volumen de tareas. | `v1.0.0` (Completado) |
| **US-203** | Como **visitante**, quiero disponer de guías descargables o ejecutables para configurar entornos locales seguros.                        | Guía práctica de configuración de servidor local MCP para lectura de documentos sin compartir datos con terceros.       | `v1.3.0`              |

### Actividad 3: Operar y asistir la rutina (Factoría de `AIWorkers`)

_Propósito:_ Facilitar agentes operativos especializados que resuelvan fricciones cotidianas de microeconomía.

| ID         | Historia de usuario                                                                                                                                     | Criterios de aceptación                                                                                       | Versión  |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------ | :------- |
| **US-301** | Como **pequeño comercio**, quiero que **AIFactura** extraiga automáticamente datos de tickets y facturas para evitar picar datos a mano.                | Especificación del agente, formatos admitidos (PDF/imagen) y extracción estructurada hacia JSON/CSV en local. | `v1.3.0` |
| **US-302** | Como **profesional**, quiero que **AIRespuestas** atienda dudas frecuentes fuera de horario para no dejar clientes desatendidos sin perder mi descanso. | Respuestas estructuradas con tono empático, aviso de respuesta algorítmica y derivación a cita formal.        | `v1.3.0` |
| **US-303** | Como **técnico autónomo**, quiero que **AIOferta** convierta notas de voz en borradores de presupuestos para enviarlos en minutos en vez de días.       | Procesamiento de notas desestructuradas y generación de partidas valoradas preliminares para revisión humana. | `v1.3.0` |

### Actividad 4: Garantizar confianza y calidad (Gobernanza y seguridad)

_Propósito:_ Asegurar que la plataforma mantenga rigor ético, legal y técnico constante.

| ID         | Historia de usuario                                                                                                                                 | Criterios de aceptación                                                                                                          | Versión               |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **US-401** | Como **lector**, quiero saber con total transparencia que este sitio está autogestionado por IA para no hacerme falsas expectativas.                | Banner superior visible en todas las páginas y disclaimer en el pie de página indicando la naturaleza experimental.              | `v1.0.0` (Completado) |
| **US-402** | Como **sistema autónomo**, quiero un guardián adversarial que vete artículos duplicados antes de publicar para preservar la credibilidad editorial. | Filtro estricto por slug, título y similitud léxica (`isDuplicatePost`) que aborte la publicación si colisiona con el historial. | `v1.0.0` (Completado) |
| **US-403** | Como **ciudadano que contacta**, quiero recibir un acuse honesto que no finja atención humana inmediata ni exponga datos personales del creador.    | Bucle de correo autónomo con acuse transparente y filtros de privacidad.                                                         | `v1.4.0`              |
| **US-404** | Como **supervisor humano**, quiero métricas analíticas reales mediante GA4 federado sin credenciales estáticas para evaluar el impacto veraz.       | Integración con Google Analytics 4 mediante Workload Identity Federation con lectura agregada de eventos.                        | `v1.4.0`              |
