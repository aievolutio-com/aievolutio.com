# Registro de mejoras de la web

Se anotan los cambios de experiencia y el motivo observado. El estado de CI y
Pages se indica explícitamente: una validación local o un candidato no equivalen
a un despliegue. Una auditoría que no encuentre una corrección demostrable no se
convierte en un cambio cosmético ni en una entrada de mejora.

## 2026-10-18 — Compatibilidad del enlace del artículo

- Motivo: la URL truncada del artículo de ese día devolvía 404 aunque existía
  una página canónica completa.
- Cambio: alias estático desde `...como-un-buen-resum.html` a la página
  canónica; prueba de build que comprueba el alias y su destino.
- Verificación: build, 19 pruebas, accesibilidad y Lighthouse correctos; CI y
  `deploy-validated` de GitHub pasaron. La rama `gh-pages` contiene el alias.
  No se pudo comprobar el host HTTP directamente desde este entorno.

## 2026-10-18 — Bloqueo de candidatos obsoletos

- Motivo: una candidata antigua se desplegó en Pages y después falló al
  promoverse a `pre` porque la rama había avanzado (`Update is not a fast
  forward`). Eso dejó temporalmente publicado un sitio obsoleto.
- Cambio: promover primero mediante fast-forward no forzado y desplegar solo
  después; una prueba protege el orden para que una candidata obsoleta no pueda
  sobrescribir Pages.
- Verificación local: las 14 pruebas de automatización y ESLint pasan.

## 2026-10-18 — Compatibilidad con enlaces de artículos en caché

- Motivo: la página publicada con enlaces antiguos aún servida desde caché
  enlazaba a slugs truncados. La auditoría del blog y el archivo confirmó que
  varios de esos destinos devolvían 404 aunque sus artículos canónicos existían.
- Cambio: generar alias estáticos para las diez URLs truncadas observadas que
  fallaban, además del alias anterior del 13 de octubre. Cada alias redirige a
  su artículo canónico y el build falla si falta el destino.
- Verificación: se probará localmente la generación y destino de todos los
  alias; pendiente CI y Pages para confirmar su publicación.

## 2026-10-18 — Dirección editorial y diferenciación de artículos

- Motivo: las aperturas de los artículos del 12, 13 y 17 repetían la misma
  premisa de sobrecarga informativa y valor de resumir, pese a cambiar título y
  redacción. El redactor automático recibía títulos, pero no una comparación
  editorial suficiente del catálogo.
- Cambio: diferenciados esos artículos en fidelidad de síntesis para decisiones,
  diseño de extractos para elegir contenido y traspaso de acuerdos internos.
  AIVisio queda definido y conectado como responsable editorial; AILitterae
  redacta con un dossier global del catálogo y AIVisio debe aprobar el borrador
  por su diferencia de necesidad, tesis y acción.
- Verificación local: las 23 pruebas, ESLint, `git diff --check` y el build
  estático pasan. No se ejecutó Vertex real; CI, Pages y el contenido servido
  siguen pendientes, así que esto no confirma una publicación.

## 2026-10-18 — Revisión visual y de experiencia

- Motivo: La visualización de los artículos del blog en dispositivos móviles y en escritorio con anchos de pantalla intermedios puede resultar en un diseño de una sola columna que no aprovecha el espacio disponible o en un desbordamiento La fricción observada es una rigidez en la disposición de los elementos del blog Al cambiar grid-template-columns: repeat2, minmax0, 1fr; a grid-template-columns: repeatauto-fit, minmax280px, 1fr;, se permite que la cuadrícula se adapte automáticamente, mostrando más columnas cuando hay espacio suficiente y asegurando que los elementos no se desborden en p
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.
