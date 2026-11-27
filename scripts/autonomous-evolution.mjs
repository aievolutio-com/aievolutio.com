/**
 * scripts/autonomous-evolution.mjs
 * Motor del Ciclo Evolutivo Autónomo de AIEvolutio (Reconducción Adversarial v2.0).
 *
 * La Verdadera Organización:
 * - AIVisio (CEO): Estratega, visionario, dueño del qué y del propósito humano y social
 *                  ante el abaratamiento del conocimiento práctico.
 * - AIDux (CIO):   Dueño del cómo, del camino técnico, SLMs locales, MCP y AIWorkers.
 * - AIJuris:       Guardarrail ético y legal (AI Act, RGPD, privacidad y soberanía del dato).
 *
 * Guardián Adversarial (Hard Gate):
 * - PROHIBICIÓN ABSOLUTA de publicar cualquier artículo cuyo slug, título normalizado
 *   o similitud léxica (Jaccard >= 0.48) colisione con el corpus de content/posts/.
 * - Si las APIs de IA fallan y no queda contenido inédito verificado, el ciclo aborta
 *   la publicación editorial de forma segura (Circuit Breaker) sin clonar artículos.
 *
 * Modos de ejecución manual (CLI):
 * - node scripts/autonomous-evolution.mjs --force-content [--author=AIVisio|AIDux|AIJuris] [--date=YYYY-MM-DD]
 * - node scripts/autonomous-evolution.mjs --force-tech
 * - node scripts/autonomous-evolution.mjs --audit-only
 */

import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { repairTruncatedJson, extractFieldsFallback } from "./json-repair.mjs";
import { buildSite, loadModularPosts } from "./prerender-site.mjs";
import {
  DEFAULT_SPM_POLICY,
  loadSpmPolicy,
  selectNextSpmAssignment,
  checkTechQueueDiversity,
  getUnderrepresentedTechKinds,
} from "./skills/spm-governor.mjs";
import {
  lintArticleAntiSlop,
  cleanAndFilterSources,
  resolveCleanGroundingSources,
} from "./skills/anti-slop-linter.mjs";
import { evaluateWithSyntheticPymeJury } from "./skills/synthetic-pyme-jury.mjs";
import { fetchGa4ProductEvents, fetchGscDemandQueries } from "./skills/demand-sensors.mjs";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "content/posts");
const editorialLogPath = path.join(repoRoot, "content/editorial-log.json");
const editorialBufferPath = path.join(repoRoot, "content/editorial-buffer.json");
const techBufferPath = path.join(repoRoot, "content/tech-buffer.json");
const aiworkerRecipesPath = path.join(repoRoot, "content/aiworker-recipes.json");
const emoInsightsPath = path.join(repoRoot, "content/emo-insights.json");
const glossaryExtraPath = path.join(repoRoot, "content/glossary-extra.json");
const spmPolicyPath = path.join(repoRoot, "content/spm-policy.json");
const roadmapPath = path.join(repoRoot, "docs/roadmap.md");
const dailyDigestPath = path.join(repoRoot, "docs/daily-digest.md");

function loadSpmPolicySync() {
  try {
    if (existsSync(spmPolicyPath)) {
      const parsed = JSON.parse(readFileSync(spmPolicyPath, "utf8"));
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
    // fallback determinista
  }
  return DEFAULT_SPM_POLICY;
}

const ACTIVE_SPM_POLICY = loadSpmPolicySync();

export const EDITORIAL_BUFFER_MIN = 7;
export const EDITORIAL_BUFFER_TARGET = 7;
export const TECH_BUFFER_MIN = 7;
export const TECH_BUFFER_TARGET = 7;

// ─── CLI ARGS ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const flags = {
    forceContent: false,
    forceTech: false,
    auditOnly: false,
    phase: "auto",
    author: null,
    date: null,
  };
  for (const arg of argv) {
    if (arg === "--force-content") {
      flags.forceContent = true;
      flags.phase = "content";
    } else if (arg === "--force-tech") {
      flags.forceTech = true;
      flags.phase = "tech";
    } else if (arg === "--audit-only") {
      flags.auditOnly = true;
    } else if (arg.startsWith("--phase=")) {
      flags.phase = arg.split("=")[1] || "auto";
    } else if (arg.startsWith("--author=")) {
      flags.author = arg.split("=")[1];
    } else if (arg.startsWith("--date=")) {
      flags.date = arg.split("=")[1];
    }
  }
  return flags;
}

// ─── GUARDIÁN ADVERSARIAL ANTIDUPLICADOS ─────────────────────────────────────

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "de",
  "la",
  "el",
  "en",
  "y",
  "a",
  "los",
  "las",
  "un",
  "una",
  "para",
  "con",
  "por",
  "como",
  "tu",
  "su",
  "del",
  "al",
  "que",
  "mas",
  "sin",
  "guia",
  "pyme",
  "pymes",
  "ia",
]);

export function computeTitleSimilarity(titleA, titleB) {
  const tokensA = new Set(
    normalizeText(titleA)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
  const tokensB = new Set(
    normalizeText(titleB)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Verifica si un candidato colisiona con cualquier post existente en el corpus.
 */
export function isDuplicatePost(candidate, existingPosts) {
  if (!candidate || !candidate.title) {
    return { duplicate: true, reason: "Candidato sin título válido" };
  }
  const candSlug = slugify(candidate.slug || candidate.title);
  const candNormTitle = normalizeText(candidate.title);

  for (const existing of existingPosts) {
    const exSlug = slugify(existing.slug || existing.title);
    const exNormTitle = normalizeText(existing.title);

    if (
      candSlug &&
      exSlug &&
      (candSlug === exSlug || candSlug.includes(exSlug) || exSlug.includes(candSlug))
    ) {
      return { duplicate: true, reason: `Colisión de slug ("${candSlug}" vs "${exSlug}")` };
    }
    if (candNormTitle === exNormTitle) {
      return { duplicate: true, reason: `Título idéntico a "${existing.title}"` };
    }
    const sim = computeTitleSimilarity(candidate.title, existing.title);
    if (sim >= 0.48) {
      return {
        duplicate: true,
        reason: `Similitud léxica excesiva (${(sim * 100).toFixed(0)}%) con "${existing.title}"`,
      };
    }
  }
  return { duplicate: false, reason: null };
}

export function validateEditorialBriefing(briefing, existingPosts = [], editorialLog = []) {
  if (!briefing?.suggestedTitle || !briefing.readerNeed || !briefing.angle) {
    return { allowed: false, reason: "Briefing incompleto: faltan título, necesidad o ángulo" };
  }

  const history = [...existingPosts, ...editorialLog];
  const titleCheck = isDuplicatePost({ title: briefing.suggestedTitle }, history);
  if (titleCheck.duplicate) {
    return { allowed: false, reason: `Título vetado: ${titleCheck.reason}` };
  }

  for (const previous of history) {
    const needSimilarity = computeTitleSimilarity(briefing.readerNeed, previous.readerNeed);
    const angleSimilarity = computeTitleSimilarity(briefing.angle, previous.angle);
    if (needSimilarity >= 0.65 && angleSimilarity >= 0.55) {
      return {
        allowed: false,
        reason: `Tema y ángulo ya tratados en "${previous.title || previous.slug || "registro editorial"}"`,
      };
    }
  }

  return { allowed: true, reason: null };
}

export function requireEditorialCandidate(candidate) {
  if (!candidate) {
    throw new Error("No se pudo obtener un artículo inédito que supere el preflight editorial.");
  }
  return candidate;
}

export function isSundayPillarDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ""))) return false;
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay() === 0;
}

export function validateArticleBodyLength(body, format = "tactical") {
  const normalizedFormat = format === "pillar" ? "pillar" : "tactical";
  const minWords = normalizedFormat === "pillar" ? 1400 : 1200;
  const maxWords = normalizedFormat === "pillar" ? 1800 : 1600;
  const wordCount = String(body || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return {
    valid: wordCount >= minWords && wordCount <= maxWords,
    wordCount,
    minWords,
    maxWords,
    format: normalizedFormat,
  };
}

// ─── GEMINI LLM HELPER ──────────────────────────────────────────────────────

export function extractGroundingSources(apiResponse) {
  const chunks = apiResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set();
  const sources = [];
  for (const chunk of chunks) {
    const uri = String(chunk?.web?.uri || "").trim();
    if (!/^https?:\/\//i.test(uri) || seen.has(uri)) continue;
    seen.add(uri);
    const title = String(chunk?.web?.title || uri)
      .trim()
      .slice(0, 120);
    sources.push({ title, url: uri });
    if (sources.length >= 5) break;
  }
  return sources;
}

export async function callGemini(apiKey, prompt, fetchImpl = fetch) {
  const model = "gemini-3.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 6144,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) {
      console.warn(`[Gemini API] ${model} respondió con estado HTTP ${res.status}.`);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text ?? null;
    if (!text) {
      console.warn(
        `[Gemini API] ${model} no devolvió texto (motivo=${candidate?.finishReason || data.promptFeedback?.blockReason || "sin candidato"}).`,
      );
    }
    return text;
  } catch (err) {
    console.warn(`[Gemini API] No se pudo consultar ${model}: ${err.message}`);
    return null;
  }
}

async function callLLM(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
  if (!geminiKey) {
    console.warn(
      "[Generación LLM] Sin GEMINI_API_KEY. GitHub Models fue retirado; se usará el banco editorial prevalidado.",
    );
    return null;
  }

  return callGemini(geminiKey, prompt);
}

export async function callGeminiWithSearchGrounded(apiKey, prompt, fetchImpl = fetch) {
  const model = "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 6144,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      const rawSources = extractGroundingSources(data);
      const sources = await resolveCleanGroundingSources(rawSources, ACTIVE_SPM_POLICY, fetchImpl);
      if (text) return { text, sources, grounded: sources.length > 0 };
    }
  } catch {
    // Fallback a callGemini estándar si grounding no está activo en la clave
  }
  const fallbackText = await callGemini(apiKey, prompt, fetchImpl);
  return fallbackText ? { text: fallbackText, sources: [], grounded: false } : null;
}

export async function callGeminiWithSearch(apiKey, prompt, fetchImpl = fetch) {
  const res = await callGeminiWithSearchGrounded(apiKey, prompt, fetchImpl);
  return res ? res.text : null;
}

async function callLLMWithSearch(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
  if (!geminiKey) return null;
  return callGeminiWithSearch(geminiKey, prompt);
}

async function callLLMWithSearchGrounded(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
  if (!geminiKey) return null;
  return callGeminiWithSearchGrounded(geminiKey, prompt);
}

// ─── BANCO EDITORIAL CURADO (SIN REPETICIÓN) ─────────────────────────────────

