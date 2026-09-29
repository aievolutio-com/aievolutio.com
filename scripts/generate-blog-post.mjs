import { readFile, writeFile } from "node:fs/promises";

const contentPath = "content/content.es.json";
const projectId = process.env.GCP_PROJECT_ID;
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
const location = process.env.VERTEX_AI_LOCATION || "us-central1";
const model = process.env.VERTEX_AI_MODEL || "gemini-2.5-flash";

if (!projectId || !accessToken) {
  throw new Error("GCP_PROJECT_ID y GOOGLE_ACCESS_TOKEN son obligatorios.");
}

const content = JSON.parse(await readFile(contentPath, "utf8"));
const blog = content.sections.find((section) => section.id === "blog");

if (!blog) throw new Error("No existe la sección blog.");

const existingPosts = (blog.blocks || []).filter(
  (block) => block.type === "post",
);
const existingTitles = existingPosts.map((post) => post.title).filter(Boolean);
const topics = [
  "cómo diseñar procesos de trabajo asistidos por IA sin perder criterio humano",
  "qué tareas conviene delegar a un AIWorker y cuáles no",
  "cómo medir el tiempo recuperado gracias a la automatización",
  "cómo empezar un pequeño experimento de IA en una organización",
];
const topic = topics[existingPosts.length % topics.length];
const today = new Date().toISOString().slice(0, 10);

const prompt = `
Actúa como editor del blog de AIEvolutio.

Escribe un artículo breve en español sobre: ${topic}.
Tono: claro, práctico, humano y optimista, sin promesas exageradas.
Público: profesionales y pequeños equipos que quieren usar IA con criterio.
Extensión: entre 500 y 800 palabras.
No inventes estadísticas, estudios, clientes, leyes ni enlaces.
No des asesoramiento jurídico, médico o financiero.
Devuelve únicamente JSON válido, sin Markdown ni bloques de código, con esta forma:
{
  "title": "Título del artículo",
  "body": "Texto completo del artículo en párrafos separados por dos saltos de línea"
}

Fecha de publicación: ${today}
Títulos ya publicados, que no debes repetir:
${JSON.stringify(existingTitles)}
`;

const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  }),
});

if (!response.ok) {
  throw new Error(
    `Vertex AI devolvió ${response.status}: ${await response.text()}`,
  );
}

const result = await response.json();
const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
if (!generatedText) throw new Error("Vertex AI no devolvió contenido.");

const generated = JSON.parse(generatedText);
const title = String(generated.title || "").trim();
const body = String(generated.body || "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/^#{1,6}\s+/gm, "")
  .trim();

if (!title || !body)
  throw new Error("El artículo generado no tiene título o contenido.");
if (
  existingTitles.some(
    (existingTitle) => existingTitle.toLowerCase() === title.toLowerCase(),
  )
) {
  throw new Error(`El título generado ya existe: ${title}`);
}
if (body.length < 500)
  throw new Error("El artículo generado es demasiado corto.");

blog.blocks = [
  ...(blog.blocks || []),
  { type: "post", title, date: today, body },
];
await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log(`Artículo generado: ${title}`);
