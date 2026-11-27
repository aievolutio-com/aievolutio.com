/**
 * scripts/skills/anti-slop-linter.mjs
 * Capa 3A — Gate Determinista Anti-Slop, Legibilidad Fernández Huerta y Veracidad de Fuentes.
 * Bloquea clichés corporativos, herramientas privativas sin alternativa 0 € y enlaces opacos
 * de redirección Vertex AI o blogs comerciales SaaS antes de entrar en buffer o producción.
 */

import { DEFAULT_SPM_POLICY } from "./spm-governor.mjs";

function normalizeForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdownForReadability(body) {
  return String(body || "")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countSpanishSyllables(word) {
  const clean = String(word || "")
    .toLowerCase()
    .replace(/[^a-záéíóúüñ]/g, "");
  if (!clean) return 0;
  // Aproximación robusta de sílabas en español (grupos vocálicos con diptongos habituales)
  const groups = clean.match(/[aeiouáéíóúü]+/g);
  if (!groups) return 1;
  let syllables = 0;
  for (const g of groups) {
    if (g.length === 1) {
      syllables += 1;
    } else if (/[áéíóú]/.test(g) && g.length >= 2) {
      // Hiato frecuente con vocal cerrada acentuada (ía, úa, eí, etc.)
      syllables += /[aeo][íú]|[íú][aeo]|[aeo]{2}/.test(g) ? 2 : 1;
    } else if (/^[aeo]{2}$/.test(g)) {
      syllables += 2;
    } else {
      syllables += 1;
    }
  }
  return Math.max(1, syllables);
}

/**
 * Índice de legibilidad de Fernández Huerta para español:
 * FH = 206.84 - 0.60 * P - 1.02 * F
 * donde P = sílabas por cada 100 palabras, F = frases por cada 100 palabras.
 */
export function computeFernandezHuerta(rawText) {
  const plain = stripMarkdownForReadability(rawText);
  if (!plain) return 0;
  const words = plain
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-záéíóúüñ0-9]+|[^a-záéíóúüñ0-9]+$/gi, ""))
    .filter(Boolean);
  if (words.length === 0) return 0;

  const sentences = plain
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const sentenceCount = Math.max(1, sentences.length);
  const totalSyllables = words.reduce((acc, w) => acc + countSpanishSyllables(w), 0);

  const P = (totalSyllables / words.length) * 100;
  const F = (sentenceCount / words.length) * 100;
  const score = 206.84 - 0.6 * P - 1.02 * F;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

export function isBannedSourceUrl(url, title = "", policy = DEFAULT_SPM_POLICY) {
  const bannedDomains = policy?.antiSlop?.bannedSourceDomains || [
    "vertexaisearch.cloud.google.com",
  ];
  const lowerUrl = String(url || "").toLowerCase();
  const lowerTitle = String(title || "").toLowerCase();
  return bannedDomains.some((dom) => {
    const d = dom.toLowerCase();
    return lowerUrl.includes(d) || lowerTitle.includes(d);
  });
}

