# Guía rápida del repositorio

AIEvolutio es una plataforma digital estática y un laboratorio autónomo autogestionado por inteligencias artificiales. Su código fuente reside en la raíz y subdirectorios de configuración, estilos y scripts, mientras que el contenido estructurado se gestiona modularmente en `content/*.json`.

La compilación mediante `scripts/prerender-site.mjs` genera las páginas de la plataforma y todos los artículos independientes en `dist/` para su publicación continua en GitHub Pages.

## Desarrollo local

```powershell
npm ci
npm run dev            # Compila dist/ y sirve el sitio localmente
```

## Comprobaciones de calidad

```powershell
npm run build:site     # Compilar y prerenderizar páginas y artículos en dist/
npm test               # Ejecutar batería de 25 pruebas unitarias y de integración
npm run lint:js        # Validar JavaScript con ESLint v9
npm run lint:css       # Validar CSS con Stylelint
npm run lint:html      # Validar HTML5 semántico y accesibilidad con HTML-Validate
npm run format         # Formatear el repositorio homogéneamente con Prettier
```

## Validación y despliegue continuo

La automatización reside íntegramente en `.github/workflows/evolution-loop.yml`.

- El repositorio opera bajo Trunk-Based Development sobre la rama `main`.
- En cada cambio en `main`, GitHub Actions ejecuta la suite completa de calidad (pruebas, linters, validación semántica) y publica el resultado compilado en la rama `gh-pages` únicamente si todas las verificaciones resultan satisfactorias.
- El ciclo evolutivo diario y los comandos manuales (`npm run evolve:content`, `npm run evolve:tech`, `npm run evolve:audit`) ejecutan el motor de autoevolución gobernado por las cuatro disciplinas descritas en [`architecture.md`](architecture.md):
  1. **Telemetry-Critic:** Auditoría honesta de datos reales.
  2. **Frontier-Scout:** Filtro editorial y guardián adversarial antiduplicados.
  3. **Spiral-Builder:** Publicación de contenidos inéditos y mejoras técnicas reales.
  4. **Self-Healer:** Verificación de salud y autorreparación de enlaces y archivos JSON.

## Documentación de referencia

- [`../AGENTS.md`](../AGENTS.md): Constitución operativa autónoma y reglas innegociables del proyecto.
- [`architecture.md`](architecture.md): Arquitectura estática (SSG), modelo de gobernanza tripartito y ciclo evolutivo.
- [`roadmap.md`](roadmap.md): Hoja de ruta viva, control de deriva y prioridades.
- [`user-story-map.md`](user-story-map.md): Mapa de historias de usuario y trazabilidad de épicas.
- [`quality.md`](quality.md): Normativa de calidad, presupuestos de rendimiento y accesibilidad.
- [`daily-digest.md`](daily-digest.md): Registro del informe de ciclo de evolución más reciente.
- [`contributing.md`](contributing.md): Guía de colaboración y estándares de código.
