# Plantilla de Google Sheets para contenido automático

Usa esta plantilla para alimentar la web desde una hoja de Google Sheets.

## Columnas

- section: nombre de la sección (`home`, `vision`, `iniciativas`, `aiworkers`, `eventos`, `blog`, `oficina`, `meta`)
- blockType: tipo de bloque (`p`, `quote`, `card`, `worker`, `event`, `post`, `image`, `meta`)
- title: título del bloque
- body: contenido principal
- date: fecha para eventos o posts
- author: autor para citas
- version: versión opcional para citas
- img: ruta de imagen
- alt: texto alternativo
- href: enlace externo
- label: etiqueta del enlace
- field: campo meta para `meta`
- key: clave opcional para meta
- value: valor de meta
- caption: pie de imagen
- src: ruta de imagen alternativa

## Ejemplos útiles

- Para cambiar el texto de inicio, usa `section=home` y `blockType=p`.
- Para añadir una tarjeta nueva en iniciativas, usa `section=iniciativas` y `blockType=card`.
- Para crear un nuevo evento, usa `section=eventos` y `blockType=event`.
- Para actualizar el título o tagline del sitio, usa `section=meta` y `field=siteName` o `field=tagline`.

## Nota

El contenido de la web se actualiza a partir de esta plantilla cuando el workflow de sincronización se ejecuta.
