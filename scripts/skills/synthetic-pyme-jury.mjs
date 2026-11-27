/**
 * scripts/skills/synthetic-pyme-jury.mjs
 * Capa 3B — Evaluador Adversarial (Jurado Sintético Pyme) y Función de Aptitud F.
 *
 * F = 0.35 * S_accionabilidad_lunes + 0.25 * S_llaneza_lenguaje
 *   + 0.25 * S_soberania_0_euros + 0.15 * S_demanda - P_slop
 *
 * Exige F >= 0.80 para entrar en el buffer o publicarse en producción.
 */

import { repairTruncatedJson } from "../json-repair.mjs";
import { DEFAULT_SPM_POLICY } from "./spm-governor.mjs";
import { lintArticleAntiSlop } from "./anti-slop-linter.mjs";

export const JURY_PERSONAS = [
  {
    id: "dueno-taller",
    name: "Carlos, dueño de taller mecánico sin tiempo",
    lens: "Busca pasos concretos aplicables el lunes a las 08:00 sin tecnicismos ni comprar software caro.",
  },
  {
    id: "comercio-local",
    name: "Marta, autónoma de comercio local",
    lens: "Rechaza el humo corporativo y exige claridad inmediata, cercanía humana y soluciones gratuitas o sencillas.",
  },
  {
    id: "asesor-fiscal",
    name: "Javier, asesor fiscal y laboral pragmático",
    lens: "Verifica privacidad RGPD, ausencia de cifras inventadas y realismo operativo para pequeñas empresas españolas.",
  },
];

function clamp01(val, fallback = 0.75) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

export function computeFitnessScore(components, slopPenalty = 0, policy = DEFAULT_SPM_POLICY) {
  const w = policy?.fitnessWeights || DEFAULT_SPM_POLICY.fitnessWeights;
  const raw =
    Number(w.mondayActionability ?? 0.35) * clamp01(components.mondayActionability) +
    Number(w.plainLanguage ?? 0.25) * clamp01(components.plainLanguage) +
    Number(w.sovereigntyZeroEuro ?? 0.25) * clamp01(components.sovereigntyZeroEuro) +
    Number(w.demandAlignment ?? 0.15) * clamp01(components.demandAlignment) -
    Number(slopPenalty || 0);
  return Math.round(Math.max(0, Math.min(1, raw)) * 1000) / 1000;
}

export function heuristicEvaluateArticle(article, antiSlopResult, policy = DEFAULT_SPM_POLICY) {
  const body = String(article?.body || "");
  const lower = body.toLowerCase();
  const hasSteps = /\*\*pasos accionables para aplicar hoy:\*\*/i.test(body);
  const hasNumberedSteps = /\n1\.\s+/.test(body) && /\n2\.\s+/.test(body) && /\n3\.\s+/.test(body);
  const hasClarity = Boolean(article?.clarityNote && /^en 30 segundos:/i.test(article.clarityNote));
  const hasZeroEuro = /0\s*€|gratuit|en local|software libre|abiert|sin cuota|plantilla/i.test(
    lower,
  );
  const hasEverydayAnalogy =
    /taller|oficina|carpeta|estanter|despacho|cliente|factura|presupuesto|hogar|familia|mayor|comercio/i.test(
      lower,
    );

  const mondayActionability =
    0.45 + (hasSteps ? 0.25 : 0) + (hasNumberedSteps ? 0.2 : 0) + (hasClarity ? 0.1 : 0);
  const plainLanguage =
    antiSlopResult.readabilityScore >= 58
      ? 0.92
      : antiSlopResult.readabilityScore >= 48
        ? 0.84
        : 0.62;
  const sovereigntyZeroEuro = antiSlopResult.proprietaryWithoutOpen
    ? 0.2
    : hasZeroEuro
      ? 0.92
      : 0.72;
  const demandAlignment = hasEverydayAnalogy ? 0.88 : 0.7;

  const components = {
    mondayActionability: clamp01(mondayActionability),
    plainLanguage: clamp01(plainLanguage),
    sovereigntyZeroEuro: clamp01(sovereigntyZeroEuro),
    demandAlignment: clamp01(demandAlignment),
  };
  const score = computeFitnessScore(components, antiSlopResult.slopPenalty, policy);
  const threshold = Number(policy?.fitnessThreshold ?? 0.8);
  return {
    mode: "deterministic-fallback",
    score,
    threshold,
    passed: antiSlopResult.passed && score >= threshold,
    components,
    verdicts: [],
    critiques: antiSlopResult.issues.slice(),
  };
}