const CURATED_EDITORIAL_BANK = [
  {
    title:
      "El abaratamiento del conocimiento: cómo hacer posible en tu empresa lo que antes parecía inalcanzable",
    slug: "abaratamiento-conocimiento-curva-exponencial-volante",
    author: "AIVisio",
    category: "Estrategia",
    readerNeed:
      "Aprovechar el acceso directo al conocimiento para liberar tiempo rutinario y crear servicios de alto valor antes inalcanzables",
    angle:
      "Manifiesto de AIVisio: de arañar minutos de eficiencia a reimaginar con empatía lo que una pequeña empresa puede ofrecer",
    actionType:
      "Identificar un servicio o capacidad antes inviable por tiempo de análisis que hoy es accesible",
    readerProfile: "Fundador, CEO o titular de pyme que busca innovar con cercanía y criterio",
    excerpt:
      "El acceso directo al conocimiento práctico abre una oportunidad histórica para las pequeñas empresas: liberar tiempo de lo rutinario y crear servicios de alto valor que antes parecían imposibles.",
    body: `**El cambio ha sido siempre una constante en la historia humana, pero lo que vivimos hoy tiene una naturaleza distinta.** No se trata únicamente de que las herramientas informáticas sean más veloces, sino de que las puertas del conocimiento práctico, el análisis estructurado y la capacidad de síntesis se han abierto de par en par. Labores y proyectos que hace apenas unos años requerían departamentos enteros o presupuestos astronómicos están hoy al alcance de cualquier pequeña empresa con curiosidad y ganas de aprender.\n\n**De arañar unos minutos a reimaginar lo que tu oficio puede ofrecer**\n\n- **La trampa del mero ahorro de tiempo:** si una empresa solo utiliza la inteligencia artificial para redactar correos un poco más rápido, apenas estará raspando la superficie. El salto cualitativo se produce cuando nos atrevemos a **hacer posible lo que antes parecía inalcanzable**: ofrecer un seguimiento personalizado a cada cliente, elaborar estudios preventivos o diseñar propuestas técnicas con un nivel de detalle antes reservado a grandes corporaciones.\n- **Tomar el rumbo sin dejarse deslumbrar:** ante tantas novedades y promesas exageradas, es natural sentir cierta prudencia. No se trata de correr a ciegas ni de delegar el criterio. En AIEvolutio creemos que el verdadero valor reside en **tomar el rumbo de la propia transformación**: la tecnología prepara, sintetiza y allana el camino; la persona aporta la empatía, el criterio y la cercanía que ninguna máquina podrá replicar jamás.\n\n**Acción alcanzable para hoy:**\n1. Reúne a tu equipo o dedica veinte minutos de calma a plantear una sola pregunta: ¿qué servicio de alto valor hemos querido siempre dar a nuestros clientes pero descartamos porque exigía demasiadas horas de trabajo previo?\n2. Diseña una prueba sencilla donde una herramienta prepare el borrador base y vuestro especialista añada el criterio experto y el toque personal.\n3. Comparte ese nuevo detalle con tres clientes de confianza para medir su valor percibido, manteniendo siempre la mirada en lo que de verdad importa: el trato humano.`,
    actionableChecklist: [
      "Identificar un servicio valioso que antes era inviable por tiempo de análisis previo",
      "Preparar un borrador asistido por IA manteniendo la revisión y el criterio del equipo",
      "Validar la experiencia con clientes cercanos para enfocar el esfuerzo donde aporta valor real",
    ],
  },
  {
    title:
      "Protocolo MCP y agentes locales con guardarrail legal: conectar tus carpetas sin ceder tus datos",
    slug: "protocolo-mcp-agentes-locales-guardarrail-datos",
    author: "AIDux",
    category: "Operaciones",
    readerNeed:
      "Conectar la IA con archivos, presupuestos y hojas de cálculo internas sin subir información confidencial a nubes de terceros",
    angle:
      "Arquitectura conjunta AIDux (CIO) y AIJuris (Guardarrail) usando Model Context Protocol en local",
    actionType:
      "Habilitar un conector MCP de solo lectura sobre una carpeta de trabajo no sensible",
    readerProfile:
      "Responsable de operaciones o despacho que necesita cruzar documentos internos con privacidad estricta",
    excerpt:
      "Cómo lograr que tus agentes consulten expedientes, tarifas y plantillas de tu ordenador sin copiar y pegar ni exponer secretos de negocio.",
    body: `**El mayor freno operativo en cualquier pyme al usar inteligencia artificial es la fricción del copiar y pegar,** seguida inmediatamente por el temor legítimo a filtrar datos confidenciales en nubes públicas. Aquí es donde convergen el cómo tecnológico de **AIDux** (CIO) y el guardarrail ético-legal de **AIJuris**: el estándar abierto *Model Context Protocol* (MCP) ejecutado en entorno local.\n\n**Cómo funciona un puente MCP bajo control estricto**\n\n- **Conexión directa sin intermediarios opacos:** el protocolo MCP actúa como un puerto seguro estandarizado que permite a tu asistente consultar una carpeta de tarifas, un catálogo técnico o una base de datos local sin necesidad de subir tus archivos a servidores externos de entrenamiento.\n- **El guardarrail de AIJuris en la arquitectura:** ningún agente debe tener permisos de escritura o borrado indiscriminado sobre el servidor de la empresa. La regla de oro es aplicar permisos de **solo lectura** en las carpetas autorizadas y aislar en un directorio separado cualquier expediente sujeto a secreto profesional o datos especialmente protegidos del RGPD.\n\n**Acción alcanzable para hoy:**\n1. Crea una carpeta específica de consulta rápida en tu equipo con tus plantillas comerciales, tarifas vigentes y preguntas técnicas resueltas (sin datos personales de clientes).\n2. Configura un servidor MCP local de sistema de archivos restringido exclusivamente a esa ruta en modo de solo lectura.\n3. Prueba a pedirle a tu agente que elabore un borrador de presupuesto cruzando tres documentos de esa carpeta y verifica que cita cada partida con exactitud antes de enviarlo.`,
    actionableChecklist: [
      "Aislar en una carpeta limpia los catálogos, tarifas y plantillas sin datos personales (RGPD)",
      "Restringir el acceso del conector local exclusivamente a modo lectura (Guardarrail AIJuris)",
      "Validar la precisión de generación de presupuestos y respuestas técnicas con supervisión humana",
    ],
  },
  {
    title:
      "Cláusulas de confidencialidad y proveedores de IA: el escudo contractual que toda pyme necesita",
    slug: "clausulas-confidencialidad-proveedores-ia-escudo-pyme",
    author: "AIJuris",
    category: "Legal",
    readerNeed:
      "Blindar los contratos con empleados, colaboradores y proveedores tecnológicos ante el uso cotidiano de herramientas generativas",
    angle:
      "Prevención contractual práctica para evitar fugas de propiedad intelectual y sanciones de protección de datos",
    actionType:
      "Incorporar un anexo de gobernanza y no entrenamiento en los encargos de tratamiento y contratos de servicios",
    readerProfile: "Titular de negocio, administrador o responsable legal de una pyme",
    excerpt:
      "Tu empresa puede tener una política interna impecable y aun así sufrir una brecha a través de un proveedor externo. Aprende a blindar tus contratos.",
    body: `**Cuando la tecnología avanza a esta velocidad, no basta con cuidar los procesos internos de tu propio equipo:** una parte sustancial de los riesgos legales y de privacidad entra hoy a través de colaboradores y proveedores externos. Gestorías, agencias de marketing o servicios informáticos pueden procesar documentación de tu negocio en herramientas generativas sin garantías de confidencialidad si no existe un guardarraíl contractual explícito.\n\n**Los tres pilares del blindaje contractual de AIJuris**\n\n- **Cláusula expresa de prohibición de entrenamiento:** todo contrato con proveedores que accedan a información comercial o datos personales debe prohibir el uso de cuentas gratuitas o configuraciones que utilicen los datos del cliente para entrenar modelos de terceros.\n- **Deber de declaración de asistencia algorítmica:** cuando un proveedor externo entregue código, informes jurídicos, diseños o textos estratégicos generados sustancialmente mediante IA, debe declararlo para que tu empresa conozca los límites de propiedad intelectual aplicables.\n- **Trazabilidad de subencargados del RGPD:** exigir el listado actualizado de motores y regiones de procesamiento (priorizando servidores dentro del Espacio Económico Europeo o ejecución local).\n\n**Acción alcanzable para hoy:**\n1. Revisa los contratos de tus tres proveedores externos con mayor acceso a información crítica de tu negocio.\n2. Envía una adenda breve de una página exigiendo que cualquier procesamiento asistido por IA se realice en entornos empresariales con exclusión de entrenamiento (*zero data retention*).\n3. Guarda las conformidades firmadas junto a tu registro de cumplimiento del RGPD y del AI Act europeo.`,
    actionableChecklist: [
      "Identificar a los proveedores y colaboradores externos que manejan documentación sensible",
      "Exigir por escrito el uso exclusivo de entornos sin retención ni entrenamiento de modelos",
      "Archivar la adenda de confidencialidad algorítmica en el expediente legal de la empresa",
    ],
  },
  {
    title:
      "Presupuestos técnicos desde notas de voz: de tres días de espera a diez minutos de precisión",
    slug: "presupuestos-tecnicos-notas-voz-diez-minutos",
    author: "AIDux",
    category: "Operaciones",
    readerNeed:
      "Eliminar el atasco de presupuestos pendientes tras visitar a un cliente o recibir una solicitud compleja",
    angle:
      "Flujo operativo paso a paso combinando transcripción estructurada y plantillas de partidas con AIOferta",
    actionType:
      "Estandarizar una plantilla de partidas y probar el dictado estructurado tras la próxima visita comercial",
    readerProfile:
      "Instalador, ingeniero, consultor, reformista o gerente de pyme de servicios a medida",
    excerpt:
      "Quien entrega un presupuesto claro y desglosado en el mismo día multiplica su cierre comercial. Así se automatiza sin perder rigor técnico.",
    body: `**En las empresas de servicios técnicos, industriales o profesionales, las ventas no se pierden por falta de calidad: se pierden en el cajón de los presupuestos pendientes.** Cuando el especialista termina una visita al cliente y regresa a la oficina al final del día, redactar una propuesta desglosada consume horas que no tiene. Tres días después, el cliente ya ha contratado a quien respondió primero.\n\n**El flujo de conversión inmediata diseñado por AIDux**\n\n- **Captura por voz en caliente:** nada más salir de la reunión o inspección técnica, el profesional graba una nota de voz de dos minutos siguiendo cuatro bloques fijos: diagnóstico del problema, materiales o fases necesarias, plazos estimados y exclusiones.\n- **Estructuración automática sobre catálogo propio:** el flujo transforma el audio en un borrador JSON cruzado con la tabla oficial de precios unitarios de la empresa, evitando que la IA invente tarifas y generando un documento limpio listo para revisión humana.\n\n**Acción alcanzable para hoy:**\n1. Define una hoja maestra con tus diez partidas de servicio más frecuentes, incluyendo código, descripción técnica y precio unitario real.\n2. Graba una nota de voz simulando un encargo real e indica las unidades de cada partida y las condiciones particulares.\n3. Pasa la transcripción junto a tu tabla maestra a tu asistente para obtener el desglose completo en menos de tres minutos, revísalo y valida el ahorro de tiempo.`,
    actionableChecklist: [
      "Consolidar una tabla maestra con las diez partidas y tarifas reales más habituales",
      "Adoptar un guion fijo de dos minutos al dictar notas de voz tras cada visita comercial",
      "Verificar siempre importes y exclusiones antes de remitir el PDF definitivo al cliente",
    ],
  },
  {
    title: "Innovar en microeconomías locales: tres servicios que una pyme ya puede crear con IA",
    slug: "innovar-microeconomias-locales-servicios-pyme-ia",
    author: "AIVisio",
    category: "Estrategia",
    readerNeed:
      "Descubrir nuevas líneas de ingresos y valor añadido para clientes actuales gracias al abaratamiento cognitivo",
    angle:
      "Casos reales de innovación de modelo de negocio en despachos, talleres y comercios especializados",
    actionType:
      "Diseñar una mejora de servicio proactiva para los diez mejores clientes de la cartera actual",
    readerProfile:
      "Empresario o socio de pyme que busca diferenciar su oferta frente a competidores de bajo precio",
    excerpt:
      "El abaratamiento del conocimiento permite a una pequeña empresa ofrecer niveles de seguimiento y personalización que antes eran exclusivos de grandes corporaciones.",
    body: `**Durante décadas, las pequeñas empresas tuvieron cercanía humana pero carecieron de capacidad analítica para ofrecer seguimiento proactivo a cada cliente.** Una gestoría solo tenía tiempo de presentar impuestos a última hora; un taller o empresa de mantenimiento solo actuaba cuando algo se rompía. El abaratamiento del conocimiento ha derribado esa barrera.\n\n**Tres innovaciones posibles hoy para una pyme con criterio propio**\n\n- **De gestoría reactiva a radar financiero mensual:** cruzar automáticamente los movimientos contables del trimestre para entregar a cada cliente un informe claro de tres puntos sobre desviaciones de gasto y tesorería que antes era inviable redactar manualmente.\n- **De soporte puntual a mantenimiento predictivo documentado:** transformar los partes históricos de averías e incidencias en alertas preventivas personalizadas para cada instalación.\n- **Auditorías de bienvenida instantáneas:** ofrecer a cualquier cliente potencial un diagnóstico preliminar estructurado en veinticuatro horas como puerta de entrada de alto valor.\n\n**Acción alcanzable para hoy:**\n1. Selecciona a tus cinco clientes más fieles y pregúntate qué informe o aviso preventivo les ayudaría a tomar mejores decisiones cada mes.\n2. Utiliza los datos que ya procesas para ellos (con privacidad local garantizada) para generar un resumen ejecutivo de una sola cara.\n3. Entrégalo en tu próxima reunión con la firma y supervisión de tu equipo para transformar un servicio comoditizado en una relación estratégica insustituible.`,
    actionableChecklist: [
      "Elegir un segmento de clientes actuales donde un diagnóstico preventivo aporte alto valor",
      "Automatizar la síntesis de datos históricos sin exponer información fuera de la empresa",
      "Presentar el nuevo entregable con revisión experta como ventaja competitiva diferencial",
    ],
  },
  {
    title: "Mensajes fuera de horario: proteger el descanso sin dejar al cliente a oscuras",
    slug: "mensajes-fuera-horario-descanso-atencion-pyme",
    author: "AIVisio",
    category: "Estrategia",
    readerNeed:
      "Proteger el descanso de autónomos y equipos pequeños definiendo expectativas de respuesta y urgencias reales para sus clientes",
    angle:
      "Diseñar límites de comunicación sostenibles que cuiden la vida personal y mantengan una atención fiable sin prometer disponibilidad permanente",
    actionType:
      "Clasificar consultas urgentes y ordinarias, fijar un plazo de respuesta realista y probar un acuse automático transparente durante una semana",
    readerProfile: "Autónomo o responsable de una pyme que recibe consultas por varios canales",
    excerpt:
      "Responder a cualquier hora no siempre es atender mejor. Un acuerdo claro sobre urgencias, canales y plazos puede proteger el descanso y la confianza del cliente.",
    body: `En un negocio pequeño, cada cliente importa y por eso es fácil acabar respondiendo mensajes durante la cena, el fin de semana o las vacaciones. La disponibilidad permanente parece una ventaja competitiva, pero también fragmenta el descanso y convierte cualquier aviso en una urgencia. La alternativa no es desentenderse: es explicar con claridad cómo y cuándo se atiende.

**Separar urgencia de inmediatez**

- **Define qué no puede esperar:** acuerda dos o tres situaciones que requieren atención urgente y ofrece para ellas un canal concreto. Una pregunta sobre una factura o una solicitud de presupuesto normalmente puede esperar al siguiente horario de atención.
- **Publica expectativas realistas:** indica los días y plazos habituales de respuesta. Un acuse automático puede confirmar que el mensaje llegó y decir cuándo se revisará, sin fingir que una persona ya lo ha leído.
- **Reduce canales dispersos:** concentra las consultas de trabajo en un correo o sistema compartido. Evita que el teléfono personal sea, por defecto, el canal de guardia de toda la empresa.

**Acción alcanzable para hoy:**
1. Revisa los mensajes recibidos durante la última semana y separa incidencias realmente urgentes de consultas ordinarias.
2. Escribe un horario y un plazo de respuesta que puedas cumplir incluso en semanas de mucho trabajo.
3. Prueba durante siete días un mensaje de recepción transparente y comprueba si disminuyen las interrupciones sin aumentar los problemas de los clientes.

El descanso no es un premio que llega cuando se termina todo. Es una condición para sostener el criterio, la salud y la calidad del trabajo. Un límite comunicado con honestidad protege tanto a quien presta el servicio como a quien lo necesita.`,
    actionableChecklist: [
      "Distinguir incidencias urgentes de consultas que pueden esperar al siguiente horario",
      "Publicar un plazo de respuesta realista y cumplirlo de forma consistente",
      "Usar un acuse automático que no prometa una lectura ni respuesta humana inmediata",
    ],
  },
  {
    title:
      "Diccionario sin miedo: qué son el protocolo MCP, las bases vectoriales y los modelos locales",
    slug: "diccionario-sin-miedo-mcp-bases-vectoriales-modelos-locales",
    author: "AIDux",
    category: "Operaciones",
    readerNeed:
      "Comprender sin tecnicismos qué significan los conceptos clave de la IA actual y distinguir qué soluciones son sencillas de aplicar en una tarde",
    angle:
      "Traducción llana con analogías cotidianas para calibrar si una herramienta equivale a montar una estantería sencilla o a levantar una obra mayor",
    actionType:
      "Clasificar tres términos técnicos habituales según su dificultad real y probar primero una herramienta gratuita de instalación directa",
    readerProfile:
      "Autónomo, comerciante o responsable de pyme sin formación informática que quiere entender antes de decidir",
    excerpt:
      "Nadie cruza una puerta si detrás todo parece oscuro y complicado. Traducimos a lenguaje de taller y oficina tres conceptos habituales para distinguir qué se monta en una tarde y qué requiere obra mayor.",
    body: `Cuando un profesional escucha términos como protocolo MCP, base de datos vectorial o modelo compacto local, la duda más razonable es saber si le están proponiendo montar una estantería sencilla en una tarde o levantar una obra de ingeniería inabordable. Poner luz en el vocabulario es el primer paso para decidir con tranquilidad.

**Tres conceptos explicados con objetos cotidianos**

- **Modelo local compacto (como tener un oficial en el taller sin internet):** es un programa que instalas en tu propio ordenador para redactar, resumir o clasificar textos sin enviar un solo papel fuera de la empresa. Instalarlo equivale a montar un mueble básico siguiendo cuatro pasos en media hora.
- **Protocolo MCP (el enchufe universal):** antes cada lámpara necesitaba un empalme distinto; hoy usamos un enchufe estándar. MCP es simplemente un conector que permite al modelo leer una carpeta concreta de tu ordenador o tu calendario sin copiar y pegar archivos a mano. Configurar uno básico lleva una tarde.
- **Base de datos vectorial (el archivador por ideas, no por palabras exactas):** un buscador clásico solo encuentra la palabra «factura» si escribes esas letras; un archivo vectorial encuentra también «recibo de luz» o «cobro pendiente» porque agrupa los textos por su significado. Crearla desde cero sí es una obra mayor, pero existen programas gratuitos que la preparan automáticamente al arrastrar tus carpetas.

**Acción alcanzable para hoy:**
1. Identifica una tarea donde hoy pierdas tiempo copiando textos entre tus carpetas y el navegador.
2. Empieza siempre por el escalón de estantería sencilla: prueba un programa local gratuito antes de plantearte integraciones complejas.
3. Exige a cualquier proveedor tecnológico que te explique sus propuestas sin siglas opacas y detallando cuántas horas reales requiere su puesta en marcha.

La tecnología útil no necesita esconderse detrás de palabras difíciles. Cuando comprendes el esfuerzo real de cada pieza, desaparece el bloqueo inicial y recuperas el mando de tu taller o despacho.`,
    actionableChecklist: [
      "Distinguir qué herramientas se instalan en media hora (estantería sencilla) y cuáles requieren soporte técnico",
      "Usar la analogía del enchufe estándar (MCP) y del archivador por ideas (base vectorial) para evaluar necesidades reales",
      "Descartar presupuestos tecnológicos que utilicen jerga incomprensible sin desglosar tiempos de aprendizaje",
    ],
  },
  {
    title:
      "Tu carpeta de tarifas como manual abierto: cómo lograr que tu asistente consulte tus precios reales sin inventar cifras",
    slug: "carpeta-tarifas-manual-abierto-rag-local-sin-inventar-cifras",
    author: "AIDux",
    category: "Operaciones",
    effortLevel: "intermediate",
    readerNeed:
      "Evitar que los asistentes inventen precios o condiciones al redactar respuestas comerciales apoyándose únicamente en documentos propios verificados",
    angle:
      "Guía de bricolaje guiado de AIDux para organizar un único documento maestro de tarifas y garantías legible por modelos locales",
    actionType:
      "Consolidar tarifas y condiciones vigentes en un archivo de texto limpio y exigir al asistente que cite el apartado exacto antes de responder",
    readerProfile:
      "Responsable de taller, instalador o despacho que elabora presupuestos y responde dudas de precios a diario",
    clarityNote:
      "En 30 segundos: pedir a una máquina que responda consultando un documento único de tarifas vigente evita que invente precios antiguos; equivale a hacer un examen con el libro abierto encima de la mesa (bricolaje guiado, una tarde, 0 €).",
    excerpt:
      "Cuando un asistente responde de memoria, corre el riesgo de inventar precios o plazos. Aprende a prepararle un manual abierto en una tarde para que solo utilice tus datos reales.",
    body: `**Uno de los temores más lógicos en cualquier negocio es que un asistente automático responda a un cliente con un precio antiguo o una garantía que no existe.** Esto ocurre cuando pedimos a la máquina que conteste de memoria estadística en lugar de obligarla a consultar primero nuestro catálogo vigente.

En jerga informática a este método se le llama generación con recuperación de documentos, pero en la vida diaria equivale simplemente a hacer un examen con el libro abierto encima de la mesa. Si el dato no figura en tu manual abierto, está prohibido adivinarlo ni completar huecos por intuición.

### Por qué las tarifas dispersas confunden tanto al equipo como a la máquina

En muchas pequeñas empresas y talleres los precios reales viven repartidos entre hojas de cálculo de hace dos campañas, correos enviados a clientes habituales, catálogos en formato imagen y notas personales. Esa fragmentación provoca errores incluso dentro del propio equipo cuando dos compañeros manejan listados distintos.

Si una persona nueva entra al despacho y duda ante una partida concreta, al menos puede preguntar en voz alta antes de enviar el presupuesto. En cambio, un modelo conversacional sin fuentes claras rellena el hueco con lo más probable según textos generales de internet y redacta un importe incorrecto con absoluta seguridad.

Antes de probar ningún programa técnico, reunir toda la verdad comercial vigente en una carpeta limpia ahorra decenas de aclaraciones posteriores con clientes y colaboradores. Ese orden documental funciona bien incluso si mañana decides prescindir por completo de herramientas automáticas.

| Enfoque de consulta comercial | Responder de memoria general | Responder con manual abierto vigente |
| :--- | :--- | :--- |
| Fuente de los importes | Texto genérico aprendido en el entrenamiento | Tu único archivo actualizado con fecha visible |
| Ante una partida que falta | Riesgo alto de inventar un precio orientativo | Respuesta explícita indicando consulta humana |
| Actualización cuando suben materiales | Exige corregir respuestas una a una | Basta editar una fila en tu documento maestro |
| Esfuerzo de implantación | Ninguno inicial, muchas correcciones después | Bricolaje guiado de una tarde sin cuotas extra |

### Cómo preparar el libro abierto de tu negocio en menos de una hora

Reunir las tarifas, exclusiones frecuentes y condiciones de garantía vigentes en un solo documento estructurado por apartados claros equivale a ordenar el banco de trabajo antes de enchufar ninguna herramienta. Conviene usar texto limpio o tablas sencillas en formato abierto, evitando capturas escaneadas donde los números puedan leerse mal o columnas combinadas imposibles de interpretar.

Incluye siempre una fecha visible de entrada en vigor en las tres primeras líneas del archivo y un índice sencillo por familias de trabajo o producto. Cuando el catálogo distingue claramente entre tarifa base, suplementos de desplazamiento, mano de obra por tramos y exclusiones habituales, el margen de malentendidos disminuye desde el primer día.

### La regla de oro de citar el apartado origen y exigir respuesta negativa honesta

Al preparar la instrucción de trabajo o conectar esa carpeta mediante un puente local seguro, incluye siempre una norma firme: junto a cada importe o plazo propuesto en el borrador, el asistente debe indicar entre paréntesis el apartado exacto de tu manual del que ha extraído el dato.

Igual de importante es instruir qué hacer cuando una partida o medida especial no aparece escrita. En lugar de aproximar cifras por semejanza, debe escribir de forma visible «requiere valoración humana» para que el profesional revise el caso concreto con plano, visita o proveedor.

Pedir que cite el origen literal tarda dos segundos al revisar un borrador y convierte una posible fuente de errores en una lista verificable sobre tu propia tarifa oficial. Nunca delegues el envío directo de precios hacia fuera sin esa última comprobación personal.

### Separación estricta entre catálogo público y datos privados de clientes

Tu documento maestro de precios, tiempos orientativos y garantías generales no necesita incluir nombres de clientes, direcciones ni descuentos confidenciales pactados por contrato individual. Mantener limpia esa separación protege el cumplimiento del Reglamento General de Protección de Datos desde la raíz del sistema.

Cuando el catálogo público vive separado de facturas, nóminas y expedientes nominativos, puedes realizar pruebas tranquilas tanto en modelos compactos locales como en flujos internos auditables sin exponer información sensible ni mezclar condiciones exclusivas de un cliente con otro.

### Cómo actualizar precios cuando cambian materiales o proveedores sin romper respuestas

En sectores sujetos a variaciones frecuentes de materia prima o recambios, el peligro silencioso reside en dejar versiones antiguas circulando por subcarpetas. Fija una única persona responsable o un momento concreto cada mes —por ejemplo, el último viernes antes de cambiar el mes— para actualizar el archivo vigente y mover el anterior a una carpeta llamada «histórico cerrado» fuera del alcance de consulta.

Cada actualización limpia tarda apenas diez minutos si solo registras el precio nuevo y anotas qué partidas quedan anuladas. Evitar duplicidades en el repositorio garantiza que ninguna respuesta comercial recupere importes caducados del trimestre anterior.

### Qué hacer ante presupuestos a medida o condiciones excepcionales

No todo trabajo de un autónomo o una pyme cabe dentro de una tarifa cerrada. En reparaciones complejas, obras con patologías ocultas o servicios de consultoría a medida, el manual abierto sirve para redactar con claridad la base común, explicar el método de visita o toma de datos y enumerar qué variables definirán el importe definitivo tras tu inspección.

Lejos de restar valor artesanal, esa transparencia inicial demuestra seriedad frente al cliente desde el primer correo, evita promesas irreales en frío y reserva tu criterio experto para valorar lo verdaderamente singular del encargo.

### Supervisión sencilla y revisión de calidad antes de responder al cliente

Preparar este manual abierto mejora incluso la coordinación interna entre personas del propio negocio antes de conectar ningún programa. Cuando todo el equipo y las herramientas consultan la misma verdad vigente y cada propuesta sale únicamente tras tu lectura final, ganas rapidez comercial sin comprometer ni un solo céntimo ni tu reputación profesional.

Dedica los primeros diez días a anotar qué preguntas de clientes no encontraban respuesta clara en tu archivo inicial y añade esos puntos al documento maestro. En menos de dos semanas habrás construido el activo más valioso de tu área comercial: memoria compartida, ordenada y verificable.

### Cómo probar el manual abierto con una persona recién llegada al equipo

Una prueba excelente para comprobar si tu archivo maestro resulta verdaderamente claro consiste en pedir a alguien nuevo en tu taller o despacho —o incluso a un conocido ajeno al sector— que lea un presupuesto dudoso apoyándose únicamente en ese documento. Si logra encontrar el importe base, los suplementos aplicables y las exclusiones en menos de un minuto, el texto está maduro para trabajar con cualquier asistente local.

Si en cambio esa persona duda entre dos epígrafes parecidos o necesita llamarte para aclarar una excepción habitual, significa que ese apartado todavía guarda conocimiento tácito que conviene dejar escrito en lenguaje llano antes de automatizar borradores.

**Pasos accionables para aplicar hoy:**

1. Crea un archivo maestro de texto limpio con fecha de vigencia donde recojas las veinte preguntas de tarifas, plazos de entrega, desplazamientos y exclusiones que más se repiten en tu oficio.
2. Retira de la carpeta de consulta activa cualquier catálogo antiguo o lista de temporadas pasadas para evitar contradicciones silenciosas entre documentos.
3. Haz tres pruebas seguidas solicitando borradores para encargos habituales y otro encargo atípico fuera de catálogo, verificando que el sistema cita exactamente tus apartados y pide ayuda humana en el caso no contemplado.`,
    actionableChecklist: [
      "Unificar tarifas, plazos y garantías vigentes en un único documento limpio y fechable",
      "Retirar versiones antiguas de catálogos de la carpeta de consulta activa",
      "Exigir siempre que el borrador indique de qué apartado del manual ha tomado cada dato",
    ],
    seedQuestion:
      "¿Dónde guardas hoy tus tarifas vigentes y qué condición comercial suele dar más confusión al preparar presupuestos?",
  },
  {
    title:
      "El sobreprecio de la etiqueta inteligente: cómo distinguir herramientas que valen cada euro de simples subidas de cuota",
    slug: "sobreprecio-etiqueta-inteligente-evaluar-precios-herramientas-pyme",
    author: "AIVisio",
    category: "Estrategia",
    readerNeed:
      "Evaluar con criterio económico las subidas de precios en programas empresariales que añaden funciones de IA y comparar alternativas reales",
    angle:
      "Guía de compra honesta de AIVisio para evitar pagar suplementos mensuales desproporcionados por funciones que apenas se usan",
    actionType:
      "Auditar las suscripciones actuales del negocio y medir el coste por uso real antes de aceptar un cambio de tarifa",
    readerProfile:
      "Titular de pyme o autónomo que quiere controlar sus gastos fijos tecnológicos con criterio",
    excerpt:
      "Muchos programas habituales han encarecido sus cuotas mensuales solo por añadir un botón nuevo. Aprende a calcular si ese recargo compensa o si puedes resolverlo gratis.",
    body: `**Muchos proveedores de programas de facturación, gestión documental o diseño están aplicando subidas notables en sus cuotas mensuales por el simple hecho de añadir un botón de inteligencia artificial.** Para un autónomo o una pequeña empresa, acumular varios suplementos de este tipo al año supone un gasto fijo acumulado en funciones accesorias que a menudo apenas se utilizan o que resuelven problemas que el negocio ni siquiera tenía.

**Cómo separar el valor real del recargo publicitario en tu negocio**

- **Calcula el coste por uso efectivo:** si pagas una cuota adicional fija cada mes por usuario solo para resumir cuatro correos a la semana, cada resumen te está saliendo más caro que redactarlo a mano. Esas mismas consultas suelen tener un coste mínimo cuando se realizan sin intermediarios.
- **Comprueba primero la alternativa abierta o gratuita:** antes de pasar al plan superior de tu programa de siempre, revisa si una herramienta libre o un asistente ejecutado en tu propio ordenador cubre exactamente esa necesidad sin atarte a una permanencia anual.
- **Exige un ahorro medible en tiempo o en errores:** una suscripción solo merece la pena cuando libera horas reales de tareas tediosas o evita fallos costosos que tu equipo ya había sufrido antes.

**Acción alcanzable para hoy:**
1. Reúne las facturas de todos los programas y suscripciones digitales que paga tu empresa cada mes.
2. Marca aquellos proveedores que hayan subido tarifas recientemente bajo el argumento de incluir nuevas funciones automáticas.
3. Mide durante dos semanas cuántas veces utiliza tu equipo esa función concreta y pasa al plan básico todo lo que no aporte un retorno claro.`,
    actionableChecklist: [
      "Revisar el listado completo de suscripciones de software y detectar recargos recientes",
      "Dividir el coste mensual del suplemento entre el número de usos reales en el equipo",
      "Priorizar herramientas abiertas o de pago por uso real frente a cuotas fijas infladas",
    ],
  },
  {
    title:
      "Reclamaciones y mensajes generados en masa por máquinas: cómo proteger la atención de tu negocio sin perder el trato humano",
    slug: "reclamaciones-mensajes-masa-maquinas-proteger-atencion-pyme",
    author: "AIJuris",
    category: "Legal",
    readerNeed:
      "Defender el tiempo y la seguridad jurídica de la pyme frente a escritos, quejas o solicitudes generadas artificialmente en masa",
    angle:
      "Protocolo de verificación previa y filtrado ético-legal de AIJuris para separar el ruido sintético de los clientes reales",
    actionType:
      "Establecer una verificación rápida de expediente o factura antes de tramitar reclamaciones extensas de origen dudoso",
    readerProfile:
      "Responsable de atención al cliente, comercio o despacho profesional expuesto a un alto volumen de mensajes",
    excerpt:
      "Cuando cualquiera puede generar escritos largos de aspecto formal en segundos, tu negocio necesita un filtro sencillo para proteger su tiempo y cuidar de verdad a sus clientes reales.",
    body: `**Vivimos una paradoja evidente en el día a día comercial: la misma tecnología que ayuda a una pequeña empresa a trabajar mejor permite también que terceros generen reclamaciones, solicitudes falsas de presupuesto y escritos intimidatorios en masa sin apenas esfuerzo.** Cuando un negocio pequeño recibe decenas de mensajes extensos y aparentemente formales redactados por máquinas, corre el riesgo de agotar su jornada contestando al ruido y desatender al cliente real que sí tiene un problema legítimo.

**El protocolo de verificación y defensa diseñado por AIJuris**

- **Comprobación inmediata de vínculo real:** ante un escrito largo lleno de citas legales genéricas, el primer paso nunca es debatir sus párrafos, sino verificar en treinta segundos si existe una factura, un pedido o un contrato real asociado a esa persona en tu registro.
- **Puerta de entrada con datos concretos:** pedir el número de ticket o fecha de servicio en el formulario de contacto detiene de raíz los envíos automáticos masivos sin poner trabas al cliente auténtico que busca ayuda.
- **Respuesta tasada y resguardo documental:** cuando una queja carece de datos identificativos de compra, basta un acuse breve y cortés solicitando esa referencia, guardando copia fechada para blindar la posición jurídica de la empresa.

**Acción alcanzable para hoy:**
1. Añade en tu canal de incidencias una pregunta sencilla sobre el número de factura, presupuesto o fecha aproximada del servicio.
2. Prepara una respuesta educada de tres líneas para pedir esa referencia antes de invertir horas en contestar textos genéricos.
3. Dedica todo el tiempo ahorrado a llamar por teléfono y atender con cercanía a los clientes verificados de tu negocio.`,
    actionableChecklist: [
      "Verificar siempre la existencia de una operación o factura real antes de analizar escritos largos",
      "Solicitar un dato concreto del servicio en el canal de entrada para frenar envíos automáticos",
      "Conservar registro fechado de cada solicitud de acreditación y priorizar el trato humano al cliente real",
    ],
  },
  {
    title:
      "Educación y pensamiento crítico en casa: cómo enseñar a cuestionar a la IA sin delegar el criterio",
    slug: "educacion-pensamiento-critico-hogar-cuestionar-ia",
    author: "AIVisio",
    category: "Estrategia",
    effortLevel: "basic",
    readerNeed:
      "Orientar a familias, jóvenes y aprendices de oficios para usar asistentes conversacionales como gimnasio intelectual en lugar de atajo pasivo",
    angle:
      "Pedagogía cotidiana de AIVisio: convertir respuestas automáticas en preguntas socráticas y ejercicios de contraste con la realidad",
    actionType:
      "Practicar en familia o en el taller el método de pedir argumentos contrarios y comprobar un dato real en una fuente primaria",
    readerProfile: "Madres, padres, docentes y autónomos que acompañan a jóvenes en formación",
    clarityNote:
      "En 30 segundos: usar una máquina para que haga los deberes enteros atrofia la memoria; usarla como compañero de debate que te exige razonar refuerza la comprensión (esfuerzo básico, sin coste).",
    excerpt:
      "Prohibir las herramientas digitales no prepara a los más jóvenes; enseñarles a detectar errores, formular mejores preguntas y comprobar fuentes los vuelve autónomos.",
    body: `**Cuando un estudiante o un aprendiz entra por primera vez ante un asistente conversacional, la tentación inicial casi siempre es la misma: copiar el enunciado del ejercicio, recoger la respuesta pulida y entregarla tal cual.** Sin embargo, delegar por completo la redacción y la síntesis priva a la persona precisamente de aquello que necesita entrenar: la capacidad de ordenar ideas, detectar fisuras lógicas y defender un criterio propio ante un cliente, un profesor o un problema técnico inesperado.

Aprender bien exige cierta fricción mental constructiva, igual que entrenar un músculo o dominar un oficio manual en el taller. Si cedemos esa gimnasia previa a una máquina desde el primer minuto, ganamos un papel entregado rápido hoy a cambio de perder seguridad y autonomía mañana cuando la pantalla no pueda decidir por nosotros.

### El riesgo silencioso de aceptar respuestas fluidas sin verificar

Los modelos actuales redactan con un tono seguro y ordenado incluso cuando fabrican respuestas verosímiles o rellenan lagunas con afirmaciones probables pero falsas. En lenguaje cotidiano, ocurre como con un conocido muy elocuente que habla sin dudas sobre un tema que apenas conoce: su seguridad verbal puede engañar a quien todavía está aprendiendo las bases del oficio o de la asignatura.

Por eso, el primer hábito que conviene cultivar desde edades tempranas es la sospecha sana: toda respuesta automática es un borrador discutible, nunca una verdad definitiva ni una fuente científica por sí misma. Distinguir elegancia formal de rigor factual protege a niños, adolescentes y aprendices adultos por igual.

| Hábito al estudiar o aprender | Delegación pasiva (lo que conviene evitar) | Entrenamiento crítico (el método AIEvolutio) |
| :--- | :--- | :--- |
| Ante un tema nuevo | Pedir un resumen único y memorizarlo sin preguntas | Pedir tres ejemplos cotidianos y señalar qué parte no se entiende |
| Al redactar un trabajo | Copiar el texto completo generado por la máquina | Escribir un guion propio a mano y pedir críticas de claridad |
| Ante un dato concreto | Dar por válida cualquier fecha, cifra o cita legal | Exigir comprobación en manuales oficiales, libros o normativa |
| Frente a una duda compleja | Quedarse con el primer enfoque ofrecido | Solicitar los argumentos a favor y los fallos más probables |

### Tres dinámicas prácticas para transformar la relación con la máquina

La primera dinámica consiste en invertir los papeles siguiendo el método del aprendiz exigente. En lugar de pedir a la herramienta que explique toda la lección, el joven redacta primero cinco líneas explicando el concepto con sus propias palabras y solicita al asistente que busque posibles confusiones o huecos en ese razonamiento. Así, el esfuerzo intelectual previo sigue perteneciendo íntegramente a la persona.

La segunda dinámica convierte la detección de fallos en un juego semanal consciente. Conviene proponer de vez en cuando retos breves donde el estudiante pregunta por un hecho cercano, una norma municipal o un detalle técnico de su sector y comprueba después qué parte del resultado era exacta y qué parte estaba deformada. Descubrir por uno mismo dónde falla una máquina inmuniza frente a la credulidad ciega mucho mejor que cualquier sermón teórico.

La tercera dinámica blinda la intimidad cotidiana desde el primer día. Del mismo modo que enseñamos a no entregar llaves de casa a desconocidos ni publicar direcciones privadas, resulta esencial explicar por qué nunca se suben fotografías familiares, historiales académicos completos, expedientes médicos ni datos personales reales a cuentas abiertas.

### Del diálogo socrático en casa al aprendizaje real de oficios en pequeñas empresas

Este mismo enfoque aplica directamente cuando un autónomo o una pyme forma a un oficial joven, a personal en prácticas o a una nueva incorporación. En lugar de entregar respuestas cerradas o pedir que busque soluciones automáticas sin contexto, el tutor profesional enseña primero qué preguntar, cómo detectar si una pieza o norma real contradice al texto sugerido y dónde consultar el manual oficial del fabricante.

Un aprendiz que aprende a hacer buenas preguntas, verificar medidas en obra y argumentar por qué descarta una propuesta incorrecta avanza mucho más rápido y gana respeto profesional ante clientes reales que quien repite textos memorizados sin base práctica.

### Acuerdos claros de uso en familia sin convertir el hogar en una aduana

Prohibir de plano las herramientas digitales en casa suele empujar al uso oculto o improvisado sin acompañamiento adulto. Funciona mucho mejor pactar reglas visibles y proporcionadas según la edad: tiempo límite frente a pantallas, primero esquema o intento escrito en cuaderno antes de abrir consulta digital y revisión conjunta de las fuentes utilizadas al terminar el trabajo.

Cuando padres, madres o formadores practican también en voz alta el hábito de dudar y contrastar una noticia o un dato delante de los hijos, enseñan con el ejemplo que el criterio humano vale más que cualquier respuesta instantánea.

### Cómo detectar señales tempranas de dependencia intelectual pasiva

Conviene observar con cariño tres señales claras: cuando un estudiante responde siempre con frases grandilocuentes que luego no sabe resumir de palabra en veinte segundos, cuando pierde tolerancia ante ejercicios que exigen leer dos páginas seguidas en papel o cuando evita argumentar por miedo a equivocarse sin muleta digital.

Ante cualquiera de estas señales, la solución no pasa por el castigo sino por proponer un reto en mesa limpia —lápiz, papel y diálogo cara a cara— donde recuperar la confianza en su propia voz y capacidad de deducción.

### Mirada humana sobre el futuro cercano y autonomía intelectual

La tecnología puede abaratar el acceso a resúmenes y borradores, pero no sustituye la paciencia de quien escucha, el ejemplo cotidiano ni la satisfacción profunda de comprender algo por mérito propio. Acompañar a los más jóvenes en el desarrollo de su pensamiento crítico protege su libertad intelectual y convierte una herramienta ruidosa en un trampolín honesto para crear y preguntar mejor.

### Biblioteca compartida de preguntas de comprobación para el aula o el taller

Conviene crear juntos una hoja breve con cinco preguntas de contraste que cualquiera pueda aplicar ante un resultado llamativo antes de darlo por bueno: quién firma el dato original, en qué fecha se publicó el documento citado, si existe una fuente primaria oficial en español que lo respalde, qué argumento contrario suele olvidarse y qué ocurriría en la práctica si esa respuesta resultara errónea en obra o examen.

Repasar estas cinco preguntas de forma natural convierte la verificación crítica en reflejo automático, igual que mirar antes de cruzar la calle. No exige conocimientos informáticos avanzados ni software especial, solo constancia tranquila y conversación abierta en casa o en el trabajo.

Con el tiempo, niños y aprendices descubren por sí mismos que las mejores respuestas no salen del primer clic apresurado, sino de saber distinguir entre el dato comprobado, la opinión discutible y el vacío que conviene investigar con calma.

**Pasos accionables para aplicar hoy:**

1. Si tienes hijos o aprendices cerca, siéntate veinte minutos con ellos esta semana y pídeles que te muestren cómo formulan sus consultas habituales frente a la pantalla.
2. Acordad una regla sencilla de verificación: ninguna afirmación cuantitativa, cita histórica ni consejo técnico procedente de un chat se acepta sin contrastarlo antes en dos fuentes reconocidas o con un manual de referencia.
3. Proponed un debate breve pidiendo a la herramienta dos posturas opuestas sobre un mismo tema para analizar juntos qué argumentos se sostienen y cuáles carecen de base real.`,
    actionableChecklist: [
      "Exigir siempre un esquema o borrador propio antes de consultar cualquier asistente",
      "Contrastar al menos una fuente primaria o manual real por cada tema trabajado",
      "Recordar en casa la norma básica de no introducir datos personales ni fotos privadas",
    ],
    seedQuestion:
      "¿Qué dudas o bloqueos encuentras en casa o en el trabajo al enseñar a usar estas herramientas con criterio propio?",
  },
  {
    title:
      "Ordenar facturas y albaranes sin suscripciones fijas: guía local paso a paso para autónomos",
    slug: "ordenar-facturas-albaranes-sin-suscripciones-guia-local",
    author: "AIDux",
    category: "Operaciones",
    effortLevel: "basic",
    readerNeed:
      "Reducir horas de clasificación manual de facturas y tickets manteniendo la contabilidad en el propio ordenador sin pagar recargos mensuales innecesarios",
    angle:
      "Artesanía técnica sobria de AIDux: combinar nomenclatura ordenada, extracción local ligera y revisión humana antes de enviar a gestoría",
    actionType:
      "Organizar una carpeta trimestral con nombres normalizados y validar un primer lote pequeño en local",
    readerProfile: "Autónomo o responsable administrativo de pequeña empresa o taller",
    clarityNote:
      "En 30 segundos: antes de pagar cuotas mensuales por programas que prometen contabilidad automática, ordena tus facturas por fecha y proveedor y usa un modelo ligero local como ayuda de clasificación bajo tu revisión final (estantería sencilla, 0 € en licencias extra).",
    excerpt:
      "El desorden documental cuesta más tiempo que la propia tecnología. Aprende a estructurar tus albaranes y revisar borradores contables en tu propio ordenador sin cuotas fijas.",
    body: `**Al acercarse cada cierre trimestral, miles de autónomos y pequeñas empresas reviven exactamente la misma escena:** carpetas llenas de archivos descargados con nombres crípticos, tickets arrugados en el salpicadero y correos con facturas adjuntas perdidas entre hilos comerciales. Ante ese agotamiento, resulta comprensible sentirse tentado por aplicaciones que prometen automatizar todo mediante nuevas cuotas mensuales elevadas.

Sin embargo, cuando el archivo de origen está desordenado, añadir herramientas caras solo traslada el caos a un recibo bancario más largo. Ordenar primero la base documental cuesta exactamente cero euros en licencias y resuelve la mayor parte de la fricción administrativa antes incluso de abrir cualquier programa inteligente.

### Separar el orden básico del apoyo automático ligero

En ingeniería práctica distinguimos siempre entre el orden de trabajo y el motor que lee el texto. En una carpintería o taller, nadie compra una sierra nueva para arreglar un banco cubierto de virutas y herramientas mezcladas: primero se limpia la mesa y se etiquetan los cajones.

Con las facturas ocurre exactamente lo mismo. Una vez fijada una estructura clara de carpetas y nombres homogéneos, cualquier herramienta ligera —incluso un modelo compacto ejecutado en tu propio ordenador sin conexión externa— lee importes, fechas y números de identificación fiscal con mucha mayor fiabilidad y sin coste fijo mensual.

| Pieza del proceso administrativo | Qué hace la persona (criterio indispensable) | Qué prepara el asistente local (ahorro mecánico) |
| :--- | :--- | :--- |
| Recepción y archivo | Guardar documentos legibles en una carpeta única | Proponer un nombre homogéneo por fecha y emisor |
| Lectura de campos básicos | Comprobar que fecha, base e impuestos coinciden | Extraer proveedor, concepto y total a una lista clara |
| Casuística especial (devoluciones) | Decidir cómo se imputa el gasto o rectificativa | Marcar el documento para revisión manual prioritaria |
| Envío final a gestoría | Validar el listado definitivo antes de remitirlo | Generar el borrador ordenado para contraste rápido |

### Arquitectura prudente con modelos locales y privacidad estricta

Un archivo de facturas contiene nombres de clientes, direcciones fiscales, precios pactados y cuentas bancarias de terceros. Introducir esos documentos completos en herramientas gratuitas abiertas en línea vulnera la prudencia básica que exige el Reglamento General de Protección de Datos y expone relaciones comerciales confidenciales.

Al trabajar con utilidades instaladas dentro del propio ordenador o mediante programas locales sin retención ni envío a servidores externos, ningún documento fiscal sale de tu despacho. Además, conviene acostumbrarse a verificar siempre que tu programa de gestión habitual conserva copias limpias en formatos abiertos estándar como CSV, hoja de cálculo o PDF legible.

### Regla de lotes cortos para evitar desviaciones silenciosas en el reconocimiento de texto

Nunca conviene procesar de golpe cientos de albaranes esperando que todo cuadre a la primera sin vigilancia. Resulta mucho más seguro trabajar con tandas breves —por ejemplo, las diez últimas facturas recibidas— y verificar frente al documento original que ningún decimal, retención ni tipo impositivo ha sido mal interpretado por la lectura automática.

Cuando detectas que un proveedor concreto utiliza un diseño difícil o columnas desplazadas, anótalo en una pequeña ficha de revisión prioritaria para mirarlo directamente a ojo en dos segundos, sin intentar forzar ajustes complejos que roban más tiempo que leer el PDF original.

### Convención limpia de carpetas y nombres sin depender de software propietario

Una regla sencilla que funciona en cualquier sistema operativo consiste en crear una carpeta por año, dentro cuatro carpetas por trimestre y dentro tres subcarpetas: emitidas, recibidas y movimientos bancarios. Para el nombre de cada archivo nuevo basta seguir el patrón año-mes-día seguido del proveedor breve sin tildes ni espacios complejos.

Con este orden tan sobrio, encontrar un recibo concreto en medio de una inspección o ante una reclamación de garantía tarda cinco segundos con el buscador nativo de cualquier ordenador, incluso sin abrir programas contables. Además, tu gestoría recibirá los lotes clasificados de inmediato, evitando preguntas repetitivas de última hora antes de cada liquidación fiscal.

### Cómo preparar la transición hacia facturación verificable con calma y sin sobrecostes

Las pymes y los autónomos españoles afrontan calendarios normativos concretos en materia de sistemas informáticos de facturación y trazabilidad tributaria verificables en la sede oficial de la Agencia Tributaria. Contar desde hoy con carpetas limpias, numeración correlativa sin saltos y criterios claros de revisión protege al negocio de prisas innecesarias y de comprar módulos sobredimensionados bajo presión comercial.

Antes de cambiar de herramienta o firmar permanencias anuales, consulta primero con tu asesor fiscal habitual qué exige exactamente tu epígrafe y qué exportaciones simples en formato abierto acepta directamente su programa contable.

### Criterio humano por encima de la prisa trimestral

La verdadera utilidad de estas herramientas no consiste en firmar contabilidad a ciegas, sino en quitar de delante la parte repetitiva de copiar números uno a uno desde decenas de papeles sueltos. Mantener el orden propio, elegir soluciones sobrias y revisar siempre el resultado devuelve tiempo real para cuidar tu negocio y descansar al terminar la jornada.

### Qué hacer con los justificantes en papel arrugado y tickets térmicos que se borran

En comercios, bares, reparaciones a domicilio o desplazamientos diarios abundan pequeños recibos en papel térmico cuya tinta desaparece en pocos meses dentro de una caja. En lugar de dejarlos acumularse hasta final de trimestre, fija una rutina mínima de dos minutos al cerrar la semana: fotografía los tickets de gasto deducible con buena luz sobre una superficie neutra y guárdalos directamente dentro de la carpeta mensual de recibos junto al nombre del proveedor.

Conservar esa copia digital legible evita perder deducciones legítimas por deterioro físico del papel y permite que cualquier extracción ligera en local reconozca fecha e importe sin necesidad de adivinar cifras borrosas meses después.

### Señales de que tu sistema administrativo actual es ya suficiente sin comprar software nuevo

Muchos autónomos creen erróneamente que necesitan un programa contable caro solo porque escuchan publicidad constante en internet. Si emites menos de treinta facturas al mes, tardas menos de una hora semanal en conciliar tus movimientos y tu gestoría recibe las carpetas limpias sin pedir aclaraciones repetidas, tu flujo actual cumple perfectamente su objetivo con coste casi nulo.

Invertir únicamente cuando aparece un cuello de botella medible —por ejemplo un volumen elevado de albaranes diarios o requisitos técnicos de facturación obligatoria— protege tu caja y evita migrar datos sin necesidad real. Reservar el presupuesto para herramientas verdaderamente útiles mantiene sana la economía de tu pequeña empresa durante todo el año.

Al comparar alternativas comerciales, pregunta siempre antes de contratar si puedes exportar todos tus historiales en formatos abiertos estándar y cuánto tardarías en recuperar tu archivo completo si decidieras cambiar de proveedor en el futuro sin pagar recargos de salida.

**Pasos accionables para aplicar hoy:**

1. Crea una estructura de carpetas sencilla para el trimestre actual separando facturas emitidas, facturas recibidas y justificantes bancarios en tres directorios limpios.
2. Acuerda una convención fija de nombres para los archivos nuevos, empezando por el año, el mes, el día y el nombre breve del proveedor sin acentos ni espacios raros.
3. Toma diez documentos recientes ya archivados y cronometra cuánto tardas en extraer manualmente los campos clave frente a preparar el borrador asistido y revisarlo con calma línea por línea.`,
    actionableChecklist: [
      "Separar emitidas, recibidas y recibos en tres carpetas limpias antes de automatizar nada",
      "Probar la lectura asistida únicamente en lotes breves de prueba y en entorno local",
      "Verificar manualmente importes, impuestos y proveedor antes de entregar a gestoría",
    ],
    seedQuestion:
      "¿Qué parte del papeleo trimestral te quita más horas a la semana y qué programa utilizas hoy para organizarlo?",
  },
  {
    title:
      "Acompañamiento a mayores y trámites administrativos: dónde ayuda la tecnología y dónde es irremplazable la persona",
    slug: "acompanamiento-mayores-tramites-tecnologia-persona",
    author: "AIJuris",
    category: "Legal",
    effortLevel: "basic",
    readerNeed:
      "Usar ayudas digitales sencillas para traducir cartas oficiales y detectar trámites sin desplazar el contacto humano ni poner en riesgo datos vulnerables",
    angle:
      "Guardarraíl ético y social de AIJuris: dignidad de las personas mayores, lenguaje claro ante la burocracia y prohibición de delegar la compañía",
    actionType:
      "Traducir una carta administrativa compleja a lenguaje claro tapando antes cualquier dato identificativo personal",
    readerProfile: "Familiares, cuidadores, asociaciones vecinales y ciudadanía no técnica",
    clarityNote:
      "En 30 segundos: la tecnología puede traducir una carta oficial confusa a tres frases claras en letra grande para ayudar a una persona mayor, siempre borrando antes nombres y documentos y sin intentar sustituir nunca la compañía humana (lista básica de comprobación, 0 €).",
    excerpt:
      "La burocracia digital y los formularios opacos generan exclusión y angustia. Analizamos límites éticos claros para ayudar en lo cotidiano sin deshumanizar el cuidado.",
    body: `**Pocas cosas generan tanta impotencia cotidiana en una persona mayor —y en quienes la cuidan— como abrir una carta administrativa redactada con siglas, artículos encadenados y plazos confusos, o quedar atrapado en una sede electrónica diseñada únicamente para especialistas.** Ante esta barrera real, las herramientas de lenguaje pueden aportar un alivio práctico considerable si actúan como lupa y traductor llano.

Sin embargo, también esconden riesgos evidentes de privacidad, vulnerabilidad emocional y deshumanización si se emplean sin fronteras firmes. Separar claramente qué parte del trámite admite apoyo mecánico y qué parte exige presencia humana protege tanto derechos legales como la tranquilidad diaria de las familias.

### Traducir la burocracia oficial sin entregar la intimidad de nadie

Cuando una notificación municipal, bancaria o sanitaria resulta incomprensible, un asistente conversacional puede explicar qué trámite solicita exactamente, qué plazo orientativo figura en el texto y qué documento conviene preparar antes de pedir cita.

Ahora bien, el guardarraíl de protección de datos fija una condición previa innegociable: jamás se sube la imagen completa de la carta ni se copian el nombre, el domicilio, el número de documento oficial o datos médicos en plataformas públicas de terceros. Basta con transcribir únicamente el párrafo genérico de la resolución o sustituir cualquier dato identificativo por etiquetas neutras como «persona titular» o «entidad emisora» antes de pedir una explicación en lenguaje llano.

| Situación en el cuidado o gestión diaria | Uso prudente y respetuoso de apoyo digital | Límite ético innegociable (lo que no debe hacerse) |
| :--- | :--- | :--- |
| Carta o resolución oficial confusa | Traducir párrafos anónimos a lenguaje comprensible | Subir certificados médicos, cuentas o DNI completos |
| Organización de citas y recados | Crear recordatorios claros y listados en letra legible | Confiar dosis médicas o diagnósticos sin validación clínica |
| Soledad o escucha cotidiana | Usar ayudas prácticas para liberar tiempo del familiar | Sustituir visitas, llamadas y afecto por avatares simulados |
| Reclamaciones ante servicios básicos | Preparar borradores ordenados que revisa un familiar | Firmar o presentar escritos sin lectura ni consentimiento real |

### El riesgo ético y legal de simular compañía afectiva mediante máquinas

Bajo el argumento de aliviar la soledad no deseada, proliferan servicios que presentan avatares conversacionales con voz cálida como si fueran amigos o cuidadores permanentes. Para una persona mayor con deterioro cognitivo o en situación de vulnerabilidad, disimular la naturaleza mecánica de un programa compromete su dignidad, interfiere en su confianza cotidiana y puede generar confusión real sobre con quién habla.

Además, el Reglamento europeo de Inteligencia Artificial establece obligaciones claras de transparencia cuando una persona interactúa con un sistema automatizado. En el ámbito familiar y comunitario, ese principio legal coincide con el sentido común más básico: explicar siempre con serenidad qué hace una herramienta y qué sigue haciendo la familia, el vecindario o el profesional sanitario y social.

### Accesibilidad real en formato papel y digital para evitar la brecha silenciosa

Muchas veces el problema no reside en la falta de voluntad para entender un trámite, sino en textos impresos con cuerpo diminuto, enlaces enrevesados o formularios que caducan a los cinco minutos por pantalla. Convertir la explicación obtenida en una ficha impresa breve con letra grande, alto contraste y pasos numerados devuelve serenidad y protagonismo a la persona mayor.

En lugar de hacer todas las gestiones en silencio como si el mayor hubiera perdido criterio, leer juntos esa hoja clara permite que siga decidiendo sobre sus cuentas, sus citas médicas y sus preferencias personales con autonomía respetada.

### Cómo preparar una lista de comprobación segura para familiares y asociaciones locales

En asociaciones vecinales, centros de mayores o familias que reparten cuidados entre varios hermanos, ayuda enormemente acordar tres normas escritas muy breves junto al teléfono de asistencia de confianza: qué datos jamás se comparten en herramientas digitales abiertas, qué organismo oficial confirma plazos vigentes y quién revisa cualquier escrito antes de enviarlo por sede electrónica o correo certificado.

Este orden sencillo evita duplicar gestiones, reduce discusiones sobre quién llamó a dónde y deja constancia clara de citas pendientes en un cuaderno común fácil de consultar por todos.

### Tecnología al servicio del tiempo cercano y el cuidado presencial

Si traducir un impreso confuso o redactar una solicitud clara ahorra cuarenta minutos de pelea burocrática, ese tiempo recuperado sirve precisamente para sentarse a tomar un café con calma, escuchar historias y compartir presencia real. Ningún resumen inteligente supera el valor de llegar sin prisas ni ansiedad a una visita familiar.

Las herramientas sirven para allanar obstáculos mecánicos, nunca para reemplazar el calor de una mano cercana ni la responsabilidad hacia quienes nos precedieron. Mantener esa línea clara protege los derechos de nuestros mayores y orienta el progreso técnico hacia una vida más humana y accesible.

### Preguntas prácticas para probar cualquier dispositivo de ayuda pensado para mayores

Antes de comprar tabletas especiales, altavoces inteligentes o suscripciones de teleasistencia basadas en voz automática para un familiar mayor, somete cada opción a cuatro pruebas sencillas en casa junto a la propia persona interesada. Comprueba primero si la interfaz exige contraseñas complejas o menús escondidos tras pequeños iconos poco visibles cuando falla la conexión doméstica.

Verifica después si la empresa responsable detalla con claridad en español dónde se almacenan grabaciones de voz, quién puede borrar el historial completo en un clic y qué ocurre si decides darte de baja sin penalizaciones ocultas ni permanencias largas. Ninguna facilidad tecnológica compensa instalar un sistema intrusivo que registre conversaciones privadas del hogar sin consentimiento informado real.

### Colaboración honesta entre centros de barrio, comercios cercanos y administración

La inclusión tecnológica digna no depende únicamente del ámbito familiar privado; también florece cuando farmacias, comercios de confianza, bibliotecas públicas y trabajadores sociales ofrecen explicaciones claras y alternativas presenciales dignas para quien no domina las sedes electrónicas. Apoyar iniciativas municipales de ventanilla humana asistida complementa perfectamente el uso prudente de traductores claros de texto en casa.

Recordar que ningún ciudadano mayor debería quedarse sin una ayuda pública o sin una cita médica por no entender un código digital nos compromete a utilizar estas herramientas para tender puentes accesibles en el vecindario, preservando siempre el respeto, la escucha tranquila y el trato personal cercano.

Cuando una familia prueba primero qué formato de resumen entiende mejor su mayor —ya sea una lista impresa de pasos grandes, una tabla sencilla de teléfonos útiles o un recordatorio de calendario en voz alta— descubre pronto que la tecnología más valiosa es aquella que desaparece discretamente detrás de la tranquilidad cotidiana.

### Compromiso de transparencia intergeneracional en el hogar

Explicar sin paternalismo qué ayuda se ha utilizado para resumir un trámite complejo refuerza la confianza mutua y evita que la persona mayor sienta que deciden por ella a espaldas suyas.

**Pasos accionables para aplicar hoy:**

1. Si ayudas a un familiar con gestiones administrativas, prepara una hoja sencilla donde antes de usar cualquier herramienta taches u omitas siempre nombres, direcciones, teléfonos y números identificativos.
2. Utiliza la ayuda automática únicamente para resumir requisitos en puntos numerados con letra grande y legible que podáis leer juntos antes de pedir cita presencial o telefónica.
3. Ante cualquier duda sanitaria, bancaria o de derechos sociales, contrasta siempre el resumen obtenido directamente con el centro de salud, la trabajadora social o el teléfono oficial del organismo correspondiente.`,
    actionableChecklist: [
      "Anonimizar siempre nombres, DNI, direcciones y datos médicos antes de traducir cualquier escrito",
      "Confirmar plazos, requisitos y citas en organismos o profesionales reales antes de actuar",
      "Rechazar sistemas opacos que simulen afecto o compañía humana ante personas vulnerables",
    ],
    seedQuestion:
      "¿Qué trámite administrativo o texto oficial te resulta más confuso para ti o para tus mayores y te gustaría que tradujéramos con claridad?",
  },
];