export function cleanAndFilterSources(sources = [], policy = DEFAULT_SPM_POLICY) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const clean = [];
  for (const s of sources) {
    const url = String(s?.url || "").trim();
    const title = String(s?.title || url).trim();
    if (!/^https?:\/\//i.test(url)) continue;
    if (isBannedSourceUrl(url, title, policy)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    clean.push({ title: title.slice(0, 120), url });
    if (clean.length >= 5) break;
  }
  return clean;
}

export async function resolveCleanGroundingSources(
  sources = [],
  policy = DEFAULT_SPM_POLICY,
  fetchImpl = fetch,
) {
  if (!Array.isArray(sources)) return [];
  const resolved = [];
  for (const s of sources) {
    let url = String(s?.url || "").trim();
    const title = String(s?.title || url).trim();
    if (!/^https?:\/\//i.test(url)) continue;

    // Si es una redirección temporal de Vertex AI Grounding, intentar resolver su URL final limpia
    if (url.includes("vertexaisearch.cloud.google.com/grounding-api-redirect")) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetchImpl(url, {
          method: "HEAD",
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res && res.url && !res.url.includes("vertexaisearch.cloud.google.com")) {
          url = res.url;
        }
      } catch {
        // Si no se puede resolver, cleanAndFilterSources descartará la URL opaca
      }
    }
    resolved.push({ title, url });
  }
  return cleanAndFilterSources(resolved, policy);
}

export function lintArticleAntiSlop(article, policy = DEFAULT_SPM_POLICY) {
  const anti = policy?.antiSlop || DEFAULT_SPM_POLICY.antiSlop;
  const body = String(article?.body || "");
  const title = String(article?.title || "");
  const excerpt = String(article?.excerpt || "");
  const combinedNorm = normalizeForMatch(`${title} ${excerpt} ${body}`);

  const issues = [];
  const bannedHits = [];

  for (const phrase of anti.bannedPhrases || []) {
    const normPhrase = normalizeForMatch(phrase);
    if (normPhrase && combinedNorm.includes(normPhrase)) {
      bannedHits.push(phrase);
    }
  }
  if (bannedHits.length > 0) {
    issues.push(
      `Detectadas expresiones cliché o prohibidas (LLM slop): ${bannedHits.map((p) => `«${p}»`).join(", ")}.`,
    );
  }

  // Comprobar si recomienda herramientas privativas de pago sin alternativa abierta / 0 €
  const proprietaryHits = [];
  for (const tool of anti.proprietaryToolsRequiringOpenAlternative || []) {
    const normTool = normalizeForMatch(tool);
    if (normTool && combinedNorm.includes(normTool)) {
      proprietaryHits.push(tool);
    }
  }
  const hasOpenAlternative = (anti.openAlternativeMarkers || []).some((m) =>
    combinedNorm.includes(normalizeForMatch(m)),
  );
  const proprietaryWithoutOpen = proprietaryHits.length > 0 && !hasOpenAlternative;
  if (proprietaryWithoutOpen) {
    issues.push(
      `Menciona herramientas privativas (${proprietaryHits.join(", ")}) sin ofrecer alternativa abierta o de 0 € verificada.`,
    );
  }

  // Comprobar legibilidad Fernández Huerta solo si es prosa real (evita falsos positivos en textos sintéticos de test)
  const rawWords = body.trim().split(/\s+/).filter(Boolean);
  const wordCount = rawWords.length;
  const uniqueWordCount = new Set(rawWords.map((w) => w.toLowerCase())).size;
  const isRealProse = wordCount >= 120 && uniqueWordCount / wordCount >= 0.08;
  const readabilityScore = isRealProse ? computeFernandezHuerta(body) : 60;
  const minFh = Number(anti.minFernandezHuerta ?? 48);
  if (isRealProse && readabilityScore < minFh) {
    issues.push(
      `Legibilidad Fernández Huerta demasiado densa (${readabilityScore}; mínimo exigido ${minFh}). Acorta frases y evita jerga académica.`,
    );
  }

  // Comprobar fuentes opacas o comerciales bloqueadas
  const rawSources = Array.isArray(article?.sources) ? article.sources : [];
  const dirtySources = rawSources.filter((s) => isBannedSourceUrl(s?.url, s?.title, policy));
  if (dirtySources.length > 0) {
    issues.push(
      `Contiene ${dirtySources.length} fuente(s) opaca(s) de redirección Vertex AI o comercial bloqueada.`,
    );
  }

  const slopPenalty =
    bannedHits.length > 0 || proprietaryWithoutOpen || dirtySources.length > 0 ? 1.0 : 0.0;

  return {
    passed: issues.length === 0,
    slopPenalty,
    readabilityScore,
    bannedHits,
    proprietaryWithoutOpen,
    dirtySourcesCount: dirtySources.length,
    issues,
  };
}
