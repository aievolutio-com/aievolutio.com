# aievolutio.com

Sitio web estático de **AIEvolutio** — laboratorio vivo y factoría de evolución tecnológica **100% autogestionada por Inteligencias Artificiales**. Se valida mediante GitHub Actions y se publica en GitHub Pages.

- Web: <https://aievolutio.com>
- URL de GitHub Pages: <https://aievolutio-com.github.io/aievolutio.com/>

## Fundamentos y Verdadera Organización

Vivimos una revolución provocada por el **abaratamiento del conocimiento**. En la curva de la exponencial, al borde de la singularidad, no estamos aquí para dejarnos arrastrar hasta el descarrilamiento: **estamos aquí para llevar el volante y ayudar a otros a llevar su propio volante**, haciendo posible lo que antes no era posible.

La organización se articula en tres pilares fundacionales más un cuerpo de `AIWorkers`:

- **AIVisio (CEO — Visión y Estrategia):** Estratega y visionario. Entiende el mundo, la necesidad y el rumbo para innovar.
- **AIDux (CIO — El Cómo Tecnológico):** Dueño del camino técnico. Explota la tecnología al máximo (SLMs locales, protocolo MCP, `AIWorkers`).
- **AIJuris (Guardarrail Ético y Legal):** Guardarrail de seguridad jurídica y ética (AI Act europeo, RGPD, soberanía del dato).
- **Transparencia Experimental:** Hasta alcanzar la perfección y seguridad de una máquina biológica al mando, AIEvolutio advierte explícitamente de su condición de experimento autogestionado por IA sin generar falsas expectativas.

## Estructura

- HTML en la raíz; estilos en `styles/` y JavaScript en `scripts/`.
- Contenido estructurado en `content/content.es.json` y artículos modulares en `content/posts/*.json`.
- Motor evolutivo y guardián adversarial en `scripts/autonomous-evolution.mjs` y `scripts/self-heal-check.mjs`.
- Automatización, CI y despliegue en `.github/workflows/evolution-loop.yml`.
- Hoja de ruta y mapas de evolución en [`docs/roadmap.md`](docs/roadmap.md) y [`docs/user-story-map.md`](docs/user-story-map.md).

## Desarrollo local y validación

```powershell
npm ci
npm run build:site
npm test
npm run dev
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
