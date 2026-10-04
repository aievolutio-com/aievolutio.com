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

## 3. Configurar la sincronización

El workflow `Sync content from Sheets` usa la URL CSV pública configurada en
`.github/workflows/sync-content.yml`. Si cambia la hoja, actualiza
`SHEET_CSV_URL` en ese workflow y publica el cambio en `pre`.

## 4. Ejecutar la sincronización

La sincronización se ejecuta los lunes a las 08:00 UTC. También se puede lanzar
manualmente desde Actions o con:

```powershell
gh workflow run sync-content.yml --ref pre
```

El workflow publica los cambios directamente en `pre`, ejecuta CI y despliega
a producción solo si pasan las validaciones. No necesita PR ni aprobación
manual. Para una ejecución local, `npm run sync:content` usa el ejemplo
`content/sync.example.csv`, salvo que se configure `SHEET_CSV_URL`.

## 5. Generar y publicar un artículo con IA

El workflow `Generate weekly blog post` genera un artículo con Gemini cada lunes
a las 08:15 UTC. Necesita las variables de repositorio
`GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` y `GCP_PROJECT_ID`,
además de la configuración de Workload Identity Federation en Google Cloud.

Para ejecutarlo ahora, sin esperar al horario semanal:

```powershell
gh workflow run generate-weekly-blog.yml --ref pre
```

El workflow añade el artículo a `content/content.es.json`, lo publica en `pre`,
lanza CI y despliega automáticamente a producción si todas las validaciones
pasan. Consulta Actions → `Generate weekly blog post` y luego el run de CI para
ver el resultado y cualquier error de autenticación o publicación.
