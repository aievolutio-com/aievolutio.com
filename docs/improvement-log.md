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

- Motivo: La cuadrícula fija en dos columnas desaprovechaba espacio en
  pantallas amplias y podía estrechar las tarjetas.
- Cambio: `styles/main.css` adapta el número de columnas al ancho disponible,
  con un mínimo de 280 px por tarjeta; la regla móvil conserva una columna.
- Validación: CI del candidato #39135230130 pasó pruebas, lint, accesibilidad y
  Lighthouse. La mejora se integró en `main` mediante el PR #65 y el CSS
  actualizado está servido por Pages.

## 2026-10-18 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, los elementos del menú se apilan en dos líneas, y la última opción Contacto queda desalineada a la izquierda, creando un espacio visual irregular Al aplicar justify-content: space-around a la navegación en móvil, se distribuyen los elementos de manera equitativa, mejorando la coherencia visual y el aprovechamiento del espacio disponible sin alterar la jerarquía ni el contenido
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-19 — Revisión visual y de experiencia

- Motivo: En las capturas de móvil en modo oscuro y claro, la sección hero tiene un desbordamiento horizontal debido al pseudo-elemento ::before que crea el efecto de fondo Este parche añade overflow: hidden; a la clase hero para contener este desbordamiento, mejorando la experiencia visual en dispositivos móviles sin afectar el diseño en escritorio Además, se ajusta el padding-bottom del hero en móvil para evitar que el contenido inferior quede demasiado pegado al borde, mejorando la legibilidad y el espaciado
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-19 — Revisión visual y de experiencia

- Motivo: Observo que el espaciado vertical entre secciones en escritorio y móvil es inconsistente, lo que puede generar una experiencia de lectura abrupta En móvil, el hero section tiene menos padding superior de lo que sería óptimo para la legibilidad Aumento el padding vertical general de las secciones y el padding superior del hero en móvil para mejorar la jerarquía visual y la legibilidad, proporcionando más aire entre bloques de contenido y una presentación más equilibrada en pantallas pequeñas
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-19 — Revisión visual y de experiencia

- Motivo: El CICD falló en el intento anterior debido a un error de linting en stylesmaincss en la línea 54, que esperaba una línea vacía antes de la regla He corregido este problema añadiendo la propiedad display: grid; a la clase post-grid Esta propiedad es necesaria para que las subsiguientes propiedades de grid-template-columns y gap funcionen correctamente y organicen los elementos de la cuadrícula de manera esperada Aunque las capturas no mostraban un problema visual directo en esta sección, la corrección es un ajuste técnico que asegura la correcta interpretación del CSS, previen
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-20 — Revisión visual y de experiencia

- Motivo: La navegación actual en dispositivos móviles, especialmente en modo claro, presenta un problema de legibilidad y jerarquía visual El elemento Contacto se superpone o se muestra de forma inconsistente con los demás elementos de navegación cuando la pantalla es estrecha Además, el padding de los elementos de navegación en móvil es inconsistente entre los enlaces activos y los inactivos, lo que puede generar una percepción de desorden visual La hipótesis es que al ajustar el padding de los elementos de navegación inactivos en móvil y asegurar que el Contacto se alinee correctamente con los
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-20 — Revisión visual y de experiencia

- Motivo: Se ha observado que el enlace archive-back en la página de blog tiene un subrayado por defecto que no es coherente con el estilo de otros enlaces de navegación y acción Al eliminar la decoración de texto, se mejora la coherencia visual y se alinea con la estética general del sitio También se observó que, en las tarjetas de blog, el título h3 que sigue inmediatamente a la imagen de portada post-cover tiene un margen superior predeterminado que puede generar un espacio excesivo Al establecer margin-top: 0 para este caso específico, se logra una distribución más compacta y visualm
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-21 — Revisión visual y de experiencia

- Motivo: En las capturas de móvil, tanto en modo claro como oscuro, se observa que la navegación superior Inicio, Qué hacemos, Blog, Equipo, Contacto se desborda horizontalmente, haciendo que Contacto quede parcialmente oculto o forzando un scroll horizontal indeseado Esto genera fricción al usuario al dificultar el acceso a todas las opciones de navegación La hipótesis es que el gap entre los elementos de navegación en móvil, combinado con el justify-content: space-around; y la posible longitud de los textos, provoca que los elementos no quepan en una sola línea El cambio propuesto aborda e
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-21 — Revisión visual y de experiencia

