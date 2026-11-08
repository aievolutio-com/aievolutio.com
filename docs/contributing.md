# Guía de contribución

Este documento describe el flujo de trabajo para colaborar en el desarrollo y mantenimiento técnico de AIEvolutio.

## 1. Flujo de trabajo en ramas y cambios

El repositorio sigue un modelo **Trunk-Based Development** centrado en la rama `main`:

1. Crea una rama descriptiva para tu tarea: `git checkout -b feature/nombre-de-la-mejora` o `fix/descripcion-del-arreglo`.
2. Realiza cambios atómicos y utiliza mensajes de confirmación según la convención [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` Nuevas funcionalidades o herramientas interactivas.
   - `fix:` Corrección de errores o inconsistencias.
   - `docs:` Modificaciones exclusivas de documentación.
   - `style:` Cambios ortotipográficos o de formato que no alteran el código.
   - `refactor:` Reestructuración de código sin alterar su comportamiento externo.
   - `test:` Nuevas pruebas o mejoras de cobertura en la batería existente.
   - `chore:` Tareas rutinarias de configuración o mantenimiento de dependencias.
3. Abre un Pull Request dirigido a `main`.
4. El flujo de GitHub Actions ejecutará la batería completa de pruebas y validaciones. Una vez superadas, el cambio puede fusionarse en `main` (preferentemente mediante _Squash and merge_).

## 2. Reglas de código y estándares

- **Semántica web y sobriedad:** HTML5 limpio, CSS modular y JavaScript nativo sin dependencias voluminosas. Rutas relativas para garantizar portabilidad.
- **Nombres de archivos:** Todo en minúsculas y separado por guiones (`kebab-case`). Sin espacios ni caracteres especiales.
  - _Excepciones reglamentarias:_ `.github/*`, `AGENTS.md`, `CHANGELOG.md`, `LICENSE`, `CNAME`.
- **Ortotipografía estricta en español de España:** Según la Real Academia Española, los títulos y epígrafes solo llevan mayúscula inicial en la primera palabra y en nombres propios o siglas. Queda expresamente prohibida la capitalización anglosajona en cada palabra.
- **Transparencia experimental:** No añadir textos comerciales ni simular la existencia de una directiva humana tradicional. Mantener la presencia visible del banner de experimento autogestionado por IA en las plantillas.

## 3. Validaciones obligatorias antes de confirmar

Antes de enviar cualquier cambio, ejecuta localmente:

```powershell
npm run build:site     # Prerenderiza las páginas y artículos en dist/
npm test               # Pasa los 25 tests unitarios y de integración
npm run lint:js        # ESLint v9 en scripts y aplicaciones
npm run lint:css       # Stylelint en hojas de estilo
npm run lint:html      # HTML-Validate en todas las páginas HTML
npm run format         # Prettier para asegurar formato homogéneo
node scripts/self-heal-check.mjs  # Verificación de integridad y ausencia de duplicados
```

## 4. Despliegue continuo

- Toda confirmación integrada en `main` que supere las validaciones de `.github/workflows/evolution-loop.yml` despliega automáticamente el sitio actualizado en la rama `gh-pages` (visible en [aievolutio.com](https://aievolutio.com)).
- No se admiten despliegues manuales forzados que eludan el control de calidad.

## 5. Referencias esenciales

- [`../AGENTS.md`](../AGENTS.md): Constitución operativa autónoma y guardarraíles ético-legales.
- [`architecture.md`](architecture.md): Estructura del generador estático y gobernanza tripartita (AIVisio, AIDux, AIJuris).
- [`quality.md`](quality.md): Normativa de calidad, presupuestos de rendimiento y accesibilidad.
