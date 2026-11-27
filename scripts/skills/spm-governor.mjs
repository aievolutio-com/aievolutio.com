/**
 * scripts/skills/spm-governor.mjs
 * Capa 1 — Plano de Control Estratégico (Strategic Portfolio Management).
 * Impone cuotas duras por célula de decisión (Grow, Transform, Modernize, Compliance),
 * evita el secuestro del backlog por AIJuris (máx. 15 %) y garantiza diversidad
 * real en la cola técnica y en los ámbitos temáticos de AIEvolutio.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const defaultPolicyPath = path.join(process.cwd(), "content/spm-policy.json");

export const DEFAULT_SPM_POLICY = {
  version: "1.5.0",
  reviewCadenceDays: 7,
  rollingWindowPosts: 14,
  fitnessThreshold: 0.8,
  fitnessWeights: {
    mondayActionability: 0.35,
    plainLanguage: 0.25,
    sovereigntyZeroEuro: 0.25,
    demandAlignment: 0.15,
  },
  cells: {
    grow: { targetPct: 45, maxPct: 55, leadAuthors: ["AIVisio", "AIDux"] },
    transform: { targetPct: 25, maxPct: 35, leadAuthors: ["AIDux", "AIVisio"] },
    modernize: { targetPct: 15, maxPct: 25, leadAuthors: ["AIDux"] },
    compliance: { targetPct: 15, maxPct: 15, leadAuthors: ["AIJuris"] },
  },
  authorQuotas: {
    AIVisio: { minPct: 35, maxPct: 50 },
    AIDux: { minPct: 35, maxPct: 50 },
    AIJuris: { minPct: 10, maxPct: 15 },
  },
  techBufferDiversity: {
    minActive: 7,
    targetActive: 7,
    maxSameKind: 2,
    maxSameAgent: 3,
    requiredKinds: [
      "aiworker_recipe",
      "glossary_expansion",
      "article_diagram_enrichment",
      "article_faq_enrichment",
    ],
  },
  editorialDomains: [],
  antiSlop: {
    minFernandezHuerta: 48,
    bannedPhrases: [],
    bannedSourceDomains: ["vertexaisearch.cloud.google.com"],
    proprietaryToolsRequiringOpenAlternative: [],
    openAlternativeMarkers: ["0 €", "gratuit", "en local", "plantilla"],
  },
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadSpmPolicy(policyPath = defaultPolicyPath) {
  try {
    if (existsSync(policyPath)) {
      const parsed = JSON.parse(await readFile(policyPath, "utf8"));
      return {
        ...DEFAULT_SPM_POLICY,
        ...parsed,
        cells: { ...DEFAULT_SPM_POLICY.cells, ...(parsed.cells || {}) },
        authorQuotas: { ...DEFAULT_SPM_POLICY.authorQuotas, ...(parsed.authorQuotas || {}) },
        techBufferDiversity: {
          ...DEFAULT_SPM_POLICY.techBufferDiversity,
          ...(parsed.techBufferDiversity || {}),
        },
        antiSlop: { ...DEFAULT_SPM_POLICY.antiSlop, ...(parsed.antiSlop || {}) },
      };
    }
  } catch {
    // fallback determinista seguro
  }
  return DEFAULT_SPM_POLICY;
}

export function classifyPostCell(post) {
  if (post?.spmCell && ["grow", "transform", "modernize", "compliance"].includes(post.spmCell)) {
    return post.spmCell;
  }
  const text = normalize(`${post?.title || ""} ${post?.category || ""} ${post?.slug || ""}`);
  if (
    post?.author === "AIJuris" ||
    text.includes("ai act") ||
    text.includes("rgpd") ||
    text.includes("clausula") ||
    text.includes("semaforo legal") ||
    text.includes("reclamacion")
  ) {
    return "compliance";
  }
  if (
    text.includes("slm") ||
    text.includes("sobreprecio") ||
    text.includes("hardware") ||
    text.includes("mcp") ||
    text.includes("orquestacion") ||
    text.includes("arquitectura")
  ) {
    return "modernize";
  }
  if (
    text.includes("factura") ||
    text.includes("presupuesto") ||
    text.includes("aiworker") ||
    text.includes("receta") ||
    text.includes("tarifa") ||
    text.includes("automatiz")
  ) {
    return "transform";
  }
  return "grow";
}

export function computePortfolioState(existingPosts = [], policy = DEFAULT_SPM_POLICY) {
  const windowSize = Number(policy.rollingWindowPosts || 14);
  const sorted = [...existingPosts].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || "")),
  );
  const recent = sorted.slice(-windowSize);
  const total = recent.length || 1;

  const cellCounts = { grow: 0, transform: 0, modernize: 0, compliance: 0 };
  const authorCounts = { AIVisio: 0, AIDux: 0, AIJuris: 0 };

  for (const post of recent) {
    const cell = classifyPostCell(post);
    cellCounts[cell] = (cellCounts[cell] || 0) + 1;
    const author = ["AIVisio", "AIDux", "AIJuris"].includes(post.author) ? post.author : "AIDux";
    authorCounts[author]++;
  }

  const cellPct = {};
  const cellDeficit = {};
  for (const [cell, cfg] of Object.entries(policy.cells || DEFAULT_SPM_POLICY.cells)) {
    const pct = Math.round(((cellCounts[cell] || 0) / total) * 100);
    cellPct[cell] = pct;
    cellDeficit[cell] = Number(cfg.targetPct || 0) - pct;
  }

  const authorPct = {};
  for (const author of ["AIVisio", "AIDux", "AIJuris"]) {
    authorPct[author] = Math.round(((authorCounts[author] || 0) / total) * 100);
  }

  const complianceMax = Number(policy.cells?.compliance?.maxPct ?? 15);
  const aiJurisMax = Number(policy.authorQuotas?.AIJuris?.maxPct ?? 15);
  const aiJurisBlocked =
    recent.length >= 4 && (cellPct.compliance >= complianceMax || authorPct.AIJuris >= aiJurisMax);

  return {
    windowCount: recent.length,
    cellCounts,
    cellPct,
    cellDeficit,
    authorCounts,
    authorPct,
    aiJurisBlocked,
  };
}

export function selectNextSpmAssignment(
  existingPosts = [],
  policy = DEFAULT_SPM_POLICY,
  options = {},
) {
  const state = computePortfolioState(existingPosts, policy);
  const forcedAuthor = options.forcedAuthor || null;
  const recentTitlesText = existingPosts
    .slice(-6)
    .map((p) => normalize(`${p.title || ""} ${p.slug || ""}`))
    .join(" ");

  // 1. Elegir célula con mayor déficit respetando el tope duro de Compliance/AIJuris
  const candidateCells = Object.entries(policy.cells || DEFAULT_SPM_POLICY.cells)
    .filter(([cell]) => {
      if (cell === "compliance" && state.aiJurisBlocked && forcedAuthor !== "AIJuris") {
        return false;
      }
      return true;
    })
    .sort((a, b) => (state.cellDeficit[b[0]] || 0) - (state.cellDeficit[a[0]] || 0));

  const chosenCell = forcedAuthor === "AIJuris" ? "compliance" : candidateCells[0]?.[0] || "grow";

  // 2. Elegir autor respetando el tope estricto de AIJuris (<= 15 %)
  let chosenAuthor = forcedAuthor;
  if (!chosenAuthor || !["AIVisio", "AIDux", "AIJuris"].includes(chosenAuthor)) {
    const cellAuthors = policy.cells?.[chosenCell]?.leadAuthors || ["AIVisio", "AIDux"];
    const allowedAuthors = cellAuthors.filter((a) => !(a === "AIJuris" && state.aiJurisBlocked));
    const pool = allowedAuthors.length > 0 ? allowedAuthors : ["AIVisio", "AIDux"];
    pool.sort((a, b) => (state.authorPct[a] || 0) - (state.authorPct[b] || 0));
    chosenAuthor = pool[0];
  }

  // 3. Elegir dominio cotidiano menos cubierto recientemente para romper la cámara de eco
  const domains = Array.isArray(policy.editorialDomains) ? policy.editorialDomains : [];
  let chosenDomain = null;
  if (domains.length > 0) {
    const scored = domains.map((d) => {
      const hits = (d.keywords || []).reduce(
        (acc, kw) => acc + (recentTitlesText.includes(normalize(kw)) ? 1 : 0),
        0,
      );
      const cellBonus = d.cell === chosenCell ? -2 : 0;
      const authorBonus = d.preferredAuthor === chosenAuthor ? -1 : 0;
      const compliancePenalty = d.cell === "compliance" && state.aiJurisBlocked ? 10 : 0;
      return { domain: d, score: hits * 3 + cellBonus + authorBonus + compliancePenalty };
    });
    scored.sort((a, b) => a.score - b.score);
    chosenDomain = scored[0].domain;
  }

  return {
    cell: chosenCell,
    author: chosenAuthor,
    domain: chosenDomain,
    portfolioState: state,
    rationale: `Célula ${chosenCell} (déficit ${state.cellDeficit[chosenCell] || 0} %) · autor ${chosenAuthor} (${state.authorPct[chosenAuthor] || 0} % en ventana ${state.windowCount})${state.aiJurisBlocked ? " · cuota Compliance/AIJuris bloqueada (>=15 %)" : ""}`,
  };
}

export function checkTechQueueDiversity(activeItems = [], candidate, policy = DEFAULT_SPM_POLICY) {
  const div = policy.techBufferDiversity || DEFAULT_SPM_POLICY.techBufferDiversity;
  const maxSameKind = Number(div.maxSameKind || 2);
  const maxSameAgent = Number(div.maxSameAgent || 3);

  const kindCount = activeItems.filter((i) => i && i.kind === candidate?.kind).length;
  if (kindCount >= maxSameKind) {
    return {
      allowed: false,
      reason: `Cuota de diversidad técnica alcanzada para kind="${candidate.kind}" (${kindCount}/${maxSameKind})`,
    };
  }

  const agent = candidate?.leadAgent || candidate?.payload?.worker || "AIDux";
  const agentCount = activeItems.filter(
    (i) => i && (i.leadAgent || i.payload?.worker || "AIDux") === agent,
  ).length;
  if (agentCount >= maxSameAgent) {
    return {
      allowed: false,
      reason: `Cuota de diversidad de agente alcanzada para "${agent}" (${agentCount}/${maxSameAgent})`,
    };
  }

  return { allowed: true, reason: null };
}

export function getUnderrepresentedTechKinds(activeItems = [], policy = DEFAULT_SPM_POLICY) {
  const div = policy.techBufferDiversity || DEFAULT_SPM_POLICY.techBufferDiversity;
  const requiredKinds = Array.isArray(div.requiredKinds)
    ? div.requiredKinds
    : DEFAULT_SPM_POLICY.techBufferDiversity.requiredKinds;
  const maxSameKind = Number(div.maxSameKind || 2);
  const counts = new Map(requiredKinds.map((k) => [k, 0]));
  for (const item of activeItems) {
    if (item && counts.has(item.kind)) {
      counts.set(item.kind, counts.get(item.kind) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c < maxSameKind)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);
}
