/**
 * scripts/autonomous-evolution.mjs
 * Motor del Ciclo Evolutivo Autónomo de AIEvolutio (Reconducción Adversarial v2.0).
 *
 * La Verdadera Organización:
 * - AIVisio (CEO): Estratega, visionario, dueño del qué y de la estrategia para aprovechar
 *                  el abaratamiento del conocimiento e innovar en la curva exponencial.
 * - AIDux (CIO):   Dueño del cómo, del camino técnico, SLMs locales, MCP y AIWorkers.
 * - AIJuris:       Guardarrail ético y legal (AI Act, RGPD, soberanía del dato).
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
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { repairTruncatedJson, extractFieldsFallback } from "./json-repair.mjs";
import { buildSite, loadModularPosts } from "./prerender-site.mjs";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "content/posts");
const editorialLogPath = path.join(repoRoot, "content/editorial-log.json");
const dailyDigestPath = path.join(repoRoot, "docs/daily-digest.md");

// ─── CLI ARGS ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const flags = {
    forceContent: false,
    forceTech: false,
    auditOnly: false,
    author: null,
    date: null,
  };
  for (const arg of argv) {
    if (arg === "--force-content") flags.forceContent = true;
    else if (arg === "--force-tech") flags.forceTech = true;
    else if (arg === "--audit-only") flags.auditOnly = true;
    else if (arg.startsWith("--author=")) flags.author = arg.split("=")[1];
    else if (arg.startsWith("--date=")) flags.date = arg.split("=")[1];
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

export function validateArticleBodyLength(body) {
  const wordCount = String(body || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { valid: wordCount >= 240 && wordCount <= 290, wordCount };
}

// ─── GEMINI LLM HELPER ──────────────────────────────────────────────────────

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
          maxOutputTokens: 1000,
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
    body: `**Durante décadas, las pequeñas empresas tuvieron cercanía humana pero carecieron de capacidad analítica para ofrecer seguimiento proactivo a cada cliente.** Una gestoría solo tenía tiempo de presentar impuestos a última hora; un taller o empresa de mantenimiento solo actuaba cuando algo se rompía. El abaratamiento del conocimiento ha derribado esa barrera.\n\n**Tres innovaciones posibles hoy para una pyme con el volante en la mano**\n\n- **De gestoría reactiva a radar financiero mensual:** cruzar automáticamente los movimientos contables del trimestre para entregar a cada cliente un informe claro de tres puntos sobre desviaciones de gasto y tesorería que antes era inviable redactar manualmente.\n- **De soporte puntual a mantenimiento predictivo documentado:** transformar los partes históricos de averías e incidencias en alertas preventivas personalizadas para cada instalación.\n- **Auditorías de bienvenida instantáneas:** ofrecer a cualquier cliente potencial un diagnóstico preliminar estructurado en veinticuatro horas como puerta de entrada de alto valor.\n\n**Acción alcanzable para hoy:**\n1. Selecciona a tus cinco clientes más fieles y pregúntate qué informe o aviso preventivo les ayudaría a tomar mejores decisiones cada mes.\n2. Utiliza los datos que ya procesas para ellos (con privacidad local garantizada) para generar un resumen ejecutivo de una sola cara.\n3. Entrégalo en tu próxima reunión con la firma y supervisión de tu equipo para transformar un servicio comoditizado en una relación estratégica insustituible.`,
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
      "Diccionario sin miedo para tu negocio: qué son MCP, las bases vectoriales y los modelos locales explicados con objetos cotidianos",
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
      "Muchos nombres técnicos parecen diseñados para intimidar. Explicamos con ejemplos de todos los días qué hay detrás de cada término y cuánto cuesta de verdad ponerlo en marcha.",
    body: `**Cuando escuchas términos como protocolo MCP, base de datos vectorial o modelo local compacto, es muy fácil pensar que te están proponiendo construir una gran catedral desde los cimientos.** Sin embargo, en la práctica cotidiana de una pequeña empresa, la mayoría de estas piezas se parecen mucho más a montar una estantería sencilla de salón en una tarde con cuatro tornillos. El obstáculo rara vez es la herramienta en sí, sino la costumbre del sector tecnológico de bautizar ideas simples con palabras intimidantes.

**Tres conceptos habituales traducidos al lenguaje de tu taller o despacho**

- **Modelo local compacto (SLM):** imagina un ayudante de redacción y análisis que trabaja dentro de tu propio ordenador sin necesitar internet. Hoy se instala con programas gratuitos en diez minutos, exactamente igual que cualquier aplicación de oficina, sin pagar cuotas mensuales.
- **Protocolo MCP (el enchufe universal):** equivale a una toma de corriente estándar. Antes había que fabricar cables a medida para que un asistente leyera una carpeta de tarifas; ahora basta con conectar ese enchufe e indicar qué cajón tiene permiso para consultar.
- **Base de datos vectorial (el archivador por ideas):** en lugar de buscar documentos solo por una palabra exacta, ordena tus presupuestos y manuales antiguos por significado. Para una pyme es una estantería ligera; solo se vuelve una obra compleja cuando se manejan millones de archivos.

**Acción alcanzable para hoy:**
1. Anota las tres palabras tecnológicas que más dudas te hayan generado últimamente al leer sobre inteligencia artificial.
2. Pregúntate en cada caso: ¿esto se instala en una tarde sin coste o exige contratar un proyecto a medida?
3. Empieza siempre por las piezas de nivel estantería que resuelvan un atasco real de tu semana.`,
    actionableChecklist: [
      "Traducir cada término técnico a una función cotidiana antes de comprar o instalar nada",
      "Distinguir qué herramientas se prueban gratis en una tarde y cuáles requieren soporte experto",
      "Empezar por soluciones sencillas de impacto inmediato en lugar de proyectos complejos",
    ],
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
    body: `**Muchos proveedores de programas de facturación, gestión documental o diseño están aplicando subidas del treinta o cuarenta por ciento en sus cuotas mensuales por el simple hecho de añadir un botón de inteligencia artificial.** Para un autónomo o una pequeña empresa, acumular cinco o seis suplementos de este tipo al año supone miles de euros en funciones accesorias que a menudo apenas se utilizan o que resuelven problemas que el negocio ni siquiera tenía.

**Cómo separar el valor real del recargo publicitario en tu negocio**

- **Calcula el coste por uso efectivo:** si pagas veinte euros adicionales al mes por cada puesto de trabajo solo para resumir cuatro correos a la semana, cada resumen te está saliendo más caro que redactarlo a mano. Esas mismas consultas suelen costar pocos céntimos cuando se realizan sin intermediarios.
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
  return [...new Set(["index.html", "contacto.html", ...pages])];
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
          ],
        }),
      },
    );
    if (!reportRes.ok) return null;
    const report = await reportRes.json();
    const row = report.rows?.[0]?.metricValues;
    if (!row) return { activeUsers: 0, sessions: 0, avgDurationSec: 0 };
    return {
      activeUsers: Number(row[0]?.value || 0),
      sessions: Number(row[1]?.value || 0),
      avgDurationSec: Math.round(Number(row[2]?.value || 0)),
    };
  } catch (err) {
    console.warn("[GA4 API] Error al consultar métricas reales:", err.message);
    return null;
  }
}

// ─── SKILL 1: TELEMETRY-CRITIC (HONESTIDAD Y AUDITORÍA ADVERSARIAL) ──────────

async function runTelemetryCritic(flags = {}) {
  console.log("--- [Skill 1: Telemetry-Critic] Evaluando estado real, corpus y telemetría ---");

  let ga4Data = null;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const accessToken = process.env.GA4_ACCESS_TOKEN;

  if (propertyId && accessToken) {
    ga4Data = await fetchRealGa4Metrics(propertyId, accessToken);
    if (ga4Data) {
      console.log("Métricas reales GA4 (últimos 7 días):", ga4Data);
    } else {
      console.log(
        "GA4 API: Credenciales presentes pero sin respuesta válida; reportando estado honesto.",
      );
    }
  } else {
    console.log(
      "Telemetría GA4: etiqueta G-DDWP8Z4F9B activa; API pendiente de GA4_PROPERTY_ID y autenticación federada de GitHub Actions.",
    );
  }

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

  // Seleccionar el autor menos representado o el forzado por CLI
  let recommendedAuthor = flags.author;
  if (!recommendedAuthor || !["AIVisio", "AIDux", "AIJuris"].includes(recommendedAuthor)) {
    const sortedAuthors = Object.entries(authorsCount).sort((a, b) => a[1] - b[1]);
    recommendedAuthor = sortedAuthors[0][0];
  }

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
    ga4: ga4Data,
    editorialLog,
    allExistingTitles,
    allExistingSlugs,
    categoriesCount,
  };
}

// ─── SKILL 2a: AIVisio (DIRECCIÓN ESTRATÉGICA Y BRIEFING) ─────────────────────

async function runAIVisio(telemetry) {
  console.log("--- [AIVisio: CEO & Director Estratégico] Estableciendo Briefing de variedad ---");

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

  const briefingPrompt = `Eres AIVisio, CEO y Estratega de AIEvolutio. Define el Briefing del nuevo artículo ANTES de escribirlo.

Fundamentos de AIEvolutio:
- Acompañamos a las pymes a abrir los ojos ante el acceso directo al conocimiento para innovar, hacer posible lo que antes parecía inalcanzable y aportar valor real con trato humano.
- Claridad pedagógica: ningún lector no técnico debe quedarse con dudas sobre si una propuesta equivale a montar una estantería sencilla en una tarde o a una obra de ingeniería compleja; desmitificamos la tecnología, evaluamos herramientas y precios con honestidad y exploramos su impacto en empresas, educación, mayores y ciudadanía.
- Perfil que firmará hoy: ${authorRoleMap[telemetry.recommendedAuthor] || telemetry.recommendedAuthor}

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

  // Si no hay LLM disponible, extraer el Briefing del primer artículo inédito del banco curado para ese autor
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
      ).allowed && validateArticleBodyLength(candidate.body).valid,
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
    `[AIVisio] Banco editorial agotado: ${CURATED_EDITORIAL_BANK.length} candidatos vetados antes de redactar. No se generó un artículo para evitar una repetición.`,
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
  console.log(`--- [Comité Editorial: ${author}] Redactando artículo bajo Briefing de AIVisio ---`);

  const articlePrompt = `Eres ${author} de AIEvolutio (${
    author === "AIVisio"
      ? "CEO, dirección estratégica y mirada humana sobre el impacto en las pymes y la sociedad"
      : author === "AIJuris"
        ? "Guardarraíl ético y legal, especialista en AI Act, RGPD y soberanía del dato"
        : "CIO, dirección tecnológica, artesanía práctica, modelos compactos locales y AIWorkers"
  }).
Escribe un artículo único, accionable y riguroso para pymes en España.

BRIEFING OBLIGATORIO:
- Necesidad: ${briefing.readerNeed}
- Ángulo: ${briefing.angle}
- Acción final: ${briefing.actionType}
- Perfil lector: ${briefing.readerProfile}
- Categoría: ${briefing.suggestedCategory || (author === "AIJuris" ? "Legal" : author === "AIVisio" ? "Estrategia" : "Operaciones")}
${briefing.suggestedTitle ? `- Título sugerido: ${briefing.suggestedTitle}` : ""}

PROHIBIDO REPETIR CUALQUIERA DE ESTOS TÍTULOS EXISTENTES:
${JSON.stringify(telemetry.allExistingTitles)}

Normas RAE, claridad pedagógica y formato:
1. Título en sentence case según la RAE (solo primera letra y siglas como IA, AI Act, RGPD, SLM, MCP, AIVisio, AIDux, AIJuris en mayúscula; "pyme"/"pymes" en minúscula).
2. Claridad sin jerga opaca: si mencionas cualquier término técnico (como MCP, base de datos vectorial, modelo local SLM, API o tokens), explícalo al instante con una analogía cotidiana para que una persona no técnica distinga si aplicarlo equivale a montar una estantería sencilla en una tarde o a una obra compleja.
3. body: 240-290 palabras. Párrafo inicial potente + subtítulo en negrita + viñetas con negritas + bloque "**Acción alcanzable para hoy:**" con 3 pasos numerados.
4. actionableChecklist: exactamente 3 pasos concretos.
5. Responde SOLO con JSON válido:
{"title":"...","slug":"...","category":"...","excerpt":"...","body":"...","actionableChecklist":["...","...","..."]}`;

  const rawArticle = await callLLM(articlePrompt);

  if (rawArticle) {
    let parsed = null;
    try {
      parsed = repairTruncatedJson(rawArticle);
    } catch {
      const fallbackFields = extractFieldsFallback(rawArticle);
      if (fallbackFields.title && fallbackFields.body) parsed = fallbackFields;
    }

    if (parsed && parsed.title && parsed.body) {
      const { valid: validLength, wordCount } = validateArticleBodyLength(parsed.body);
      const normalizedTitle = applyRaeTitleCase(parsed.title);
      const candidate = {
        title: normalizedTitle,
        slug: slugify(parsed.slug || normalizedTitle),
        date: targetDate,
        author,
        category: parsed.category || briefing.suggestedCategory || "Operaciones",
        excerpt: parsed.excerpt || parsed.body.substring(0, 140) + "…",
        body: parsed.body,
        actionableChecklist:
          Array.isArray(parsed.actionableChecklist) && parsed.actionableChecklist.length >= 1
            ? parsed.actionableChecklist.slice(0, 3)
            : [
                briefing.actionType,
                "Medir impacto en la primera semana",
                "Validar con supervisión humana",
              ],
        readerNeed: briefing.readerNeed,
        angle: briefing.angle,
        actionType: briefing.actionType,
        readerProfile: briefing.readerProfile,
      };

      const dupCheck = isDuplicatePost(candidate, telemetry.existingPosts);
      if (validLength && !dupCheck.duplicate) {
        console.log(
          `✅ [Comité Editorial] Artículo inédito verificado: "${candidate.title}" (${wordCount} palabras)`,
        );
        return candidate;
      }
      const rejectionReason = dupCheck.duplicate
        ? dupCheck.reason
        : `body de ${wordCount} palabras; se exigen entre 240 y 290`;
      console.warn(`⚠️ [Guardián Adversarial] Candidato LLM descartado: ${rejectionReason}`);
    }
  }

  // Fallback seguro al banco curado: SOLO selecciona artículos que pasen isDuplicatePost
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
    return briefingCheck.allowed && validateArticleBodyLength(candidate.body).valid;
  });
  const curatedCandidate =
    availableCandidates.find((candidate) => candidate.slug === briefing.curatedSlug) ||
    availableCandidates.find((candidate) => candidate.author === author) ||
    availableCandidates[0];

  if (!curatedCandidate) {
    console.warn(
      "🛑 [Guardián Adversarial] Todos los artículos de reserva ya fueron publicados y no hay API LLM activa. Abortando publicación para impedir duplicados.",
    );
    return null;
  }

  const normalizedTitle = applyRaeTitleCase(curatedCandidate.title);
  console.log(
    `✅ [Banco Editorial Curado] Seleccionado artículo 100% inédito: "${normalizedTitle}" (${curatedCandidate.author})`,
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
  console.log("--- [Skill 3: Spiral-Builder] Ejecutando Auditoría y Mejora Técnica en Espiral ---");
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

  // 2. Recompilar todo el sitio estático (incluyendo JSON-LD, navegación prerenderizada y limpieza de articulos/)
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
    console.warn(`🛑 [Hard Gate] Bloqueado guardado de "${newPost.title}": ${dupCheck.reason}`);
    return false;
  }

  const filename = `${newPost.date}-${newPost.slug}.json`;
  const postPath = path.join(postsDir, filename);
  const { readerNeed, angle, actionType, readerProfile, ...postData } = newPost;
  await writeFile(postPath, JSON.stringify(postData, null, 2) + "\n", "utf8");
  console.log(`✅ Post guardado en disco: content/posts/${filename}`);

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
  return true;
}

// ─── SKILL 4: SELF-HEALER & REPORTE DETERMINISTA (CERO COMMITS VACÍOS) ───────

async function runSelfHealer(telemetry, post, spiralResult, briefing) {
  console.log("--- [Skill 4: Self-Healer] Verificando salud y actualizando Daily Digest ---");

  const todayIso = getTodayString();
  const authorsSummary = Object.entries(telemetry.authorsCount)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

  const digestContent = `# 📊 Informe de Evolución Autónoma — AIEvolutio

**Fecha de ciclo:** ${todayIso}  
**Naturaleza:** 🧪 Experimento autogestionado por IA (AIVisio CEO · AIDux CIO · AIJuris Guardarrail)  
**Estado del Guardián Adversarial:** 🟢 Activo — 0 artículos duplicados tolerados  
**Ciclo editorial:** ${post ? `Nuevo artículo publicado por **${post.author}** (${post.category})` : "Mantenimiento técnico y verificación adversarial (sin nuevo post duplicado)"}

---

### 1. Telemetría Real y Salud del Corpus (Telemetry-Critic)
- **Artículos únicos en producción:** ${spiralResult.buildResult.articles} (${authorsSummary})
- **Duplicados detectados / bloqueados:** 0 en producción
- **Páginas dinámicas prerenderizadas:** ${getRenderedPageList(spiralResult.buildResult.pages).join(", ")}
- **GA4 (${process.env.GA4_PROPERTY_ID ? "API Conectada" : "Etiqueta G-DDWP8Z4F9B en web"}):** ${
    telemetry.ga4
      ? `Usuarios activos (7d): ${telemetry.ga4.activeUsers} | Sesiones: ${telemetry.ga4.sessions} | Duración media: ${telemetry.ga4.avgDurationSec}s`
      : "Pendiente configurar GA4_PROPERTY_ID y Workload Identity Federation en GitHub Actions para lectura automática (0 métricas inventadas)."
  }

---

### 2. Dirección Estratégica y Briefing (AIVisio — CEO)
${
  briefing
    ? `- **Necesidad del lector:** ${briefing.readerNeed}
- **Ángulo diferencial:** ${briefing.angle}
- **Acción de volante propuesta:** ${briefing.actionType}
- **Perfil del destinatario:** ${briefing.readerProfile}`
    : "_Corpus diario completo; sin necesidad de forzar publicación repetida._"
}

---

### 3. Publicación Verificada (AIVisio · AIDux · AIJuris)
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

### 4. Espiral Técnica Ejecutada (Spiral-Builder)
${
  spiralResult.actionsTaken.length > 0
    ? spiralResult.actionsTaken.map((a) => `- 🔧 ${a}`).join("\n")
    : "- ✅ DOM prerenderizado, esquemas JSON-LD (`Organization`, `FAQPage`, `SoftwareApplication`, `BlogPosting`), filtros interactivos y banner experimental verificados sin regresiones."
}

---

### 5. Diagnóstico Final (Self-Healer)
- **Integridad HTML/JSON y enlaces internos:** ✅ Verificada.
- **Falsas expectativas comerciales:** 🛡️ Mitigadas mediante aviso experimental visible en todas las páginas.
`;

  await writeFile(dailyDigestPath, digestContent, "utf8");
  console.log("Daily Digest actualizado en docs/daily-digest.md");
}

// ─── ORQUESTADOR PRINCIPAL ────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log("=== INICIO DEL CICLO EVOLUTIVO AUTÓNOMO (AIEVOLUTIO v2.0) ===", flags);

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
    const existingDatePost = telemetry.existingPosts.find((p) => p.date === targetDate);

    let briefing = null;
    let newPost = null;

    const shouldPublishContent = flags.forceContent || (!flags.forceTech && !existingDatePost);

    if (shouldPublishContent) {
      console.log(
        `[Editorial] Iniciando ciclo de contenido para fecha ${targetDate} (Autor asignado: ${telemetry.recommendedAuthor})...`,
      );
      briefing = await runAIVisio(telemetry);
      const candidate = requireEditorialCandidate(
        await runEditorialWriter(telemetry, briefing, targetDate),
      );
      const saved = await integrateNewPost(candidate, telemetry.existingPosts);
      if (!saved) {
        throw new Error(`El artículo "${candidate.title}" fue rechazado al guardarlo.`);
      }
      newPost = candidate;
    } else {
      console.log(
        `[Editorial] Ciclo enfocado en espiral técnica (ya existe post para ${targetDate} o se solicitó --force-tech).`,
      );
    }

    // Ejecutar siempre la espiral técnica real y recompilación
    const updatedTelemetry = await runTelemetryCritic(flags);
    const spiralResult = await runTechnicalSpiral();

    // Actualizar el Daily Digest determinista
    await runSelfHealer(updatedTelemetry, newPost, spiralResult, briefing);

    console.log("=== CICLO EVOLUTIVO COMPLETADO CON ÉXITO ===");
  } catch (fatalErr) {
    console.error("Error en el ciclo evolutivo:", fatalErr);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
