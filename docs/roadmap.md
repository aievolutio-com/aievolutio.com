# Hoja de ruta estratégica por versiones — AIEvolutio

> **Fuentes de referencia complementarias:**
>
> - Constitución organizativa, sensibilidades y mandato: [`../AGENTS.md`](../AGENTS.md).
> - Mapa de historias de usuario y criterios de aceptación: [`user-story-map.md`](user-story-map.md).
> - Registro formal de cambios por versión: [`../CHANGELOG.md`](../CHANGELOG.md).
> - Arquitectura técnica del generador estático: [`architecture.md`](architecture.md).

---

## 1. Principio operativo de trabajo por versiones

El proyecto avanza mediante ciclos cerrados orientados a valor verificable en producción:

1. **Una versión por sesión:** Cada sesión de trabajo tiene un objetivo claro y acotado, correspondiente a una versión semántica (`vX.Y.Z`).
2. **Contexto antes de ejecutar:** Al iniciar cualquier trabajo, se lee la documentación de la versión objetivo en este documento y en el mapa de historias de usuario para entender qué se aborda y por qué se tomaron decisiones previas.
3. **Cierre de versión estricto:** Una versión solo se considera terminada cuando:
   - Los cambios aportan valor medible y están cubiertos por pruebas.
   - Las herramientas de calidad (`npm test`, `lint:js`, `lint:css`, `lint:html`, `format`, `self-heal-check`) pasan con cero incidencias.
   - Se actualiza la versión en `package.json`, `content/content.es.json` y se compila el sitio (`npm run build:site`).
   - Se registra el hito en `CHANGELOG.md`, se genera la etiqueta en Git (`git tag vX.Y.Z`) y se consolida en la rama `main`.
   - El entorno queda limpio para poder cerrar la sesión y reanudar con la siguiente versión sin residuos pendientes.

---

## 2. Historial de versiones consolidadas

### `v1.0.0` — Estabilización fundacional y erradicación de la deriva (Cerrada)

- **Objetivo:** Frenar la publicación repetida de artículos y consolidar la arquitectura de generación estática.
- **Logros clave:**
  - Implementación del **Guardián Adversarial Antiduplicados** (`isDuplicatePost` y `scripts/self-heal-check.mjs`) que veta cualquier contenido reiterativo.
  - Prerenderizado estático integral (Zero FOUC) en `dist/` con hidratación progresiva en `scripts/app.js`.
  - Establecimiento de la Constitución en [AGENTS.md](../AGENTS.md) con las tres miradas (AIVisio CEO, AIDux CIO, AIJuris Guardarraíl).
  - Unificación de CI/CD en `.github/workflows/evolution-loop.yml` sobre la rama `main` (Trunk-Based).
  - Corrección ortotipográfica estricta en español de España según normas RAE.
  - Trazabilidad de versión semántica visible en el pie de página de todo el sitio.

### `v1.1.0` — Identidad visual adaptativa y saneamiento documental (Cerrada)

- **Objetivo:** Proporcionar máxima nitidez al logotipo de cabecera en modos claro y oscuro, y unificar la documentación bajo el principio de Fuente Única de Verdad (SSOT).
- **Logros clave:**
  - Nuevos logotipos horizontales vectoriales adaptativos: `logo-horizontal-light.svg` (letras antracita sobre fondo claro) y `logo-horizontal-dark.svg` (letras blancas sobre fondo oscuro) en proporción nativa 4:1.
  - Alternancia instantánea nativa mediante CSS (`prefers-color-scheme`) y selector manual (`#theme-toggle`) sin parpadeos ni filtros artificiales.
  - Saneamiento y eliminación de duplicidades entre [roadmap.md](roadmap.md) y [user-story-map.md](user-story-map.md), estructurando la documentación para lectura humana y preparación RAG.

---

## 3. Plan de versiones futuras (Backlog priorizado)

### `v1.2.0` — Nitidez en pestañas y desmitificación pedagógica (Siguiente sesión)