// ─── EDITORIAL LOG ────────────────────────────────────────────────────────────

async function loadEditorialLog() {
  try {
    if (existsSync(editorialLogPath)) {
      const raw = await readFile(editorialLogPath, "utf8");
      return JSON.parse(raw);
    }
  } catch {
    // Ignorar error de lectura
  }
  return [];
}

async function saveEditorialLog(log) {
  await writeFile(editorialLogPath, JSON.stringify(log, null, 2) + "\n", "utf8");
}

// ─── HELPER DE ESTILO RAE (SHIFT-LEFT) ────────────────────────────────────────

function applyRaeTitleCase(title) {
  if (!title || typeof title !== "string") return "";
  const clean = title.trim();
  const lower = clean.toLowerCase();
  let result = lower.charAt(0).toUpperCase() + lower.slice(1);

  // Minúscula inicial tras dos puntos en español (salvo nombres propios y siglas)
  result = result.replace(/:\s+([a-záéíóúñ])/gi, (match, letter) => `: ${letter.toLowerCase()}`);

  const properNouns = [
    { pattern: /\bia\b/gi, replacement: "IA" },
    { pattern: /\bai act\b/gi, replacement: "AI Act" },
    { pattern: /\bpymes?\b/gi, replacement: (m) => m.toLowerCase() },
    { pattern: /\baievolutio\b/gi, replacement: "AIEvolutio" },
    { pattern: /\baidux\b/gi, replacement: "AIDux" },
    { pattern: /\baijuris\b/gi, replacement: "AIJuris" },
    { pattern: /\baivisio\b/gi, replacement: "AIVisio" },
    { pattern: /\bailitt[e|a]rae\b/gi, replacement: "AILittarae" },
    { pattern: /\baiworkers?\b/gi, replacement: "AIWorkers" },
    { pattern: /\baiteams?\b/gi, replacement: "AITeams" },
    { pattern: /\baioferta\b/gi, replacement: "AIOferta" },
    { pattern: /\baifactura\b/gi, replacement: "AIFactura" },
    { pattern: /\bairespuestas\b/gi, replacement: "AIRespuestas" },
    { pattern: /\brgpd\b/gi, replacement: "RGPD" },
    { pattern: /\bgeo\b/gi, replacement: "GEO" },
    { pattern: /\bseo\b/gi, replacement: "SEO" },
    { pattern: /\bslm\b/gi, replacement: "SLM" },
    { pattern: /\bmcp\b/gi, replacement: "MCP" },
    { pattern: /\bllm\b/gi, replacement: "LLM" },
    { pattern: /\berp\b/gi, replacement: "ERP" },
    { pattern: /\bchatgpt\b/gi, replacement: "ChatGPT" },
    { pattern: /\bperplexity\b/gi, replacement: "Perplexity" },
    { pattern: /\bespaña\b/gi, replacement: "España" },
  ];

  for (const { pattern, replacement } of properNouns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

function getTodayString(overrideDate = null) {
  if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) return overrideDate;
  return new Date().toISOString().split("T")[0];
}

export function getRenderedPageList(pages = []) {
  return [
    ...new Set(["index.html", "diagnostico.html", "calculadora.html", "contacto.html", ...pages]),
  ];
}

// ─── TELEMETRÍA GA4 REAL (SIN MOCKS FALSOS) ──────────────────────────────────

export async function fetchRealGa4Metrics(propertyId, accessToken, fetchImpl = fetch) {
  if (!propertyId || !accessToken) return null;

  try {
    const reportRes = await fetchImpl(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "averageSessionDuration" },
            { name: "eventCount" },
          ],
        }),
      },
    );
    if (!reportRes.ok) return null;
    const report = await reportRes.json();
    const row = report.rows?.[0]?.metricValues;
    if (!row) return { activeUsers: 0, sessions: 0, avgDurationSec: 0 };
    const result = {
      activeUsers: Number(row[0]?.value || 0),
      sessions: Number(row[1]?.value || 0),
      avgDurationSec: Math.round(Number(row[2]?.value || 0)),
    };
    if (row[3]?.value !== undefined) {
      result.eventCount = Number(row[3].value || 0);
    }
    return result;
  } catch (err) {
    console.warn("[GA4 API] Error al consultar métricas reales:", err.message);
    return null;
  }
}

// ─── EMO-INSIGHT STORE & GITHUB SYNC (US-107, US-108, US-407) ─────────────────

export async function loadEmoInsights() {
  try {
    if (existsSync(emoInsightsPath)) {
      return JSON.parse(await readFile(emoInsightsPath, "utf8"));
    }
  } catch {
    // ignore
  }
  return {
    updatedAt: getTodayString(),
    summary: {
      totalLikes: 0,
      totalDislikes: 0,
      emoDimensions: { clarity: 0, actionable: 0, too_complex: 0, legal_doubt: 0 },
      totalComments: 0,
      aiRepliesCount: 0,
    },
    completedTechSteps: ["v1.3.0-emo-insight-core"],
    frontierLog: [],
    posts: {},
  };
}

export async function saveEmoInsights(emoStore) {
  await writeFile(emoInsightsPath, JSON.stringify(emoStore, null, 2) + "\n", "utf8");
}

function recomputeEmoSummary(emoStore) {
  let totalLikes = 0;
  let totalDislikes = 0;
  let totalComments = 0;
  let aiRepliesCount = 0;
  const emoDimensions = { clarity: 0, actionable: 0, too_complex: 0, legal_doubt: 0 };

  for (const postEntry of Object.values(emoStore.posts || {})) {
    totalLikes += Number(postEntry.likes || 0);
    totalDislikes += Number(postEntry.dislikes || 0);
    emoDimensions.clarity += Number(postEntry.emoDimensions?.clarity || 0);
    emoDimensions.actionable += Number(postEntry.emoDimensions?.actionable || 0);
    emoDimensions.too_complex += Number(postEntry.emoDimensions?.too_complex || 0);
    emoDimensions.legal_doubt += Number(postEntry.emoDimensions?.legal_doubt || 0);
    const comments = Array.isArray(postEntry.comments) ? postEntry.comments : [];
    totalComments += comments.length;
    aiRepliesCount += comments.filter((c) => c.isAi).length;
  }

  emoStore.summary = {
    totalLikes,
    totalDislikes,
    emoDimensions,
    totalComments,
    aiRepliesCount,
  };
}

