import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  loadSpmPolicy,
  computePortfolioState,
  selectNextSpmAssignment,
  checkTechQueueDiversity,
  getUnderrepresentedTechKinds,
} from "./skills/spm-governor.mjs";
import {
  computeFernandezHuerta,
  lintArticleAntiSlop,
  cleanAndFilterSources,
  resolveCleanGroundingSources,
} from "./skills/anti-slop-linter.mjs";
import {
  computeFitnessScore,
  evaluateWithSyntheticPymeJury,
} from "./skills/synthetic-pyme-jury.mjs";
import { fetchGa4ProductEvents, fetchGscDemandQueries } from "./skills/demand-sensors.mjs";

test("SPM governor blocks AIJuris when compliance exceeds 15% and picks highest-deficit cell", async () => {
  const policy = await loadSpmPolicy();
  const skewedPosts = [
    {
      date: "2026-11-20",
      author: "AIJuris",
      title: "Agentes y cumplimiento del AI Act",
      slug: "p1",
    },
    { date: "2026-11-21", author: "AIJuris", title: "Guía legal RGPD para pymes", slug: "p2" },
    { date: "2026-11-22", author: "AIJuris", title: "Cláusulas AI Act en contratos", slug: "p3" },
    { date: "2026-11-23", author: "AIVisio", title: "Comercio de barrio y clientes", slug: "p4" },
    { date: "2026-11-24", author: "AIJuris", title: "Blindaje legal de proveedores", slug: "p5" },
    { date: "2026-11-25", author: "AIDux", title: "Organizar reseñas en tienda", slug: "p6" },
  ];

  const state = computePortfolioState(skewedPosts, policy);
  assert.equal(state.aiJurisBlocked, true);
  assert.ok(state.cellPct.compliance > 15);

  const assignment = selectNextSpmAssignment(skewedPosts, policy);
  assert.notEqual(assignment.author, "AIJuris");
  assert.notEqual(assignment.cell, "compliance");
  assert.ok(assignment.domain && assignment.domain.id);
});

test("SPM governor enforces strict diversity limits on tech-buffer (maxSameKind <= 2, maxSameAgent <= 3)", async () => {
  const policy = await loadSpmPolicy();
  const active = [
    { id: "t1", kind: "aiworker_recipe", leadAgent: "AIDux" },
    { id: "t2", kind: "aiworker_recipe", leadAgent: "AIDux" },
    { id: "t3", kind: "glossary_expansion", leadAgent: "AIDux" },
  ];

  const thirdRecipe = checkTechQueueDiversity(
    active,
    { id: "t4", kind: "aiworker_recipe", leadAgent: "AIVisio" },
    policy,
  );
  assert.equal(thirdRecipe.allowed, false);
  assert.match(thirdRecipe.reason, /kind="aiworker_recipe"/);

  const fourthAidux = checkTechQueueDiversity(
    active,
    { id: "t5", kind: "article_faq_enrichment", leadAgent: "AIDux" },
    policy,
  );
  assert.equal(fourthAidux.allowed, false);
  assert.match(fourthAidux.reason, /"AIDux"/);

  const diversePick = checkTechQueueDiversity(
    active,
    { id: "t6", kind: "article_faq_enrichment", leadAgent: "AIVisio" },
    policy,
  );
  assert.equal(diversePick.allowed, true);

  const needed = getUnderrepresentedTechKinds(active, policy);
  assert.ok(!needed.includes("aiworker_recipe"));
  assert.ok(needed.includes("article_diagram_enrichment"));
  assert.ok(needed.includes("article_faq_enrichment"));
});

test("Anti-Slop linter passes all goodSamples and rejects all badSlopSamples in content/eval-golden-set.json", async () => {
  const policy = await loadSpmPolicy();
  const goldenPath = path.join(process.cwd(), "content/eval-golden-set.json");
  const golden = JSON.parse(await readFile(goldenPath, "utf8"));

  assert.ok(Array.isArray(golden.goodSamples) && golden.goodSamples.length >= 3);
  assert.ok(Array.isArray(golden.badSlopSamples) && golden.badSlopSamples.length >= 4);

  for (const sample of golden.goodSamples) {
    const res = lintArticleAntiSlop(
      { ...sample, body: sample.opening || sample.body || "" },
      policy,
    );
    assert.equal(
      res.passed,
      true,
      `Golden goodSample ${sample.id} should pass Anti-Slop, got issues: ${JSON.stringify(res.issues)}`,
    );
    assert.equal(res.slopPenalty, 0);
  }

  for (const bad of golden.badSlopSamples) {
    const res = lintArticleAntiSlop({ ...bad, body: bad.opening || bad.body || "" }, policy);
    assert.equal(res.passed, false, `Golden badSlopSample ${bad.id} must be rejected by Anti-Slop`);
    assert.equal(res.slopPenalty, 1.0);
  }
});