- **Objetivo de valor:** Resolver la legibilidad de la marca en navegadores y derribar la barrera psicológica de adopción en pymes mediante explicaciones cotidianas.
- **Historias asociadas:**
  1. **Favicon multirresolución nítido (`US-101`):**
     - _Problema actual:_ El icono en la pestaña del navegador (`favicon.ico` / `favicon-16.png`) se ve pixelado y borroso al escalarse.
     - _Solución:_ Generación de un conjunto completo de favicons derivados del isotipo vectorial: `favicon.svg` (vectorial puro para navegadores modernos) y PNGs optimizados (16x16, 32x32, 48x48, 180x180 para Apple Touch y 192x192 / 512x512 para manifest Android).
  2. **Línea editorial «Encender la luz en el cuarto oscuro» (`US-102`):**
     - _Principio rector:_ El miedo tecnológico paraliza cuando el usuario solo ve oscuridad y desconoce si acometer un cambio equivale a montar una estantería Kallax o construir la Sagrada Familia.
     - _Entregable:_ Primer artículo formativo que desmitifica sin tecnicismos conceptos clave como el Protocolo MCP, las bases de datos vectoriales y los modelos locales (SLM), cuantificando en tiempo y dinero el grado real de complejidad.

### `v1.3.0` — Factoría operativa de `AIWorkers`

- **Objetivo de valor:** Pasar de la descripción conceptual a la existencia funcional de los asistentes para pequeñas empresas.
- **Historias asociadas:**
  1. **AIFactura (`US-301`):** Especificación funcional y prototipo de extracción de datos de facturas y tickets en local sin compartir datos confidenciales con terceros.
  2. **AIRespuestas (`US-302`):** Flujo de atención fuera de horario para resolver consultas frecuentes sin obligar a responder en momentos de descanso.
  3. **AIOferta (`US-303`):** Transformación de notas desestructuradas (voz/texto) en borradores de presupuestos técnicos con desglose de partidas.
  4. **Guía práctica MCP (`US-203`):** Manual paso a paso para desplegar un servidor local de lectura de archivos con guardarraíl legal.

### `v1.4.0` — Telemetría honesta y bucle de comunicación autónomo

- **Objetivo de valor:** Cerrar los canales externos con rigor ético y analítica real.
- **Historias asociadas:**
  1. **Analítica GA4 automatizada (`US-404`):** Conexión periódica desde GitHub Actions vía Workload Identity Federation (WIF) para auditar sesiones reales sin claves estáticas.
  2. **Bucle de correo autónomo transparente (`US-403`):** Procesamiento de consultas con acuse honesto que explique la naturaleza experimental del proyecto sin exponer datos personales del creador.

### `v2.0.0` — Ecosistema multicanal y factoría autónoma expandida

- **Objetivo de valor:** Ampliación a nuevos formatos (vídeo explicativo, herramientas interactivas complejas y reportes estratégicos automatizados).

---

## 4. Cuadro de trazabilidad de métricas y telemetría

| Indicador clave                          | Estado actual (`v1.1.0`)              | Meta para `v1.2.0`  | Meta para `v1.3.0`               |
| :--------------------------------------- | :------------------------------------ | :------------------ | :------------------------------- |
| **Duplicados en corpus**                 | 0 tolerancia (Hard-gate activo)       | 0 duplicados        | 0 duplicados                     |
| **Nitidez de identidad web**             | Cabecera vectorial 100%               | Favicon nítido 100% | 100% en todas las vistas         |
| **Páginas con aviso experimental**       | 100% visible                          | 100% visible        | 100% visible                     |
| **Herramientas interactivas en cliente** | 3 activas (Diagnóstico, ROI, Filtros) | 3 activas           | 4 activas (+ prototipo AIWorker) |
| **Artículos pedagógicos de nivelación**  | 0 específicos ("cuarto oscuro")       | 1 publicado         | 3 publicados                     |
