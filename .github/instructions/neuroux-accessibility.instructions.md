---
applyTo: "**/*.{html,css,js,mjs}"
---

# Reglas vinculantes de NeuroUX, identidad visual y accesibilidad AAA

Todo código HTML, CSS o JavaScript (incluidos scripts SSG en `scripts/prerender-site.mjs` e hidratación en `scripts/app.js`) debe respetar estas reglas constitucionales sin excepciones:

## 1. Lenguaje público libre de jerga interna

- **Prohibido exponer en la interfaz visible** términos internos del experimento o metáforas opacas: `volante`, `curva exponencial`, `máquina biológica al mando`, `AIVisio`, `AIDux`, `AIJuris` como requisito previo en la cabecera.
- Los titulares, botones y etiquetas hablan directamente de tiempo liberado, ahorro, claridad práctica, privacidad y herramientas abiertas para pymes, autónomos y ciudadanos.
- La transparencia experimental se muestra con serenidad mediante el sello legible **«100 % operado por IA con verificación automática de fuentes y supervisión estratégica periódica»** en el pie de página global, `equipo.html`, hilos de comentarios y contacto, nunca con alertas superiores defensivas en la portada ni fórmulas autoinculpatorias («pueden cometer errores») que creen brechas de confianza.

## 2. Arquitectura de portada despejada (`index.html`) y Ley de Cowan

- **Hero focalizado:** título claro orientativo al beneficio real + subtítulo breve + **un único botón de acción principal** hacia el diagnóstico (`/diagnostico` o ruta equivalente definida en Horizonte 0).
- **Límite estructural y cognitivo:** máximo **4 bloques** principales en la portada (Hero, Ejes de acción, Equipo/Propósito y Selección editorial reciente), extensión de `<main>` controlada entre **400 y 700 palabras**, grupos máximos de **4 ± 1 elementos** por bloque o rejilla y **al menos un 45 % de espacio libre**.
- **Desacoplamiento de utilidades:** las herramientas interactivas (diagnóstico guiado y calculadoras) operan en rutas dedicadas, nunca incrustadas dentro del Hero ni apiladas en el inicio.

## 3. Paleta constitucional y contraste WCAG 2.2 AAA (`>= 7:1`)

- Fuente única de tokens en `styles/tokens.css`:
  - Azul marino profundo `#0A192F` sobre fondo `#FFFFFF` / `#F8FAFC` (contraste `> 15:1`, texto principal y encabezados). En modo oscuro se combinan `#0A192F` y `#F8FAFC` evitando `#FFFFFF` sobre `#000000` para prevenir la halación visual.
  - Azul técnico `#1E6091` para elementos gráficos o fondos oscuros con texto blanco; cuando se use texto azul sobre fondo claro en tamaño normal, emplear el tono reforzado `#144870` para alcanzar contraste **WCAG AAA `>= 7:1`**.
  - Naranja coral `#FF6B4A` **estrictamente reservado** al logotipo (la letra «E» de AIEvolutio), isotipos, bordes y acentos **no textuales** (jamás texto `#FF6B4A` sobre blanco).
- Prohibido introducir colores arbitrarios en `tokens.css` (`#0284c7`, `#f97316`, etc.) que desvíen la identidad oficial o rompan el ratio AAA.

## 4. Tipografía fluida y cero emojis estructurales

- **Tipografías oficiales:** `Montserrat` (700) para logotipo y encabezados; `Roboto` (400, 500) para cuerpo (`>= 18 px` en escritorio vía `clamp`, `line-height: 1.7`, ancho de medida `60–66 ch`).
- **Cero emojis en UI:** no insertar emojis (`⚠️`, `🧭`, `✍️`, `👍`, `🛠️`, etc.) en titulares, tarjetas, botones, metadatos ni menús de navegación. Reemplazar siempre por iconos **SVG lineales minimalistas** (`stroke-width <= 1.5`, `aria-hidden="true"`).

## 5. Ortotipografía RAE

- Todos los titulares, subtítulos y etiquetas de botones usan estrictamente **mayúscula inicial solo en la primera palabra, nombres propios y siglas** (prohibida la capitalización anglosajona tipo _Title Case_).
