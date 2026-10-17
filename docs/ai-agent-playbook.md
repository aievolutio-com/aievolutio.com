# Manual operativo de agentes de AIEvolutio

Esta es la fuente de criterio para cualquier agente que investigue, escriba,
rediseñe, programe o publique en AIEvolutio. Leerla antes de proponer cambios
editoriales o de producción. La prioridad no es producir más texto: es ayudar a
personas y empresas a evolucionar con IA útil, responsable y comprensible.

## 1. Propósito y promesa

AIEvolutio canaliza el cambio que trae la inteligencia artificial como una
evolución elegida, no como una apisonadora inevitable. Ayudamos a las empresas a
adaptarse, seguir siendo valiosas para sus clientes y liberar tiempo humano de
tareas repetitivas. La tecnología debe ampliar la capacidad de las personas, no
tratar a las personas como un coste que hay que eliminar.

Mensaje central:

> Evolucionar con IA para que las empresas sigan siendo valiosas para la sociedad y las personas
> ganen tiempo, capacidad y confianza.

No vender miedo a la extinción, milagros, sustitución indiscriminada de puestos,
ni una transformación instantánea. Hablar de cambio real con criterio,
aprendizaje, seguridad, supervisión humana y pasos alcanzables. La oportunidad
es grande; también lo son las responsabilidades.

## 2. Prueba de valor para todas las partes

Antes de recomendar una automatización, una afirmación comercial o una mejora
del sitio, comprobar que no traslada el coste del beneficio a otra parte:

| Parte interesada            | Valor que debemos buscar                                                      | Pregunta de control                                                                 |
| --------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Clientes                    | Mejor servicio, menos fricción, resultados y control de sus datos             | ¿Resuelve un problema real y explica sus límites?                                   |
| Empleados                   | Menos tareas mecánicas, más autonomía, aprendizaje y trabajo significativo    | ¿Las personas participan en el cambio y conservan capacidad de decisión?            |
| Accionistas                 | Una empresa resiliente, útil y económicamente sostenible a largo plazo        | ¿El valor se puede explicar sin prometer rendimientos no demostrados?               |
| Proveedores y colaboradores | Relaciones justas, objetivos claros, interoperabilidad y respeto a su trabajo | ¿Evitamos dependencias innecesarias y respetamos licencias y propiedad intelectual? |
| Sociedad                    | Tecnología comprensible, inclusiva, segura y responsable                      | ¿Quién podría quedar excluido o perjudicado, y cómo lo mitigamos?                   |

No afirmar que se satisfacen los intereses de todos si hay una compensación
relevante. Nombrar el conflicto y proponer cómo medirlo o reducirlo.

## 3. Voz, evidencia y coherencia editorial

- Escribir en español natural, cercano, sereno y concreto. Explicar siglas y
  conceptos técnicos en su primera aparición.
- Ser optimista sin triunfalismo. Evitar jerga de consultoría, grandilocuencia,
  alarmismo, falsa urgencia y frases intercambiables con cualquier proveedor.
- No inventar clientes, testimonios, cifras, estudios, fuentes, capacidades,
  resultados, certificaciones ni experiencia propia.
- Separar hechos comprobables, interpretación y propuesta. Toda afirmación
  externa relevante necesita una fuente fiable y un enlace verificable; si no
  se puede verificar, retirarla o presentarla claramente como hipótesis.
- Reconocer límites, privacidad, seguridad, sesgos, errores, supervisión,
  adopción y coste total cuando sean pertinentes; no presentar la IA como
  autónoma o infalible.
- Ofrecer al lector una acción útil que pueda probar, sus condiciones y una
  forma de observar si funcionó. No prometer un resultado garantizado.
- No usar datos personales reales, imágenes de personas sin derechos y
  consentimiento, ni falsa prueba social. Respetar licencias y atribución.
- Mantener el idioma, la promesa, la terminología y la navegación existentes.
  Antes de cambiar una página o sección, comprobar su papel dentro del recorrido
  completo del sitio.

### Pilares y rotación

Rotar los ángulos para que el calendario no repita una idea con otro título:

1. Valor para clientes: calidad, atención, accesibilidad y confianza.
2. Valor para empleados: trabajo cotidiano, habilidades, participación y cambio.
3. Aplicación práctica: procesos, casos de uso hipotéticos claramente
   etiquetados, pilotos y criterios de decisión.
4. Adopción responsable: privacidad, seguridad, gobernanza, supervisión y
   límites.
5. Resiliencia empresarial: estrategia, operaciones, proveedores,
   interoperabilidad y sostenibilidad económica.

Revisar títulos y artículos recientes antes de elegir tema. Buscar una
necesidad concreta del lector, no una palabra clave aislada. Un artículo no
debe existir solo para cumplir el calendario.

## 4. El sitio como recorrido de difusión y marketing

Cada página y publicación debe cumplir un trabajo reconocible:

1. **Descubrir:** hacer comprensible qué problema ayuda a resolver AIEvolutio.
2. **Entender:** explicar qué hace la IA, qué sigue bajo responsabilidad humana
   y cómo se empieza de forma segura.
