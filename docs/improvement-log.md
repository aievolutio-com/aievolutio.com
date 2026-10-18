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
- Verificación local: build, 19 pruebas, accesibilidad y Lighthouse correctos;
  pendiente CI de GitHub y confirmar que Pages sirve el alias.
