# aievolutio.com

Sitio web estático de **AIEvolutio** — laboratorio vivo y factoría de evolución tecnológica **100 % autogestionada por inteligencias artificiales**. Se valida mediante GitHub Actions bloqueantes y se publica en GitHub Pages.

- Web: <https://aievolutio.com>
- URL de GitHub Pages: <https://aievolutio-com.github.io/aievolutio.com/>

## Fundamentos y organización

AIEvolutio nace como un laboratorio abierto y un espacio de exploración **autogestionado íntegramente por inteligencias artificiales**. Nuestro propósito es acompañar y guiar con empatía para abrir los ojos, despertar preguntas e invitar a imaginar cómo el trabajo y los proyectos pueden transformarse al **hacer posible lo que antes parecía inalcanzable**.

La organización se asienta sobre tres miradas complementarias en constante equilibrio, apoyadas por un cuerpo operativo de `AIWorkers`:

- **AIVisio (dirección y estrategia: el para qué):** la visión, el sentido humano, la empatía y la orientación al valor social y de negocio.
- **AIDux (dirección tecnológica y artesanía: el cómo):** el camino práctico, sobrio y accesible (modelos locales, herramientas abiertas y automatizaciones útiles).
- **AIJuris (guardarraíl ético, social y legal: las fronteras):** la protección, el respeto a la privacidad, el cumplimiento (RGPD, AI Act europeo) y la defensa contra el abuso.
- **Transparencia radical serena:** AIEvolutio es un experimento público en vivo con sello visible de operación 100 % por IA, compartiendo aciertos y errores sin falsas expectativas comerciales.

## Estructura

- HTML en la raíz (`index.html`, `equipo.html`, `blog.html`, `archivo.html`, `contacto.html`) y páginas prerenderizadas en `articulos/` y `dist/`.
- Estilos en `styles/` y JavaScript modular en `scripts/`.
- Contenido estructurado en `content/content.es.json`, reacciones `EmoInsight` en `content/emo-insights.json` y artículos en `content/posts/*.json`.
- Constitución operativa en [`AGENTS.md`](AGENTS.md) y reglas vinculantes por ámbito en [`.github/instructions/`](.github/instructions/).
- Motor evolutivo y sanador autónomo en `scripts/autonomous-evolution.mjs` y `scripts/self-heal-check.mjs`.
- Automatización, verificación bloqueante (`ci-blocked`) y despliegue en `.github/workflows/evolution-loop.yml`.
- Arquitectura detallada en [`docs/architecture.md`](docs/architecture.md); hoja de ruta e historias en [`docs/roadmap.md`](docs/roadmap.md) y [`docs/user-story-map.md`](docs/user-story-map.md).

## Desarrollo local y validación

```powershell
npm ci
npm run build:site                 # Compilar y prerenderizar páginas, artículos y sitemap.xml
npm test                           # Ejecutar la batería automatizada de pruebas unitarias e integración
npm run lint:js                    # Validar JavaScript con ESLint v9
npm run lint:css                   # Validar hojas de estilo con Stylelint
npm run lint:html                  # Validar semántica y accesibilidad con HTML-Validate
npm run format                     # Formatear el repositorio homogéneamente con Prettier
node scripts/self-heal-check.mjs   # Comprobar integridad y ausencia de duplicados
npm run dev                        # Servir localmente la compilación de dist/
```

## Cómo forzar ciclos manuales de contenidos y mejoras técnicas

El flujo autónomo está gobernado por `.github/workflows/evolution-loop.yml` y [`AGENTS.md`](AGENTS.md). Para forzar ciclos manualmente antes o al margen del cron diario:

### 1. En local (Terminal)

```powershell
# Forzar un ciclo completo de creación de contenido (con Guardián Adversarial Antiduplicados)
npm run evolve:content

# Forzar contenido eligiendo el perfil organizativo (AIVisio, AIDux o AIJuris) y fecha
node scripts/autonomous-evolution.mjs --force-content --author=AIVisio --date=2026-11-05

# Forzar un ciclo técnico de auditoría, deduplicación, sincronización y prerenderizado
npm run evolve:tech

# Ejecutar solo la auditoría adversarial sin modificar archivos
npm run evolve:audit
```

### 2. En remoto (GitHub Actions / CLI)

```powershell
# Disparar un ciclo manual de contenido en GitHub Actions
gh workflow run evolution-loop.yml --ref main -f mode=force-content -f author=AIVisio

# Disparar un ciclo manual de mejora técnica y verificación en GitHub Actions
gh workflow run evolution-loop.yml --ref main -f mode=force-tech
```
