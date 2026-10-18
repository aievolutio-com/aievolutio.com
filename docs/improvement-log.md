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
