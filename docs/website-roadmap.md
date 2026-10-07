# Hoja de ruta de la web

## Situación comprobada

- El archivo del blog mostraba el texto completo de cada artículo en tarjetas
  y la cuadrícula podía crecer hasta cuatro columnas en escritorio.
- Dos publicaciones recientes recomendaban una sección de contacto que la web
  no ofrecía.
- En el repositorio no se encontró instrumentación de analítica ni resultados
  de pruebas con visitantes. Por tanto, no hay evidencia para afirmar que la
  web guste a su audiencia ni para medir su impacto comercial.
- La política de privacidad de `docs/quality.md` prohíbe incorporar trackers
  o código externo sin una decisión explícita.

## Prioridades y criterios de salida

### P0 — Hacer legible y fiable el blog

- Mostrar cuatro artículos recientes y separar los anteriores en otra página;
  usar extractos breves, con dos columnas como máximo en escritorio y una en
  móvil.
- Abrir cada pieza en una vista individual con URL enlazable y regreso claro
  al archivo.
- Revisar y retirar contenido que recomiende funciones inexistentes o presente
  consejos genéricos como si fueran una propuesta propia.
- Criterios: sin desplazamiento horizontal a 360 px, cuerpo de artículo de
  ancho cómodo, navegación directa a URL con hash, Atrás/Adelante del navegador
  y enlaces de lectura operativos.

### P1 — Completar el recorrido de confianza y contacto

- Acordar un canal público real de contacto antes de publicarlo. No inventar
  correo, formulario, tiempos de respuesta ni presencia en redes.
- Aclarar en Inicio qué problema resuelve AIEvolutio, para quién y cuál es el
  siguiente paso útil.
- Criterios: una persona nueva puede describir la propuesta, encontrar una
  prueba concreta de valor y localizar un canal de contacto real sin ayuda.

### P2 — Validar con personas

- Probar la web con 5 personas del público objetivo, una a una, mediante tareas:
  explicar la propuesta tras una visita breve, encontrar un artículo relevante,
  identificar qué puede hacer un AIWorker y localizar cómo iniciar una
  conversación.
- Observar finalización, tiempo, dudas y errores; no guiar durante la tarea.
- Hacer cambios sobre los problemas observados y repetir la misma prueba.
- Criterio inicial, no estadístico: al menos 4 de 5 completan cada tarea sin
  ayuda y ninguna confunde una capacidad experimental con una garantía.
  Publicar también los fallos; una muestra pequeña sirve para descubrir
  fricciones, no para representar a toda la audiencia.

### P3 — Medir alcance e impacto con privacidad

- Sin analítica web, se pueden revisar métricas de publicación, accesibilidad,
  rendimiento y Search Console si existe acceso: páginas indexadas, impresiones
  y clics desde búsqueda. No revelan por sí solas satisfacción ni conversiones.
- Antes de añadir medición de comportamiento, decidir proveedor, ubicación de
  datos, retención, consentimiento y métricas mínimas. Priorizar una opción
  respetuosa con la privacidad y no añadir Google Analytics por defecto.
- Definir un embudo solo cuando exista un destino real: visita → lectura útil →
  acción de contacto. Medir conversiones únicamente con instrumentación y base
  legal adecuadas; no confundir visitas con valor entregado.
- Revisar mensualmente rendimiento, errores de navegación, consultas recibidas
  y aprendizajes de entrevistas; traducirlos en el siguiente experimento.

## Cadencia y responsabilidad

Cada cambio diario debe tener una hipótesis de usuario, una mejora observable,
una comprobación automática pertinente y un registro del resultado. Un cambio
de contenido no cuenta como mejora de UX si no hace más clara, útil o fiable la
experiencia. El equipo autónomo puede proponer y ejecutar cambios dentro de
estos criterios; no debe inventar testimonios, datos, capacidades ni canales
de contacto.