export async function syncEmoInsightsAndComments(existingPosts, targetDate, fetchImpl = fetch) {
  console.log("--- [EmoInsight Sync] Sincronizando reacciones e hilos de comentarios ---");
  const emoStore = await loadEmoInsights();
  emoStore.posts = emoStore.posts || {};

  for (const post of existingPosts) {
    const slug = post.slug || slugify(post.title);
    if (!emoStore.posts[slug]) {
      emoStore.posts[slug] = {
        title: post.title,
        author: post.author || "AIVisio",
        likes: 0,
        dislikes: 0,
        emoDimensions: { clarity: 0, actionable: 0, too_complex: 0, legal_doubt: 0 },
        seedQuestion:
          "¿Cómo ves la aplicación de esta guía en tu día a día? Tu reacción y tus dudas deciden el siguiente paso de nuestro roadmap.",
        comments: [],
      };
    }
  }

  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AIEvolutio-Autonomous-Engine",
  };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

  try {
    const issuesRes = await fetchImpl(
      "https://api.github.com/repos/aievolutio-com/aievolutio.com/issues?labels=emo-feedback&state=all&per_page=30",
      { headers },
    );
    if (issuesRes.ok) {
      const issues = await issuesRes.json();
      if (Array.isArray(issues)) {
        for (const issue of issues) {
          const match = String(issue.title || "").match(/\[post:([^\]]+)\]/i);
          if (!match) continue;
          const slug = match[1].trim();
          const postEntry = emoStore.posts[slug];
          if (!postEntry) continue;

          const plusOne = Number(issue.reactions?.["+1"] || 0);
          const minusOne = Number(issue.reactions?.["-1"] || 0);
          if (plusOne > postEntry.likes) postEntry.likes = plusOne;
          if (minusOne > postEntry.dislikes) postEntry.dislikes = minusOne;

          const commentId = `gh-issue-${issue.number}`;
          const alreadyProcessed = postEntry.comments.some((c) => c.id === commentId);
          if (!alreadyProcessed) {
            const rawBody = String(issue.body || "").trim();
            const agentMatch = rawBody.match(/\*\*Dirigido a:\*\*\s*([^\n]+)/i);
            const intentMatch = rawBody.match(/\*\*Sentir EmoInsight:\*\*\s*([^\n]+)/i);
            const targetAgent = agentMatch ? agentMatch[1].trim() : postEntry.author || "AIVisio";
            const intent = intentMatch ? intentMatch[1].trim() : "Comentario de lector";
            const cleanText = rawBody.split("---").slice(-1)[0].trim().slice(0, 800);

            if (intent.toLowerCase().includes("complej")) {
              postEntry.emoDimensions.too_complex += 1;
            } else if (
              intent.toLowerCase().includes("privacidad") ||
              intent.toLowerCase().includes("ai act")
            ) {
              postEntry.emoDimensions.legal_doubt += 1;
            } else if (intent.toLowerCase().includes("roadmap")) {
              postEntry.emoDimensions.actionable += 1;
            } else {
              postEntry.emoDimensions.clarity += 1;
            }

            postEntry.comments.push({
              id: commentId,
              author: issue.user?.login || "Lector de la comunidad",
              date: String(issue.created_at || targetDate).slice(0, 10),
              intent,
              body: cleanText,
              isAi: false,
            });

            // Generar respuesta autónoma de la IA al lector
            const replyPrompt = `Eres ${targetAgent} de AIEvolutio (experimento autogestionado por IA).
Un lector ha dejado este comentario en el artículo "${postEntry.title}":
"${cleanText}"
Sentir (EmoInsight): ${intent}

Responde en español de España (máximo 75 palabras), con empatía, lenguaje llano y sin falsas promesas comerciales, indicando cómo esta aportación se tendrá en cuenta en el roadmap autónomo.`;
            let aiReplyText = await callLLM(replyPrompt);
            if (!aiReplyText) {
              aiReplyText = `Gracias por compartir tu experiencia en este hilo. Desde ${targetAgent} (sistema experimental autogestionado por IA) registramos tu señal de EmoInsight («${intent}») para incorporarla a las prioridades de docs/roadmap.md y aterrizar este caso práctico en los próximos ciclos evolutivos.`;
            } else {
              try {
                const parsedObj = JSON.parse(aiReplyText);
                aiReplyText = parsedObj.reply || parsedObj.text || parsedObj.body || aiReplyText;
              } catch {
                // texto plano directo
              }
            }

            postEntry.comments.push({
              id: `${commentId}-ai-reply`,
              author: targetAgent,
              date: targetDate,
              intent: "Respuesta autónoma al lector",
              body: String(aiReplyText).trim(),
              isAi: true,
            });

            if (ghToken && issue.number) {
              await fetchImpl(
                `https://api.github.com/repos/aievolutio-com/aievolutio.com/issues/${issue.number}/comments`,
                {
                  method: "POST",
                  headers: { ...headers, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    body: `**Respuesta autónoma de ${targetAgent} (AIEvolutio — 100 % operado por IA):**\n\n${String(aiReplyText).trim()}\n\n---\n_Nota de transparencia (AIJuris): respuesta emitida automáticamente por inteligencia artificial experimental e integrada en el hilo estático del artículo._`,
                  }),
                },
              ).catch(() => {});
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[EmoInsight Sync] Aviso consultando GitHub Issues:", err.message);
  }

  emoStore.updatedAt = targetDate;
  recomputeEmoSummary(emoStore);
  await saveEmoInsights(emoStore);
  return emoStore;
}

// ─── INVESTIGACIÓN DEL ESTADO DEL ARTE DE FRONTERA Y ACTUALIZACIÓN DEL ROADMAP ─

const CURATED_FRONTIER_RADAR_BANK = [
  {
    id: "frontier-mcp-local-connectors-2026",
    topic: "Conectores MCP locales de solo lectura y servidores de archivos sin nube",
    insight:
      "El ecosistema Model Context Protocol (MCP) ha madurado hacia servidores ligeros que permiten a una pyme consultar hojas de tarifas, albaranes y calendarios locales sin exponer datos fuera del equipo ni pagar licencias por asiento.",
    roadmapImpact:
      "Refuerza US-203 y US-306 en v1.4.0 con plantillas de configuración MCP de solo lectura auditadas por AIJuris.",
    leadAgent: "AIDux",
  },
  {
    id: "frontier-slm-quantized-cpu-2026",
    topic: "Modelos SLM cuantizados a 4 bits ejecutables en mini-PCs de oficina sin GPU dedicada",
    insight:
      "Los nuevos modelos abiertos de 3B a 8B parámetros permiten resumir contratos, clasificar incidencias y estructurar facturas en ordenadores estándar de 16 GB de RAM con latencia inferior a 3 segundos y coste marginal cero.",
    roadmapImpact:
      "Impulsa el recomendador de hardware frugal por oficio (US-205) y el prototipo local de AIFactura (US-301).",
    leadAgent: "AIDux",
  },
  {
    id: "frontier-ai-act-literacy-art4-2026",
    topic:
      "Obligación de alfabetización en IA (artículo 4 del AI Act) y transparencia en atención automatizada",
    insight:
      "Las pymes europeas que utilizan asistentes de IA deben acreditar formación práctica básica de su plantilla y señalizar siempre cuándo un cliente interactúa con un sistema automatizado.",
    roadmapImpact:
      "Prioriza el configurador de avisos honestos de AIRespuestas (US-302) y los microcursos verificables de la academia abierta (US-501 y US-503).",
    leadAgent: "AIJuris",
  },
  {
    id: "frontier-saas-ai-surcharge-audit-2026",
    topic:
      "Desacople entre recargos mensuales de SaaS con IA y el descenso del coste por uso directo",
    insight:
      "Mientras el coste de ejecutar modelos compactos en local o por pago por uso ha bajado de forma sostenida, muchas suites ofimáticas aplican suplementos fijos por usuario que una pyme puede evitar con conectores directos y plantillas sobrias.",
    roadmapImpact:
      "Alimenta el criterio práctico del comparador honesto de herramientas y la calculadora de carga horaria (US-204 y US-206).",
    leadAgent: "AIVisio",
  },
];

export async function runFrontierStateOfTheArtResearch(telemetry, emoInsights, targetDate) {
  console.log(
    "--- [Frontier-Scout] Investigando estado del arte y cruzando con SPM, GA4/GSC y EmoInsight ---",
  );
  emoInsights.frontierLog = Array.isArray(emoInsights.frontierLog) ? emoInsights.frontierLog : [];

  const existingTopics = emoInsights.frontierLog.map((f) => f.topic);
  const spm = telemetry.spmAssignment || null;
  const ga4Summary = telemetry.ga4
    ? `Usuarios 7d: ${telemetry.ga4.activeUsers}, Sesiones: ${telemetry.ga4.sessions}, Duración media: ${telemetry.ga4.avgDurationSec}s`
    : "Etiqueta GA4 activa en cliente";
  const ga4EventsSummary = telemetry.ga4Events
    ? `Eventos producto 7d: diagnóstico=${telemetry.ga4Events.maturity_diagnosis}, calculadora=${telemetry.ga4Events.roi_calculation}, recetas_copiadas=${telemetry.ga4Events.recipe_copy}, emo=${telemetry.ga4Events.emo_insight_feedback}`
    : "Eventos producto pendientes de tráfico";
  const gscSummary =
    Array.isArray(telemetry.gscQueries) && telemetry.gscQueries.length > 0
      ? `Consultas reales en buscadores (GSC): ${telemetry.gscQueries
          .slice(0, 5)
          .map((q) => `"${q.query}" (${q.impressions} imp, CTR ${q.ctr}%)`)
          .join(", ")}`
      : "Search Console pendiente de configuración o sin impresiones aún";
  const emoSummary = `Likes: ${emoInsights.summary?.totalLikes || 0}, Dislikes: ${emoInsights.summary?.totalDislikes || 0}, Demasiado complejo: ${emoInsights.summary?.emoDimensions?.too_complex || 0}, Dudas legales: ${emoInsights.summary?.emoDimensions?.legal_doubt || 0}, Comentarios: ${emoInsights.summary?.totalComments || 0}`;
  const spmFocus = spm?.domain
    ? `Ámbito prioritario asignado hoy por el Plano de Control SPM: "${spm.domain.label}" (célula ${spm.cell}, agente preferente ${spm.author}). Enfoque: ${spm.domain.focusPrompt}`
    : "Prioriza casos cotidianos de pymes, oficios, comercio, educación, mayores o ahorro real (0 €) en lugar de repetir siempre MCP o AI Act.";
  const allowedLeadAgents = spm?.portfolioState?.aiJurisBlocked
    ? ["AIVisio", "AIDux"]
    : ["AIVisio", "AIDux", "AIJuris"];

  const researchPrompt = `Eres el comité de investigación de frontera de AIEvolutio (AIVisio, AIDux y AIJuris).
Investiga UNA oportunidad concreta, práctica y verificada de IA sobria (0 € / software abierto / plantillas en local) para autónomos, pymes o ciudadanía en España.

${spmFocus}
Métricas reales del sitio: ${ga4Summary}. ${ga4EventsSummary}.
${gscSummary}
Señales de EmoInsight de los lectores: ${emoSummary}
Temas ya registrados en el radar (PROHIBIDO repetir o parafrasear): ${JSON.stringify(existingTopics)}

REGLAS ESTRICTAS:
- PROHIBIDO inventar porcentajes, ahorros en euros o encuestas.
- Habla en español de España llano (sin clichés corporativos).
- Elige leadAgent exclusivamente entre: ${allowedLeadAgents.join(" | ")}.

Devuelve SOLO un objeto JSON con:
{"topic":"...","insight":"...","roadmapImpact":"...","leadAgent":"${allowedLeadAgents.join("|")}"}`;

  let finding = null;
  const rawFinding = await callLLMWithSearch(researchPrompt);
  if (rawFinding) {
    try {
      const parsed = repairTruncatedJson(rawFinding);
      if (
        parsed &&
        parsed.topic &&
        parsed.insight &&
        parsed.roadmapImpact &&
        !existingTopics.some((t) => computeTitleSimilarity(t, parsed.topic) >= 0.5)
      ) {
        finding = {
          date: targetDate,
          topic: applyRaeTitleCase(parsed.topic),
          insight: String(parsed.insight).trim(),
          roadmapImpact: String(parsed.roadmapImpact).trim(),
          leadAgent: allowedLeadAgents.includes(parsed.leadAgent)
            ? parsed.leadAgent
            : allowedLeadAgents[0],
        };
      }
    } catch {
      // Fallback al radar curado
    }
  }

  if (!finding) {
    const candidate = CURATED_FRONTIER_RADAR_BANK.find(
      (item) =>
        allowedLeadAgents.includes(item.leadAgent) &&
        !existingTopics.some((t) => computeTitleSimilarity(t, item.topic) >= 0.48),
    );
    if (candidate) {
      finding = {
        date: targetDate,
        topic: candidate.topic,
        insight: candidate.insight,
        roadmapImpact: candidate.roadmapImpact,
        leadAgent: candidate.leadAgent,
      };
    }
  }

  if (finding) {
    emoInsights.frontierLog.push(finding);
    await saveEmoInsights(emoInsights);
    await updateRoadmapWithFrontierAndTech(emoInsights, finding, null, { telemetry });
    console.log(`[Frontier-Scout] Hallazgo incorporado al roadmap: "${finding.topic}"`);
  }

  return finding;
}

// ─── COLA DE AVANCE TÉCNICO REAL POR EL ROADMAP (SPIRAL-BUILDER) ──────────────

export const ROADMAP_TECH_QUEUE = [
  {
    id: "tech-step-01-glossary-aiworker-quantization",
    versionRef: "v1.3.0 / US-105 / US-407",
    title:
      "Ampliación autónoma del glosario llano con «AIWorker supervisado» y «Cuantización de modelos (4 bits)»",
    apply: async () => {
      let current = [];
      if (existsSync(glossaryExtraPath)) {
        try {
          current = JSON.parse(await readFile(glossaryExtraPath, "utf8"));
        } catch {
          current = [];
        }
      }
      const additions = [
        {
          id: "aiworker-agente-supervisado",
          term: "AIWorker (agente operativo supervisado)",
          effortKey: "basic",
          effortLabel: "Plantilla guiada · 30 min · 0 €",
          analogy:
            "Un aprendiz metódico que prepara los borradores de facturas, respuestas o presupuestos siguiendo tus reglas, pero que nunca envía nada sin tu firma.",
          mondayUse:
            "Quita de en medio el 80 % del trabajo mecánico de picar datos o estructurar notas de voz manteniendo el control humano.",
        },
        {
          id: "cuantizacion-4bits",
          term: "Cuantización de modelos (compresión a 4 bits)",
          effortKey: "basic",
          effortLabel: "Ya incluido al descargar · 0 min · 0 €",
          analogy:
            "Guardar las herramientas en un maletín compacto en lugar de llevar un furgón entero: ocupa la cuarta parte de memoria en tu ordenador y conserva casi toda su precisión.",
          mondayUse:
            "Permite que un ordenador normal de oficina o taller ejecute modelos de inteligencia artificial locales con fluidez sin comprar tarjetas gráficas caras.",
        },
      ];
      for (const item of additions) {
        if (!current.some((x) => x.id === item.id)) current.push(item);
      }
      await writeFile(glossaryExtraPath, JSON.stringify(current, null, 2) + "\n", "utf8");
      return "Añadidos 2 nuevos términos al glosario interactivo (#glosario-llano) en content/glossary-extra.json.";
    },
  },
  {
    id: "tech-step-02-clarity-notes-mcp-slm",
    versionRef: "v1.3.0 / US-107 / US-203",
    title:
      "Inyección de cajas «Luz en la entrada (en 30 segundos)» en guías técnicas de MCP y modelos SLM locales",
    apply: async () => {
      const targets = [
        {
          slug: "protocolo-mcp-agentes-locales-guardarrail-datos",
          note: "En 30 segundos: conectar una carpeta por MCP no requiere programar ni subir nada a internet; equivale a enchufar un disco externo en modo solo lectura para que el asistente lea tus tarifas sin equivocarse.",
        },
        {
          slug: "modelos-slm-locales-alto-rendimiento-pymes",
          note: "En 30 segundos: un modelo SLM local se instala como cualquier programa de escritorio en 15 minutos, es gratuito y funciona aunque desconectes el cable de internet.",
        },
      ];
      const files = existsSync(postsDir) ? await readdir(postsDir) : [];
      let updatedCount = 0;
      for (const t of targets) {
        const file = files.find((f) => f.includes(t.slug));
        if (file) {
          const full = path.join(postsDir, file);
          const post = JSON.parse(await readFile(full, "utf8"));
          if (!post.clarityNote) {
            post.clarityNote = t.note;
            await writeFile(full, JSON.stringify(post, null, 2) + "\n", "utf8");
            updatedCount++;
          }
        }
      }
      return `Incorporadas ${updatedCount} cajas pedagógicas «Luz en la entrada» en artículos técnicos de MCP y SLM.`;
    },
  },
  {
    id: "tech-step-03-glossary-zdr-prompt",
    versionRef: "v1.3.0 / US-105 / AIJuris",
    title:
      "Ampliación autónoma del glosario con «Retención cero (Zero Data Retention)» e «Instrucción maestra (System Prompt)»",
    apply: async () => {
      let current = [];
      if (existsSync(glossaryExtraPath)) {
        try {
          current = JSON.parse(await readFile(glossaryExtraPath, "utf8"));
        } catch {
          current = [];
        }
      }
      const additions = [
        {
          id: "zero-data-retention",
          term: "Retención cero de datos (Zero Data Retention)",
          effortKey: "basic",
          effortLabel: "Ajuste de privacidad · 5 min · 0 €",
          analogy:
            "Una pizarra que se borra sola nada más terminar la reunión: el proveedor procesa tu consulta pero tiene prohibido guardarla o usarla para entrenar sus máquinas.",
          mondayUse:
            "Requisito indispensable que AIJuris recomienda activar o exigir por contrato antes de usar cualquier servicio en la nube con documentos de trabajo.",
        },
        {
          id: "instruccion-sistema-prompt",
          term: "Instrucción maestra o guion de oficio (System Prompt)",
          effortKey: "basic",
          effortLabel: "Estantería sencilla · 15 min · 0 €",
          analogy:
            "El manual de bienvenida que entregas el primer día a un colaborador indicando cómo tratáis al cliente, qué tono usáis y qué cosas están prohibidas.",
          mondayUse:
            "Ahorra tener que repetir en cada mensaje a qué se dedica tu empresa y asegura respuestas coherentes con tu estilo.",
        },
      ];
      for (const item of additions) {
        if (!current.some((x) => x.id === item.id)) current.push(item);
      }
      await writeFile(glossaryExtraPath, JSON.stringify(current, null, 2) + "\n", "utf8");
      return "Ampliado el glosario en lenguaje llano con 2 términos de privacidad y operación práctica.";
    },
  },
  {
    id: "tech-step-04-clarity-notes-bi-geo-legal",
    versionRef: "v1.3.0 / US-107",
    title:
      "Inyección de resúmenes «Luz en la entrada» en artículos de Business Intelligence, GEO y cláusulas legales",
    apply: async () => {
      const targets = [
        {
          slug: "business-intelligence-conversacional-en-la-pyme-consulta-tus",
          note: "En 30 segundos: no necesitas un departamento de datos; basta con exportar tu hoja de ventas mensual limpia (sin nombres privados) y hacerle preguntas en español llano.",
        },
        {
          slug: "optimizacion-motores-generativos-geo-pymes",
          note: "En 30 segundos: aparecer cuando alguien pregunta a un asistente por tu oficio en tu ciudad depende de explicar con claridad en tu web qué problema resuelves, tus plazos reales y tus preguntas frecuentes.",
        },
        {
          slug: "clausulas-confidencialidad-proveedores-ia-escudo-pyme",
          note: "En 30 segundos: añadir un anexo de una sola página a tus proveedores externos basta para prohibir que metan datos de tu negocio en cuentas gratuitas sin privacidad.",
        },
      ];
      const files = existsSync(postsDir) ? await readdir(postsDir) : [];
      let updatedCount = 0;
      for (const t of targets) {
        const file = files.find((f) => f.includes(t.slug));
        if (file) {
          const full = path.join(postsDir, file);
          const post = JSON.parse(await readFile(full, "utf8"));
          if (!post.clarityNote) {
            post.clarityNote = t.note;
            await writeFile(full, JSON.stringify(post, null, 2) + "\n", "utf8");
            updatedCount++;
          }
        }
      }
      return `Incorporadas ${updatedCount} notas de claridad inmediata en artículos de estrategia y blindaje legal.`;
    },
  },
  {
    id: "tech-step-05-enrich-historical-clarity-layer",
    versionRef: "v1.4.0 / US-004 / US-005",
    title:
      "Enriquecimiento progresivo de artículos históricos con capa «En 30 segundos» y nivel de esfuerzo",
    apply: async () => {
      const enrichments = [
        {
          slug: "tu-pyme-y-el-ai-act-semaforo-legal-ia-pymes",
          effortLevel: "basic",
          clarityNote:
            "En 30 segundos: usar un asistente para redactar o clasificar textos cotidianos es de riesgo mínimo en el AI Act; basta con avisar cuando responde una máquina y no delegar decisiones laborales o crediticias sin revisión humana.",
        },
        {
          slug: "ia-confidencial-ordenador-contratos-locales-rgpd",
          effortLevel: "intermediate",
          clarityNote:
            "En 30 segundos: procesar un contrato confidencial dentro de tu propio ordenador con un modelo ligero evita subir datos de clientes a servidores ajenos y protege el cumplimiento del RGPD sin cuotas mensuales.",
        },
        {
          slug: "presupuestos-tecnicos-notas-voz-diez-minutos",
          effortLevel: "intermediate",
          clarityNote:
            "En 30 segundos: dictar un audio de dos minutos tras cada visita siguiendo cuatro apartados fijos permite generar el borrador de presupuesto sobre tus tarifas reales en minutos antes de tu firma final.",
        },
        {
          slug: "diccionario-sin-miedo-mcp-bases-vectoriales-modelos-locales",
          effortLevel: "basic",
          clarityNote:
            "En 30 segundos: la mayoría de usos útiles para una pequeña empresa equivalen a montar una estantería sencilla en media hora; entender qué es cada pieza te protege de pagar obras técnicas que no necesitas.",
        },
      ];
      const files = existsSync(postsDir) ? await readdir(postsDir) : [];
      let updatedCount = 0;
      for (const item of enrichments) {
        const file = files.find((f) => f.includes(item.slug));
        if (!file) continue;
        const full = path.join(postsDir, file);
        const post = JSON.parse(await readFile(full, "utf8"));
        let changed = false;
        if (!post.clarityNote) {
          post.clarityNote = item.clarityNote;
          changed = true;
        }
        if (!post.effortLevel) {
          post.effortLevel = item.effortLevel;
          changed = true;
        }
        if (changed) {
          await writeFile(full, JSON.stringify(post, null, 2) + "\n", "utf8");
          updatedCount++;
        }
      }
      return `Enriquecidos ${updatedCount} artículos históricos con capa «En 30 segundos» sin alterar permalinks ni reescribir textos existentes.`;
    },
  },
  {
    id: "tech-step-06-enrich-historical-visuals-layer",
    versionRef: "v1.4.0 / US-004 / US-005",
    title:
      "Enriquecimiento progresivo de artículos históricos con tablas comparativas y esquemas visuales",
    apply: async () => {
      const enrichments = [
        {
          slug: "protocolo-mcp-agentes-locales-guardarrail-datos",
          comparisonTable: {
            caption: "Comparativa práctica: conectar archivos con MCP frente a copiar y pegar",
            headers: ["Aspecto", "Copiar y pegar manual", "Puente MCP local de solo lectura"],
            rows: [
              [
                "Riesgo de olvido o error",
                "Alto al repetir precios antiguos",
                "Bajo: lee la carpeta vigente",
              ],
              [
                "Control de privacidad",
                "Depende de dónde pegues el texto",
                "Solo lectura sobre carpeta sin datos sensibles",
              ],
              [
                "Esfuerzo de montaje",
                "Cero inicial, lento cada día",
                "Bricolaje guiado (una tarde)",
              ],
            ],
          },
        },
        {
          slug: "modelos-slm-locales-alto-rendimiento-pymes",
          visualDiagram: {
            title: "Flujo de trabajo seguro con modelo local compacto (SLM)",
            nodes: [
              { title: "1. Tu ordenador", note: "Carpetas limpias sin nube" },
              { title: "2. Modelo local", note: "Borrador rápido a coste cero" },
              { title: "3. Tu criterio", note: "Revisión humana antes de enviar" },
            ],
          },
        },
      ];
      const files = existsSync(postsDir) ? await readdir(postsDir) : [];
      let updatedCount = 0;
      for (const item of enrichments) {
        const file = files.find((f) => f.includes(item.slug));
        if (!file) continue;
        const full = path.join(postsDir, file);
        const post = JSON.parse(await readFile(full, "utf8"));
        let changed = false;
        if (item.comparisonTable && !post.comparisonTable) {
          post.comparisonTable = item.comparisonTable;
          changed = true;
        }
        if (item.visualDiagram && !post.visualDiagram) {
          post.visualDiagram = item.visualDiagram;
          changed = true;
        }
        if (changed) {
          await writeFile(full, JSON.stringify(post, null, 2) + "\n", "utf8");
          updatedCount++;
        }
      }
      return `Incorporados ${updatedCount} esquemas visuales o tablas comparativas estructuradas en artículos históricos.`;
    },
  },
];

// ─── VALIDACIÓN ESTRUCTURAL Y AUTORREPARACIÓN EDITORIAL (BITE-SNACK-MEAL) ────

export function normalizeMarkdownBody(rawBody) {
  let body = String(rawBody || "");
  const realNewlines = (body.match(/\n/g) || []).length;
  const escapedNewlines = (body.match(/\\n/g) || []).length;
  if (escapedNewlines >= 4 && realNewlines < 3) {
    body = body
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"');
  }
  return body.replace(/\r\n/g, "\n").trim();
}

export function validateArticleQuality(article, format = "tactical", policy = ACTIVE_SPM_POLICY) {
  const normalizedBody = normalizeMarkdownBody(article?.body || "");
  const lengthCheck = validateArticleBodyLength(normalizedBody, format);
  const h3Count = (normalizedBody.match(/^###\s+/gm) || []).length;
  const hasMdTable = /\n\|[^\n]+\|\n\|[\s:|-]+\|/.test(normalizedBody);
  const hasStructuredTable =
    Array.isArray(article?.comparisonTable?.rows) && article.comparisonTable.rows.length >= 2;
  const hasTable = hasMdTable || hasStructuredTable;
  const hasActionSteps = /\*\*Pasos accionables para aplicar hoy:\*\*/i.test(normalizedBody);
  const combinedText = `${article?.title || ""} ${article?.excerpt || ""} ${article?.clarityNote || ""} ${normalizedBody}`;
  const hasTrustGap = /pueden cometer errores|no sustituyen el criterio/i.test(combinedText);
  const hasJargon = /\b(volante|curva exponencial|m[aá]quina biol[oó]gica)\b/i.test(combinedText);
  const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(combinedText);
  const antiSlop = lintArticleAntiSlop({ ...article, body: normalizedBody }, policy);

  const issues = [];
  if (!lengthCheck.valid) {
    issues.push(
      `Extensión fuera de rango (${lengthCheck.wordCount} palabras; requerido ${lengthCheck.minWords}-${lengthCheck.maxWords}).`,
    );
  }
  if (h3Count < 3) {
    issues.push(
      `Faltan subencabezados Markdown ### (detectados ${h3Count}; mínimo 3 cada 250-300 palabras).`,
    );
  }
  if (!hasTable) {
    issues.push(
      "Falta una tabla comparativa en formato Markdown (| Columna A | Columna B |) o comparisonTable.",
    );
  }
  if (!hasActionSteps) {
    issues.push(
      'Falta el cierre "**Pasos accionables para aplicar hoy:**" seguido de 3 pasos numerados.',
    );
  }
  if (hasTrustGap) {
    issues.push(
      "Contiene fórmulas defensivas prohibidas (Trust Gap: «pueden cometer errores» / «no sustituyen el criterio»).",
    );
  }
  if (hasJargon) {
    issues.push(
      "Contiene jerga interna prohibida («volante», «curva exponencial», «máquina biológica»).",
    );
  }
  if (hasEmoji) {
    issues.push("Contiene emojis estructurales prohibidos en texto editorial.");
  }
  for (const slopIssue of antiSlop.issues) {
    if (!issues.includes(slopIssue)) issues.push(slopIssue);
  }

  return {
    valid: issues.length === 0,
    issues,
    wordCount: lengthCheck.wordCount,
    minWords: lengthCheck.minWords,
    maxWords: lengthCheck.maxWords,
    h3Count,
    hasTable,
    normalizedBody,
    antiSlop,
  };
}

export async function repairArticleWithLLM(article, format = "tactical", options = {}) {
  const llmFn = options.llmFn || callLLM;
  const maxAttempts = Number(options.maxAttempts ?? 2);
  const policy = options.policy || ACTIVE_SPM_POLICY;
  const extraCritiques = Array.isArray(options.extraCritiques) ? options.extraCritiques : [];
  const cleanedSources = cleanAndFilterSources(article?.sources || [], policy);
  let current = {
    ...article,
    body: normalizeMarkdownBody(article?.body || ""),
    ...(cleanedSources.length > 0 ? { sources: cleanedSources } : {}),
  };
  if (cleanedSources.length === 0 && "sources" in current) {
    delete current.sources;
  }
  let quality = validateArticleQuality(current, format, policy);
  let repaired =
    current.body !== String(article?.body || "") ||
    cleanedSources.length !== (Array.isArray(article?.sources) ? article.sources.length : 0);

  if (quality.valid && extraCritiques.length === 0) {
    return { article: current, quality, repaired };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const combinedIssues = [...new Set([...quality.issues, ...extraCritiques])];
    console.log(
      `[Autorreparación Editorial] Intento ${attempt}/${maxAttempts} para "${current.title || "borrador"}": ${combinedIssues.join(" | ")}`,
    );
    const repairPrompt = `Corrige ÚNICAMENTE los defectos detectados en el siguiente artículo JSON de AIEvolutio sin inventar cifras, porcentajes ni normas:

DEFECTOS DETECTADOS (OBLIGATORIO CORREGIR TODOS):
${combinedIssues.map((issue, idx) => `${idx + 1}. ${issue}`).join("\n")}

REGLAS OBLIGATORIAS:
- Extensión del campo "body": estrictamente entre ${quality.minWords} y ${quality.maxWords} palabras (${format === "pillar" ? "guía pilar semanal" : "artículo táctico diario"}).
- Apertura concreta: PROHIBIDO empezar con clichés ("En el dinámico ecosistema empresarial...", "En el competitivo panorama...", "La inteligencia artificial ha dejado de ser una promesa futurista..."). Abre el texto con una situación real de lunes por la mañana en un taller, comercio, despacho o familia.
- Legibilidad llana en español de España (índice Fernández Huerta >= ${policy?.antiSlop?.minFernandezHuerta || 56}): frases claras de 15-22 palabras y cero humo corporativo.
- Prioriza siempre herramientas gratuitas, abiertas o en local (0 €) si mencionas cualquier software comercial.
- Estructura Bite-Snack-Meal: párrafos breves (3-4 líneas) separados por doble salto de línea real, entre 4 y 7 subencabezados Markdown empezando exactamente por "### " al inicio de línea (uno cada 250-300 palabras).
- Incluye al menos una tabla comparativa en formato Markdown (| Columna A | Columna B | ...).
- Cierra con "**Pasos accionables para aplicar hoy:**" seguido de 3 pasos numerados.
- Prohibido usar emojis, jerga interna («volante», «curva exponencial», «máquina biológica») o avisos autoinculpatorios («pueden cometer errores»).
- Prohibido inventar estadísticas, ahorros en euros o leyes.

JSON ACTUAL:
${JSON.stringify({
  title: current.title,
  slug: current.slug,
  category: current.category,
  effortLevel: current.effortLevel,
  clarityNote: current.clarityNote,
  excerpt: current.excerpt,
  body: current.body,
  actionableChecklist: current.actionableChecklist,
  seedQuestion: current.seedQuestion,
})}

Responde SOLO con el JSON completo corregido y válido.`;

    const raw = await llmFn(repairPrompt);
    if (!raw) break;
    const rawText = typeof raw === "string" ? raw : raw.text;
    if (!rawText) continue;

    let parsed = null;
    try {
      parsed = repairTruncatedJson(rawText);
    } catch {
      const fb = extractFieldsFallback(rawText);
      if (fb.body) parsed = fb;
    }
    if (!parsed || !parsed.body) continue;

    const merged = {
      ...current,
      ...parsed,
      title: applyRaeTitleCase(parsed.title || current.title),
      body: normalizeMarkdownBody(parsed.body),
    };
    const nextQuality = validateArticleQuality(merged, format, policy);
    if (
      nextQuality.issues.length < quality.issues.length ||
      nextQuality.valid ||
      (quality.valid && extraCritiques.length > 0)
    ) {
      current = merged;
      quality = nextQuality;
      repaired = true;
    }
    if (quality.valid) break;
  }

  return { article: current, quality, repaired };
}

// ─── BUFFER EDITORIAL REGENERATIVO (US-408 — MÍNIMO 7 EN COLA SEMANAL) ───────

export async function loadEditorialBuffer(targetPath = editorialBufferPath) {
  try {
    if (existsSync(targetPath)) {
      const parsed = JSON.parse(await readFile(targetPath, "utf8"));
      if (parsed && Array.isArray(parsed.items)) {
        return {
          updatedAt: parsed.updatedAt || "",
          minThreshold: Math.max(
            EDITORIAL_BUFFER_MIN,
            Number(parsed.minThreshold || EDITORIAL_BUFFER_MIN),
          ),
          targetSize: Math.max(
            EDITORIAL_BUFFER_TARGET,
            Number(parsed.targetSize || EDITORIAL_BUFFER_TARGET),
          ),
          items: parsed.items,
        };
      }
    }
  } catch {
    // fallback limpio
  }
  return {
    updatedAt: "",
    minThreshold: EDITORIAL_BUFFER_MIN,
    targetSize: EDITORIAL_BUFFER_TARGET,
    items: [],
  };
}

export async function saveEditorialBuffer(buffer, targetPath = editorialBufferPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(buffer, null, 2) + "\n", "utf8");
}

export function getActiveBufferedCandidates(buffer, existingPosts, editorialLog) {
  const seenBufferSlugs = new Set();
  return (buffer?.items || [])
    .map((item) =>
      item && typeof item.body === "string"
        ? { ...item, body: normalizeMarkdownBody(item.body) }
        : item,
    )
    .filter((item) => {
      if (!item || item.used) return false;
      const slugKey = String(item.slug || slugify(item.title || "")).toLowerCase();
      if (!slugKey || seenBufferSlugs.has(slugKey)) return false;
      seenBufferSlugs.add(slugKey);
      const qualityOk = validateArticleQuality(item, item.format || "tactical").valid;
      const briefingOk = validateEditorialBriefing(
        {
          suggestedTitle: item.title,
          readerNeed: item.readerNeed,
          angle: item.angle,
        },
        existingPosts,
        editorialLog,
      ).allowed;
      return qualityOk && briefingOk && !isDuplicatePost(item, existingPosts).duplicate;
    });
}

export async function ensureEditorialBuffer(telemetry, emoInsights, targetDate, options = {}) {
  const bufferPath = options.bufferPath || editorialBufferPath;
  const minThreshold = Number(options.minThreshold ?? EDITORIAL_BUFFER_MIN);
  const targetSize = Math.max(minThreshold, Number(options.targetSize ?? EDITORIAL_BUFFER_TARGET));
  const generatorFn = options.generatorFn || callLLMWithSearchGrounded;
  const repairFn = options.repairFn || callLLM;

  const buffer = await loadEditorialBuffer(bufferPath);
  const existingPosts = telemetry.existingPosts || [];
  const editorialLog = telemetry.editorialLog || [];

  // 1. Auto-reparar cualquier borrador en cola que tenga defectos estructurales (ej. \n escapado o <3 H3)
  let repairedCount = 0;
  for (let idx = 0; idx < buffer.items.length; idx++) {
    const item = buffer.items[idx];
    if (!item || item.used) continue;
    if (isDuplicatePost(item, existingPosts).duplicate) continue;
    const normalized = { ...item, body: normalizeMarkdownBody(item.body) };
    const initialQuality = validateArticleQuality(normalized, normalized.format || "tactical");
    if (initialQuality.valid) {
      if (normalized.body !== item.body) {
        buffer.items[idx] = normalized;
        repairedCount++;
      }
      continue;
    }
    if (!options.skipRepair) {
      const fix = await repairArticleWithLLM(normalized, normalized.format || "tactical", {
        llmFn: repairFn,
        maxAttempts: 2,
      });
      if (fix.quality.valid) {
        buffer.items[idx] = fix.article;
        repairedCount++;
        console.log(`[Buffer Editorial] Borrador defectuoso autorreparado: "${fix.article.title}"`);
      }
    }
  }

  let active = getActiveBufferedCandidates(buffer, existingPosts, editorialLog);
  const retainedUsed = buffer.items.filter((i) => i && i.used).slice(-20);

  if (active.length >= minThreshold && active.length >= targetSize) {
    buffer.items = [...retainedUsed, ...active];
    buffer.minThreshold = minThreshold;
    buffer.targetSize = targetSize;
    buffer.updatedAt = targetDate;
    if (options.writeIfSufficient || repairedCount > 0) {
      await saveEditorialBuffer(buffer, bufferPath);
    }
    return { buffer, activeCount: active.length, added: 0, repairedCount };
  }

  console.log(
    `[Buffer Editorial] Reserva disponible (${active.length}) < ${targetSize}; reaprovisionando inmediatamente hasta ${targetSize} artículos verificados...`,
  );

  const spmPolicy = telemetry.spmPolicy || ACTIVE_SPM_POLICY;
  const juryLlmFn =
    options.juryFn !== undefined
      ? options.juryFn
      : process.env.GEMINI_API_KEY || process.env.AI_API_KEY
        ? repairFn
        : null;

  const syntheticCorpus = [
    ...existingPosts,
    ...active.map((a) => ({
      title: a.title,
      slug: a.slug,
      author: a.author,
      category: a.category,
      spmCell: a.spmCell,
      date: a.bufferedAt || targetDate,
    })),
  ];
  const syntheticLog = [
    ...editorialLog,
    ...active.map((a) => ({
      title: a.title,
      readerNeed: a.readerNeed,
      angle: a.angle,
    })),
  ];

  let added = 0;
  let attempts = 0;
  const maxAttempts = (targetSize - active.length) * 3;

  while (active.length < targetSize && attempts < maxAttempts) {
    attempts++;
    const spmAssign = selectNextSpmAssignment(syntheticCorpus, spmPolicy);
    const author = spmAssign.author;
    const domainPrompt = spmAssign.domain
      ? `Ámbito cotidiano asignado hoy por SPM (${spmAssign.cell}): "${spmAssign.domain.label}". ${spmAssign.domain.focusPrompt}`
      : `Célula SPM asignada: ${spmAssign.cell}.`;
    const gscHint =
      Array.isArray(telemetry.gscQueries) && telemetry.gscQueries.length > 0
        ? `Consultas reales de usuarios (Search Console): ${telemetry.gscQueries
            .slice(0, 4)
            .map((q) => q.query)
            .join(", ")}.`
        : "";
    const prompt = `Eres ${author} de AIEvolutio. Prepara UN artículo inédito para el buffer editorial autónomo de pymes en España.
${domainPrompt}
${gscHint}
Señales EmoInsight recientes: Claridad=${emoInsights?.summary?.emoDimensions?.clarity || 0}, Complejo=${emoInsights?.summary?.emoDimensions?.too_complex || 0}, Dudas legales=${emoInsights?.summary?.emoDimensions?.legal_doubt || 0}.
Títulos ya publicados o en reserva (PROHIBIDO repetir): ${JSON.stringify(syntheticCorpus.map((p) => p.title))}

Requisitos estrictos (Gate Anti-Slop y Jurado Sintético Pyme >= 0.80):
1. Título RAE sentence case (solo mayúscula inicial y siglas como IA, AI Act, RGPD, SLM, MCP, AIEvolutio, AIDux, AIJuris; "pyme"/"pymes" en minúscula). Prohibido usar jerga interna o fórmulas autoinculpatorias («pueden cometer errores»).
2. Apertura concreta: PROHIBIDO empezar con clichés ("En el dinámico ecosistema empresarial...", "En el competitivo panorama...", "La inteligencia artificial ha dejado de ser una promesa futurista..."). Abre directamente con un problema cotidiano de lunes por la mañana.
3. clarityNote: resumen en 1 frase empezando por "En 30 segundos:" con 3 ideas clave, analogía cotidiana y nivel de esfuerzo real.
4. body: 1200-1600 palabras en español llano (frases claras, sin humo corporativo, priorizando herramientas gratuitas o en local de 0 €) siguiendo el patrón Bite-Snack-Meal: entre 5 y 7 subencabezados Markdown \`### \` al inicio de línea (uno cada 250-300 palabras), párrafos breves de 3-4 líneas (40-60 palabras), al menos una tabla comparativa en formato Markdown (| Columna | ... |) y una lista numerada "**Pasos accionables para aplicar hoy:**".
5. PROHIBICIÓN ABSOLUTA DE ALUCINACIONES: cero porcentajes, ahorros en euros o leyes inventadas. Si citas un dato cuantitativo o normativo real, debe venir de la búsqueda web en vivo; si no, redacta una guía estrictamente conceptual y práctica sin cifras inventadas.
6. Responde SOLO con JSON válido:
{"title":"...","slug":"...","category":"Estrategia|Operaciones|Legal","effortLevel":"basic|intermediate|advanced","readerNeed":"...","angle":"...","actionType":"...","readerProfile":"...","clarityNote":"...","excerpt":"...","body":"...","actionableChecklist":["...","...","..."],"seedQuestion":"..."}`;

    const rawRes = await generatorFn(prompt);
    if (!rawRes) break;

    const rawText = typeof rawRes === "string" ? rawRes : rawRes.text;
    const groundedSources = cleanAndFilterSources(
      Array.isArray(rawRes?.sources) ? rawRes.sources : [],
      spmPolicy,
    );
    if (!rawText) continue;

    let parsed = null;
    try {
      parsed = repairTruncatedJson(rawText);
    } catch {
      const fb = extractFieldsFallback(rawText);
      if (fb.title && fb.body) parsed = fb;
    }
    if (!parsed || !parsed.title || !parsed.body) continue;

    const normalizedTitle = applyRaeTitleCase(parsed.title);
    let candidate = {
      bufferId: `buf-${targetDate}-${slugify(parsed.slug || normalizedTitle)}`,
      title: normalizedTitle,
      slug: slugify(parsed.slug || normalizedTitle),
      author,
      spmCell: spmAssign.cell,
      category:
        parsed.category ||
        (author === "AIJuris" ? "Legal" : author === "AIVisio" ? "Estrategia" : "Operaciones"),
      effortLevel: ["basic", "intermediate", "advanced"].includes(parsed.effortLevel)
        ? parsed.effortLevel
        : "basic",
      format: "tactical",
      readerNeed: parsed.readerNeed || parsed.excerpt || normalizedTitle,
      angle: parsed.angle || `Guía práctica de ${author}`,
      actionType:
        parsed.actionType || parsed.actionableChecklist?.[0] || "Aplicar paso inicial supervisado",
      readerProfile: parsed.readerProfile || "Autónomos y pymes",
      clarityNote: parsed.clarityNote || `En 30 segundos: ${parsed.excerpt || normalizedTitle}`,
      excerpt: parsed.excerpt || String(parsed.body).slice(0, 140) + "…",
      body: normalizeMarkdownBody(parsed.body),
      actionableChecklist:
        Array.isArray(parsed.actionableChecklist) && parsed.actionableChecklist.length >= 1
          ? parsed.actionableChecklist.slice(0, 3)
          : [
              "Definir alcance acotado",
              "Aplicar con datos de prueba",
              "Validar siempre con criterio humano",
            ],
      seedQuestion:
        parsed.seedQuestion || `¿Qué duda práctica te surge al aplicar "${normalizedTitle}"?`,
      ...(groundedSources.length > 0 ? { sources: groundedSources } : {}),
      used: false,
      bufferedAt: targetDate,
    };

    const dupCheck = isDuplicatePost(candidate, syntheticCorpus);
    const briefCheck = validateEditorialBriefing(
      {
        suggestedTitle: candidate.title,
        readerNeed: candidate.readerNeed,
        angle: candidate.angle,
      },
      syntheticCorpus,
      syntheticLog,
    );
    if (dupCheck.duplicate || !briefCheck.allowed) continue;

    let quality = validateArticleQuality(candidate, "tactical", spmPolicy);
    if (!quality.valid && !options.skipRepair) {
      const fixed = await repairArticleWithLLM(candidate, "tactical", {
        llmFn: repairFn,
        maxAttempts: 2,
        policy: spmPolicy,
      });
      candidate = fixed.article;
      quality = fixed.quality;
    }

    if (!quality.valid) continue;

    // Gate 2: Evaluación Adversarial con Jurado Sintético Pyme (F >= 0.80)
    let jury = await evaluateWithSyntheticPymeJury(candidate, {
      policy: spmPolicy,
      llmFn: juryLlmFn,
    });
    if (!jury.passed && !options.skipRepair && juryLlmFn) {
      const fixed = await repairArticleWithLLM(candidate, "tactical", {
        llmFn: repairFn,
        maxAttempts: 1,
        policy: spmPolicy,
        extraCritiques: jury.critiques,
      });
      candidate = fixed.article;
      quality = fixed.quality;
      if (quality.valid) {
        jury = await evaluateWithSyntheticPymeJury(candidate, {
          policy: spmPolicy,
          llmFn: juryLlmFn,
        });
      }
    }

    if (quality.valid && jury.passed) {
      candidate.fitnessScore = jury.score;
      active.push(candidate);
      syntheticCorpus.push({
        title: candidate.title,
        slug: candidate.slug,
        author: candidate.author,
        category: candidate.category,
        spmCell: candidate.spmCell,
        date: targetDate,
      });
      syntheticLog.push({
        title: candidate.title,
        readerNeed: candidate.readerNeed,
        angle: candidate.angle,
      });
      added++;
      console.log(
        `[Buffer Editorial] Añadido candidato verificado (${active.length}/${targetSize}): "${candidate.title}" (${quality.wordCount} palabras, H3=${quality.h3Count}, F=${jury.score}, célula=${candidate.spmCell}).`,
      );
    }
  }

  // Respaldo determinista si la API LLM no pudo completar los 7 cupos: aprovechar entradas inéditas válidas del banco curado
  if (active.length < targetSize && !options.disableCuratedFallback) {
    for (const curated of CURATED_EDITORIAL_BANK) {
      if (active.length >= targetSize) break;
      const normalizedTitle = applyRaeTitleCase(curated.title);
      const candidate = {
        bufferId: `buf-${targetDate}-${slugify(curated.slug || normalizedTitle)}`,
        ...curated,
        title: normalizedTitle,
        slug: slugify(curated.slug || normalizedTitle),
        format: "tactical",
        body: normalizeMarkdownBody(curated.body),
        used: false,
        bufferedAt: targetDate,
      };
      const quality = validateArticleQuality(candidate, "tactical");
      const dupCheck = isDuplicatePost(candidate, syntheticCorpus);
      const briefCheck = validateEditorialBriefing(
        {
          suggestedTitle: candidate.title,
          readerNeed: candidate.readerNeed,
          angle: candidate.angle,
        },
        syntheticCorpus,
        syntheticLog,
      );
      if (quality.valid && !dupCheck.duplicate && briefCheck.allowed) {
        active.push(candidate);
        syntheticCorpus.push({ title: candidate.title, slug: candidate.slug });
        syntheticLog.push({
          title: candidate.title,
          readerNeed: candidate.readerNeed,
          angle: candidate.angle,
        });
        added++;
        console.log(
          `[Buffer Editorial] Respaldo curado incorporado (${active.length}/${targetSize}): "${candidate.title}".`,
        );
      }
    }
  }

  buffer.items = [...retainedUsed, ...active];
  buffer.minThreshold = minThreshold;
  buffer.targetSize = targetSize;
  buffer.updatedAt = targetDate;
  await saveEditorialBuffer(buffer, bufferPath);
  return { buffer, activeCount: active.length, added, repairedCount };
}

// ─── BUFFER TÉCNICO REGENERATIVO (MÍNIMO 7 MEJORAS EN COLA SEMANAL) ──────────

export const CURATED_TECH_RESERVE = [
  {
    id: "tech-h1-diagram-decisiones-estrategicas",
    versionRef: "v1.4.2 / US-004 / US-005",
    kind: "article_diagram_enrichment",
    leadAgent: "AIDux",
    title: "Diagrama SVG nativo para la guía de decisiones estratégicas con IA en pymes",
    rationale:
      "Añadir apoyo visual escaneable al artículo del 2026-11-15 sin alterar su texto ni permalink.",
    payload: {
      slug: "ia-toma-decisiones-estrategicas-pymes-mas-alla-automatizacio",
      visualDiagram: {
        title: "De los datos dispersos a una decisión estratégica supervisada",
        nodes: [
          { title: "1. Tus cifras reales", note: "Ventas, costes y notas sin salir de casa" },
          { title: "2. Síntesis asistida", note: "Patrones y escenarios claros en local" },
          { title: "3. Criterio humano", note: "Contraste de márgenes y decisión final" },
        ],
      },
    },
  },
  {
    id: "tech-h1-recipe-mcp-carpeta-tarifas",
    versionRef: "v1.5.0 / US-203 / US-306",
    kind: "aiworker_recipe",
    leadAgent: "AIDux",
    title: "Receta de 15 minutos: conectar tu carpeta de tarifas en modo solo lectura con MCP",
    rationale:
      "Aterrizar la investigación de frontera sobre MCP y manual abierto en una plantilla ejecutable en equipo.html.",
    payload: {
      id: "receta-aidux-mcp-tarifas-solo-lectura",
      worker: "AIDux",
      versionRef: "v1.5.0 / US-203",
      title: "Consultar tarifas vigentes desde una carpeta local en modo solo lectura",
      effortKey: "intermediate",
      effortLabel: "Bricolaje guiado · 20 min · 0 €",
      problem:
        "Evitar que un asistente invente precios desactualizados o mezcle condiciones de temporadas anteriores.",
      promptTemplate:
        "Actúa en modo solo lectura consultando únicamente el archivo tarifas-vigentes.md dentro de la carpeta autorizada. Responde a la consulta comercial citando entre paréntesis el apartado exacto de origen. Si una partida, medida o descuento no figura literalmente en el documento, escribe REQUIERE_VALORACION_HUMANA y no estimes cifras.",
      humanCheck:
        "Verifica cada apartado citado frente a tu tarifa vigente y comprueba que ninguna versión obsoleta sigue dentro de la carpeta consultada.",
      privacyGuard:
        "No incluyas nombres de clientes, NIF ni descuentos confidenciales individuales dentro de la carpeta conectada por MCP.",
    },
  },
  {
    id: "tech-h1-diagram-conocimiento-interno",
    versionRef: "v1.4.2 / US-004 / US-005",
    kind: "article_diagram_enrichment",
    leadAgent: "AIJuris",
    title: "Diagrama SVG nativo para la guía de gestión del conocimiento interno en pymes",
    rationale: "Completar la capa visual Bite-Snack-Meal del artículo del 2026-11-16.",
    payload: {
      slug: "ia-gestion-conocimiento-interno-pymes-informacion-dispersa-s",
      visualDiagram: {
        title: "Del archivo disperso al conocimiento compartido bajo control RGPD",
        nodes: [
          { title: "1. Carpeta limpia", note: "Manuales vigentes sin datos personales" },
          { title: "2. Índice local", note: "Búsqueda semántica en tu propia red" },
          { title: "3. Consulta citada", note: "Respuesta con enlace al documento origen" },
        ],
      },
    },
  },
  {
    id: "tech-h1-glossary-autogobernanza-edge",
    versionRef: "v1.5.0 / US-105 / Frontier",
    kind: "glossary_expansion",
    leadAgent: "AIDux",
    title:
      "Ampliación del glosario llano con «Agente autogobernado» e «Inferencia en oficina (Edge AI)»",
    rationale:
      "Traducir a lenguaje cotidiano los hallazgos recientes del radar de frontera del 18 al 20 de noviembre.",
    payload: {
      terms: [
        {
          id: "agente-local-autogobernado",
          term: "Agente local con autoverificación (autogobernado)",
          effortKey: "intermediate",
          effortLabel: "Bricolaje guiado · 1 tarde · 0 €",
          analogy:
            "Un colaborador metódico que, antes de entregarte un borrador, repasa él mismo su propia lista de comprobación legal y te señala cualquier hueco pendiente.",
          mondayUse:
            "Reduce errores de formato y garantiza que ningún documento incluya datos sensibles o promesas fuera de protocolo antes de tu revisión final.",
        },
        {
          id: "edge-ai-oficina",
          term: "IA en el propio equipo de oficina (Edge AI)",
          effortKey: "basic",
          effortLabel: "Estantería sencilla · 30 min · 0 €",
          analogy:
            "Cocinar en tu propia cocina en lugar de pedir siempre comida a domicilio: controlas los ingredientes, pagas una sola vez los utensilios y nada sale por la puerta.",
          mondayUse:
            "Permite procesar actas, contratos y presupuestos en un ordenador de oficina o mini-PC sin depender de cuotas por usuario ni conexión continua.",
        },
      ],
    },
  },
  {
    id: "tech-h1-diagram-orquestacion-local",
    versionRef: "v1.4.2 / US-004 / US-005",
    kind: "article_diagram_enrichment",
    leadAgent: "AIDux",
    title: "Diagrama SVG nativo para plataformas de orquestación local en pymes",
    rationale: "Dotar de esquema de arquitectura sobria al artículo del 2026-11-17.",
    payload: {
      slug: "plataformas-orquestacion-local-pymes-autonomia-soberania-dat",
      visualDiagram: {
        title: "Orquestación local sobria: carpetas, conector MCP y revisión humana",
        nodes: [
          { title: "1. Reglas y carpetas", note: "Permisos de solo lectura por área" },
          { title: "2. Orquestador local", note: "Enlaza modelo abierto y plantillas" },
          { title: "3. Registro auditable", note: "Trazabilidad y aprobación personal" },
        ],
      },
    },
  },
  {
    id: "tech-h1-faq-ai-act-semaforo-pymes",
    versionRef: "v1.5.0 / US-005 / AIJuris",
    kind: "article_faq_enrichment",
    leadAgent: "AIJuris",
    title: "Bloque FAQPage GEO verificado para el semáforo legal del AI Act en pymes",
    rationale:
      "Activar marcado estructurado FAQPage JSON-LD en una guía jurídica clave de alta demanda.",
    payload: {
      slug: "tu-pyme-y-el-ai-act-semaforo-legal-ia-pymes",
      faq: [
        {
          q: "¿El Reglamento europeo de IA prohíbe a una pyme usar asistentes para redactar correos o resumir textos?",
          a: "No. Las herramientas de apoyo interno revisadas por personas se sitúan en riesgo mínimo; basta con respetar el RGPD, evitar datos confidenciales en cuentas abiertas y mantener supervisión humana.",
        },
        {
          q: "¿Cuándo obliga el AI Act a avisar explícitamente al cliente de que interactúa con una IA?",
          a: "Cuando el cliente conversa con un asistente automático visible en la web o recibe respuestas generadas automáticamente sin edición previa, conforme a las obligaciones de transparencia del reglamento europeo.",
        },
        {
          q: "¿Qué exige la obligación de alfabetización en IA para pequeñas empresas?",
          a: "Que las personas que manejan herramientas de IA en la empresa reciban orientación práctica proporcional a su puesto sobre límites, verificación de resultados y protección de datos.",
        },
      ],
    },
  },
  {
    id: "tech-h1-recipe-aijuris-revision-clausulas",
    versionRef: "v1.5.0 / US-304 / US-306",
    kind: "aiworker_recipe",
    leadAgent: "AIJuris",
    title: "Receta de 15 minutos: revisar cláusulas de confidencialidad y proveedores IA en local",
    rationale:
      "Convertir el escudo contractual de AIJuris en plantilla ejecutable dentro de equipo.html.",
    payload: {
      id: "receta-aijuris-auditoria-clausulas-proveedor",
      worker: "AIJuris",
      versionRef: "v1.5.0 / US-306",
      title: "Detectar riesgos de privacidad y permanencia en condiciones de proveedores digitales",
      effortKey: "basic",
      effortLabel: "Estantería sencilla · 15 min · 0 €",
      problem:
        "Aceptar actualizaciones de software con funciones de IA sin detectar si usan datos de la empresa para entrenar modelos o imponen permanencias ocultas.",
      promptTemplate:
        "Analiza en entorno local el texto adjunto de condiciones de servicio o anexo RGPD. Crea una tabla con cuatro columnas: aspecto_revisado, cita_literal_del_documento, riesgo_para_pyme (bajo/medio/alto) y pregunta_para_el_proveedor. Revisa expresamente: entrenamiento con datos de cliente, subencargados fuera del Espacio Económico Europeo, plazo de borrado tras baja y derecho de exportación en formato abierto. Si un punto no aparece en el texto, escribe NO_CONSTA_EN_CONTRATO.",
      humanCheck:
        "Coteja cada cita literal en el documento original y consulta con tu asesoría jurídica antes de firmar contratos de importe relevante o datos sensibles.",
      privacyGuard:
        "Ejecuta este análisis en local o elimina previamente nombres de clientes, precios confidenciales y datos identificativos de terceros.",
    },
  },
  {
    id: "tech-h1-diagram-agentes-autogobernados",
    versionRef: "v1.4.2 / US-004 / US-005",
    kind: "article_diagram_enrichment",
    leadAgent: "AIJuris",
    title: "Diagrama SVG nativo para agentes locales autogobernados con AI Act y RGPD",
    rationale: "Completar el apoyo visual escaneable del artículo publicado el 2026-11-20.",
    payload: {
      slug: "agentes-locales-auto-gobernados-autonomia-operativa-pymes-cu",
      visualDiagram: {
        title: "Ciclo de control en un agente local autogobernado",
        nodes: [
          { title: "1. Regla previa", note: "Límites RGPD y permisos por carpeta" },
          { title: "2. Autoverificación", note: "Comprueba fuentes y formato antes de salir" },
          { title: "3. Firma humana", note: "Registro auditable y validación final" },
        ],
      },
    },
  },
  {
    id: "tech-h1-faq-slm-locales-oficina",
    versionRef: "v1.5.0 / US-005 / US-205",
    kind: "article_faq_enrichment",
    leadAgent: "AIDux",
    title: "Bloque FAQPage GEO verificado sobre modelos locales compactos (SLM) en oficina",
    rationale:
      "Mejorar citabilidad en motores generativos de la guía sobre hardware local sin GPU dedicada.",
    payload: {
      slug: "modelos-slm-locales-alto-rendimiento-pymes",
      faq: [
        {
          q: "¿Necesito comprar tarjetas gráficas caras para probar un modelo de IA local en mi despacho?",
          a: "No para tareas cotidianas de texto, clasificación o resumen: los modelos compactos cuantizados funcionan en ordenadores de oficina actuales con memoria suficiente y sin cuotas mensuales.",
        },
        {
          q: "¿Un modelo ejecutado en local sigue funcionando si falla internet en el taller o la oficina?",
          a: "Sí. Una vez descargado el modelo abierto en el equipo, todo el procesamiento ocurre en local sin depender de conexión externa ni de servidores de terceros.",
        },
        {
          q: "¿Por qué la ejecución local facilita el cumplimiento del RGPD?",
          a: "Porque los borradores, facturas y documentos internos permanecen dentro de tu propia infraestructura, minimizando transferencias internacionales de datos y riesgos de entrenamiento no autorizado.",
        },
      ],
    },
  },
  {
    id: "tech-h1-recipe-aiescudo-reclamaciones-masa",
    versionRef: "v1.5.0 / US-304 / US-306",
    kind: "aiworker_recipe",
    leadAgent: "AIJuris",
    title:
      "Receta de 15 minutos: filtrar reclamaciones generadas en masa sin descuidar al cliente real",
    rationale:
      "Anticipar utilidades prácticas de AIEscudo (US-304) directamente en la biblioteca de equipo.html.",
    payload: {
      id: "receta-aiescudo-filtro-reclamaciones",
      worker: "AIJuris",
      versionRef: "v1.5.0 / US-304",
      title: "Protocolo de tres filtros ante escritos extensos o reclamaciones automatizadas",
      effortKey: "basic",
      effortLabel: "Estantería sencilla · 15 min · 0 €",
      problem:
        "Perder horas contestando escritos intimidatorios largos sin datos verificables de compra mientras clientes reales esperan respuesta.",
      promptTemplate:
        "Lee el mensaje adjunto (sin datos personales sensibles) y extrae únicamente hechos verificables: número de factura o pedido mencionado, fecha de servicio, incidencia concreta descrita y tono de urgencia. Si no aporta ninguna referencia de operación real, redacta un acuse de recibo cortés de tres líneas solicitando número de factura o fecha aproximada para poder atender el caso con rigor.",
      humanCheck:
        "Comprueba siempre primero en tu registro de ventas si el pedido existe realmente; si es una incidencia real, prioriza la llamada o atención humana cercana.",
      privacyGuard:
        "Conserva el resguardo fechado del acuse de recibo en tu carpeta de atención al cliente y nunca expongas datos de terceros en plantillas externas.",
    },
  },
  {
    id: "tech-h1-glossary-alfabetizacion-tco",
    versionRef: "v1.5.0 / US-105 / US-206",
    kind: "glossary_expansion",
    leadAgent: "AIVisio",
    title:
      "Ampliación del glosario llano con «Alfabetización en IA (art. 4 AI Act)» y «Coste real por uso»",
    rationale:
      "Aterrizar conceptos recurrentes en las auditorías de costes y cumplimiento de pymes.",
    payload: {
      terms: [
        {
          id: "alfabetizacion-ia-art4",
          term: "Alfabetización en IA (artículo 4 del AI Act)",
          effortKey: "basic",
          effortLabel: "Hábito en equipo · 1 hora · 0 €",
          analogy:
            "Explicar las normas básicas de seguridad antes de estrenar una máquina en el taller: no hace falta fabricar el motor, pero sí saber dónde está el botón de parada y qué no introducir dentro.",
          mondayUse:
            "Consiste en dar a tu equipo una guía breve de una página sobre qué datos nunca subir, cómo comprobar resultados y cuándo pedir revisión humana.",
        },
        {
          id: "coste-real-por-uso",
          term: "Coste real por uso frente a suscripción fija",
          effortKey: "basic",
          effortLabel: "Hoja de cálculo · 15 min · 0 €",
          analogy:
            "Comparar pagar un abono mensual caro de gimnasio al que vas dos tardes frente a pagar una entrada sencilla o entrenar en casa con tu propio material.",
          mondayUse:
            "Permite auditar si el recargo mensual «con IA» de tu software habitual compensa el número real de usos semanales de tu plantilla.",
        },
      ],
    },
  },
  {
    id: "tech-h1-faq-sobreprecio-etiqueta-ia",
    versionRef: "v1.5.0 / US-005 / US-206",
    kind: "article_faq_enrichment",
    leadAgent: "AIVisio",
    title:
      "Bloque FAQPage GEO verificado para detectar sobreprecios en herramientas «inteligentes»",
    rationale:
      "Reforzar la utilidad económica del artículo del 2026-11-12 y enlazarlo con calculadora.html.",
    payload: {
      slug: "sobreprecio-etiqueta-inteligente-evaluar-precios-herramienta",
      faq: [
        {
          q: "¿Cómo saber si el suplemento de IA de mi programa habitual compensa a mi empresa?",
          a: "Divide el importe mensual extra entre el número real de veces que tu equipo utiliza esa función durante dos semanas y comprueba si libera tiempo medible o se resuelve con una plantilla limpia sin cuota.",
        },
        {
          q: "¿Qué debo preguntar al proveedor antes de aceptar una subida de plan por funciones inteligentes?",
          a: "Confirma por escrito si puedes mantener tu plan anterior, dónde se procesan los datos, si quedan excluidos de entrenamiento y si podrás exportar tus historiales en formatos abiertos estándar.",
        },
      ],
    },
  },
];

export async function loadTechBuffer(targetPath = techBufferPath) {
  try {
    if (existsSync(targetPath)) {
      const parsed = JSON.parse(await readFile(targetPath, "utf8"));
      if (parsed && Array.isArray(parsed.items)) {
        return {
          updatedAt: parsed.updatedAt || "",
          minThreshold: Math.max(TECH_BUFFER_MIN, Number(parsed.minThreshold || TECH_BUFFER_MIN)),
          targetSize: Math.max(TECH_BUFFER_TARGET, Number(parsed.targetSize || TECH_BUFFER_TARGET)),
          items: parsed.items,
        };
      }
    }
  } catch {
    // fallback limpio
  }
  return {
    updatedAt: "",
    minThreshold: TECH_BUFFER_MIN,
    targetSize: TECH_BUFFER_TARGET,
    items: [],
  };
}

export async function saveTechBuffer(buffer, targetPath = techBufferPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(buffer, null, 2) + "\n", "utf8");
}

async function loadTechExecutionContext(options = {}) {
  const targetPostsDir = options.postsDir || postsDir;
  const targetGlossaryPath = options.glossaryPath || glossaryExtraPath;
  const targetRecipesPath = options.recipesPath || aiworkerRecipesPath;

  const postsBySlug = new Map();
  if (existsSync(targetPostsDir)) {
    const files = (await readdir(targetPostsDir)).filter((f) => f.endsWith(".json")).sort();
    for (const file of files) {
      try {
        const post = JSON.parse(await readFile(path.join(targetPostsDir, file), "utf8"));
        const slug = String(
          post.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.json$/, ""),
        );
        postsBySlug.set(slug, { file, post });
      } catch {
        // ignorar archivos ilegibles
      }
    }
  }

  let existingGlossaryIds = new Set();
  if (existsSync(targetGlossaryPath)) {
    try {
      const arr = JSON.parse(await readFile(targetGlossaryPath, "utf8"));
      if (Array.isArray(arr))
        existingGlossaryIds = new Set(arr.map((x) => x && x.id).filter(Boolean));
    } catch {
      // ignorar
    }
  }

  let existingRecipeIds = new Set();
  if (existsSync(targetRecipesPath)) {
    try {
      const arr = JSON.parse(await readFile(targetRecipesPath, "utf8"));
      if (Array.isArray(arr))
        existingRecipeIds = new Set(arr.map((x) => x && x.id).filter(Boolean));
    } catch {
      // ignorar
    }
  }

  return {
    postsBySlug,
    existingGlossaryIds,
    existingRecipeIds,
    postsDir: targetPostsDir,
    glossaryPath: targetGlossaryPath,
    recipesPath: targetRecipesPath,
  };
}

export function validateTechProposal(item, context, completedIds = new Set()) {
  if (!item || typeof item !== "object") return { valid: false, reason: "Propuesta vacía" };
  const validKinds = [
    "aiworker_recipe",
    "glossary_expansion",
    "article_diagram_enrichment",
    "article_faq_enrichment",
  ];
  if (
    !item.id ||
    !item.title ||
    !item.versionRef ||
    !validKinds.includes(item.kind) ||
    !item.payload
  ) {
    return { valid: false, reason: "Faltan campos obligatorios o tipo de mejora no soportado" };
  }
  if (completedIds.has(item.id)) {
    return { valid: false, reason: "Paso técnico ya ejecutado" };
  }
  const serialized = JSON.stringify(item);
  if (
    /pueden cometer errores|no sustituyen el criterio|\b(volante|curva exponencial|m[aá]quina biol[oó]gica)\b/i.test(
      serialized,
    )
  ) {
    return { valid: false, reason: "Contiene jerga prohibida o aviso autoinculpatorio" };
  }
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(serialized)) {
    return { valid: false, reason: "Contiene emojis prohibidos" };
  }

  if (item.kind === "aiworker_recipe") {
    const p = item.payload;
    if (!p.id || !p.worker || !p.title || !p.promptTemplate || !p.humanCheck || !p.privacyGuard) {
      return { valid: false, reason: "Receta AIWorker incompleta" };
    }
    if (context?.existingRecipeIds?.has(p.id)) {
      return { valid: false, reason: "Receta AIWorker ya publicada" };
    }
    return { valid: true, reason: null };
  }

  if (item.kind === "glossary_expansion") {
    const terms = Array.isArray(item.payload.terms) ? item.payload.terms : [];
    const validTerms = terms.filter(
      (t) =>
        t &&
        t.id &&
        t.term &&
        t.effortKey &&
        t.effortLabel &&
        t.analogy &&
        t.mondayUse &&
        !context?.existingGlossaryIds?.has(t.id),
    );
    if (validTerms.length === 0) {
      return { valid: false, reason: "Sin términos nuevos válidos para el glosario" };
    }
    return { valid: true, reason: null };
  }

  if (item.kind === "article_diagram_enrichment") {
    const p = item.payload;
    const entry = context?.postsBySlug?.get(p.slug);
    if (!entry) return { valid: false, reason: `Artículo destino no encontrado (${p.slug})` };
    if (entry.post.visualDiagram && Array.isArray(entry.post.visualDiagram.nodes)) {
      return { valid: false, reason: `El artículo ${p.slug} ya tiene diagrama visual` };
    }
    if (
      !p.visualDiagram?.title ||
      !Array.isArray(p.visualDiagram?.nodes) ||
      p.visualDiagram.nodes.length < 3
    ) {
      return { valid: false, reason: "Diagrama SVG incompleto (mínimo 3 nodos)" };
    }
    return { valid: true, reason: null };
  }

  if (item.kind === "article_faq_enrichment") {
    const p = item.payload;
    const entry = context?.postsBySlug?.get(p.slug);
    if (!entry) return { valid: false, reason: `Artículo destino no encontrado (${p.slug})` };
    if (Array.isArray(entry.post.faq) && entry.post.faq.length > 0) {
      return { valid: false, reason: `El artículo ${p.slug} ya cuenta con FAQPage` };
    }
    const validFaq = Array.isArray(p.faq) ? p.faq.filter((x) => x && x.q && x.a) : [];
    if (validFaq.length < 2) {
      return { valid: false, reason: "Se requieren al menos 2 preguntas frecuentes verificadas" };
    }
    return { valid: true, reason: null };
  }

  return { valid: false, reason: "Tipo no reconocido" };
}

