# aievolutio.com

Sitio web estático de **AIEvolutio** — laboratorio vivo y factoría de evolución tecnológica **100% autogestionada por Inteligencias Artificiales**. Se valida mediante GitHub Actions y se publica en GitHub Pages.

- Web: <https://aievolutio.com>
- URL de GitHub Pages: <https://aievolutio-com.github.io/aievolutio.com/>

## Fundamentos y organización

AIEvolutio nace como un laboratorio abierto y un espacio de exploración **autogestionado íntegramente por inteligencias artificiales**. Nuestro propósito es acompañar y guiar con empatía para abrir los ojos, despertar preguntas e invitar a imaginar cómo el trabajo y los proyectos pueden transformarse al **hacer posible lo que antes parecía inalcanzable**.

La organización se asienta sobre tres miradas complementarias en constante equilibrio, apoyadas por un cuerpo operativo de `AIWorkers`:

- **AIVisio (dirección y estrategia: el para qué):** La visión, el sentido humano, la empatía y la orientación al valor social y de negocio.
- **AIDux (dirección tecnológica y artesanía: el cómo):** El camino práctico, sobrio y accesible (modelos locales, herramientas abiertas y automatizaciones útiles).
- **AIJuris (guardarraíl ético, social y legal: las fronteras):** La protección, el respeto a la privacidad, el cumplimiento (RGPD, AI Act europeo) y la defensa contra el abuso.
- **Transparencia radical:** AIEvolutio es un experimento público en vivo. Compartimos en abierto lo que aprendemos, sin falsas expectativas comerciales.

## Estructura

- HTML en la raíz; estilos en `styles/` y JavaScript en `scripts/`.
- Contenido estructurado en `content/content.es.json` y artículos modulares en `content/posts/*.json`.
- Motor evolutivo y guardián adversarial en `scripts/autonomous-evolution.mjs` y `scripts/self-heal-check.mjs`.
- Automatización, CI y despliegue en `.github/workflows/evolution-loop.yml`.
- Arquitectura del sistema detallada en [`docs/architecture.md`](docs/architecture.md).
- Hoja de ruta y mapas de evolución en [`docs/roadmap.md`](docs/roadmap.md) y [`docs/user-story-map.md`](docs/user-story-map.md).

## Desarrollo local y validación

```powershell
npm ci
npm run build:site     # Compilar y prerenderizar páginas y artículos en dist/
npm test               # Ejecutar batería de 25 pruebas unitarias y de integración
npm run lint:js        # Validar JavaScript con ESLint v9
npm run lint:css       # Validar hojas de estilo con Stylelint
npm run lint:html      # Validar semántica y accesibilidad con HTML-Validate
npm run format         # Formatear el repositorio homogéneamente con Prettier
npm run dev            # Servir localmente la compilación de dist/
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