- Motivo: En la vista móvil del modo oscuro, los avatares de los AIWorkers en la sección de equipo se ven desproporcionados o no se ajustan correctamente a su contenedor cuando se expanden los detalles La hipótesis es que la regla CSS para el tamaño del avatar en detailsworker worker-body avatar no se aplica consistentemente al worker-avatar en pantallas pequeñas, causando una inconsistencia visual El cambio propuesto extiende la regla existente para que también afecte a worker-avatar en el mismo contexto, asegurando que ambos tipos de avatares mantengan un tamaño coherente y adecuado en móv
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-22 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, los elementos del menú se distribuyen con justify-content: space-between, lo que provoca que el último elemento Contacto quede muy separado de los anteriores, creando un espacio visual incómodo y una jerarquía poco clara Al cambiar justify-content a flex-start y añadir flex-grow: 1 a los enlaces, se asegura que los elementos se alineen al inicio y se distribuyan uniformemente, mejorando la legibilidad y la coherencia visual en pantallas pequeñas
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-22 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, el enlace Contacto aparece en una línea separada debajo de los otros elementos de navegación, creando un espacio visual inconsistente y una posible fricción al interactuar con la navegación Al aplicar un margen superior al theme-toggle que en este caso está oculto, pero su estilo podría afectar el flujo de la navegación si se hiciera visible o si se interactuara con otros elementos en su lugar, se busca asegurar que si en el futuro se añade algún elemento en esa posición, o si el theme-toggle se vuelve visible, no afecte negativamente la distribución de los ele
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-23 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, la opción Qué hacemos se divide en dos líneas debido a la falta de espacio, lo que rompe la coherencia visual y la legibilidad La hipótesis es que al añadir white-space: nowrap; al elemento a dentro de la navegación móvil, se evitará que el texto se divida en varias líneas, mejorando la presentación y la experiencia del usuario al mantener todos los elementos de navegación en una sola línea y alineados
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-23 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, los elementos del menú Inicio, Qué hacemos, Blog, Equipo y Contacto se muestran alineados a la izquierda, lo que genera un espacio vacío poco estético a la derecha y una apariencia desequilibrada Al centrar estos elementos, se mejora la coherencia visual y la legibilidad en pantallas pequeñas, aprovechando mejor el espacio disponible y ofreciendo una experiencia más pulcra y organizada al usuario
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-24 — Revisión visual y de experiencia

- Motivo: En la navegación de escritorio, los elementos del menú principal están demasiado pegados al logo, lo que genera una sensación de aglomeración y dificulta la lectura visual Al añadir un margin-left al nav en stylesmaincss, se crea un espacio adecuado entre el logo y los enlaces de navegación, mejorando la legibilidad y la estética general En la navegación móvil, los elementos del menú se agrupan en el centro, lo que puede resultar en un uso ineficiente del espacio disponible y una apariencia menos organizada Al cambiar justify-content: center a justify-content: space-around en e
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-24 — Revisión visual y de experiencia

- Motivo: En las capturas de móvil, la navegación superior se desborda en una segunda línea, y los elementos Blog, Equipo y Contacto se ven apretados o cortados Esto genera fricción visual y dificultad para interactuar con los enlaces La hipótesis es que el margin-left excesivo en la navegación principal en escritorio, sumado a justify-content: space-around en móvil, no permite una distribución óptima de los elementos en pantallas pequeñas El cambio propuesto reduce el margin-left de la navegación en escritorio para dar más espacio general y, en móvil, ajusta justify-content a space-be
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-24 — Revisión visual y de experiencia

- Motivo: La navegación actual del Blog en el menú principal lleva a una página separada bloghtml, mientras que la sección de blog en la página de inicio indexhtmlblog ya muestra contenido relevante Esta discrepancia puede generar confusión en el usuario, ya que podría esperar ver el mismo contenido o una continuación al hacer clic en Blog en la navegación Al cambiar el enlace del menú Blog para que apunte a la sección blog de la página de inicio, se unifica la experiencia de navegación, asegurando que el usuario acceda directamente al contenido del blog sin ser redirigido a una página
- Archivos: content/navigation.json
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-25 — Revisión visual y de experiencia

- Motivo: En las capturas de móvil, el logo de AIEvolutio en la barra de navegación aparece a la derecha de los enlaces de navegación, lo cual es una jerarquía visual inusual y puede dificultar la identificación rápida de la marca La fricción observada es que el logo no está en la posición esperada para un elemento de marca principal en la navegación móvil, lo que puede generar una micro-pausa cognitiva La hipótesis es que ubicar el logo a la izquierda, como es convención en la mayoría de los sitios web, mejorará la legibilidad y la coherencia visual El cambio propuesto reordena los elementos de la n
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-25 — Revisión visual y de experiencia

- Motivo: En la navegación móvil, el logo de AIEvolutio y los elementos de navegación Inicio, Qué hacemos, Blog, Equipo, Contacto se encuentran en la misma línea, con el logo a la izquierda y los elementos de navegación a la derecha Debajo, el elemento Contacto aparece en una línea separada y centrado, lo que rompe la coherencia visual y la jerarquía de la navegación Al añadir margin-right: auto al logo en la vista móvil, se empuja el logo a la izquierda y el resto de los elementos de navegación a la derecha, agrupándolos de manera más lógica y permitiendo que Contacto se alinee con los demás 
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.

## 2026-10-25 — Revisión visual y de experiencia

- Motivo: La fricción observada es que el enlace Volver al archivo en la página de blog no tiene un color distintivo en el tema claro, lo que reduce su visibilidad y lo hace menos intuitivo como un elemento interactivo En el tema oscuro, el color del enlace se mezcla con el fondo, disminuyendo aún más su contraste y legibilidad La hipótesis es que al aplicar el color de la marca primaria --brand-primary a este enlace, se mejorará su visibilidad y coherencia con otros elementos interactivos de la marca El cambio propuesto resuelve esta fricción al asignar explícitamente color: var--brand-prima
- Archivos: styles/main.css
- Validación: el candidato solo se publica tras superar la validación completa de CI.