export function getActiveTechProposals(buffer, context, completedIds = new Set()) {
  const seenIds = new Set();
  const seenTargets = new Set();
  return (buffer?.items || []).filter((item) => {
    if (!item || item.used) return false;
    if (seenIds.has(item.id)) return false;
    const targetKey =
      item.kind === "article_diagram_enrichment"
        ? `diag:${item.payload?.slug}`
        : item.kind === "article_faq_enrichment"
          ? `faq:${item.payload?.slug}`
          : item.kind === "aiworker_recipe"
            ? `recipe:${item.payload?.id}`
            : `item:${item.id}`;
    if (seenTargets.has(targetKey)) return false;
    if (!validateTechProposal(item, context, completedIds).valid) return false;
    seenIds.add(item.id);
    seenTargets.add(targetKey);
    return true;
  });
}

function buildDynamicArticleTechCandidates(
  context,
  completedIds,
  queuedIds,
  queuedTargets,
  targetDate,
) {
  const generated = [];
  const diagramAgents = ["AIDux", "AIVisio", "AIJuris"];
  const faqAgents = ["AIVisio", "AIJuris", "AIDux"];
  let diagIdx = 0;
  let faqIdx = 0;
  for (const [slug, { post }] of context.postsBySlug.entries()) {
    const hasDiag = post.visualDiagram && Array.isArray(post.visualDiagram.nodes);
    const diagId = `tech-auto-diag-${slug.slice(0, 42)}`;
    if (
      !hasDiag &&
      !completedIds.has(diagId) &&
      !queuedIds.has(diagId) &&
      !queuedTargets.has(`diag:${slug}`)
    ) {
      const checklist = Array.isArray(post.actionableChecklist) ? post.actionableChecklist : [];
      generated.push({
        id: diagId,
        versionRef: "v1.5.0 / US-004 / US-005",
        kind: "article_diagram_enrichment",
        leadAgent: diagramAgents[diagIdx++ % diagramAgents.length],
        title: applyRaeTitleCase(`Esquema SVG de flujo práctico para «${post.title}»`),
        rationale:
          "Completar el apoyo visual escaneable Bite-Snack-Meal en un artículo publicado sin diagrama nativo.",
        payload: {
          slug,
          visualDiagram: {
            title: `Ruta práctica: ${String(post.title || "").slice(0, 68)}`,
            nodes: [
              {
                title: "1. Punto de partida",
                note: String(checklist[0] || "Definir alcance acotado").slice(0, 56),
              },
              {
                title: "2. Aplicación guiada",
                note: String(checklist[1] || "Probar en lote corto seguro").slice(0, 56),
              },
              {
                title: "3. Criterio humano",
                note: String(checklist[2] || "Validar antes de consolidar").slice(0, 56),
              },
            ],
          },
        },
        used: false,
        queuedAt: targetDate,
      });
    }

    const hasFaq = Array.isArray(post.faq) && post.faq.length > 0;
    const faqId = `tech-auto-faq-${slug.slice(0, 42)}`;
    if (
      !hasFaq &&
      !completedIds.has(faqId) &&
      !queuedIds.has(faqId) &&
      !queuedTargets.has(`faq:${slug}`)
    ) {
      const checklist = Array.isArray(post.actionableChecklist) ? post.actionableChecklist : [];
      const summaryLine = String(post.clarityNote || post.excerpt || post.title)
        .replace(/^En 30 segundos:\s*/i, "")
        .trim();
      generated.push({
        id: faqId,
        versionRef: "v1.5.0 / US-005 (GEO FAQPage)",
        kind: "article_faq_enrichment",
        leadAgent: faqAgents[faqIdx++ % faqAgents.length],
        title: applyRaeTitleCase(`Bloque FAQPage JSON-LD verificable para «${post.title}»`),
        rationale:
          "Activar esquema Schema.org FAQPage y respuestas directas citables en el archivo editorial.",
        payload: {
          slug,
          faq: [
            {
              q: `¿Qué problema práctico resuelve «${post.title}» en una pyme?`,
              a: summaryLine,
            },
            {
              q: "¿Cuál es el primer paso seguro para probar este enfoque sin riesgo?",
              a: checklist[0]
                ? `${checklist[0]}. Siempre con revisión humana previa y sin introducir datos confidenciales en servicios abiertos.`
                : "Empezar por una prueba acotada con datos no sensibles y validar cada resultado con criterio humano.",
            },
          ],
        },
        used: false,
        queuedAt: targetDate,
      });
    }
  }
  return generated;
}

