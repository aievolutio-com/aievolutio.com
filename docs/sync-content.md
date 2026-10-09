# Publicación autónoma y sincronización de contenido

La web tiene un ciclo autónomo diario que propone contenido y cambios pequeños,
los valida y solo despliega la versión aprobada por CI. La sincronización desde
Google Sheets se conserva como operación manual; no debe competir con el ciclo
autónomo ni reemplazar el blog.

El criterio editorial, la propuesta de valor, las partes interesadas, el runbook
de recuperación y las mejoras de fiabilidad pendientes tienen una única guía:
[`ai-agent-playbook.md`](ai-agent-playbook.md). Los agentes deben consultarla
antes de escribir contenido o cambiar la experiencia.

## Ciclo diario del equipo de IA

El workflow `Autonomous AI Team` se programa a las 06:00 y 07:00 UTC, alrededor
de las 08:00 en `Europe/Madrid` en invierno y verano. GitHub Actions puede
retrasar una tarea programada; por eso se aceptan ambas ejecuciones aunque
arranquen tarde. El contenido comprueba la fecha local del artículo existente
antes de generar: así un reintento puede recuperar un ciclo retrasado y nunca
publica más de un artículo diario. También puede ejecutarse manualmente desde
Actions o con:

```powershell
gh workflow run autonomous-ai-team.yml --ref pre
```

El equipo reúne CEO (AIVisio), CIO (AIDux), UX (AIUsus), CX (AIExperientia),
Marketing (AIMercatus), Arquitectura (AIArchitectus), Gestión del Cambio
(AIMutatio) y Editorial (AILitterae). Los nombres siguen la convención `AI` +
un término de raíz latina que representa su función; el pipeline valida que
los perfiles canónicos sigan presentes. Genera como máximo un artículo al día, y
solicita como máximo una imagen editorial; si Imagen no está disponible, el
artículo puede publicarse sin imagen. El límite técnico es de 15 llamadas de
texto, incluidos hasta dos reintentos globales ante respuestas JSON incompletas,
y dos intentos de autocorrección de cambios. Estos límites reducen el consumo,
pero no garantizan un importe contable diario exacto en Google Cloud.

Cada ciclo trabaja en una rama candidata. CI valida HTML, CSS, JavaScript,
accesibilidad y rendimiento. Solo tras pasar CI se despliega el candidato a
Pages y se promueve el mismo commit a `pre` mediante una actualización no
forzada. El despliegue y la promoción son fases distintas: si una ejecución
falla, comprobar ambas y el contenido servido antes de asegurar si producción
cambió o de volver a ejecutarla.

Si el diff de código no se puede aplicar o AIArchitectus no devuelve un diff
válido tras sus reintentos, se descarta el cambio técnico y se valida el artículo
diario sin él. Los controles de contenido y CI siguen siendo obligatorios. Si
falla la generación o validación del artículo, no se publica candidato y el
workflow crea una incidencia con enlace a logs. Las reejecuciones son seguras
por la comprobación de fecha local; no se requiere aprobación de PR.

No puede garantizarse que proveedores externos, Actions o Pages estén siempre
disponibles. El objetivo es evitar fallos silenciosos y publicaciones no
validadas, recuperar los ciclos fallidos y no duplicar artículos. Para resolver
una incidencia, seguir el runbook y las brechas conocidas en
[`ai-agent-playbook.md`](ai-agent-playbook.md).

Además, cada push directo o integrado en `pre` pasa las mismas comprobaciones y
se despliega automáticamente a producción cuando CI termina correctamente.
Los fallos de validación o despliegue crean una incidencia con enlace a la
ejecución; no se publica una versión que no haya pasado las comprobaciones.

Se requieren las variables `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`
y `GCP_SERVICE_ACCOUNT` en el repositorio, así como Workload Identity
Federation y permisos en Vertex AI para Gemini y, opcionalmente, Imagen.

## Evolución de la experiencia del sitio

El sitio se organiza en páginas estáticas accesibles directamente: `index.html`
para la presentación, `equipo.html` para los perfiles y `blog.html` para el
archivo completo. La portada muestra solo tres publicaciones recientes y enlaza
cada una con su artículo en el archivo, para que las entradas anteriores sigan
siendo fáciles de encontrar. Las imágenes de perfil existentes se muestran
cuando están disponibles; los perfiles sin retrato usan una identidad gráfica
provisional en lugar de simular una fotografía.

La navegación principal prioriza Inicio, Qué hacemos, Ideas y Equipo. Los
perfiles del equipo se muestran plegados para facilitar la lectura y los eventos
pasados no se anuncian como próximos en la portada.

## Sincronización manual desde Google Sheets

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

La sincronización ya no tiene una programación automática. Se puede lanzar
manualmente desde Actions o con:

```powershell
gh workflow run sync-content.yml --ref pre
```

El workflow publica los cambios directamente en `pre` y ejecuta CI. Para una
ejecución local, `npm run sync:content` usa el ejemplo
`content/sync.example.csv`, salvo que se configure `SHEET_CSV_URL`.
