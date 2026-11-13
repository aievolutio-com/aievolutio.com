import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  callGemini,
  callGeminiWithSearchGrounded,
  ensureEditorialBuffer,
  extractGroundingSources,
  isSundayPillarDate,
  requireEditorialCandidate,
  ROADMAP_TECH_QUEUE,
  validateArticleBodyLength,
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

test("enforces 1200–1600 words for daily tactical posts and 1400–1800 words for Sunday pillars", () => {
  assert.equal(validateArticleBodyLength("palabra ".repeat(1199), "tactical").valid, false);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1200), "tactical").valid, true);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1600), "tactical").valid, true);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1601), "tactical").valid, false);

  assert.equal(validateArticleBodyLength("palabra ".repeat(1399), "pillar").valid, false);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1400), "pillar").valid, true);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1800), "pillar").valid, true);
  assert.equal(validateArticleBodyLength("palabra ".repeat(1801), "pillar").valid, false);

  assert.equal(isSundayPillarDate("2026-11-15"), true);
  assert.equal(isSundayPillarDate("2026-11-16"), false);
});

test("extracts verified grounding sources from Gemini Search responses", async () => {
  const sampleApiPayload = {
    candidates: [
      {
        content: { parts: [{ text: '{"title":"Guía verificada","body":"Texto"}' }] },
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://eur-lex.europa.eu/ai-act", title: "EUR-Lex AI Act" } },
            { web: { uri: "https://eur-lex.europa.eu/ai-act", title: "Duplicate URL" } },
            { web: { uri: "https://www.aepd.es/", title: "AEPD" } },
            { web: { uri: "javascript:alert(1)", title: "Invalid" } },
          ],
        },
      },
    ],
  };

  assert.deepEqual(extractGroundingSources(sampleApiPayload), [
    { title: "EUR-Lex AI Act", url: "https://eur-lex.europa.eu/ai-act" },
    { title: "AEPD", url: "https://www.aepd.es/" },
  ]);

  let sentPayload;
  const grounded = await callGeminiWithSearchGrounded("test-key", "prompt", async (_url, opts) => {
    sentPayload = JSON.parse(opts.body);
    return { ok: true, json: async () => sampleApiPayload };
  });

  assert.ok(sentPayload.generationConfig.maxOutputTokens >= 3000);
  assert.equal(grounded.grounded, true);
  assert.equal(grounded.sources.length, 2);
});

test("replenishes editorial buffer up to 5 verified non-duplicate candidates when reserve drops below 3", async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ae-buffer-test-"));
  try {
    const bufferPath = path.join(tmpDir, "editorial-buffer.json");
    let seq = 0;
    const topics = [
      "Primer protocolo de copias locales cifradas para talleres pequeños",
      "Cómo preparar preguntas frecuentes útiles antes de instalar un asistente",
      "Control horario transparente y sencillo sin aplicaciones invasivas en pymes",
      "Uso prudente de transcripciones de reuniones manteniendo el secreto comercial",
      "Checklist legal para revisar condiciones antes de probar software gratuito",
    ];
    const result = await ensureEditorialBuffer(
      { existingPosts: [], editorialLog: [] },
      { summary: { emoDimensions: { clarity: 1, too_complex: 0, legal_doubt: 0 } } },
      "2026-11-13",
      {
        bufferPath,
        generatorFn: async () => {
          const idx = seq++;
          const title =
            topics[idx % topics.length] + (idx >= topics.length ? ` variante ${idx}` : "");
          const body = `${"palabra ".repeat(1240)}\n\n| Paso | Criterio |\n| :--- | :--- |\n| 1 | Revisión |\n\n**Pasos accionables para aplicar hoy:**\n1. Paso uno\n2. Paso dos\n3. Paso tres`;
          return {
            text: JSON.stringify({
              title,
              slug: `tema-buffer-${idx}`,
              category: "Operaciones",
              effortLevel: "basic",
              readerNeed: `Resolver necesidad práctica sobre ${title}`,
              angle: `Guía paso a paso orientada a ${title}`,
              actionType: `Aplicar medida práctica ${idx}`,
              readerProfile: "Autónomos y pymes",
              clarityNote: "En 30 segundos: guía sencilla de prueba.",
              excerpt: `Resumen breve sobre ${title}.`,
              body,
              actionableChecklist: ["Paso 1", "Paso 2", "Paso 3"],
              seedQuestion: "¿Cómo lo aplicarías?",
            }),
            sources: [{ title: "Fuente oficial", url: "https://www.aepd.es/" }],
          };
        },
      },
    );

    assert.equal(result.activeCount, 5);
    assert.equal(result.added, 5);

    const secondPass = await ensureEditorialBuffer(
      { existingPosts: [], editorialLog: [] },
      {},
      "2026-11-14",
      {
        bufferPath,
        generatorFn: async () => {
          throw new Error("Should not regenerate when reserve >= 3");
        },
      },
    );
    assert.equal(secondPass.activeCount, 5);
    assert.equal(secondPass.added, 0);
    assert.ok(ROADMAP_TECH_QUEUE.length >= 6);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});