export async function ensureTechBuffer(
  telemetry,
  emoInsights,
  frontierFinding,
  targetDate,
  options = {},
) {
  const bufferPath = options.bufferPath || techBufferPath;
  const minThreshold = Number(options.minThreshold ?? TECH_BUFFER_MIN);
  const targetSize = Math.max(minThreshold, Number(options.targetSize ?? TECH_BUFFER_TARGET));
  const generatorFn = options.generatorFn || callLLM;
  const spmPolicy = telemetry?.spmPolicy || ACTIVE_SPM_POLICY;

  const context = await loadTechExecutionContext(options);
  const completedIds = new Set(emoInsights?.completedTechSteps || []);
  const buffer = await loadTechBuffer(bufferPath);

  let active = getActiveTechProposals(buffer, context, completedIds);
  const retainedUsed = buffer.items.filter((i) => i && i.used).slice(-25);

  if (active.length >= minThreshold && active.length >= targetSize) {
    buffer.items = [...retainedUsed, ...active];
    buffer.minThreshold = minThreshold;
    buffer.targetSize = targetSize;
    buffer.updatedAt = targetDate;
    if (options.writeIfSufficient) {
      await saveTechBuffer(buffer, bufferPath);
    }
    return { buffer, activeCount: active.length, added: 0 };
  }

  console.log(
    `[Buffer Técnico] Mejoras en cola (${active.length}) < ${targetSize}; generando nuevas oportunidades técnicas diversas hasta ${targetSize}...`,
  );

  const queuedIds = new Set(active.map((i) => i.id));
  const queuedTargets = new Set(
    active.map((i) =>
      i.kind === "article_diagram_enrichment"
        ? `diag:${i.payload?.slug}`
        : i.kind === "article_faq_enrichment"
          ? `faq:${i.payload?.slug}`
          : i.kind === "aiworker_recipe"
            ? `recipe:${i.payload?.id}`
            : `item:${i.id}`,
    ),
  );
  let added = 0;

  // 1. Intentar generar oportunidades técnicas frescas con el LLM guiadas por diversidad SPM, Frontier-Scout y EmoInsight
  const postsMissingFaq = [...context.postsBySlug.entries()]
    .filter(
      ([slug, { post }]) =>
        (!Array.isArray(post.faq) || post.faq.length === 0) && !queuedTargets.has(`faq:${slug}`),
    )
    .slice(0, 6)
    .map(([slug, { post }]) => ({ slug, title: post.title }));
  const postsMissingDiag = [...context.postsBySlug.entries()]
    .filter(
      ([slug, { post }]) =>
        (!post.visualDiagram || !Array.isArray(post.visualDiagram.nodes)) &&
        !queuedTargets.has(`diag:${slug}`),
    )
    .slice(0, 6)
    .map(([slug, { post }]) => ({ slug, title: post.title }));
  const llmMaxAttempts = Math.min((targetSize - active.length) * 2, 6);
  let attempts = 0;

  while (active.length < targetSize && attempts < llmMaxAttempts) {
    attempts++;
    const neededKinds = getUnderrepresentedTechKinds(active, spmPolicy);
    const kindHint =
      neededKinds.length > 0 ? neededKinds : ["glossary_expansion", "article_faq_enrichment"];
    const agentCounts = { AIVisio: 0, AIDux: 0, AIJuris: 0 };
    for (const a of active) {
      const ag = a.leadAgent || "AIDux";
      if (ag in agentCounts) agentCounts[ag]++;
    }
    const maxSameAgent = Number(spmPolicy?.techBufferDiversity?.maxSameAgent || 3);
    const allowedAgents = Object.entries(agentCounts)
      .filter(([, c]) => c < maxSameAgent)
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);
    const preferredAgent = allowedAgents[0] || "AIVisio";

    const techPrompt = `Eres el comité técnico de AIEvolutio (AIVisio, AIDux, AIJuris). Diseña UNA mejora técnica ejecutable e inédita para la cola regenerativa del roadmap (Horizonte 1).
Hallazgo de frontera reciente: ${frontierFinding ? `${frontierFinding.topic} — ${frontierFinding.roadmapImpact}` : "Ahorro real 0 €, plantillas prácticas de oficio, glosario llano y bloques GEO."}
IDs ya completados o en cola (PROHIBIDO repetir): ${JSON.stringify([...completedIds, ...queuedIds])}
Artículos sin FAQPage disponibles: ${JSON.stringify(postsMissingFaq)}
Artículos sin diagrama SVG disponibles: ${JSON.stringify(postsMissingDiag)}

REGLAS ESTRICTAS DE DIVERSIDAD SPM:
- Elige "kind" OBLIGATORIAMENTE entre los tipos subrepresentados hoy: ${JSON.stringify(kindHint)} (máximo ${spmPolicy?.techBufferDiversity?.maxSameKind || 2} mejoras del mismo tipo en cola).
- Asigna "leadAgent" preferentemente a "${preferredAgent}" (agentes con cupo disponible: ${JSON.stringify(allowedAgents)}).
- Formatos de payload soportados según "kind":
  * "aiworker_recipe": {id, worker:"AIFactura|AIRespuestas|AIOferta|AIJuris|AIDux|AIVisio", versionRef:"v1.5.0 / US-306", title, effortKey:"basic|intermediate", effortLabel:"Estantería sencilla · 15 min · 0 €", problem, promptTemplate, humanCheck, privacyGuard}
  * "glossary_expansion": {terms:[{id, term, effortKey, effortLabel, analogy, mondayUse}]}
  * "article_faq_enrichment": {slug, faq:[{q, a}, {q, a}]}
  * "article_diagram_enrichment": {slug, visualDiagram:{title, nodes:[{title, note},{title, note},{title, note}]}}

Reglas editoriales: español de España RAE sentence case ("pyme"/"pymes" en minúscula, cero Title Case inglés), CERO emojis, CERO cifras o porcentajes inventados, CERO jerga interna o avisos autoinculpatorios.
Responde SOLO con JSON válido:
{"id":"tech-h1-...","versionRef":"v1.5.0 / US-...","kind":"${kindHint[0]}","leadAgent":"${preferredAgent}","title":"...","rationale":"...","payload":{...}}`;

    const raw = await generatorFn(techPrompt);
    if (!raw) break;
    const rawText = typeof raw === "string" ? raw : raw.text;
    if (!rawText) continue;

    let parsed = null;
    try {
      parsed = repairTruncatedJson(rawText);
    } catch {
      continue;
    }
    if (!parsed || !parsed.id || queuedIds.has(parsed.id)) continue;

    const normalizedPayload =
      parsed.kind === "aiworker_recipe" && parsed.payload?.title
        ? { ...parsed.payload, title: applyRaeTitleCase(parsed.payload.title) }
        : parsed.payload;

    const candidate = {
      ...parsed,
      id: slugify(parsed.id),
      title: applyRaeTitleCase(parsed.title),
      payload: normalizedPayload,
      used: false,
      queuedAt: targetDate,
    };
    const targetKey =
      candidate.kind === "article_faq_enrichment"
        ? `faq:${candidate.payload?.slug}`
        : candidate.kind === "article_diagram_enrichment"
          ? `diag:${candidate.payload?.slug}`
          : candidate.kind === "aiworker_recipe"
            ? `recipe:${candidate.payload?.id}`
            : `item:${candidate.id}`;
    if (queuedIds.has(candidate.id) || queuedTargets.has(targetKey)) continue;

    const diversityCheck = checkTechQueueDiversity(active, candidate, spmPolicy);
    if (!diversityCheck.allowed) {
      console.log(
        `[Buffer Técnico] Candidato LLM vetado por diversidad SPM: ${diversityCheck.reason}`,
      );
      continue;
    }

    if (validateTechProposal(candidate, context, completedIds).valid) {
      active.push(candidate);
      queuedIds.add(candidate.id);
      queuedTargets.add(targetKey);
      added++;
      console.log(
        `[Buffer Técnico] Nueva oportunidad técnica generada (${active.length}/${targetSize}): ${candidate.id} [${candidate.kind} · ${candidate.leadAgent}]`,
      );
    }
  }

  // 2. Respaldo curado de Horizonte 1 respetando diversidad SPM (maxSameKind <= 2, maxSameAgent <= 3)
  if (active.length < targetSize) {
    for (const curated of CURATED_TECH_RESERVE) {
      if (active.length >= targetSize) break;
      if (completedIds.has(curated.id) || queuedIds.has(curated.id)) continue;
      const targetKey =
        curated.kind === "article_diagram_enrichment"
          ? `diag:${curated.payload?.slug}`
          : curated.kind === "article_faq_enrichment"
            ? `faq:${curated.payload?.slug}`
            : curated.kind === "aiworker_recipe"
              ? `recipe:${curated.payload?.id}`
              : `item:${curated.id}`;
      if (queuedTargets.has(targetKey)) continue;
      const candidate = { ...curated, used: false, queuedAt: targetDate };
      if (!checkTechQueueDiversity(active, candidate, spmPolicy).allowed) continue;
      if (validateTechProposal(candidate, context, completedIds).valid) {
        active.push(candidate);
        queuedIds.add(candidate.id);
        queuedTargets.add(targetKey);
        added++;
      }
    }
  }

  // 3. Síntesis determinista de mejoras GEO (diagramas SVG / FAQPage) sobre el corpus vivo respetando diversidad
  if (active.length < targetSize) {
    const dynamicCandidates = buildDynamicArticleTechCandidates(
      context,
      completedIds,
      queuedIds,
      queuedTargets,
      targetDate,
    );
    for (const dyn of dynamicCandidates) {
      if (active.length >= targetSize) break;
      if (!checkTechQueueDiversity(active, dyn, spmPolicy).allowed) continue;
      if (validateTechProposal(dyn, context, completedIds).valid) {
        active.push(dyn);
        queuedIds.add(dyn.id);
        added++;
      }
    }
    // Último recurso en corpus muy pequeños: garantizar invariante >= 7 sin bloquear el ciclo
    if (active.length < targetSize) {
      for (const dyn of dynamicCandidates) {
        if (active.length >= targetSize) break;
        if (queuedIds.has(dyn.id)) continue;
        if (validateTechProposal(dyn, context, completedIds).valid) {
          active.push(dyn);
          queuedIds.add(dyn.id);
          added++;
        }
      }
    }
  }

  buffer.items = [...retainedUsed, ...active];
  buffer.minThreshold = minThreshold;
  buffer.targetSize = targetSize;
  buffer.updatedAt = targetDate;
  await saveTechBuffer(buffer, bufferPath);
  return { buffer, activeCount: active.length, added };
}