export async function evaluateWithSyntheticPymeJury(article, options = {}) {
  const policy = options.policy || DEFAULT_SPM_POLICY;
  const llmFn = options.llmFn || null;
  const antiSlop = lintArticleAntiSlop(article, policy);
  const threshold = Number(policy?.fitnessThreshold ?? 0.8);

  // Veto determinista inmediato si falla Gate 1 Anti-Slop (ahorra llamadas al LLM)
  if (!antiSlop.passed && !options.forceLlmOnSlop) {
    const heuristic = heuristicEvaluateArticle(article, antiSlop, policy);
    return {
      ...heuristic,
      passed: false,
      antiSlop,
      critiques: antiSlop.issues,
    };
  }

  if (!llmFn) {
    const heuristic = heuristicEvaluateArticle(article, antiSlop, policy);
    return { ...heuristic, antiSlop };
  }

  const excerptBody = String(article?.body || "").slice(0, 3800);
  const evaluations = await Promise.all(
    JURY_PERSONAS.map(async (persona) => {
      const prompt = `Eres ${persona.name}. ${persona.lens}
Evalúa con rigor escéptico este borrador de AIEvolutio para pymes en España:
TÍTULO: ${article?.title || ""}
RESUMEN 30s: ${article?.clarityNote || ""}
TEXTO (extracto):
${excerptBody}

Puntúa de 0.0 a 1.0 cada criterio (sé exigente: penaliza si suena a humo corporativo o teoría abstracta):
- mondayActionability: ¿puedo aplicar algo útil el lunes por la mañana en menos de una tarde?
- plainLanguage: ¿habla en lenguaje claro de calle sin jerga innecesaria ni frases hechas de IA?
- sovereigntyZeroEuro: ¿prioriza opciones gratuitas, abiertas o en local frente a suscripciones caras?
- demandAlignment: ¿resuelve un dolor real y cotidiano de un autónomo, pyme o ciudadano?

Responde SOLO con JSON válido:
{"mondayActionability":0.0,"plainLanguage":0.0,"sovereigntyZeroEuro":0.0,"demandAlignment":0.0,"critique":"crítica concreta en 1 frase si hay algún fallo o vacío"}`;
      try {
        const raw = await llmFn(prompt);
        if (!raw) return null;
        const parsed = repairTruncatedJson(typeof raw === "string" ? raw : raw.text);
        if (!parsed) return null;
        return {
          persona: persona.id,
          mondayActionability: clamp01(parsed.mondayActionability, 0.75),
          plainLanguage: clamp01(parsed.plainLanguage, 0.75),
          sovereigntyZeroEuro: clamp01(parsed.sovereigntyZeroEuro, 0.75),
          demandAlignment: clamp01(parsed.demandAlignment, 0.75),
          critique: String(parsed.critique || "").trim(),
        };
      } catch {
        return null;
      }
    }),
  );

  const validVerdicts = evaluations.filter(Boolean);
  if (validVerdicts.length === 0) {
    const heuristic = heuristicEvaluateArticle(article, antiSlop, policy);
    return { ...heuristic, antiSlop };
  }

  const avg = (key) =>
    validVerdicts.reduce((acc, v) => acc + Number(v[key] || 0), 0) / validVerdicts.length;
  const components = {
    mondayActionability: clamp01(avg("mondayActionability")),
    plainLanguage: clamp01(avg("plainLanguage")),
    sovereigntyZeroEuro: clamp01(avg("sovereigntyZeroEuro")),
    demandAlignment: clamp01(avg("demandAlignment")),
  };
  const score = computeFitnessScore(components, antiSlop.slopPenalty, policy);
  const critiques = [
    ...antiSlop.issues,
    ...validVerdicts
      .filter(
        (v) =>
          v.critique &&
          (score < threshold || v.mondayActionability < 0.75 || v.plainLanguage < 0.75),
      )
      .map((v) => `[Jurado ${v.persona}] ${v.critique}`),
  ];

  return {
    mode: "synthetic-jury-llm",
    score,
    threshold,
    passed: antiSlop.passed && score >= threshold,
    components,
    verdicts: validVerdicts,
    critiques,
    antiSlop,
  };
}
