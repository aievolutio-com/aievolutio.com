import test from "node:test";
import assert from "node:assert/strict";
import {
  callGemini,
  requireEditorialCandidate,
  validateEditorialBriefing,
} from "./autonomous-evolution.mjs";

test("vetoes a briefing with a title already in the published corpus", () => {
  const briefing = {
    suggestedTitle: "Mensajes fuera de horario en una pyme",
    readerNeed: "Definir las expectativas de respuesta a clientes",
    angle: "Acordar límites de comunicación y descanso",
  };

  const result = validateEditorialBriefing(briefing, [
    { title: "Mensajes fuera de horario en una pyme", slug: "mensajes-fuera-horario" },
  ]);

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Título vetado/);
});

test("vetoes a new title when both the need and angle repeat editorial history", () => {
  const briefing = {
    suggestedTitle: "Una nueva forma de responder mensajes",
    readerNeed:
      "Proteger el descanso de autónomos y equipos pequeños definiendo expectativas de respuesta y urgencias reales para sus clientes",
    angle:
      "Diseñar límites de comunicación sostenibles que cuiden la vida personal y mantengan una atención fiable sin prometer disponibilidad permanente",
  };

  const result = validateEditorialBriefing(
    briefing,
    [],
    [
      {
        title: "Título anterior sobre comunicación",
        readerNeed: briefing.readerNeed,
        angle: briefing.angle,
      },
    ],
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Tema y ángulo ya tratados/);
});

test("allows a prevalidated briefing on a distinct topic", () => {
  const briefing = {
    suggestedTitle:
      "Mensajes fuera de horario: proteger el descanso sin dejar al cliente a oscuras",
    readerNeed:
      "Proteger el descanso de autónomos y equipos pequeños definiendo expectativas de respuesta y urgencias reales para sus clientes",
    angle:
      "Diseñar límites de comunicación sostenibles que cuiden la vida personal y mantengan una atención fiable sin prometer disponibilidad permanente",
  };

  const result = validateEditorialBriefing(
    briefing,
    [
      { title: "Protocolo MCP y agentes locales con guardarrail legal", slug: "protocolo-mcp" },
      { title: "AIWorkers: tu equipo invisible que multiplica el valor", slug: "aiworkers-equipo" },
    ],
    [
      {
        title: "Medir el impacto de automatizar tareas repetitivas",
        readerNeed: "Medir el tiempo y coste recuperado tras automatizar una tarea administrativa",
        angle: "Comparar horas antes y después con un indicador sencillo de retorno",
      },
    ],
  );

  assert.deepEqual(result, { allowed: true, reason: null });
});

test("fails the cycle instead of claiming success when no original article is available", () => {
  assert.throws(() => requireEditorialCandidate(null), /artículo inédito que supere el preflight/);
});

test("uses the current low-cost Gemini API model", async () => {
  let requestUrl;
  const generatedText = '{"readerNeed":"Proteger el descanso"}';

  const result = await callGemini("test-key", "briefing", async (url) => {
    requestUrl = url;
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: generatedText }] } }],
      }),
    };
  });

  assert.match(requestUrl, /models\/gemini-3\.5-flash-lite:generateContent/);
  assert.equal(result, generatedText);
});

test("returns null when the Gemini API rejects the request", async () => {
  const result = await callGemini("test-key", "briefing", async () => ({
    ok: false,
    status: 404,
  }));

  assert.equal(result, null);
});