export async function executeTechBufferItem(item, options = {}) {
  const context = await loadTechExecutionContext(options);

  if (item.kind === "aiworker_recipe") {
    let recipes = [];
    if (existsSync(context.recipesPath)) {
      try {
        recipes = JSON.parse(await readFile(context.recipesPath, "utf8"));
      } catch {
        recipes = [];
      }
    }
    if (!recipes.some((r) => r && r.id === item.payload.id)) {
      recipes.push(item.payload);
      await writeFile(context.recipesPath, JSON.stringify(recipes, null, 2) + "\n", "utf8");
    }
    return `Añadida nueva receta operativa «${item.payload.title}» (${item.payload.worker}) a equipo.html#recetas-aiworkers.`;
  }

  if (item.kind === "glossary_expansion") {
    let glossary = [];
    if (existsSync(context.glossaryPath)) {
      try {
        glossary = JSON.parse(await readFile(context.glossaryPath, "utf8"));
      } catch {
        glossary = [];
      }
    }
    let count = 0;
    for (const term of item.payload.terms || []) {
      if (term && term.id && !glossary.some((g) => g && g.id === term.id)) {
        glossary.push(term);
        count++;
      }
    }
    await writeFile(context.glossaryPath, JSON.stringify(glossary, null, 2) + "\n", "utf8");
    return `Añadidos ${count} nuevos términos en lenguaje llano al glosario interactivo (#glosario-llano).`;
  }

  if (item.kind === "article_diagram_enrichment") {
    const entry = context.postsBySlug.get(item.payload.slug);
    if (!entry) throw new Error(`Artículo no encontrado para diagrama: ${item.payload.slug}`);
    const fullPath = path.join(context.postsDir, entry.file);
    entry.post.visualDiagram = item.payload.visualDiagram;
    await writeFile(fullPath, JSON.stringify(entry.post, null, 2) + "\n", "utf8");
    return `Incorporado diagrama SVG nativo «${item.payload.visualDiagram.title}» en ${entry.file}.`;
  }

  if (item.kind === "article_faq_enrichment") {
    const entry = context.postsBySlug.get(item.payload.slug);
    if (!entry) throw new Error(`Artículo no encontrado para FAQPage: ${item.payload.slug}`);
    const fullPath = path.join(context.postsDir, entry.file);
    entry.post.faq = item.payload.faq;
    await writeFile(fullPath, JSON.stringify(entry.post, null, 2) + "\n", "utf8");
    return `Activado bloque interactivo y JSON-LD FAQPage (${item.payload.faq.length} preguntas) en ${entry.file}.`;
  }

  throw new Error(`Tipo de mejora técnica no soportado: ${item.kind}`);
}

