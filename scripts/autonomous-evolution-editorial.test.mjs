import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  callGemini,
  callGeminiWithSearchGrounded,
  EDITORIAL_BUFFER_TARGET,
  ensureEditorialBuffer,
  ensureTechBuffer,
  extractGroundingSources,
  isSundayPillarDate,
  normalizeMarkdownBody,
  repairArticleWithLLM,
  requireEditorialCandidate,
  ROADMAP_TECH_QUEUE,
  runRoadmapTechnicalStep,
  TECH_BUFFER_TARGET,
  validateArticleBodyLength,
  validateArticleQuality,
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

function buildValidSampleBody(wordBlockCount = 415) {
  const chunk = "palabra ".repeat(wordBlockCount).trim();
  return [
    `**Idea principal práctica.** ${chunk}`,
    `### Primer bloque de análisis\n\n${chunk}`,
    `### Segundo bloque con método\n\n${chunk}`,
    "### Tercera clave de control\n\n| Paso | Criterio |\n| :--- | :--- |\n| 1 | Revisión humana |\n| 2 | Datos en local |",
    "**Pasos accionables para aplicar hoy:**\n1. Paso uno\n2. Paso dos\n3. Paso tres",
  ].join("\n\n");
}

test("validates Bite-Snack-Meal structure, heals double-escaped newlines, and repairs missing H3 headings via LLM", async () => {
  const validBody = buildValidSampleBody(415);
  const escapedWall = validBody.replace(/\n/g, "\\n");
  assert.equal((escapedWall.match(/^###\s+/gm) || []).length, 0);
  const healed = normalizeMarkdownBody(escapedWall);
  assert.equal((healed.match(/^###\s+/gm) || []).length, 3);
  assert.equal(validateArticleQuality({ title: "Guía sobria", body: escapedWall }).valid, true);

  const brokenDraft = {
    title: "Guía sin estructura",
    slug: "guia-sin-estructura",
    body: "palabra ".repeat(1260),
  };
  const initial = validateArticleQuality(brokenDraft, "tactical");
  assert.equal(initial.valid, false);
  assert.ok(initial.issues.some((i) => i.includes("subencabezados Markdown ###")));
  assert.ok(initial.issues.some((i) => i.includes("tabla comparativa")));

  let repairCalls = 0;
  const repaired = await repairArticleWithLLM(brokenDraft, "tactical", {
    llmFn: async (prompt) => {
      repairCalls++;
      assert.match(prompt, /DEFECTOS DETECTADOS/);
      return JSON.stringify({ ...brokenDraft, body: validBody });
    },
  });
  assert.equal(repairCalls, 1);
  assert.equal(repaired.repaired, true);
  assert.equal(repaired.quality.valid, true);
});

test("replenishes editorial buffer up to 7 verified non-duplicate candidates and immediately refills when one is consumed", async () => {
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
      "Organizar el inventario del almacén con plantillas limpias y sin cuotas",
      "Guía de bienvenida digital para nuevas incorporaciones en comercios locales",
      "Revisión trimestral de proveedores tecnológicos con criterio de ahorro",
    ];
    const makeGenerator = () => async () => {
      const idx = seq++;
      const title = topics[idx % topics.length] + (idx >= topics.length ? ` variante ${idx}` : "");
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
          body: buildValidSampleBody(415),
          actionableChecklist: ["Paso 1", "Paso 2", "Paso 3"],
          seedQuestion: "¿Cómo lo aplicarías?",
        }),
        sources: [{ title: "Fuente oficial", url: "https://www.aepd.es/" }],
      };
    };

    const result = await ensureEditorialBuffer(
      { existingPosts: [], editorialLog: [] },
      { summary: { emoDimensions: { clarity: 1, too_complex: 0, legal_doubt: 0 } } },
      "2026-11-20",
      {
        bufferPath,
        disableCuratedFallback: true,
        generatorFn: makeGenerator(),
        juryFn: null,
      },
    );

    assert.equal(EDITORIAL_BUFFER_TARGET, 7);
    assert.equal(result.activeCount, 7);
    assert.equal(result.added, 7);

    // Sin consumo previo (7/7), no debe regenerar
    const secondPass = await ensureEditorialBuffer(
      { existingPosts: [], editorialLog: [] },
      {},
      "2026-11-20",
      {
        bufferPath,
        disableCuratedFallback: true,
        generatorFn: async () => {
          throw new Error("Should not regenerate when reserve >= 7");
        },
      },
    );
    assert.equal(secondPass.activeCount, 7);
    assert.equal(secondPass.added, 0);

    // Simular consumo de 1 artículo (baja a 6) -> reposición inmediata a 7
    const stored = JSON.parse(await readFile(bufferPath, "utf8"));
    stored.items[0].used = true;
    await writeFile(bufferPath, JSON.stringify(stored, null, 2) + "\n", "utf8");

    const afterConsume = await ensureEditorialBuffer(
      { existingPosts: [], editorialLog: [] },
      {},
      "2026-11-21",
      {
        bufferPath,
        disableCuratedFallback: true,
        generatorFn: makeGenerator(),
        juryFn: null,
      },
    );
    assert.equal(afterConsume.activeCount, 7);
    assert.equal(afterConsume.added, 1);
    assert.ok(ROADMAP_TECH_QUEUE.length >= 6);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test("maintains >= 7 executable technical improvements in tech-buffer.json and immediately refills after executing one", async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ae-tech-buffer-test-"));
  try {
    const bufferPath = path.join(tmpDir, "tech-buffer.json");
    const recipesPath = path.join(tmpDir, "aiworker-recipes.json");
    const glossaryPath = path.join(tmpDir, "glossary-extra.json");
    const tmpPostsDir = path.join(tmpDir, "posts");
    await mkdir(tmpPostsDir, { recursive: true });
    await writeFile(recipesPath, "[]\n", "utf8");
    await writeFile(glossaryPath, "[]\n", "utf8");
    for (let i = 1; i <= 5; i++) {
      await writeFile(
        path.join(tmpPostsDir, `2026-11-1${i}-articulo-demo-${i}.json`),
        JSON.stringify({
          date: `2026-11-1${i}`,
          slug: `articulo-demo-${i}`,
          title: `Guía práctica de ejemplo número ${i}`,
          author: "AIDux",
          clarityNote: "En 30 segundos: guía de ejemplo aislada para pruebas.",
          excerpt: `Resumen ${i}`,
          body: buildValidSampleBody(415),
          actionableChecklist: ["Paso 1", "Paso 2", "Paso 3"],
        }),
        "utf8",
      );
    }

    const emoInsights = {
      completedTechSteps: ROADMAP_TECH_QUEUE.map((s) => s.id),
      techHistory: [],
      summary: { totalLikes: 0, totalDislikes: 0, totalComments: 0 },
    };

    const seeded = await ensureTechBuffer(
      { existingPosts: [], editorialLog: [] },
      emoInsights,
      { topic: "MCP y recetas locales", roadmapImpact: "Ampliar recetas de 15 min" },
      "2026-11-20",
      {
        bufferPath,
        recipesPath,
        glossaryPath,
        postsDir: tmpPostsDir,
        generatorFn: async () => null,
      },
    );
    assert.equal(TECH_BUFFER_TARGET, 7);
    assert.equal(seeded.activeCount, 7);

    // Ejecutar 1 mejora técnica y verificar que el buffer se repone inmediatamente de vuelta a 7
    const executed = await runRoadmapTechnicalStep(
      { existingPosts: [], editorialLog: [] },
      emoInsights,
      "2026-11-21",
      { topic: "MCP y recetas locales", roadmapImpact: "Ampliar recetas de 15 min" },
      {
        bufferPath,
        recipesPath,
        glossaryPath,
        postsDir: tmpPostsDir,
        preferTechBuffer: true,
        skipSaveEmo: true,
        skipRoadmapUpdate: true,
        generatorFn: async () => null,
      },
    );

    assert.ok(executed && executed.id, "Expected a technical improvement to execute");
    const finalBuf = JSON.parse(await readFile(bufferPath, "utf8"));
    const activeAfter = finalBuf.items.filter((i) => i && !i.used);
    assert.ok(
      activeAfter.length >= 7,
      `Expected tech buffer to stay >= 7 immediately after consuming one, got ${activeAfter.length}`,
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});
