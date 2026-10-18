# Operación y housekeeping de GitHub

## Ramas y despliegue

- `main` es la fuente canónica de producción. Se recomienda como rama
  predeterminada; la configuración actual de GitHub aún deja `pre` como
  predeterminada.
- `pre` es la rama de integración y validación del equipo autónomo. Vertex
  trabaja desde aquí; los cambios ordinarios llegan mediante ramas breves y PR.
- `gh-pages` contiene el sitio estático generado. No es una rama de trabajo y
  nunca se elimina como parte de housekeeping.
- Las ramas `feat/*`, `fix/*`, `docs/*`, `chore/*` y las candidatas de Vertex
  se conservan mientras haya un PR o una ejecución activa.
- El borrado automático de ramas fusionadas en la configuración del repositorio
  está desactivado actualmente; requiere permisos de administrador. El workflow
  semanal puede eliminar una rama adicional solo cuando tenga al menos siete
  días, no tenga PR ni ejecución activa y su commit esté integrado en `pre`.
- Una rama no integrada de 30 días o más se informa para revisión humana; no se
  elimina automáticamente. Las ramas base `main`, `pre`, `gh-pages` y la
  predeterminada, así como cualquier rama protegida por GitHub, están siempre
  protegidas por la lógica de housekeeping.
- Los informes se publican como resumen de Actions y artefacto con retención de
  90 días. El workflow no cierra incidencias ni PRs.
- El flujo `pre` → `main` consulta el SHA actual y exige CI exitoso para ese
  mismo SHA antes de abrir y habilitar el PR de producción. Si la rama avanzó,
  CI falla o vence el límite, no sincroniza. Los candidatos también solicitan
  esa validación una vez promovidos y desplegados.
- El ruleset actual de `main` solo impide borrar la rama; no exige PR ni checks.
  Requiere una actualización administrativa para que GitHub imponga también
  esas condiciones, como defensa en profundidad.

## Pull requests e incidencias

- Los PR de funcionalidad entran en `pre`; la integración validada `pre` → `main`
  conserva el recorrido de producción existente.
- Revisar PR abiertos por checks, seguridad, compatibilidad y antigüedad.
  Checks verdes son evidencia para decidir, no autorización automática para
  cambios de dependencias o producción.
- Cada incidencia automática representa un fallo real de una ejecución, no
  necesariamente un problema que siga activo. Cerrar solo tras identificar la
  causa, confirmar el cambio correctivo y comprobar la ejecución o contenido
  posterior. Conservar la referencia histórica de Actions.

## Versiones semánticas

- Usar `vMAJOR.MINOR.PATCH` para hitos de producción en `main`, no para cada
  artículo ni cada despliegue.
- `release-please` propone la versión y el changelog a partir de Conventional
  Commits en `main`; la etiqueta de release debe señalar el commit validado que
  se integra en producción.
- `v0.1.0` establece el baseline el 2026-10-18 en
  `f31794de6cc85a0a323651118aa909d13ebacf00`; `pre` tenía el mismo árbol y el
  despliegue validado de Pages fue comprobado antes de crear la release.
- `release-please` parte del manifest `0.1.0`, examina Conventional Commits de
  `main` y propone la siguiente versión en PR. Su revisión se programa
  semanalmente además de ejecutarse ante pushes o manualmente.
- No inventar retrospectivamente tags para los artefactos de `gh-pages`.
  Consultar el informe de housekeeping para ver los SHA de `pre`, `main`,
  `gh-pages`, tags y releases.

## Evolución de Vertex

- Cada ciclo debe aportar evidencia, motivo, cambio acotado, prueba, SHA y
  estado de despliegue; una ejecución o una rama candidata no equivalen a una
  mejora publicada.
- Skills e instrucciones de agente son activos versionados. Vertex puede
  proponer una actualización con evidencia repetida, prueba de regresión,
  evaluación antes/después y plan de reversión; no puede autoaprobar cambios a
  su misión, herramientas, permisos, límites de publicación o validadores.
- No convertir una falla aislada ni una recomendación del modelo en una nueva
  regla sin comprobarla. Registrar las mejoras aceptadas en el log de evolución
  y probar que la skill modifica una decisión o salida observable.