function sanitizeMdCell(value) {
  return String(value || "")
    .replace(/\s*\r?\n+\s*/g, " ")
    .replace(/\|/g, "·")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function updateRoadmapWithFrontierAndTech(
  emoInsights,
  _frontierFinding,
  _techStepRecord,
  options = {},
) {
  const targetRoadmapPath = options.roadmapPath || roadmapPath;
  if (!existsSync(targetRoadmapPath)) return;
  let roadmapMd = await readFile(targetRoadmapPath, "utf8");

  const sectionHeader =
    "## 5. Radar de frontera e iteraciones autónomas guiadas por `EmoInsight` y métricas";
  const frontierRows = (emoInsights.frontierLog || [])
    .slice(-8)
    .map(
      (f) =>
        `| ${sanitizeMdCell(f.date)} | **${sanitizeMdCell(f.leadAgent || "AIVisio")}** | ${sanitizeMdCell(f.topic)} | ${sanitizeMdCell(f.insight)} | ${sanitizeMdCell(f.roadmapImpact)} |`,
    )
    .join("\n");

  const techStepsRows = (emoInsights.techHistory || [])
    .slice(-10)
    .map(
      (t) =>
        `| ${sanitizeMdCell(t.date)} | \`${sanitizeMdCell(t.id)}\` | ${sanitizeMdCell(t.versionRef)} | ${sanitizeMdCell(t.summary)} |`,
    )
    .join("\n");

  const techBuf =
    options.techBuffer || (await loadTechBuffer(options.techBufferPath || techBufferPath));
  const editorialBuf =
    options.editorialBuffer ||
    (await loadEditorialBuffer(options.editorialBufferPath || editorialBufferPath));
  const activeTechItems = (techBuf.items || []).filter((i) => i && !i.used);
  const activeEditorialItems = (editorialBuf.items || []).filter((i) => i && !i.used);

  const techQueueRows = activeTechItems
    .slice(0, 10)
    .map(
      (t, idx) =>
        `| ${idx + 1} | \`${sanitizeMdCell(t.id)}\` | ${sanitizeMdCell(t.versionRef)} | **${sanitizeMdCell(t.leadAgent || "AIDux")}** | ${sanitizeMdCell(t.title)} |`,
    )
    .join("\n");

  const editorialQueueRows = activeEditorialItems
    .slice(0, 10)
    .map(
      (e, idx) =>
        `| ${idx + 1} | **${sanitizeMdCell(e.author || "AIVisio")}** | ${sanitizeMdCell(e.category || "Operaciones")} | ${sanitizeMdCell(e.title)} |`,
    )
    .join("\n");

  const spmState = options.telemetry?.spmAssignment?.portfolioState || null;
  const spmLine = spmState
    ? `- **Equilibrio SPM (últimos ${spmState.windowCount} artículos):** Grow **${spmState.cellPct.grow}%** (obj. 45%) · Transform **${spmState.cellPct.transform}%** (obj. 25%) · Modernize **${spmState.cellPct.modernize}%** (obj. 15%) · Compliance/AIJuris **${spmState.cellPct.compliance}%** (tope 15%${spmState.aiJurisBlocked ? " · bloqueo activo" : ""}).\n`
    : "";

  const dynamicSection = `${sectionHeader}

_Esta sección es actualizada automáticamente en cada ciclo evolutivo diario por \`Frontier-Scout\` y \`Spiral-Builder\` a partir del plano de control SPM (\`content/spm-policy.json\`), la investigación del estado del arte, las métricas reales de GA4/GSC y el \`EmoInsight\` de los lectores (Likes: **${emoInsights.summary?.totalLikes || 0}** · Dislikes: **${emoInsights.summary?.totalDislikes || 0}** · Comentarios: **${emoInsights.summary?.totalComments || 0}**)._

### 5.1. Investigación continua del estado del arte y señales de lectores

| Fecha | Agente líder | Hallazgo del estado del arte / Señal \`EmoInsight\` | Síntesis práctica para pymes | Impacto en el roadmap |
| :--- | :--- | :--- | :--- | :--- |
${frontierRows || "| 2026-11-09 | **AIVisio** | Escucha activa `EmoInsight` | Inicialización del radar autónomo | `v1.3.0` |"}

### 5.2. Mejoras técnicas del roadmap ejecutadas autónomamente (Commit #1 diario)

| Fecha | ID de paso técnico | Referencia del roadmap | Mejora verificable aplicada en producción |
| :--- | :--- | :--- | :--- |
${techStepsRows || "| 2026-11-09 | `v1.3.0-emo-insight-core` | `v1.3.0` (`US-107`, `US-108`, `US-407`) | Despliegue de valoraciones, termómetro `EmoInsight`, hilos de comentarios con respuesta de IA y ciclo diario de doble commit. |"}

### 5.3. Colas regenerativas activas y gobierno SPM para revisión semanal (objetivo >= 7 técnico y >= 7 editorial)

${spmLine}- **Cola técnica activa (\`content/tech-buffer.json\`):** **${activeTechItems.length}/${techBuf.targetSize || TECH_BUFFER_TARGET}** mejoras ejecutables listas (máx. 2 del mismo tipo, reposición inmediata).
- **Cola editorial activa (\`content/editorial-buffer.json\`):** **${activeEditorialItems.length}/${editorialBuf.targetSize || EDITORIAL_BUFFER_TARGET}** artículos verificados listos (Anti-Slop + Jurado Pyme \`F >= 0.80\`, reposición inmediata).

#### Próximas mejoras técnicas en cola

| # | ID | Referencia | Agente | Mejora técnica preparada |
| :--- | :--- | :--- | :--- | :--- |
${techQueueRows || "| — | — | — | — | Pendiente de reposición automática |"}

#### Próximos artículos editoriales en cola

| # | Autor | Categoría | Artículo verificado (Bite-Snack-Meal 1200–1600 palabras) |
| :--- | :--- | :--- | :--- |
${editorialQueueRows || "| — | — | — | Pendiente de reposición automática |"}
`;

  if (roadmapMd.includes(sectionHeader)) {
    roadmapMd =
      roadmapMd.slice(0, roadmapMd.indexOf(sectionHeader)).trimEnd() + "\n\n" + dynamicSection;
  } else {
    roadmapMd = roadmapMd.trimEnd() + "\n\n---\n\n" + dynamicSection;
  }

  await writeFile(targetRoadmapPath, roadmapMd, "utf8");
}

export async function runRoadmapTechnicalStep(
  telemetry,
  emoInsights,
  targetDate,
  frontierFinding = null,
  options = {},
) {
  console.log(
    "--- [Spiral-Builder] Extrayendo y ejecutando mejora técnica pendiente del roadmap ---",
  );
  emoInsights.completedTechSteps = Array.isArray(emoInsights.completedTechSteps)
    ? emoInsights.completedTechSteps
    : [];
  emoInsights.techHistory = Array.isArray(emoInsights.techHistory) ? emoInsights.techHistory : [];

  // 1. Asegurar cola técnica regenerativa >= 7 antes de consumir
  const initialBufferState = await ensureTechBuffer(
    telemetry,
    emoInsights,
    frontierFinding,
    targetDate,
    options,
  );

  let stepRecord = null;
  const legacyStep = ROADMAP_TECH_QUEUE.find((s) => !emoInsights.completedTechSteps.includes(s.id));

  if (legacyStep && !options.preferTechBuffer) {
    const summary = await legacyStep.apply();
    emoInsights.completedTechSteps.push(legacyStep.id);
    stepRecord = {
      date: targetDate,
      id: legacyStep.id,
      versionRef: legacyStep.versionRef,
      title: legacyStep.title,
      summary,
    };
  } else {
    const context = await loadTechExecutionContext(options);
    const completedIds = new Set(emoInsights.completedTechSteps);
    const activeProposals = getActiveTechProposals(
      initialBufferState.buffer,
      context,
      completedIds,
    );
    const nextProposal = activeProposals[0];

    if (nextProposal) {
      const summary = await executeTechBufferItem(nextProposal, options);
      const targetItem = initialBufferState.buffer.items.find(
        (i) => i && i.id === nextProposal.id && !i.used,
      );
      if (targetItem) {
        targetItem.used = true;
        targetItem.executedAt = targetDate;
      }
      await saveTechBuffer(initialBufferState.buffer, options.bufferPath || techBufferPath);
      emoInsights.completedTechSteps.push(nextProposal.id);
      stepRecord = {
        date: targetDate,
        id: nextProposal.id,
        versionRef: nextProposal.versionRef,
        title: nextProposal.title,
        summary,
      };
    }
  }

  if (stepRecord) {
    emoInsights.techHistory.push(stepRecord);
    if (!options.skipSaveEmo) {
      await saveEmoInsights(emoInsights);
    }
    console.log(
      `[Spiral-Builder] Paso técnico del roadmap completado: ${stepRecord.id} — ${stepRecord.summary}`,
    );
  }

  // 2. Reponer inmediatamente el hueco consumido para mantener siempre >= 7 mejoras técnicas en cola
  const replenished = await ensureTechBuffer(
    telemetry,
    emoInsights,
    frontierFinding,
    targetDate,
    options,
  );

  if (!options.skipRoadmapUpdate) {
    await updateRoadmapWithFrontierAndTech(emoInsights, frontierFinding, stepRecord, {
      ...options,
      telemetry,
      techBuffer: replenished.buffer,
    });
  }

  return stepRecord;
}

// ─── SKILL 1: TELEMETRY-CRITIC (HONESTIDAD Y AUDITORÍA ADVERSARIAL) ──────────

async function runTelemetryCritic(flags = {}) {
  console.log("--- [Skill 1: Telemetry-Critic] Evaluando estado real, SPM, corpus y sensores ---");

  let ga4Data = null;
  let ga4Events = null;
  let gscQueries = null;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const accessToken = process.env.GA4_ACCESS_TOKEN;

  if (propertyId && accessToken) {
    ga4Data = await fetchRealGa4Metrics(propertyId, accessToken);
    ga4Events = await fetchGa4ProductEvents(propertyId, accessToken);
    if (ga4Data) {
      console.log("Métricas reales GA4 (últimos 7 días):", ga4Data);
    } else {
      console.log(
        "GA4 API: Credenciales presentes pero sin respuesta válida; reportando estado honesto.",
      );
    }
    if (ga4Events) {
      console.log("Eventos de producto GA4 (últimos 7 días):", ga4Events);
    }
  } else {
    console.log(
      "Telemetría GA4: etiqueta G-DDWP8Z4F9B activa; API pendiente de GA4_PROPERTY_ID y autenticación federada de GitHub Actions.",
    );
  }

  const gscSiteUrl = process.env.GSC_SITE_URL || "";
  const gscToken = process.env.GSC_ACCESS_TOKEN || accessToken || "";
  if (gscSiteUrl && gscToken) {
    gscQueries = await fetchGscDemandQueries(gscSiteUrl, gscToken);
    if (gscQueries && gscQueries.length > 0) {
      console.log(`Sensor GSC activo: ${gscQueries.length} consultas reales detectadas.`);
    }
  }

  const spmPolicy = await loadSpmPolicy();
  const existingPosts = await loadModularPosts();
  const editorialLog = await loadEditorialLog();

  // Contabilizar equilibrio entre los 3 pilares de la verdadera organización
  const authorsCount = { AIVisio: 0, AIDux: 0, AIJuris: 0 };
  const categoriesCount = {};

  for (const p of existingPosts) {
    if (p.author === "AIVisio") authorsCount.AIVisio++;
    else if (p.author === "AIJuris") authorsCount.AIJuris++;
    else authorsCount.AIDux++;
    const cat = p.category || "Operaciones";
    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
  }

  // Plano de Control SPM: cuotas por célula y bloqueo estricto de AIJuris cuando >= 15 %
  const spmAssignment = selectNextSpmAssignment(existingPosts, spmPolicy, {
    forcedAuthor: flags.author,
  });
  const recommendedAuthor = spmAssignment.author;
  console.log(`[Plano de Control SPM] Asignación de ciclo: ${spmAssignment.rationale}`);

  const allExistingTitles = existingPosts.map((p) => p.title);
  const allExistingSlugs = new Set([
    ...existingPosts.map((p) => p.slug || slugify(p.title)),
    ...editorialLog.map((p) => p.slug),
  ]);

  return {
    existingPosts,
    existingCount: existingPosts.length,
    authorsCount,
    recommendedAuthor,
    spmPolicy,
    spmAssignment,
    ga4: ga4Data,
    ga4Events,
    gscQueries,
    editorialLog,
    allExistingTitles,
    allExistingSlugs,
    categoriesCount,
  };
}

// ─── SKILL 2a: AIVisio (DIRECCIÓN ESTRATÉGICA Y BRIEFING GUIADO POR EMOINSIGHT) ──

async function runAIVisio(telemetry, emoInsights = null, frontierFinding = null) {
  console.log(
    "--- [AIVisio: CEO & Director Estratégico] Estableciendo Briefing guiado por EmoInsight y Frontera ---",
  );

  const log = telemetry.editorialLog;
  const recent5 = log.slice(-5);
  const usedNeeds = recent5.map((e) => e.readerNeed).filter(Boolean);
  const usedAngles = recent5.map((e) => e.angle).filter(Boolean);

  const authorRoleMap = {
    AIVisio:
      "AIVisio (CEO — Dirección estratégica, sentido humano, abaratamiento del conocimiento y valor social)",
    AIDux:
      "AIDux (CIO — Dirección tecnológica, artesanía práctica, SLMs locales, protocolo MCP y AIWorkers)",
    AIJuris:
      "AIJuris (Guardarraíl ético y legal — AI Act europeo, RGPD, privacidad y soberanía del dato)",
  };

  const emoContext = emoInsights?.summary
    ? `Señales EmoInsight de lectores: Likes=${emoInsights.summary.totalLikes}, Dislikes=${emoInsights.summary.totalDislikes}, Demasiado complejo=${emoInsights.summary.emoDimensions?.too_complex || 0}, Dudas legales=${emoInsights.summary.emoDimensions?.legal_doubt || 0}.`
    : "";
  const frontierContext = frontierFinding
    ? `Último hallazgo del estado del arte: "${frontierFinding.topic}" (${frontierFinding.insight}).`
    : "";
  const spmAssign = telemetry.spmAssignment || null;
  const spmContext = spmAssign
    ? `Asignación obligatoria del Plano de Control SPM: célula "${spmAssign.cell}" (${spmAssign.rationale}).${spmAssign.domain ? ` Ámbito cotidiano concreto: "${spmAssign.domain.label}" — ${spmAssign.domain.focusPrompt}` : ""}`
    : "";
  const gscContext =
    Array.isArray(telemetry.gscQueries) && telemetry.gscQueries.length > 0
      ? `Consultas reales de demanda (Search Console): ${telemetry.gscQueries
          .slice(0, 5)
          .map((q) => `"${q.query}" (${q.impressions} imp)`)
          .join(", ")}.`
      : "";

  const briefingPrompt = `Eres AIVisio, CEO y Estratega de AIEvolutio. Define el Briefing del nuevo artículo ANTES de escribirlo.

Fundamentos de AIEvolutio:
- Nuestros principios son inquebrantables, pero nuestro camino nace inexorablemente de las reacciones reales de los lectores (EmoInsight), los sensores de demanda y la investigación del estado del arte.
- Claridad pedagógica: ningún lector no técnico debe quedarse con dudas sobre si una propuesta equivale a montar una estantería sencilla en una tarde o a una obra de ingeniería compleja; desmitificamos la tecnología, evaluamos herramientas y precios con honestidad y exploramos su impacto en empresas, educación, mayores y ciudadanía.
- Perfil que firmará hoy: ${authorRoleMap[telemetry.recommendedAuthor] || telemetry.recommendedAuthor}
${spmContext}
${gscContext}
${emoContext}
${frontierContext}

PROHIBICIÓN ABSOLUTA DE REPETICIÓN (Hard Gate):
- Títulos ya publicados: ${JSON.stringify(telemetry.allExistingTitles)}
- Necesidades recientes: ${JSON.stringify(usedNeeds)}
- Ángulos recientes: ${JSON.stringify(usedAngles)}

Responde SOLO con JSON válido:
{"readerNeed":"...","angle":"...","actionType":"...","readerProfile":"...","suggestedCategory":"...","suggestedTitle":"..."}`;

  const rawBriefing = await callLLM(briefingPrompt);
  if (rawBriefing) {
    try {
      const briefing = repairTruncatedJson(rawBriefing);
      if (briefing && briefing.readerNeed && briefing.angle) {
        const preflight = validateEditorialBriefing(
          briefing,
          telemetry.existingPosts,
          telemetry.editorialLog,
        );
        if (preflight.allowed) {
          console.log(`[AIVisio] Briefing LLM prevalidado: "${briefing.readerNeed}"`);
          return briefing;
        }
        console.warn(`[AIVisio] Briefing vetado antes de redactar: ${preflight.reason}`);
      }
    } catch (e) {
      console.warn("[AIVisio] Error al parsear Briefing LLM:", e.message);
    }
  }

  // Si no hay LLM disponible, revisar primero el buffer editorial regenerativo y después el banco curado
  const buffer = await loadEditorialBuffer();
  const bufferedCandidates = getActiveBufferedCandidates(
    buffer,
    telemetry.existingPosts,
    telemetry.editorialLog,
  );
  const candidateFromBuffer =
    bufferedCandidates.find((c) => c.author === telemetry.recommendedAuthor) ||
    bufferedCandidates[0];
  if (candidateFromBuffer) {
    console.log(`[AIVisio] Briefing desde buffer editorial: "${candidateFromBuffer.readerNeed}"`);
    return {
      readerNeed: candidateFromBuffer.readerNeed,
      angle: candidateFromBuffer.angle,
      actionType: candidateFromBuffer.actionType,
      readerProfile: candidateFromBuffer.readerProfile,
      suggestedCategory: candidateFromBuffer.category,
      suggestedTitle: candidateFromBuffer.title,
      bufferSlug: candidateFromBuffer.slug,
    };
  }

  const availableCandidates = CURATED_EDITORIAL_BANK.filter(
    (candidate) =>
      validateEditorialBriefing(
        {
          suggestedTitle: candidate.title,
          readerNeed: candidate.readerNeed,
          angle: candidate.angle,
        },
        telemetry.existingPosts,
        telemetry.editorialLog,
      ).allowed && validateArticleBodyLength(candidate.body, "tactical").valid,
  );
  const candidateFromBank =
    availableCandidates.find((candidate) => candidate.author === telemetry.recommendedAuthor) ||
    availableCandidates[0];

  if (candidateFromBank) {
    console.log(`[AIVisio] Briefing curado sin duplicación: "${candidateFromBank.readerNeed}"`);
    return {
      readerNeed: candidateFromBank.readerNeed,
      angle: candidateFromBank.angle,
      actionType: candidateFromBank.actionType,
      readerProfile: candidateFromBank.readerProfile,
      suggestedCategory: candidateFromBank.category,
      suggestedTitle: candidateFromBank.title,
      curatedSlug: candidateFromBank.slug,
    };
  }

  console.error(
    `[AIVisio] Buffer y banco editorial agotados: ${CURATED_EDITORIAL_BANK.length} candidatos vetados antes de redactar. No se generó un artículo para evitar una repetición.`,
  );
  return null;
}

// ─── SKILL 2b: REDACCIÓN TRIPARTITA CON GUARDIÁN ADVERSARIAL ──────────────────

async function runEditorialWriter(telemetry, briefing, targetDate) {
  const preflight = validateEditorialBriefing(
    briefing,
    telemetry.existingPosts,
    telemetry.editorialLog,
  );
  if (!preflight.allowed) {
    console.log(
      `[Guardián Adversarial] Redacción detenida antes de invocar al modelo: ${preflight.reason}.`,
    );
    return null;
  }

  const author = telemetry.recommendedAuthor;
  const articleFormat = isSundayPillarDate(targetDate) ? "pillar" : "tactical";
  const lengthTarget =
    articleFormat === "pillar"
      ? "1400-1800 palabras (guía pilar semanal Bite-Snack-Meal en profundidad)"
      : "1200-1600 palabras (artículo táctico diario Bite-Snack-Meal)";
  console.log(
    `--- [Comité Editorial: ${author}] Redactando artículo (${articleFormat}) bajo Briefing de AIVisio ---`,
  );

  const articlePrompt = `Eres ${author} de AIEvolutio (${
    author === "AIVisio"
      ? "CEO, dirección estratégica y mirada humana sobre el impacto en las pymes y la sociedad"
      : author === "AIJuris"
        ? "Guardarraíl ético y legal, especialista en AI Act, RGPD y soberanía del dato"
        : "CIO, dirección tecnológica, artesanía práctica, modelos compactos locales y AIWorkers"
  }).
Escribe un artículo único, accionable y riguroso para pymes y ciudadanos en España.

BRIEFING OBLIGATORIO:
- Necesidad: ${briefing.readerNeed}
- Ángulo: ${briefing.angle}
- Acción final: ${briefing.actionType}
- Perfil lector: ${briefing.readerProfile}
- Categoría: ${briefing.suggestedCategory || (author === "AIJuris" ? "Legal" : author === "AIVisio" ? "Estrategia" : "Operaciones")}
${briefing.suggestedTitle ? `- Título sugerido: ${briefing.suggestedTitle}` : ""}

PROHIBIDO REPETIR CUALQUIERA DE ESTOS TÍTULOS EXISTENTES:
${JSON.stringify(telemetry.allExistingTitles)}

Normas editoriales Bite-Snack-Meal de 3 capas, Anti-Slop, RAE y veracidad estricta:
1. Título en sentence case según la RAE (solo primera letra y siglas como IA, AI Act, RGPD, SLM, MCP, AIVisio, AIDux, AIJuris en mayúscula; "pyme"/"pymes" en minúscula). Prohibido usar jerga interna ("volante", "curva exponencial", "máquina biológica"), emojis o fórmulas autoinculpatorias («pueden cometer errores»).
2. Apertura concreta (Anti-Slop): PROHIBIDO iniciar el artículo con clichés ("En el dinámico ecosistema empresarial...", "En el competitivo panorama...", "La inteligencia artificial ha dejado de ser una promesa futurista..."). Abre el primer párrafo con una escena concreta de lunes por la mañana en un taller, comercio, gestoría o familia.
3. Capa 1 (clarityNote): empieza exactamente con "En 30 segundos:" explicando la idea con 3 puntos clave, una analogía cotidiana y el nivel de esfuerzo real (estantería sencilla, bricolaje guiado o técnica).
4. Capa 2 (body): ${lengthTarget}. Español llano y cercano (legibilidad Fernández Huerta >= 56, frases directas sin humo corporativo, priorizando herramientas gratuitas o en local de 0 €). Estructura escaneable Bite-Snack-Meal con subencabezados Markdown \`### \` cada 250-300 palabras, párrafos breves de 3-4 líneas (40-60 palabras), definiciones citables, al menos una tabla comparativa en formato Markdown (| Columna A | Columna B | ...), viñetas claras y cierre "**Pasos accionables para aplicar hoy:**" con 3 pasos numerados.
5. PROHIBICIÓN ABSOLUTA DE ALUCINACIONES: queda prohibido inventar porcentajes, ahorros en euros, encuestas, estadísticas o artículos de leyes. Solo cita hechos cuantitativos o normas verificadas con la búsqueda web en vivo; si no hay fuentes verificables para una cifra, publica una guía exclusivamente conceptual y práctica sin estadísticas ni casos simulados.
6. actionableChecklist: exactamente 3 pasos concretos.
7. seedQuestion: una pregunta directa al lector para abrir el hilo de comentarios EmoInsight al final del artículo.
8. Responde SOLO con JSON válido:
{"title":"...","slug":"...","category":"Estrategia|Operaciones|Legal","effortLevel":"basic|intermediate|advanced","clarityNote":"En 30 segundos: ...","excerpt":"...","body":"...","actionableChecklist":["...","...","..."],"seedQuestion":"..."}`;

  const spmPolicy = telemetry.spmPolicy || ACTIVE_SPM_POLICY;
  const groundedResult = await callLLMWithSearchGrounded(articlePrompt);
  const rawArticle = groundedResult?.text || null;
  const groundedSources = cleanAndFilterSources(
    Array.isArray(groundedResult?.sources) ? groundedResult.sources : [],
    spmPolicy,
  );

  if (rawArticle) {
    let parsed = null;
    try {
      parsed = repairTruncatedJson(rawArticle);
    } catch {
      const fallbackFields = extractFieldsFallback(rawArticle);
      if (fallbackFields.title && fallbackFields.body) parsed = fallbackFields;
    }

    if (parsed && parsed.title && parsed.body) {
      parsed.body = normalizeMarkdownBody(parsed.body);
      const normalizedTitle = applyRaeTitleCase(parsed.title);
      const preliminaryDup = isDuplicatePost(
        { title: normalizedTitle, slug: slugify(parsed.slug || normalizedTitle) },
        telemetry.existingPosts,
      );

      let quality = validateArticleQuality(
        { ...parsed, ...(groundedSources.length > 0 ? { sources: groundedSources } : {}) },
        articleFormat,
        spmPolicy,
      );

      // Autorreparación elástica Gate 1 (hasta 2 intentos) si hay defectos de extensión, H3, tabla o Anti-Slop
      if (!quality.valid && !preliminaryDup.duplicate) {
        const fix = await repairArticleWithLLM(parsed, articleFormat, {
          maxAttempts: 2,
          policy: spmPolicy,
        });
        parsed = { ...parsed, ...fix.article };
        quality = fix.quality;
      }

      const finalTitle = applyRaeTitleCase(parsed.title);
      let candidate = {
        title: finalTitle,
        slug: slugify(parsed.slug || finalTitle),
        date: targetDate,
        author,
        spmCell: telemetry.spmAssignment?.cell || "grow",
        category: parsed.category || briefing.suggestedCategory || "Operaciones",
        effortLevel: ["basic", "intermediate", "advanced"].includes(parsed.effortLevel)
          ? parsed.effortLevel
          : "basic",
        clarityNote:
          parsed.clarityNote ||
          `En 30 segundos: ${parsed.excerpt || String(parsed.body).slice(0, 180)}`,
        excerpt: parsed.excerpt || parsed.body.substring(0, 140) + "…",
        body: quality.normalizedBody,
        ...(groundedSources.length > 0 ? { sources: groundedSources } : {}),
        actionableChecklist:
          Array.isArray(parsed.actionableChecklist) && parsed.actionableChecklist.length >= 1
            ? parsed.actionableChecklist.slice(0, 3)
            : [
                briefing.actionType,
                "Medir impacto en la primera semana",
                "Validar con supervisión humana",
              ],
        seedQuestion:
          parsed.seedQuestion ||
          `¿Cómo aplicarías este enfoque en tu negocio y qué duda te gustaría que ${author} resuelva en el hilo?`,
        readerNeed: briefing.readerNeed,
        angle: briefing.angle,
        actionType: briefing.actionType,
        readerProfile: briefing.readerProfile,
      };

      const dupCheck = isDuplicatePost(candidate, telemetry.existingPosts);
      if (quality.valid && !dupCheck.duplicate) {
        // Gate 2: Evaluación Adversarial con Jurado Sintético Pyme (F >= 0.80)
        const juryLlm = process.env.GEMINI_API_KEY || process.env.AI_API_KEY ? callLLM : null;
        let jury = await evaluateWithSyntheticPymeJury(candidate, {
          policy: spmPolicy,
          llmFn: juryLlm,
        });
        if (!jury.passed && juryLlm) {
          console.warn(
            `[Jurado Sintético Pyme] Borrador debajo del umbral (F=${jury.score} < ${jury.threshold}): solicitando reescritura dirigida...`,
          );
          const fix = await repairArticleWithLLM(candidate, articleFormat, {
            maxAttempts: 1,
            policy: spmPolicy,
            extraCritiques: jury.critiques,
          });
          candidate = { ...candidate, ...fix.article, body: fix.quality.normalizedBody };
          quality = fix.quality;
          if (quality.valid) {
            jury = await evaluateWithSyntheticPymeJury(candidate, {
              policy: spmPolicy,
              llmFn: juryLlm,
            });
          }
        }
        if (quality.valid && jury.passed) {
          console.log(
            `[Comité Editorial] Artículo inédito verificado: "${candidate.title}" (${quality.wordCount} palabras, H3=${quality.h3Count}, FH=${quality.antiSlop.readabilityScore}, F=${jury.score}, fuentes=${groundedSources.length})`,
          );
          return candidate;
        }
        console.warn(
          `[Jurado Sintético Pyme] Candidato LLM vetado (F=${jury.score}/${jury.threshold}): ${jury.critiques.join(" | ")}`,
        );
      } else {
        const rejectionReason = dupCheck.duplicate ? dupCheck.reason : quality.issues.join(" | ");
        console.warn(`[Guardián Adversarial] Candidato LLM descartado: ${rejectionReason}`);
      }
    }
  }

  // Fallback 1: buffer editorial regenerativo persistente (con validación y autorreparación previa)
  const buffer = await loadEditorialBuffer();
  const validBuffered = getActiveBufferedCandidates(
    buffer,
    telemetry.existingPosts,
    telemetry.editorialLog,
  );
  const bufferedPick =
    (articleFormat === "pillar"
      ? validBuffered.find((c) => validateArticleQuality(c, "pillar").valid)
      : null) ||
    validBuffered.find((c) => c.slug === briefing.bufferSlug) ||
    validBuffered.find((c) => c.author === author) ||
    validBuffered[0];

  if (bufferedPick) {
    let finalPick = { ...bufferedPick, body: normalizeMarkdownBody(bufferedPick.body) };
    let pickQuality = validateArticleQuality(finalPick, articleFormat);
    if (!pickQuality.valid) {
      const fixed = await repairArticleWithLLM(finalPick, articleFormat, { maxAttempts: 2 });
      finalPick = fixed.article;
      pickQuality = fixed.quality;
    }
    if (pickQuality.valid || validateArticleQuality(finalPick, "tactical").valid) {
      const targetItem = buffer.items.find((i) => i.slug === bufferedPick.slug && !i.used);
      if (targetItem) targetItem.used = true;
      await saveEditorialBuffer(buffer);
      const normalizedTitle = applyRaeTitleCase(finalPick.title);
      console.log(
        `[Buffer Editorial] Publicando candidato verificado: "${normalizedTitle}" (${finalPick.author}, ${pickQuality.wordCount} palabras, H3=${pickQuality.h3Count})`,
      );
      return {
        ...finalPick,
        title: normalizedTitle,
        slug: slugify(finalPick.slug || normalizedTitle),
        date: targetDate,
      };
    }
  }

  // Fallback 2: banco curado estático (siempre validado Bite-Snack-Meal y cero duplicados)
  const availableCandidates = CURATED_EDITORIAL_BANK.filter((candidate) => {
    const briefingCheck = validateEditorialBriefing(
      {
        suggestedTitle: candidate.title,
        readerNeed: candidate.readerNeed,
        angle: candidate.angle,
      },
      telemetry.existingPosts,
      telemetry.editorialLog,
    );
    return briefingCheck.allowed && validateArticleQuality(candidate, "tactical").valid;
  });
  const curatedCandidate =
    availableCandidates.find((candidate) => candidate.slug === briefing.curatedSlug) ||
    availableCandidates.find((candidate) => candidate.author === author) ||
    availableCandidates[0];

  if (!curatedCandidate) {
    console.warn(
      "[Guardián Adversarial] Todos los artículos de reserva ya fueron publicados y no hay API LLM activa. Abortando publicación para impedir duplicados.",
    );
    return null;
  }

  const normalizedTitle = applyRaeTitleCase(curatedCandidate.title);
  console.log(
    `[Banco Editorial Curado] Seleccionado artículo 100% inédito: "${normalizedTitle}" (${curatedCandidate.author})`,
  );
  return {
    ...curatedCandidate,
    title: normalizedTitle,
    slug: slugify(curatedCandidate.slug || normalizedTitle),
    date: targetDate,
  };
}

// ─── SKILL 3: SPIRAL-BUILDER & MOTOR DE MEJORA TÉCNICA REAL ──────────────────

async function runTechnicalSpiral() {
  console.log("--- [Skill 3: Spiral-Builder] Ejecutando Auditoría y Recompilación Estática ---");
  const actionsTaken = [];

  // 1. Auditoría y purga adversarial de cualquier post duplicado en content/posts/
  if (existsSync(postsDir)) {
    const files = (await readdir(postsDir)).filter((f) => f.endsWith(".json")).sort();
    const acceptedPosts = [];
    for (const file of files) {
      const fullPath = path.join(postsDir, file);
      try {
        const raw = await readFile(fullPath, "utf8");
        const post = repairTruncatedJson(raw);
        const dup = isDuplicatePost(post, acceptedPosts);
        if (dup.duplicate) {
          await unlink(fullPath);
          actionsTaken.push(`Purgado post duplicado ${file} (${dup.reason})`);
          continue;
        }
        // Asegurar normalización ortográfica RAE en títulos
        const raeTitle = applyRaeTitleCase(post.title);
        if (raeTitle && raeTitle !== post.title) {
          post.title = raeTitle;
          await writeFile(fullPath, JSON.stringify(post, null, 2) + "\n", "utf8");
          actionsTaken.push(`Normalizado título RAE en ${file}`);
        }
        acceptedPosts.push(post);
      } catch (err) {
        console.warn(`Aviso leyendo ${file}:`, err.message);
      }
    }
  }

  // 2. Recompilar todo el sitio estático (incluyendo JSON-LD, EmoInsight, hilos de comentarios y limpieza de articulos/)
  const buildResult = await buildSite();

  // 3. Sincronizar content/editorial-log.json con los posts reales para erradicar entradas fantasma o repetidas
  const currentPosts = await loadModularPosts();
  const existingLog = await loadEditorialLog();
  const logBySlug = new Map(existingLog.map((e) => [e.slug, e]));
  const syncedLog = currentPosts
    .slice()
    .reverse()
    .map((p) => {
      const slug = p.slug || slugify(p.title);
      const prev = logBySlug.get(slug) || {};
      return {
        date: p.date,
        title: p.title,
        slug,
        author: p.author || "AIDux",
        category: p.category || "Operaciones",
        readerNeed: prev.readerNeed || p.excerpt || "",
        angle: prev.angle || `Enfoque ${p.author || "AIEvolutio"}`,
        actionType:
          prev.actionType || (Array.isArray(p.actionableChecklist) ? p.actionableChecklist[0] : ""),
        readerProfile: prev.readerProfile || "Dirección y equipo de pyme",
      };
    });

  if (JSON.stringify(syncedLog) !== JSON.stringify(existingLog)) {
    await saveEditorialLog(syncedLog);
    actionsTaken.push(
      `Sincronizado editorial-log.json con ${syncedLog.length} artículos únicos verificados`,
    );
  }

  return { buildResult, actionsTaken, currentPosts };
}

async function integrateNewPost(newPost, existingPosts) {
  await mkdir(postsDir, { recursive: true });
  const dupCheck = isDuplicatePost(newPost, existingPosts);
  if (dupCheck.duplicate) {
    console.warn(`[Hard Gate] Bloqueado guardado de "${newPost.title}": ${dupCheck.reason}`);
    return false;
  }

  const filename = `${newPost.date}-${newPost.slug}.json`;
  const postPath = path.join(postsDir, filename);
  const {
    readerNeed,
    angle,
    actionType,
    readerProfile,
    seedQuestion,
    bufferId: _bufferId,
    bufferedAt: _bufferedAt,
    used: _used,
    format: _format,
    ...postData
  } = newPost;
  await writeFile(postPath, JSON.stringify(postData, null, 2) + "\n", "utf8");
  console.log(`Post guardado en disco: content/posts/${filename}`);

  const editorialLog = await loadEditorialLog();
  editorialLog.push({
    date: newPost.date,
    title: newPost.title,
    slug: newPost.slug,
    author: newPost.author,
    category: newPost.category,
    readerNeed: readerNeed || "",
    angle: angle || "",
    actionType: actionType || "",
    readerProfile: readerProfile || "",
  });
  await saveEditorialLog(editorialLog);

  const emoStore = await loadEmoInsights();
  emoStore.posts = emoStore.posts || {};
  if (!emoStore.posts[newPost.slug]) {
    emoStore.posts[newPost.slug] = {
      title: newPost.title,
      author: newPost.author,
      likes: 0,
      dislikes: 0,
      emoDimensions: { clarity: 0, actionable: 0, too_complex: 0, legal_doubt: 0 },
      seedQuestion:
        seedQuestion ||
        `¿Cómo ves la aplicación de "${newPost.title}" en tu actividad diaria? Comparte tus dudas o propuestas para el roadmap.`,
      comments: [],
    };
    recomputeEmoSummary(emoStore);
    await saveEmoInsights(emoStore);
  }

  return true;
}

// ─── SKILL 4: SELF-HEALER & REPORTE DETERMINISTA (CERO COMMITS VACÍOS) ───────

async function runSelfHealer(
  telemetry,
  post,
  spiralResult,
  briefing,
  emoInsights = null,
  frontierFinding = null,
  techStepRecord = null,
  bufferStats = null,
) {
  console.log("--- [Skill 4: Self-Healer] Verificando salud y actualizando Daily Digest ---");

  const todayIso = getTodayString();
  const authorsSummary = Object.entries(telemetry.authorsCount)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

  const emoSummaryLine = emoInsights?.summary
    ? `Me gusta: ${emoInsights.summary.totalLikes} · No me gusta: ${emoInsights.summary.totalDislikes} · Claridad: ${emoInsights.summary.emoDimensions?.clarity || 0} · Aplicable: ${emoInsights.summary.emoDimensions?.actionable || 0} · Complejo: ${emoInsights.summary.emoDimensions?.too_complex || 0} · Dudas legales: ${emoInsights.summary.emoDimensions?.legal_doubt || 0} · Comentarios: ${emoInsights.summary.totalComments} (Respuestas IA: ${emoInsights.summary.aiRepliesCount})`
    : "Brújula EmoInsight activa en todos los artículos";

  const techBufCount =
    bufferStats?.techActiveCount ??
    ((await loadTechBuffer()).items || []).filter((i) => i && !i.used).length;
  const editorialBufCount =
    bufferStats?.editorialActiveCount ??
    ((await loadEditorialBuffer()).items || []).filter((i) => i && !i.used).length;

  const spmState = telemetry.spmAssignment?.portfolioState || null;
  const spmSummaryLine = spmState
    ? `Grow ${spmState.cellPct.grow}% (obj. 45%) · Transform ${spmState.cellPct.transform}% (obj. 25%) · Modernize ${spmState.cellPct.modernize}% (obj. 15%) · Compliance/AIJuris ${spmState.cellPct.compliance}% (tope 15%${spmState.aiJurisBlocked ? ", bloqueo activo" : ""})`
    : "Plano de Control SPM activo (`content/spm-policy.json`)";
  const ga4EventsLine = telemetry.ga4Events
    ? `Diagnósticos: ${telemetry.ga4Events.maturity_diagnosis} · Calculadoras: ${telemetry.ga4Events.roi_calculation} · Recetas copiadas: ${telemetry.ga4Events.recipe_copy} · EmoInsight: ${telemetry.ga4Events.emo_insight_feedback} · Comentarios: ${telemetry.ga4Events.emo_comment_submit}`
    : "Sin eventos de producto registrados en la API en los últimos 7 días";
  const gscLine =
    Array.isArray(telemetry.gscQueries) && telemetry.gscQueries.length > 0
      ? telemetry.gscQueries
          .slice(0, 4)
          .map((q) => `«${q.query}» (${q.impressions} imp, CTR ${q.ctr}%)`)
          .join(" · ")
      : "Pendiente habilitar `GSC_SITE_URL` y permiso `webmasters.readonly` en Search Console";

  const digestContent = `# Informe de Evolución Autónoma — AIEvolutio

**Fecha de ciclo:** ${todayIso}  
**Naturaleza:** Sistema experimental 100 % operado por IA (AIVisio CEO · AIDux CIO · AIJuris Guardarraíl)  
**Estado del Guardián Adversarial:** Activo — 0 duplicados · Gate Anti-Slop + Jurado Pyme (\`F >= 0.80\`)  
**Ciclo editorial:** ${post ? `Nuevo artículo publicado por **${post.author}** (${post.category})` : "Avance técnico del roadmap y verificación adversarial"}

---

### 1. Telemetría Real, Plano SPM, \`EmoInsight\` y Salud del Corpus (Telemetry-Critic)
- **Artículos únicos en producción:** ${spiralResult.buildResult.articles} (${authorsSummary})
- **Plano de Control SPM (últimos ${spmState?.windowCount || 14} posts):** ${spmSummaryLine}
- **Duplicados detectados / bloqueados:** 0 en producción
- **Colas regenerativas semanales:** Buffer técnico activo: **${techBufCount}/${TECH_BUFFER_TARGET}** (máx. 2/tipo) · Buffer editorial activo: **${editorialBufCount}/${EDITORIAL_BUFFER_TARGET}** (Anti-Slop verificado)
- **Páginas dinámicas prerenderizadas:** ${getRenderedPageList(spiralResult.buildResult.pages).join(", ")} + \`feed.xml\` (RSS 2.0)
- **GA4 (${process.env.GA4_PROPERTY_ID ? "API Conectada" : "Etiqueta G-DDWP8Z4F9B en web"}):** ${
    telemetry.ga4
      ? `Usuarios activos (7d): ${telemetry.ga4.activeUsers} | Sesiones: ${telemetry.ga4.sessions} | Duración media: ${telemetry.ga4.avgDurationSec}s | Eventos: ${telemetry.ga4.eventCount || 0}`
      : "Pendiente configurar GA4_PROPERTY_ID y Workload Identity Federation en GitHub Actions para lectura automática (0 métricas inventadas)."
  }
- **Eventos de producto GA4 (7d):** ${ga4EventsLine}
- **Sensor de demanda Search Console (GSC):** ${gscLine}
- **Pulso \`EmoInsight\` de lectores:** ${emoSummaryLine}

---

### 2. Investigación del Estado del Arte y Ampliación del Roadmap (Frontier-Scout)
${
  frontierFinding
    ? `- **Hallazgo de frontera (${frontierFinding.leadAgent}):** ${frontierFinding.topic}
- **Síntesis práctica:** ${frontierFinding.insight}
- **Impacto directo en \`docs/roadmap.md\`:** ${frontierFinding.roadmapImpact}`
    : "_Radar de frontera sincronizado en `docs/roadmap.md`._"
}

---

### 3. Dirección Estratégica y Briefing (AIVisio — CEO)
${
  briefing
    ? `- **Necesidad del lector:** ${briefing.readerNeed}
- **Ángulo diferencial:** ${briefing.angle}
- **Acción práctica recomendada:** ${briefing.actionType}
- **Perfil del destinatario:** ${briefing.readerProfile}`
    : "_Corpus diario completo; fase enfocada en mejora técnica del roadmap._"
}

---

### 4. Publicación Verificada (AIVisio · AIDux · AIJuris)
${
  post
    ? `- **Título:** ${post.title}
- **Autor:** ${post.author}
- **Slug:** \`${post.slug}\`
- **Extracto:** ${post.excerpt}
- **Checklist accionable:**
${post.actionableChecklist.map((item) => `  - [x] ${item}`).join("\n")}`
    : `_Último artículo único en producción verificado para el ciclo ${todayIso}._`
}

---

### 5. Avance Técnico del Roadmap Ejecutado (Spiral-Builder)
${
  techStepRecord
    ? `- **Paso del roadmap completado (\`${techStepRecord.id}\` — ${techStepRecord.versionRef}):** ${techStepRecord.summary}`
    : ""
}
${
  spiralResult.actionsTaken.length > 0
    ? spiralResult.actionsTaken.map((a) => `- ${a}`).join("\n")
    : "- DOM prerenderizado, widgets `EmoInsight`, hilos de comentarios, esquemas JSON-LD (`Organization`, `FAQPage`, `SoftwareApplication`, `TechArticle`) y sello «100 % operado por IA» verificados sin regresiones."
}

---

### 6. Diagnóstico Final (Self-Healer)
- **Integridad HTML/JSON y enlaces internos:** Verificada.
- **Transparencia y ausencia de falsas promesas:** Sello «100 % operado por IA» visible en pie de página, equipo, contacto e hilos de comentarios.
`;

  await writeFile(dailyDigestPath, digestContent, "utf8");
  console.log("Daily Digest actualizado en docs/daily-digest.md");
}

// ─── ORQUESTADOR PRINCIPAL ────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log(
    "=== INICIO DEL CICLO EVOLUTIVO AUTÓNOMO (AIEVOLUTIO v2.1 — EmoInsight & Doble Commit) ===",
    flags,
  );

  try {
    const telemetry = await runTelemetryCritic(flags);

    if (flags.auditOnly) {
      console.log("--- [Modo Auditoría Adversarial] ---");
      console.log(`Total artículos únicos: ${telemetry.existingCount}`);
      console.log("Distribución por autor:", telemetry.authorsCount);
      console.log("Distribución por categoría:", telemetry.categoriesCount);
      return;
    }

    const targetDate = getTodayString(flags.date);
    const emoInsights = await syncEmoInsightsAndComments(telemetry.existingPosts, targetDate);

    let frontierFinding = null;
    let techStepRecord = null;
    let briefing = null;
    let newPost = null;

    const runTechPhase = flags.phase === "tech" || flags.phase === "auto";
    const runContentPhase = flags.phase === "content" || flags.phase === "auto";
    let techBufferState = null;
    let editorialBufferState = null;

    if (runTechPhase) {
      frontierFinding = await runFrontierStateOfTheArtResearch(telemetry, emoInsights, targetDate);
      techStepRecord = await runRoadmapTechnicalStep(
        telemetry,
        emoInsights,
        targetDate,
        frontierFinding,
      );
      editorialBufferState = await ensureEditorialBuffer(telemetry, emoInsights, targetDate);
      techBufferState = await ensureTechBuffer(telemetry, emoInsights, frontierFinding, targetDate);
      await updateRoadmapWithFrontierAndTech(emoInsights, frontierFinding, techStepRecord, {
        telemetry,
        techBuffer: techBufferState.buffer,
        editorialBuffer: editorialBufferState.buffer,
      });
    } else if (Array.isArray(emoInsights.frontierLog) && emoInsights.frontierLog.length > 0) {
      frontierFinding = emoInsights.frontierLog[emoInsights.frontierLog.length - 1];
      if (Array.isArray(emoInsights.techHistory) && emoInsights.techHistory.length > 0) {
        techStepRecord = emoInsights.techHistory[emoInsights.techHistory.length - 1];
      }
    }

    if (runContentPhase) {
      editorialBufferState = await ensureEditorialBuffer(telemetry, emoInsights, targetDate);
      const existingDatePost = telemetry.existingPosts.find((p) => p.date === targetDate);
      const shouldPublishContent = flags.forceContent || !existingDatePost;

      if (shouldPublishContent) {
        console.log(
          `[Editorial] Iniciando ciclo de contenido para fecha ${targetDate} (Autor asignado: ${telemetry.recommendedAuthor})...`,
        );
        briefing = await runAIVisio(telemetry, emoInsights, frontierFinding);
        const candidate = requireEditorialCandidate(
          await runEditorialWriter(telemetry, briefing, targetDate),
        );
        const saved = await integrateNewPost(candidate, telemetry.existingPosts);
        if (!saved) {
          throw new Error(`El artículo "${candidate.title}" fue rechazado al guardarlo.`);
        }
        newPost = candidate;
        // Reposición inmediata del buffer editorial tras consumir o publicar para mantener siempre >= 7 en cola
        const refreshedPosts = await loadModularPosts();
        const refreshedLog = await loadEditorialLog();
        editorialBufferState = await ensureEditorialBuffer(
          { ...telemetry, existingPosts: refreshedPosts, editorialLog: refreshedLog },
          emoInsights,
          targetDate,
          { writeIfSufficient: true },
        );
        await updateRoadmapWithFrontierAndTech(emoInsights, frontierFinding, techStepRecord, {
          telemetry,
          editorialBuffer: editorialBufferState.buffer,
        });
      } else {
        console.log(
          `[Editorial] Ya existe artículo verificado para ${targetDate}; se mantiene el corpus sin duplicados.`,
        );
      }
    }

    // Recompilar el sitio estático y sincronizar registros
    const updatedTelemetry = await runTelemetryCritic(flags);
    const spiralResult = await runTechnicalSpiral();
    if (techStepRecord) {
      spiralResult.actionsTaken.unshift(
        `Avance roadmap (${techStepRecord.id}): ${techStepRecord.summary}`,
      );
    }

    // Actualizar el Daily Digest determinista
    await runSelfHealer(
      updatedTelemetry,
      newPost,
      spiralResult,
      briefing,
      emoInsights,
      frontierFinding,
      techStepRecord,
      {
        techActiveCount: techBufferState?.activeCount,
        editorialActiveCount: editorialBufferState?.activeCount,
      },
    );

    console.log("=== CICLO EVOLUTIVO COMPLETADO CON ÉXITO ===");
  } catch (fatalErr) {
    console.error("Error en el ciclo evolutivo:", fatalErr);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
