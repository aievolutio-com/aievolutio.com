# Guía de contribución

Este documento describe el flujo de trabajo para colaborar en el desarrollo y mantenimiento técnico de AIEvolutio, respetando siempre las reglas vinculantes de [`AGENTS.md`](../AGENTS.md) y [`.github/instructions/`](../.github/instructions/).

## 1. Flujo de trabajo en ramas y cambios

El repositorio sigue un modelo **Trunk-Based Development** centrado en la rama `main`:

1. Crea una rama descriptiva para tu tarea: `git checkout -b feature/nombre-de-la-mejora` o `fix/descripcion-del-arreglo`.
2. Realiza cambios atómicos y utiliza mensajes de confirmación según la convención [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` nuevas funcionalidades o herramientas interactivas.
   - `fix:` corrección de errores o inconsistencias.
   - `docs:` modificaciones exclusivas de documentación.
   - `style:` cambios ortotipográficos o de formato que no alteran el código.
   - `refactor:` reestructuración de código sin alterar su comportamiento externo.
   - `test:` nuevas pruebas o mejoras de cobertura en la batería existente.
   - `chore:` tareas rutinarias de configuración o mantenimiento de dependencias.
3. Abre un Pull Request dirigido a `main` o verifica el estado completo en local antes de integrar en `main`.
4. `.github/workflows/evolution-loop.yml` ejecutará la batería completa de pruebas y validaciones. Todo fallo bloquea el despliegue a `gh-pages` y abre o actualiza una incidencia etiquetada `ci-blocked` hasta su resolución.

## 2. Reglas de código y estándares

- **Semántica web, NeuroUX y sobriedad:** HTML5 limpio, CSS modular alineado con [`quality.md`](quality.md) y JavaScript nativo sin dependencias pesadas. Cero emojis estructurales y cero jerga interna del experimento en la interfaz pública.
- **Nombres de archivos:** todo en minúsculas y separado por guiones (`kebab-case`), sin espacios ni caracteres especiales (validado en `scripts/validate-filenames.sh`).
  - _Excepciones reglamentarias:_ `.github/*`, `AGENTS.md`, `CHANGELOG.md`, `VERSION`, `CNAME`, `_headers`.
- **Ortotipografía estricta en español de España:** según la Real Academia Española, los títulos y epígrafes solo llevan mayúscula inicial en la primera palabra, nombres propios y siglas. Prohibida la capitalización anglosajona en cada palabra.
- **Transparencia experimental serena:** no añadir promesas comerciales ni simular una directiva humana tradicional; mantener visible el sello claro **«100 % operado por IA»** en el pie de página y secciones de equipo, contacto y comentarios.
- **Veracidad editorial:** cualquier cifra o cita legal requiere fuente verificada en vivo (_Google Search Grounding_); prohibido inventar estadísticas o casos simulados.

## 3. Validaciones obligatorias antes de confirmar

Antes de enviar cualquier cambio, ejecuta localmente:

```powershell
npm run build:site                 # Prerenderiza páginas, artículos y sitemap.xml en dist/ y raíz
npm test                           # Ejecuta la batería automatizada de pruebas unitarias e integración
npm run lint:js                    # ESLint v9 en scripts y aplicación cliente
npm run lint:css                   # Stylelint en hojas de estilo
npm run lint:html                  # HTML-Validate en todas las páginas HTML
npm run format                     # Prettier para asegurar formato homogéneo
node scripts/self-heal-check.mjs   # Verificación de integridad y ausencia de duplicados
```

## 4. Despliegue continuo

- Toda confirmación integrada en `main` que supere las validaciones bloqueantes de `.github/workflows/evolution-loop.yml` compila `dist/` y despliega el sitio en la rama `gh-pages` (visible en [aievolutio.com](https://aievolutio.com)).
- No se admiten despliegues que eludan el control automático de calidad.

## 5. Referencias esenciales

- [`../AGENTS.md`](../AGENTS.md): constitución operativa autónoma, reglas de diseño y guardarraíles ético-legales.
- [`architecture.md`](architecture.md): arquitectura estática (SSG), gobernanza tripartita (`AIVisio`, `AIDux`, `AIJuris`) y motor autónomo.
- [`quality.md`](quality.md): normativa de calidad, contraste WCAG AAA, presupuestos NeuroUX y seguridad.
- [`roadmap.md`](roadmap.md) y [`user-story-map.md`](user-story-map.md): hoja de ruta viva e historias de usuario sin duplicidades.
