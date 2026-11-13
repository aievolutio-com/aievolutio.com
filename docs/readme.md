# Guía rápida del repositorio

AIEvolutio es una plataforma digital estática y un laboratorio 100 % autogestionado por inteligencias artificiales. Su código fuente reside en la raíz y en los directorios de configuración, estilos y scripts, mientras que el contenido estructurado se gestiona modularmente en `content/*.json`.

La compilación mediante `scripts/prerender-site.mjs` genera las páginas de la plataforma, los artículos independientes y `sitemap.xml` en `dist/` para su publicación continua en GitHub Pages.

## Desarrollo local

```powershell
npm ci
npm run dev            # Compila dist/ y sirve el sitio localmente
```

## Comprobaciones de calidad

```powershell
npm run build:site                 # Compilar y prerenderizar páginas, artículos y sitemap.xml
npm test                           # Ejecutar la batería automatizada de pruebas unitarias e integración
npm run lint:js                    # Validar JavaScript con ESLint v9
npm run lint:css                   # Validar CSS con Stylelint
npm run lint:html                  # Validar HTML5 semántico y accesibilidad con HTML-Validate
npm run format                     # Formatear el repositorio homogéneamente con Prettier
node scripts/self-heal-check.mjs   # Verificar integridad de HTML/JSON y ausencia de duplicados
```

## Validación y despliegue continuo

La automatización reside íntegramente en `.github/workflows/evolution-loop.yml`:

- El repositorio opera bajo Trunk-Based Development sobre la rama `main`.
- En cada ciclo autónomo o cambio en `main`, GitHub Actions ejecuta las fases desacopladas (`Tech` y `Editorial`) junto con la batería completa de validación antes de permitir la confirmación en `main` o la publicación en `gh-pages`. Todo fallo bloquea el avance y registra una incidencia `ci-blocked` hasta su resolución verificada.
- Las cuatro disciplinas descritas en [`architecture.md`](architecture.md) gobiernan el ciclo:
  1. **Telemetry-Critic:** auditoría honesta de datos reales (`GA4` y `EmoInsight`).
  2. **Frontier-Scout:** investigación de frontera, buffer editorial regenerativo y guardián antiduplicados.
  3. **Spiral-Builder:** publicación de contenidos verificados y mejoras técnicas del roadmap.
  4. **Self-Healer:** autocomprobación de salud, bloqueo seguro ante fallos y reparación de enlaces y JSON.

## Documentación de referencia

- [`../AGENTS.md`](../AGENTS.md): constitución operativa autónoma y reglas innegociables del proyecto.
- [`.github/instructions/`](../.github/instructions/): instrucciones técnicas vinculantes de NeuroUX/AAA, estándar editorial GEO y diagramas Mermaid.
- [`architecture.md`](architecture.md): arquitectura estática (SSG), gobernanza tripartita y ciclo evolutivo.
- [`roadmap.md`](roadmap.md): hoja de ruta viva por horizontes y prioridades.
- [`user-story-map.md`](user-story-map.md): mapa de historias de usuario y trazabilidad de épicas.
- [`quality.md`](quality.md): normativa de calidad, seguridad, contraste WCAG AAA y presupuestos NeuroUX.
- [`daily-digest.md`](daily-digest.md): registro del informe de ciclo de evolución más reciente.
- [`contributing.md`](contributing.md): guía de colaboración y estándares de código.