3. **Confiar:** enseñar criterios, límites, prácticas responsables y ejemplos
   verificables; nunca inventar casos de éxito.
4. **Actuar:** ofrecer un siguiente paso claro, proporcionado y sin presión.

Al proponer una mejora, identificar primero la página y etapa del recorrido, el
usuario afectado, la fricción concreta, el cambio mínimo y cómo se validará.
Priorizar claridad del servicio, legibilidad móvil, navegación, descubribilidad
de artículos, enlaces internos, accesibilidad y llamadas a la acción honestas.
No añadir analítica, píxeles, formularios ni servicios externos por iniciativa
propia: respetar `docs/quality.md` y las reglas de privacidad.

No atribuir conversiones o mejoras de negocio a un cambio sin datos. Sin
analítica consentida, usar indicadores técnicos y observables: CI, accesibilidad,
rendimiento, enlaces rotos, cobertura del contenido, claridad de la navegación
y disponibilidad de la página.

## 5. Cadencia diaria del equipo autónomo de Vertex AI

La única fuente automática de publicaciones es el workflow
`.github/workflows/autonomous-ai-team.yml`, que ejecuta
`scripts/autonomous-ai-team.mjs` con Vertex AI. No se usa Google Sheets ni una
sincronización CSV para publicar contenido.

El workflow tiene disparadores a las 06:00 y 07:00 UTC. Son dos oportunidades
para completar el mismo ciclo diario, no dos misiones distintas: el control por
fecha de `Europe/Madrid` hace que solo se genere un artículo. Una vez publicada
la pieza del día, una ejecución repetida termina sin volver a publicar.

En un ciclo que sí genera contenido, Vertex realiza las dos misiones:

1. El equipo crea y valida como máximo un artículo nuevo.
2. AIArchitectus propone como máximo una mejora pequeña y acotada del sitio.

Ambas se validan juntas. Si no hay artículo pendiente para la fecha local, el
ciclo termina antes de pedir cambios técnicos; no se ejecuta una misión de
mejora independiente.

En cada ciclo:

1. Leer este manual, la guía de publicación y el contenido actual; comprobar
   primero si ya existe una publicación para la fecha de `Europe/Madrid`.
2. Revisar páginas, navegación y publicaciones recientes antes de decidir tema
   o cambio. No reescribir contenido publicado ni borrar perfiles existentes.
3. Pedir a los perfiles perspectivas distintas; sintetizar una sola prioridad
   centrada en el usuario y compatible con el propósito.
4. Crear una publicación útil, original, verificable y coherente. Preparar una
   imagen solo cuando aporte significado y sea posible validar derechos,
   seguridad, alternativa textual y carga. La falta de imagen no debe bloquear
   un artículo válido.
5. Proponer como máximo un cambio web pequeño y acotado. Si el cambio es
   especulativo, incompatible o difícil de validar, publicar el contenido
   válido sin ese cambio y registrar la razón.
6. Validar contenido, archivos, enlaces, HTML, accesibilidad, rendimiento y
   navegación; solo desplegar el commit exacto que supera CI.
7. Confirmar el resultado real en Pages/producción y en el artículo servido;
   no inferir que hubo publicación solo porque un job terminó.
8. Dejar un resumen breve: qué valor aporta, qué cambió, pruebas, URL/SHA y
   cualquier limitación, omisión o incidencia.

## 6. Publicación autónoma: objetivo de fiabilidad

No es honesto prometer que una publicación nunca fallará: Actions, el proveedor
del modelo, cuotas, red, validadores y Pages pueden estar indisponibles. El
objetivo operativo es **cero fallos silenciosos y cero candidatos no validados
en producción**; cada fallo debe detectarse, clasificarse, notificarse y poder
recuperarse sin duplicar contenido.

### Controles que ya existen

- Dos disparadores programados diarios y ejecución serializada.
- Idempotencia por fecha local: como máximo un artículo por día.
- La navegación existente se valida antes de llamar al modelo; el destino real
  `contacto.html` está permitido y cubierto por una prueba de regresión.
- Límite global de llamadas de texto, reintentos acotados ante JSON incompleto
  y hasta tres intentos por ejecución, sujetos a ese presupuesto global. Cada
  intento cubre planificación, generación y validación del artículo, propuesta
  y aplicación del parche y CI. Ante un fallo, Vertex recibe el error como
  evidencia y puede corregirlo en el siguiente intento; si CI falla, también
  recibe sus logs fallidos. Se conserva el trabajo editorial válido, se
  restaura el árbol de trabajo y se crea una rama candidata aislada nueva.
- Si los tres intentos fallan, el flujo termina como fallido y notifica; no
  vuelve a intentarlo en esa ejecución ni publica un candidato que no haya
  superado CI.
- La imagen es opcional; el contenido y CI no dependen de Imagen.
- La imagen puede omitirse si Imagen falla. En cambio, un error al generar o
  aplicar el artículo, validar el contenido o ejecutar CI invalida el intento:
  no se omiten esas validaciones para publicar.
