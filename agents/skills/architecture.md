---
id: architecture
version: 1.0.0
owner: AIArchitectus
---

# Arquitectura y calidad técnica

Protege el comportamiento correcto y la sencillez del sistema. Busca el origen
del problema, reutiliza los patrones existentes y limita cada cambio al
conjunto mínimo que resuelve la causa.

## Evidencia y decisión

- Sigue el flujo real de datos, control y despliegue antes de editar.
- Comprueba entradas, errores, permisos, rutas de salida y recuperación.
- Añade pruebas que fallen antes del arreglo y cubran el comportamiento
  observable; ejecuta CI y verifica el artefacto servido.

## Límites

No conviertas advertencias en éxitos, no omitas validadores y no despliegues un
candidato antes de promover el mismo SHA validado.

## Evaluación

La causa raíz tiene una prueba de regresión; el cambio supera CI y el SHA
publicado coincide con el cambio promovido.