test("Anti-Slop linter enforces Spanish Fernández Huerta readability and cleans Vertex AI redirects", async () => {
  const policy = await loadSpmPolicy();
  const denseAcademic =
    "La conceptualización epistemológica multidimensional de las infraestructuras algorítmicas descentralizadas contemporáneas presupone inexorablemente una reconfiguración metodológica interdisciplinaria extraordinariamente sofisticada para las organizaciones empresariales. ".repeat(
      8,
    );
  const fhDense = computeFernandezHuerta(denseAcademic);
  assert.ok(
    fhDense < policy.antiSlop.minFernandezHuerta,
    `Expected dense prose FH < 56, got ${fhDense}`,
  );

  const denseResult = lintArticleAntiSlop({ title: "Texto denso", body: denseAcademic }, policy);
  assert.equal(denseResult.passed, false);
  assert.ok(denseResult.issues.some((i) => i.includes("Fernández Huerta")));

  const dirtySources = [
    {
      title: "Redirect opaco",
      url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQ123",
    },
    { title: "HubSpot Blog", url: "https://blog.hubspot.es/marketing/ia" },
    { title: "EUR-Lex", url: "https://eur-lex.europa.eu/legal-content/ES/TXT/" },
  ];
  const filtered = cleanAndFilterSources(dirtySources, policy);
  assert.deepEqual(filtered, [
    { title: "EUR-Lex", url: "https://eur-lex.europa.eu/legal-content/ES/TXT/" },
  ]);

  const resolved = await resolveCleanGroundingSources(
    [
      {
        title: "AEPD",
        url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQ999",
      },
    ],
    policy,
    async () => ({ ok: true, url: "https://www.aepd.es/guias/ia-rgpd" }),
  );
  assert.deepEqual(resolved, [{ title: "AEPD", url: "https://www.aepd.es/guias/ia-rgpd" }]);
});

test("Synthetic Pyme Jury evaluates F >= 0.80 with mocked LLM and vetoes low-value drafts", async () => {
  const policy = await loadSpmPolicy();
  assert.equal(
    computeFitnessScore(
      {
        mondayActionability: 0.9,
        plainLanguage: 0.85,
        sovereigntyZeroEuro: 0.9,
        demandAlignment: 0.8,
      },
      0,
      policy,
    ),
    0.872,
  );

  const cleanDraft = {
    title: "Ordenar presupuestos en tu taller con una hoja limpia de 0 €",
    clarityNote: "En 30 segundos: prepara una tabla de diez partidas en local antes del lunes.",
    body:
      "Cada lunes por la mañana en el taller se acumulan visitas sin presupuestar. Con una plantilla gratuita en local puedes ordenar tus tarifas sin pagar cuotas mensuales.\n\n" +
      "**Pasos accionables para aplicar hoy:**\n1. Anota tus diez tarifas.\n2. Dicta la nota tras la visita.\n3. Revisa siempre importes antes de enviar.",
  };

  const passRes = await evaluateWithSyntheticPymeJury(cleanDraft, {
    policy,
    llmFn: async () =>
      JSON.stringify({
        mondayActionability: 0.9,
        plainLanguage: 0.88,
        sovereigntyZeroEuro: 0.95,
        demandAlignment: 0.85,
        critique: "",
      }),
  });
  assert.equal(passRes.mode, "synthetic-jury-llm");
  assert.equal(passRes.passed, true);
  assert.ok(passRes.score >= 0.8);

  const failRes = await evaluateWithSyntheticPymeJury(cleanDraft, {
    policy,
    llmFn: async () =>
      JSON.stringify({
        mondayActionability: 0.5,
        plainLanguage: 0.6,
        sovereigntyZeroEuro: 0.5,
        demandAlignment: 0.6,
        critique: "Faltan ejemplos concretos de partidas reales de taller.",
      }),
  });
  assert.equal(failRes.passed, false);
  assert.ok(failRes.score < 0.8);
  assert.ok(failRes.critiques.some((c) => c.includes("partidas reales")));
});

test("Exogenous demand sensors parse GA4 product events and Google Search Console queries safely", async () => {
  const ga4Events = await fetchGa4ProductEvents("prop-123", "tok-abc", async () => ({
    ok: true,
    json: async () => ({
      rows: [
        { dimensionValues: [{ value: "maturity_diagnosis" }], metricValues: [{ value: "7" }] },
        { dimensionValues: [{ value: "recipe_copy" }], metricValues: [{ value: "4" }] },
        { dimensionValues: [{ value: "page_view" }], metricValues: [{ value: "99" }] },
      ],
    }),
  }));
  assert.deepEqual(ga4Events, {
    emo_insight_feedback: 0,
    emo_comment_submit: 0,
    maturity_diagnosis: 7,
    roi_calculation: 0,
    recipe_copy: 4,
  });

  const gscQueries = await fetchGscDemandQueries(
    "https://aievolutio.com/",
    "tok-abc",
    async () => ({
      ok: true,
      json: async () => ({
        rows: [
          {
            keys: ["ia gratis para facturas autonomos"],
            clicks: 2,
            impressions: 120,
            ctr: 0.0167,
            position: 11.4,
          },
          { keys: ["ai act pymes espana"], clicks: 5, impressions: 85, ctr: 0.0588, position: 6.2 },
        ],
      }),
    }),
    { startDate: "2026-11-01", endDate: "2026-11-27" },
  );
  assert.equal(gscQueries.length, 2);
  assert.equal(gscQueries[0].query, "ia gratis para facturas autonomos");
  assert.equal(gscQueries[0].impressions, 120);
  assert.equal(gscQueries[0].ctr, 1.7);
});