- Rama candidata aislada, CI antes del despliegue, despliegue de Pages y
  promoción no forzada a `pre`.
- Aviso automático en una incidencia de GitHub si el ciclo o la publicación
  fallan.
- La recuperación está limitada a errores que Vertex pueda diagnosticar con
  el código y los logs disponibles. No modifica el flujo que le da identidad,
  credenciales o permisos ni puede resolver indisponibilidad de GitHub, Vertex,
  IAM, secretos o configuración del repositorio. En el workflow de CI solo
  puede ajustar comandos de validación de una lista permitida; no puede
  reconfigurar jobs, acciones, permisos, disparadores ni despliegues.

### Runbook ante fallo

1. Consultar los logs de `Autonomous AI Team` y el CI asociado al SHA exacto.
2. Clasificar la fase: autenticación, planificación, generación, validación,
   CI, Pages o promoción a `pre`. Un fallo de promoción puede ocurrir después
   de que Pages ya se haya actualizado: comprobar producción antes de afirmar
   que no hubo publicación o repetir el ciclo.
3. Comprobar `content/content.es.json` servido en producción y localizar el
   artículo por fecha local. Si ya está, no generar otro; reparar solo el
   estado de la rama o del aviso.
4. Si no está y falló una fase recuperable, revisar los tres intentos y el error
   que Vertex recibió. Si la ejecución agotó los intentos, corregir la causa
   externa o el límite de recuperación antes de relanzar el workflow de `pre`;
   la idempotencia debe hacer que repetir una ejecución sea segura.
5. Si hay un error de credenciales, permisos, cuota agotada o proveedor/
   plataforma indisponible, no publicar texto parcial, inventado o no validado.
   El flujo notifica y termina; resolver la causa externa antes de relanzar.
6. Cerrar la incidencia únicamente tras confirmar Pages, contenido y estado de
   `pre`; documentar la resolución y cualquier publicación parcial.

### Brechas conocidas / mejoras prioritarias

1. **Reserva editorial verificada:** hoy no hay una cola de piezas aprobadas
   para recuperar una caída prolongada de Vertex. Diseñar una reserva evergreen
   con fecha de revisión, fuentes, autor, derechos, tema y caducidad; nunca
   reutilizarla automáticamente sin validar esos campos.
2. **Observabilidad del despliegue:** distinguir explícitamente publicación en
   Pages, promoción a `pre`, CI y notificación. Los avisos deben decir “estado
   de producción por confirmar” cuando no se haya verificado; no asegurar que
   producción está intacta si Pages ya pudo desplegar.
3. **Recuperación externa:** los tres intentos cubren los fallos detectados
   durante planificación, generación, validación, parche y CI/CD. No pueden
   autocorregirse fallos de autenticación, permisos, cuotas, configuración del
   repositorio, indisponibilidad de GitHub/Vertex ni cambios al propio flujo de
   autenticación. Confirmar que los avisos identifiquen claramente estos casos
   y no sugieran que se repararon automáticamente.
4. **Imagen:** Imagen devolvió HTTP 404 en ejecuciones recientes. La generación
   queda desactivada hasta verificar modelo, región y permisos; no debe consumir
   llamadas de Vertex ni bloquear la publicación mientras siga desactivada.
5. **Pruebas de contrato:** simular respuestas truncadas, 429, HTML en texto,
   imagen 404, parche corrupto, CI fallido, deploy exitoso con promoción
   fallida y reejecución del mismo día. Asegurar la comprobación de que solo el
   commit validado se publica. Mantener las rutas de navegación reales en los
   fixtures para detectar desajustes con el sitio antes de consumir llamadas.
6. **Calidad editorial verificable:** añadir validaciones automáticas para
   evidencia/citas, enlaces, repetición temática, llamadas a la acción y
   coherencia de autor; mantener revisión humana opcional como observación, no
   como requisito de publicación.

No activar una reserva, ampliar presupuesto, introducir telemetría o cambiar
los permisos del pipeline sin documentar coste, privacidad, límites y pruebas.

## 7. Límites técnicos y publicación segura

- Seguir `AGENTS.md`, `.github/copilot-instructions.md` y `GEMINI.md` para las
  instrucciones de repositorio; consultar `docs/quality.md` para los controles
  de calidad.
- Mantener contenido visible en `content/*.json`; no introducir dependencias,
  frameworks, scripts inline, rastreadores ni llamadas remotas.
- Mantener los parches IA restringidos a rutas autorizadas. No permitir que el
  modelo edite workflows, scripts de seguridad/publicación, secretos, permisos,
  pruebas o este manual.
- No desplegar por saltarse CI. No forzar actualizaciones de `pre`; si la rama
  avanzó desde la base, rebasar/recrear y volver a validar.
- Si producción y rama discrepan, reconciliar con el SHA probado; no borrar ni
  sobrescribir cambios ajenos.
- No cerrar incidencias ni afirmar “publicado” sin prueba observable.
