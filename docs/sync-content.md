# Sincronización de contenido desde Google Sheets

Este proyecto ya incluye un flujo simple para actualizar el contenido de la web desde una fuente CSV pública.

## 1. Preparar la hoja en Google Sheets

Crea una hoja con estas columnas:

- section
- blockType
- title
- body
- date
- author
- version
- img
- alt
- href
- label
- field
- key
- value
- caption
- src

### Ejemplos

- Para cambiar el meta del sitio, usa `section=meta` y `field=siteName` o `field=tagline`.
- Para actualizar una sección, usa `section=home`, `section=vision`, `section=blog`, etc.
- Para añadir contenido a una sección, usa `blockType=card`, `post`, `event`, `quote`, `p`, `link` o `image`.

## 2. Publicar la hoja como CSV

En Google Sheets:

1. Abre la hoja.
2. Ve a Archivo → Publicar en la web.
3. Elige "Valores separados por comas (.csv)".
4. Copia la URL pública generada.

Importante: el enlace que has compartido es un enlace de edición, no una URL de exportación. La URL que debe usarse en GitHub tiene este formato:

```text
https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=0
```

Por ejemplo, si tu ID es `1tSkjYwLalmExHT0V19wP2CCQ8zoQ0K-gH2slPZQvZ8w`, la URL sería:

```text
https://docs.google.com/spreadsheets/d/1tSkjYwLalmExHT0V19wP2CCQ8zoQ0K-gH2slPZQvZ8w/export?format=csv&gid=0
```

Si esa URL devuelve un error de acceso, la hoja aún no está publicada o no está accesible públicamente.

## 3. Conectar GitHub Actions

En GitHub:

1. Abre tu repositorio.
2. Ve a Settings → Secrets and variables → Actions.
3. Crea una variable llamada `SHEET_CSV_URL` con la URL CSV publicada.

## 4. Ejecutar la sincronización

La sincronización está configurada para ejecutarse automáticamente una vez a la semana. También puedes lanzarla manualmente desde Actions o con:

```powershell
npm run sync:content
```

Si no existe una variable `SHEET_CSV_URL`, el script usará el ejemplo local en `content/sync.example.csv`.
