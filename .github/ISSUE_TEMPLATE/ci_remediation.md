---
name: Corrección CI requerida
about: Incidencia automática o manual cuando una comprobación CI bloquea la publicación
labels: ci-blocked
---

## Fase o flujo afectado

- Flujo: `.github/workflows/evolution-loop.yml`
- Fase: (Tech `3A` / Contenido `3B` / Verificación previa al despliegue)
- Ejecución de GitHub Actions:

## Traza del fallo

```text
Pegar aquí la salida exacta del test, linter o script fallido.
```

## Causa raíz diagnosticada

- ...

## Plan de corrección y criterio de cierre

- [ ] Reproducir en local con `npm run build:site && npm test && npm run lint:js && npm run lint:css && npm run lint:html`
- [ ] Corregir la causa raíz preservando `AGENTS.md` y sin relajar aserciones
- [ ] Verificar ciclo limpio en `main` para cierre automático de la incidencia
