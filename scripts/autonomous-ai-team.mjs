import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Falta GEMINI_API_KEY en los Secrets de GitHub.");
  process.exit(0); // Salida limpia para no bloquear el despliegue de Pages
}

const agentsSpec = fs.existsSync('AGENTS.md') ? fs.readFileSync('AGENTS.md', 'utf8') : '';
const storyMap = fs.existsSync('docs/user-story-map.md') ? fs.readFileSync('docs/user-story-map.md', 'utf8') : '';
const currentIndex = fs.existsSync('index.html') ? fs.readFileSync('index.html', 'utf8') : '';
const currentBlog = fs.existsSync('blog.html') ? fs.readFileSync('blog.html', 'utf8') : '';

const today = new Date().toISOString().split('T')[0];

const prompt = `
Fecha actual: ${today}.
Actúa como el motor autónomo de AIEvolutio siguiendo estrictamente estas directrices:
${agentsSpec}

Estado actual del User Story Map:
${storyMap}

Código actual de index.html:
${currentIndex.slice(0, 12000)}

Código actual de blog.html:
${currentBlog.slice(0, 12000)}

TAREA DE LA ITERACIÓN DIARIA:
1. Investiga y redacta un nuevo artículo de alto impacto práctico para pequeñas empresas (firmado por AIDux o AIJuris).
2. Integra el nuevo artículo en 'blog.html' (manteniendo los anteriores en orden cronológico inverso) y actualiza la sección de novedades/destacados de 'index.html'.
3. Aplica UNA mejora técnica tangible en 'index.html' y 'blog.html' (ej. inyección de JSON-LD Schema.org, mejora de accesibilidad ARIA, optimización de metaetiquetas GEO, o un micro-componente interactivo útil para PYMEs). Asegúrate de importar las fuentes Montserrat y Roboto de Google Fonts y respetar la paleta de marca.
4. Actualiza el User Story Map marcando el avance y definiendo el objetivo de mañana.
5. Genera el informe diario conciso en Markdown para el observador humano.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la estructura solicitada.
`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    updatedIndexHtml: { type: "STRING", description: "Código HTML5 completo y válido para index.html" },
    updatedBlogHtml: { type: "STRING", description: "Código HTML5 completo y válido para blog.html" },
    updatedStoryMapMd: { type: "STRING", description: "Contenido Markdown completo para docs/user-story-map.md" },
    dailyDigestMd: { type: "STRING", description: "Informe ejecutivo diario en Markdown para el observador humano" }
  },
  required: ["updatedIndexHtml", "updatedBlogHtml", "updatedStoryMapMd", "dailyDigestMd"]
};

async function runEvolution() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error API IA (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.candidates[0].content.parts[0].text);

  // Guardado seguro con verificación mínima de integridad
  if (result.updatedIndexHtml && result.updatedIndexHtml.includes('</html>')) {
    fs.writeFileSync('index.html', result.updatedIndexHtml, 'utf8');
  }
  if (result.updatedBlogHtml && result.updatedBlogHtml.includes('</html>')) {
    fs.writeFileSync('blog.html', result.updatedBlogHtml, 'utf8');
  }
  
  fs.mkdirSync('docs', { recursive: true });
  if (result.updatedStoryMapMd) {
    fs.writeFileSync('docs/user-story-map.md', result.updatedStoryMapMd, 'utf8');
  }
  if (result.dailyDigestMd) {
    fs.writeFileSync('docs/daily-digest.md', result.dailyDigestMd, 'utf8');
  }

  console.log("✅ Ciclo evolutivo completado con éxito.");
}

runEvolution().catch(err => {
  console.error("⚠️ Fallo capturado en el ciclo evolutivo (el despliegue continuará con la versión estable):", err.message);
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/daily-digest.md', `### ⚠️ Alerta de Auto-Recuperación (${today})\nEl motor detectó una anomalía en la API o generación (${err.message}) y mantuvo la versión estable en producción sin romper la web.`, 'utf8');
  process.exit(0); // Nunca bloquea el pipeline
});