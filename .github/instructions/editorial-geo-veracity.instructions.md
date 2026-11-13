---
applyTo: "content/**,scripts/autonomous-evolution*,scripts/prerender-site*"
---

# Reglas vinculantes editoriales, GEO y veracidad técnica

Todo contenido generado en `content/posts/*.json`, `content/content.es.json`, `scripts/autonomous-evolution.mjs` o plantillas de `scripts/prerender-site.mjs` debe cumplir sin excepción:

## 1. Estándar editorial de 3 capas y cuotas de extensión

- **Cuota por formato:**
  - Artículo táctico diario: **600–900 palabras** en el cuerpo principal.
  - Guía pilar semanal: **1000–1500 palabras** en el cuerpo principal.
  - Los ciclos técnicos enriquecen gradualmente el archivo histórico en `content/posts/` sin destruirlo ni alterar URLs canónicas.
- **Anatomía obligatoria de 3 capas:**
  1. **Capa 1 — «En 30 segundos»:** resumen ejecutivo directo con la respuesta clave y qué ahorro o problema concreto resuelve.
  2. **Capa 2 — Desarrollo estructurado y apoyo visual:** explicación práctica con analogía cotidiana honesta cuando aparezca un término técnico, acompañada de **al menos un diagrama SVG nativo o tabla comparativa** más nota de claridad.
  3. **Capa 3 — Protocolo accionable e interacción `EmoInsight`:** pasos numerados verificables aplicables el mismo día + widget de valoración y comentarios reales.

## 2. Veracidad técnica estricta y regla anti-alucinación

- **Prohibido inventar datos:** no fabricar porcentajes, ahorros estimados en euros, cuotas de mercado, reseñas de herramientas ni citas legales de memoria.
- **Fuente verificada obligatoria para cifras:** todo dato cuantitativo, precio vigente o artículo normativo debe estar respaldado por búsqueda verificada en vivo (_Google Search Grounding_) con fuente enlazable real incluida en la redacción o metadatos.
- **Alternativa segura sin fuentes:** si el ciclo no obtiene fuentes verificables enlazables para una magnitud, el artículo debe publicarse **como guía puramente conceptual y operativa** sin estadísticas ni supuestos inventados.

## 3. Optimización GEO y marcado Schema.org

- Usar `@type: "TechArticle"` (y `"FAQPage"`, `"Organization"`, `"SoftwareApplication"` donde corresponda) en JSON-LD, incluyendo `author` con enlace `rel="author"` hacia `equipo.html` y definiciones breves autónomas fácilmente citables por motores generativos.
- Respetar la **ortotipografía de la RAE** en español de España: sin capitalización anglosajona en títulos ni epígrafes.

## 4. Reserva editorial regenerativa y deduplicación

- Vigilar que la reserva de propuestas editoriales verificadas no baje de **3 artículos pendientes**; si baja de 3, el sistema debe reaprovisionar hasta **5 propuestas inéditas** ancladas en `EmoInsight`, GA4 y búsqueda de frontera.
- Ningún borrador o artículo puede publicarse si colisiona semántica o léxicamente con `content/editorial-log.json` o `content/posts/`.
