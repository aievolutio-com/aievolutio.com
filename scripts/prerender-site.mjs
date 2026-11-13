import { cp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { repairTruncatedJson } from "./json-repair.mjs";

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, "dist");
const contentPath = path.join(repoRoot, "content/content.es.json");
const navigationPath = path.join(repoRoot, "content/navigation.json");
const postsDirectory = path.join(repoRoot, "content/posts");
const htmlPages = [
  "index.html",
  "diagnostico.html",
  "calculadora.html",
  "equipo.html",
  "blog.html",
  "archivo.html",
  "contacto.html",
];
const publicDirectories = ["assets", "content", "images", "styles"];
const publicFiles = ["CNAME", "_headers", "site.webmanifest", "robots.txt", "sitemap.xml"];
const articleBaseUrl = "https://aievolutio.com";

export async function getSiteVersion() {
  try {
    const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
    return `v${pkg.version || "1.0.0"}`;
  } catch {
    return "v1.0.0";
  }
}

export const legacyArticleAliases = new Map([
  [
    "articulos/articulo-2026-11-04-el-abaratamiento-del-conocimiento-y-la-curva-exponencial-como-llevar-el-volante-de-tu-pyme.html",
    "articulos/articulo-2026-11-04-el-abaratamiento-del-conocimiento-como-hacer-posible-en-tu-empresa-lo-que-antes-parecia-inalcanzable.html",
  ],
  [
    "articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-s.html",
    "articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-sin-friccion.html",
  ],
  [
    "articulos/articulo-2026-10-11-aiworkers-tu-equipo-invisible-que-multiplica-el-v.html",
    "articulos/articulo-2026-10-11-aiworkers-tu-equipo-invisible-que-multiplica-el-valor.html",
  ],
  [
    "articulos/articulo-2026-10-09-navegando-el-futuro-como-la-ia-potencia-la-resili.html",
    "articulos/articulo-2026-10-09-navegando-el-futuro-como-la-ia-potencia-la-resiliencia-de-tu-negocio.html",
  ],
  [
    "articulos/articulo-2026-10-07-antes-de-automatizar-como-elegir-un-proceso-que-m.html",
    "articulos/articulo-2026-10-07-antes-de-automatizar-como-elegir-un-proceso-que-merece-una-prueba-con-ia.html",
  ],
  [
    "articulos/articulo-2026-10-05-diseno-inteligente-de-procesos-cuando-la-ia-asist.html",
    "articulos/articulo-2026-10-05-diseno-inteligente-de-procesos-cuando-la-ia-asiste-y-el-criterio-humano-decide.html",
  ],
  [
    "articulos/articulo-2026-10-04-desmitificando-la-ia-la-guia-para-tu-primer-exper.html",
    "articulos/articulo-2026-10-04-desmitificando-la-ia-la-guia-para-tu-primer-experimento-en-equipo.html",
  ],
  [
    "articulos/articulo-2026-09-29-desbloqueando-horas-valiosas-una-guia-practica-pa.html",
    "articulos/articulo-2026-09-29-desbloqueando-horas-valiosas-una-guia-practica-para-medir-el-impacto-de-tu-automatizacion.html",
  ],
  [
    "articulos/articulo-2026-08-03-riesgos-y-ventajas-de-los-aiworkers-en-las-organiz.html",
    "articulos/articulo-2026-08-03-riesgos-y-ventajas-de-los-aiworkers-en-las-organizaciones.html",
  ],
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function articleId(post) {
  const slug = `${post.date || ""}-${post.title || "articulo"}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `articulo-${slug}`;
}

function articleUrl(post) {
  return `articulos/${articleId(post)}.html`;
}

export function sortedPosts(blocks = []) {
  return blocks
    .filter((block) => block.type === "post")
    .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
}

function formatPostDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return String(date || "");
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function postSummary(body, maxLength = 280) {
  const text = String(body || "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

function stripLeadingEmojis(value) {
  return String(value ?? "")
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]\uFE0F?/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function renderUiIcon(name) {
  const icons = {
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
    thumbUp:
      '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    thumbDown:
      '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
    comment:
      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    compass:
      '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    wrench:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    stairs: '<path d="M4 20h4v-4h4v-4h4v-4h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  };
  const body = icons[name] || '<circle cx="12" cy="12" r="9"/>';
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function renderComparisonTable(table) {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows) || !table.rows.length) {
    return "";
  }
  const caption = table.caption ? `<caption>${escapeHtml(table.caption)}</caption>` : "";
  const thead = `<thead><tr>${table.headers.map((h) => `<th scope="col">${formatInlineText(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${table.rows
    .map(
      (row) =>
        `<tr>${(Array.isArray(row) ? row : []).map((cell) => `<td>${formatInlineText(cell)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return `<div class="article-table-wrap"><table class="article-table">${caption}${thead}${tbody}</table></div>`;
}

function renderVisualDiagram(diagram) {
  if (!diagram || !Array.isArray(diagram.nodes) || diagram.nodes.length < 2) {
    return "";
  }
  const nodes = diagram.nodes.slice(0, 3);
  const title = diagram.title || "Esquema visual de decisión";
  const boxWidth = 190;
  const gap = 35;
  const startX = 20;
  const totalWidth = startX * 2 + nodes.length * boxWidth + (nodes.length - 1) * gap;
  const boxes = nodes
    .map((node, idx) => {
      const x = startX + idx * (boxWidth + gap);
      const label = escapeHtml(String(node.title || `Paso ${idx + 1}`).slice(0, 28));
      const note = escapeHtml(String(node.note || "").slice(0, 36));
      const arrow =
        idx < nodes.length - 1
          ? `<line x1="${x + boxWidth + 4}" y1="62" x2="${x + boxWidth + gap - 6}" y2="62" stroke="var(--brand-tech-surface, #1e6091)" stroke-width="2" stroke-linecap="round"/><polyline points="${x + boxWidth + gap - 12},56 ${x + boxWidth + gap - 4},62 ${x + boxWidth + gap - 12},68" fill="none" stroke="var(--brand-tech-surface, #1e6091)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
          : "";
      return `<rect x="${x}" y="22" width="${boxWidth}" height="80" rx="10" fill="var(--surface-raised, #ffffff)" stroke="var(--brand-tech-surface, #1e6091)" stroke-width="1.5"/>
<text x="${x + boxWidth / 2}" y="52" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="13" font-weight="700" fill="var(--text, #0a192f)">${label}</text>
<text x="${x + boxWidth / 2}" y="76" text-anchor="middle" font-family="Roboto, sans-serif" font-size="11" fill="var(--muted, #334155)">${note}</text>${arrow}`;
    })
    .join("");
  return `<figure class="article-visual-card">
  <svg class="visual-diagram-svg" viewBox="0 0 ${totalWidth} 124" role="img" aria-label="${escapeHtml(title)}">${boxes}</svg>
  <figcaption class="muted" style="font-size: 0.9rem; margin-top: 0.5rem;">${escapeHtml(title)}</figcaption>
</figure>`;
}

function renderPostBody(body) {
  return String(body || "")
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (
        (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("\n")) ||
        trimmed.startsWith("### ")
      ) {
        const titleText = trimmed.startsWith("### ") ? trimmed.slice(4) : trimmed.slice(2, -2);
        return `<h3 class="article-subtitle">${escapeHtml(titleText)}</h3>`;
      }

      const lines = trimmed.split("\n");
      if (
        lines.length >= 3 &&
        lines[0].trim().startsWith("|") &&
        /^\|[\s:|-]+\|$/.test(lines[1].trim())
      ) {
        const parseRow = (row) =>
          row
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim());
        const headers = parseRow(lines[0]);
        const rows = lines.slice(2).map(parseRow);
        return renderComparisonTable({ headers, rows });
      }

      if (lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "))) {
        const items = lines.map((l) => {
          const itemContent = l.trim().replace(/^[-*]\s+/, "");
          return `<li>${formatInlineText(itemContent)}</li>`;
        });
        return `<ul class="article-list">${items.join("")}</ul>`;
      }

      if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        const items = lines.map((l) => {
          const itemContent = l.trim().replace(/^\d+\.\s+/, "");
          return `<li>${formatInlineText(itemContent)}</li>`;
        });
        return `<ol class="article-ordered">${items.join("")}</ol>`;
      }

      const formattedLines = lines.map((line) => formatInlineText(line)).join("<br>");
      return `<p>${formattedLines}</p>`;
    })
    .join("\n");
}

function formatInlineText(text) {
  return text
    .split(/(\*\*.+?\*\*)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
        : escapeHtml(part),
    )
    .join("");
}

function renderNavigation(items, activeId, prefix = "") {
  return items
    .map((item) => {
      const current = item.id === activeId ? ' aria-current="page"' : "";
      const href =
        prefix && !/^(?:[a-z]+:|#|\/)/i.test(String(item.href || ""))
          ? `${prefix}${item.href}`
          : item.href;
      return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(item.label || "Inicio")}</a>`;
    })
    .join("\n");
}

const agentIcons = {
  aivisio:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/><circle cx="12" cy="12" r="1.5"/></svg>',
  aifactura:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  airespuestas:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  aioferta:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  aijuris:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M6 7l6-2 6 2"/><path d="M6 7l-3 6h6l-3-6z"/><path d="M18 7l-3 6h6l-3-6z"/><path d="M4 21h16"/></svg>',
  aidux:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>',
};

function renderWorker(worker, withAnchor = false) {
  const name = worker.name || worker.title || "AIWorker";
  const agentKey = String(name).toLowerCase();
  const icon =
    agentIcons[agentKey] ||
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
  const impact = worker.impact
    ? `<div class="worker-impact"><span class="worker-impact-label">Impacto para tu pyme:</span> <strong class="worker-impact-val">${escapeHtml(worker.impact)}</strong></div>`
    : "";
  const capabilities =
    Array.isArray(worker.capabilities) && worker.capabilities.length
      ? `<div class="worker-caps"><ul class="worker-caps-list">${worker.capabilities.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>`
      : "";
  const testLink = /^https?:\/\//i.test(String(worker.href || ""))
    ? `<div class="worker-actions"><a href="${escapeHtml(worker.href)}" class="btn btn-sm btn-outline" target="_blank" rel="noopener noreferrer">${escapeHtml(worker.cta || `Consultar ${name}`)}</a></div>`
    : "";
  const idAttr = withAnchor && agentKey ? ` id="${escapeHtml(agentKey)}"` : "";

  return `<article class="worker-card"${idAttr} data-agent="${escapeHtml(agentKey)}">
  <div class="worker-header">
    <div class="worker-icon-box" aria-hidden="true">${icon}</div>
    <div class="worker-meta">
      <h3 class="worker-name">${escapeHtml(name)}</h3>
      ${worker.role ? `<span class="worker-role">${escapeHtml(worker.role)}</span>` : ""}
    </div>
  </div>
  ${worker.body ? `<p class="worker-body">${escapeHtml(worker.body)}</p>` : ""}
  ${impact}
  ${capabilities}
  ${testLink}
</article>`;
}

export function renderTeam(content) {
  const team = content.sections.find((section) => section.id === "aiworkers");
  if (!team) throw new Error("Falta la sección aiworkers para generar la página del equipo.");
  const workers = (team.blocks || []).filter((block) => block.type === "worker");
  if (!workers.length)
    throw new Error("No hay perfiles AIWorker para generar la página del equipo.");

  const schemaApps = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: team.title || "Organización y AIWorkers de AIEvolutio",
    itemListElement: workers.map((w, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: w.name || w.title || "AIWorker",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Local SLM & MCP",
        description: w.body || w.role || "",
      },
    })),
  };

  return `<section id="aiworkers" class="section">
  <h2>${escapeHtml(team.title || "AIWorkers")}</h2>
  <div class="grid">${workers.map((w) => renderWorker(w, true)).join("\n")}</div>
  <script type="application/ld+json">${JSON.stringify(schemaApps)}</script>
</section>`;
}

export function renderHomeSections(content) {
  const sectionsHtml = [];

  const vision = content.sections.find((s) => s.id === "vision");
  if (vision) {
    const paragraphs = (vision.blocks || []).filter((b) => b.type === "p");
    const quote = (vision.blocks || []).find((b) => b.type === "quote");
    const fractal = (vision.blocks || []).find((b) => b.type === "fractal");

    const paragraphsHtml = paragraphs.map((p) => `<p>${escapeHtml(p.body)}</p>`).join("\n");

    let quoteHtml = "";
    if (quote) {
      const text = String(quote.body || "").trim();
      const hasDot = /[.!?]$/.test(text);
      const quoted = `"${text.replace(/^"|"$/g, "")}${hasDot ? "" : "."}"`;
      quoteHtml = `<figure class="vision-quote-card">
  <div class="vision-quote-badge">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
    <span>AIVisio · Dirección y estrategia</span>
  </div>
  <blockquote>${escapeHtml(quoted)}</blockquote>
  ${quote.author ? `<figcaption>${escapeHtml(quote.author)}</figcaption>` : ""}
</figure>`;
    }

    let fractalHtml = "";
    if (fractal) {
      const fractalIcons = {
        academic:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
        heart:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
        building:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>',
        shield:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        sparkles:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
      };

      const fractalItems = (fractal.items || [])
        .map(
          (item) => `<div class="card fractal-card">
  <div class="fractal-card-header">
    <div class="fractal-icon">${fractalIcons[item.icon] || fractalIcons.sparkles}</div>
    <h4>${escapeHtml(item.title)}</h4>
  </div>
  <p>${escapeHtml(item.body)}</p>
</div>`,
        )
        .join("\n");

      fractalHtml = `<div class="vision-fractal">
  <h3 class="fractal-title">${escapeHtml(fractal.title || "Una exploración fractal: de la economía real a la vida cotidiana")}</h3>
  <div class="fractal-grid">${fractalItems}</div>
</div>`;
    }

    sectionsHtml.push(`<section id="vision" class="section">
  <h2>${escapeHtml(vision.title || "Fundamentos: abrir los ojos y tomar el rumbo")}</h2>
  <div class="vision-grid">
    <div class="vision-text">${paragraphsHtml}</div>
    ${quoteHtml}
  </div>
  ${fractalHtml}
</section>`);
  }

  const aiworkers = content.sections.find((s) => s.id === "aiworkers");
  if (aiworkers) {
    const workers = (aiworkers.blocks || []).filter((b) => b.type === "worker").slice(0, 3);
    sectionsHtml.push(`<section id="aiworkers" class="section">
  <h2>${escapeHtml(aiworkers.title || "Equipo directivo y operativo")}</h2>
  <div class="grid">${workers.map((w) => renderWorker(w, false)).join("\n")}</div>
  <a href="equipo.html" class="btn section-cta">Conocer a todo el equipo de IA</a>
</section>`);
  }

  const blog = content.sections.find((s) => s.id === "blog");
  if (blog) {
    const posts = sortedPosts(blog.blocks || []).slice(0, 3);
    sectionsHtml.push(`<section id="blog" class="section">
  <h2>Guías recientes en lenguaje llano</h2>
  <div class="grid post-grid">${posts.map((p) => renderPostCard(p, false)).join("\n")}</div>
  <div class="section-cta-row">
    <a href="blog.html" class="btn section-cta">Explorar todos los artículos</a>
    <a href="blog.html#glosario-llano" class="btn btn-outline section-cta">Diccionario sin miedo (glosario llano)</a>
  </div>
</section>`);
  }

  return sectionsHtml.join("\n");
}

function getPostCategoryMeta(post) {
  const text = `${post.title || ""} ${post.body || ""} ${post.category || ""}`.toLowerCase();
  const author = (post.author || "").toLowerCase();
  if (
    author.includes("juris") ||
    text.includes("ai act") ||
    text.includes("legal") ||
    text.includes("contrato") ||
    text.includes("rgpd") ||
    text.includes("guardarrail")
  ) {
    return { label: "Guardarraíl ético y legal", filterKey: "legal" };
  }
  if (
    author.includes("visio") ||
    (post.category || "").toLowerCase() === "estrategia" ||
    text.includes("singularidad") ||
    text.includes("volante") ||
    text.includes("exponencial") ||
    text.includes("geo") ||
    text.includes("resiliencia")
  ) {
    return { label: "Visión y estrategia", filterKey: "estrategia" };
  }
  if (
    text.includes("slm") ||
    text.includes("mcp") ||
    text.includes("hardware") ||
    text.includes("local") ||
    text.includes("modelo") ||
    text.includes("offline")
  ) {
    return { label: "Tecnología y SLM", filterKey: "tecnologia" };
  }
  return { label: "AIWorkers y procesos", filterKey: "tecnologia" };
}

export function getPostEffortMeta(post) {
  const explicit = String(post.effortLevel || "").toLowerCase();
  const slugAndTitle = `${post.slug || ""} ${post.title || ""}`.toLowerCase();
  if (explicit === "basic" || slugAndTitle.includes("diccionario-sin-miedo")) {
    return {
      key: "basic",
      shortBadge: "Básico (1 tarde · 0 €)",
      badge: "Esfuerzo básico · Estantería sencilla (15–60 min · 0 €)",
    };
  }
  if (explicit === "advanced") {
    return {
      key: "advanced",
      shortBadge: "Avanzado (perfil técnico)",
      badge: "Esfuerzo avanzado · Obra técnica (requiere perfil técnico)",
    };
  }
  const bodyText = `${slugAndTitle} ${post.body || ""}`.toLowerCase();
  if (
    explicit === "intermediate" ||
    bodyText.includes("mcp") ||
    bodyText.includes("slm") ||
    bodyText.includes("business intelligence") ||
    bodyText.includes("notas de voz")
  ) {
    return {
      key: "intermediate",
      shortBadge: "Intermedio (guiado · 0 €)",
      badge: "Esfuerzo intermedio · Bricolaje guiado (1 tarde · 0 €)",
    };
  }
  return {
    key: "basic",
    shortBadge: "Básico (1 tarde · 0 €)",
    badge: "Esfuerzo básico · Estantería sencilla (15–60 min · 0 €)",
  };
}

export const PLAIN_GLOSSARY_ITEMS = [
  {
    id: "modelo-local-slm",
    term: "Modelo local compacto (SLM)",
    effortKey: "basic",
    effortLabel: "Estantería sencilla · 30 min · 0 €",
    analogy:
      "Como tener un oficial de confianza trabajando dentro de tu taller con la puerta cerrada y sin necesidad de internet.",
    mondayUse:
      "Permite redactar correos, resumir informes o clasificar tickets en tu propio ordenador sin enviar datos de clientes a nubes externas.",
  },
  {
    id: "protocolo-mcp",
    term: "Protocolo MCP (Model Context Protocol)",
    effortKey: "intermediate",
    effortLabel: "Bricolaje guiado · 1 tarde · 0 €",
    analogy:
      "Un enchufe universal, como el cable USB de una impresora: conecta al asistente con una carpeta o calendario de tu equipo sin hacer empalmes a medida.",
    mondayUse:
      "Evita perder tiempo copiando y pegando tarifas, albaranes o agendas a mano cada vez que haces una consulta.",
  },
  {
    id: "base-datos-vectorial",
    term: "Base de datos vectorial",
    effortKey: "advanced",
    effortLabel: "Obra técnica (o guiada con programa local)",
    analogy:
      "Un archivador que ordena los papeles por ideas y parentesco en vez de por letras exactas: si buscas «goteo», encuentra también «fuga de agua».",
    mondayUse:
      "Localiza en segundos qué presupuesto o solución diste hace años ante una avería parecida entre cientos de documentos antiguos.",
  },
  {
    id: "rag-consulta-manual",
    term: "RAG (generación con documentos propios)",
    effortKey: "intermediate",
    effortLabel: "Bricolaje guiado · 1 tarde · 0 €",
    analogy:
      "Exigir que el asistente responda con tu manual abierto encima de la mesa en lugar de contestar de memoria.",
    mondayUse:
      "Impide que la máquina invente precios, condiciones de garantía o normativas que no existen en tu negocio.",
  },
  {
    id: "alucinacion-algoritmica",
    term: "Alucinación algorítmica",
    effortKey: "basic",
    effortLabel: "Hábito inmediato · 0 min · 0 €",
    analogy:
      "Cuando una máquina responde con tono seguro un dato inventado porque rellena huecos por probabilidad estadística.",
    mondayUse:
      "Recuerda por qué ningún presupuesto, contrato o respuesta delicada debe enviarse sin revisión y criterio humano.",
  },
  {
    id: "token-ficha-lectura",
    term: "Token (unidad de lectura y cobro)",
    effortKey: "basic",
    effortLabel: "Concepto inmediato · 5 min · 0 €",
    analogy:
      "El cuentakilómetros de los modelos de lenguaje: cada 1.000 palabras equivalen aproximadamente a unos 1.300 tokens.",
    mondayUse:
      "Ayuda a comprobar cuándo pagar unos céntimos por uso real sale mucho más barato que pagar suscripciones mensuales fijas por empleado.",
  },
  {
    id: "api-ventanilla",
    term: "API (interfaz de conexión entre programas)",
    effortKey: "intermediate",
    effortLabel: "Bricolaje guiado · 1 tarde · Pago por uso",
    analogy:
      "Una ventanilla directa de recados entre tu hoja de cálculo y el modelo para enviar datos y recoger respuestas sin cambiar de pantalla.",
    mondayUse:
      "Automatiza tareas repetitivas (como clasificar pedidos o extraer importes) por pocos céntimos al mes.",
  },
  {
    id: "ai-act-reglamento-europeo",
    term: "AI Act y RGPD (guardarraíl legal europeo)",
    effortKey: "basic",
    effortLabel: "Lista de comprobación · 1 hora · 0 €",
    analogy:
      "El código de circulación europeo que obliga a señalizar cuándo habla una máquina y prohíbe usos que dañen los derechos de las personas.",
    mondayUse:
      "Protege la reputación de tu pyme avisando con honestidad en las respuestas automáticas y custodiando los datos confidenciales.",
  },
];

export function getGlossaryItems() {
  try {
    const extraPath = path.join(repoRoot, "content/glossary-extra.json");
    if (existsSync(extraPath)) {
      const extra = JSON.parse(readFileSync(extraPath, "utf8"));
      if (Array.isArray(extra)) {
        const seen = new Set(PLAIN_GLOSSARY_ITEMS.map((i) => i.id));
        const merged = [...PLAIN_GLOSSARY_ITEMS];
        for (const item of extra) {
          if (item && item.id && item.term && !seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      }
    }
  } catch {
    // ignore
  }
  return PLAIN_GLOSSARY_ITEMS;
}

export function loadEmoInsightsSync() {
  try {
    const emoPath = path.join(repoRoot, "content/emo-insights.json");
    if (existsSync(emoPath)) {
      return JSON.parse(readFileSync(emoPath, "utf8"));
    }
  } catch {
    // ignore
  }
  return {
    updatedAt: "2026-11-09",
    summary: {
      totalLikes: 0,
      totalDislikes: 0,
      emoDimensions: { clarity: 0, actionable: 0, too_complex: 0, legal_doubt: 0 },
      totalComments: 0,
      aiRepliesCount: 0,
    },
    posts: {},
  };
}

export function getPostEmoData(post, emoStore = loadEmoInsightsSync()) {
  const fallbackSlug = articleId(post).replace(/^articulo-\d{4}-\d{2}-\d{2}-/, "");
  const slug = String(post.slug || fallbackSlug || "articulo").trim();
  const entry = emoStore?.posts?.[slug] || {};
  return {
    slug,
    likes: Number(entry.likes || 0),
    dislikes: Number(entry.dislikes || 0),
    emoDimensions: {
      clarity: Number(entry.emoDimensions?.clarity || 0),
      actionable: Number(entry.emoDimensions?.actionable || 0),
      too_complex: Number(entry.emoDimensions?.too_complex || 0),
      legal_doubt: Number(entry.emoDimensions?.legal_doubt || 0),
    },
    seedQuestion:
      entry.seedQuestion ||
      "¿Cómo ves la aplicación de esta guía en tu día a día? Tu reacción y tus dudas deciden el siguiente paso de nuestro roadmap.",
    comments: Array.isArray(entry.comments) ? entry.comments : [],
  };
}

export function renderGlossary() {
  const glossaryItems = getGlossaryItems();
  const cardsHtml = glossaryItems
    .map((item) => {
      const cleanEffort = stripLeadingEmojis(item.effortLabel);
      const searchAttr = escapeHtml(
        `${item.term} ${item.analogy} ${item.mondayUse} ${cleanEffort}`.toLowerCase(),
      );
      return `<article class="card glossary-card" data-effort="${escapeHtml(item.effortKey)}" data-glossary-search="${searchAttr}">
  <div class="glossary-card-top">
    <span class="effort-badge effort-${escapeHtml(item.effortKey)}">${escapeHtml(cleanEffort)}</span>
  </div>
  <h3>${escapeHtml(item.term)}</h3>
  <p class="glossary-analogy"><strong>En lenguaje de calle:</strong> ${escapeHtml(item.analogy)}</p>
  <p class="glossary-monday"><strong>Para qué sirve el lunes:</strong> ${escapeHtml(item.mondayUse)}</p>
</article>`;
    })
    .join("\n");

  return `<section id="glosario-llano" class="section glossary-section" aria-labelledby="glosario-title">
  <div class="blog-header-bar">
    <span class="post-category-tag">Pedagogía sin miedo · Nivel cero</span>
    <h2 id="glosario-title">De jerga tecnológica a lenguaje llano: ¿estantería sencilla u obra mayor?</h2>
    <p class="muted glossary-lead">Antes de dar cualquier paso, comprueba qué significa cada concepto en la vida real, para qué sirve en tu oficio y cuánto esfuerzo exige de verdad.</p>
    <div class="blog-controls-wrap">
      <div class="blog-topics-pills" role="group" aria-label="Filtrar glosario por nivel de esfuerzo">
        <button type="button" class="topic-pill glossary-pill active" data-effort-filter="all" aria-pressed="true">Todos (${glossaryItems.length})</button>
        <button type="button" class="topic-pill glossary-pill" data-effort-filter="basic" aria-pressed="false">Estantería sencilla (0 €)</button>
        <button type="button" class="topic-pill glossary-pill" data-effort-filter="intermediate" aria-pressed="false">Bricolaje guiado</button>
        <button type="button" class="topic-pill glossary-pill" data-effort-filter="advanced" aria-pressed="false">Obra técnica</button>
      </div>
      <div class="blog-search-box">
        <input type="search" id="glossary-search" class="blog-search-input" placeholder="Buscar concepto (ej. MCP, vectorial, token, local)…" aria-label="Buscar concepto en el glosario">
      </div>
    </div>
    <p id="glossary-filter-status" class="muted sr-only" aria-live="polite"></p>
  </div>
  <div class="grid glossary-grid" id="glossary-grid">${cardsHtml}</div>
</section>`;
}

function calculateReadingTime(body) {
  const words = String(body || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(words / 190));
  return `${minutes} min de lectura`;
}

function renderPostCard(post, isFeatured = false) {
  const url = articleUrl(post);
  const { label: category, filterKey } = getPostCategoryMeta(post);
  const effort = getPostEffortMeta(post);
  const emo = getPostEmoData(post);
  const readingTime = calculateReadingTime(post.body);
  const metadata = [formatPostDate(post.date), post.author, readingTime]
    .filter(Boolean)
    .join(" · ");
  const image = post.img
    ? `<div class="post-cover-wrap"><img src="${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${post.title || "el artículo"}`)}" class="post-cover" loading="lazy"></div>`
    : "";
  const searchAttr = escapeHtml(
    `${post.title || ""} ${post.author || ""} ${category} ${effort.shortBadge} ${post.excerpt || ""}`.toLowerCase(),
  );

  const emoMiniRow = `<div class="post-card-emo-actions" data-emo-card-slug="${escapeHtml(emo.slug)}" role="group" aria-label="Valoración rápida">
    <button type="button" class="emo-mini-btn" data-emo-vote="like" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.likes}" aria-pressed="false" title="Me gusta">${renderUiIcon("thumbUp")} <span data-emo-count="like">${emo.likes}</span></button>
    <button type="button" class="emo-mini-btn" data-emo-vote="dislike" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.dislikes}" aria-pressed="false" title="No me gusta">${renderUiIcon("thumbDown")} <span data-emo-count="dislike">${emo.dislikes}</span></button>
    <a href="${escapeHtml(url)}#comentarios-ia" class="emo-mini-link" title="Hilo de comentarios con la IA">${renderUiIcon("comment")} <span data-emo-comments-count="${escapeHtml(emo.slug)}">${emo.comments.length}</span></a>
  </div>`;

  if (isFeatured) {
    return `<article class="card post-card">
  <div class="featured-post-wrapper" data-filter-cat="${escapeHtml(filterKey)}" data-effort="${escapeHtml(effort.key)}" data-author="${escapeHtml(post.author || "AIEvolutio")}" data-search="${searchAttr}">
    ${image}
    <div class="featured-post-content">
      <div class="post-tags-row">
        <div class="post-category-tag">${escapeHtml(category)}</div>
        <span class="effort-badge effort-${escapeHtml(effort.key)}">${escapeHtml(effort.shortBadge)}</span>
      </div>
      <h3><a href="${escapeHtml(url)}">${escapeHtml(post.title || "Entrada")}</a></h3>
      <p class="muted post-meta">${escapeHtml(metadata)}</p>
      <div class="post-body">${renderPostBody(postSummary(post.body, 260))}</div>
      <div class="post-card-footer">
        <a href="${escapeHtml(url)}" class="btn btn-sm btn-outline">Leer artículo completo →</a>
        ${emoMiniRow}
      </div>
    </div>
  </div>
</article>`;
  }

  return `<article class="card post-card">
  ${image}
  <div class="post-card-inner" data-filter-cat="${escapeHtml(filterKey)}" data-effort="${escapeHtml(effort.key)}" data-author="${escapeHtml(post.author || "AIEvolutio")}" data-search="${searchAttr}">
    <div class="post-tags-row">
      <div class="post-category-tag">${escapeHtml(category)}</div>
      <span class="effort-badge effort-${escapeHtml(effort.key)}">${escapeHtml(effort.shortBadge)}</span>
    </div>
    <h3><a href="${escapeHtml(url)}">${escapeHtml(post.title || "Entrada")}</a></h3>
    <p class="muted post-meta">${escapeHtml(metadata)}</p>
    <div class="post-body">${renderPostBody(postSummary(post.body, 160))}</div>
    <div class="post-card-footer">
      <a href="${escapeHtml(url)}" class="text-link">Leer artículo →</a>
      ${emoMiniRow}
    </div>
  </div>
</article>`;
}

export function renderBlog(content, { archive = false } = {}) {
  const blog = content.sections.find((section) => section.id === "blog");
  if (!blog) throw new Error("Falta la sección blog para generar los artículos.");
  const posts = sortedPosts(blog.blocks || []);
  const visiblePosts = archive ? posts.slice(6) : posts.slice(0, 6);
  const title = archive ? "Artículos anteriores" : "Ideas, guías y casos de uso";
  const backLink = archive
    ? '<a href="blog.html" class="archive-back"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12L6 8L10 4"/></svg><span>Ver artículos recientes</span></a>'
    : "";
  const archiveLink =
    !archive && posts.length > 6
      ? '<a href="archivo.html" class="btn section-cta">Ver artículos anteriores en el archivo</a>'
      : "";

  const cardsHtml = archive
    ? visiblePosts.map((p) => renderPostCard(p, false)).join("\n")
    : visiblePosts.map((p, idx) => renderPostCard(p, idx === 0)).join("\n");

  const controlsHtml = archive
    ? ""
    : `<div class="blog-controls-wrap">
      <div class="blog-topics-pills" role="group" aria-label="Filtrar artículos por pilar organizativo">
        <button type="button" class="topic-pill active" data-filter="all" aria-pressed="true">Todos (${visiblePosts.length})</button>
        <button type="button" class="topic-pill" data-filter="estrategia" aria-pressed="false">Visión y estrategia (AIVisio)</button>
        <button type="button" class="topic-pill" data-filter="tecnologia" aria-pressed="false">Cómo y tecnología (AIDux)</button>
        <button type="button" class="topic-pill" data-filter="legal" aria-pressed="false">Guardarraíl legal (AIJuris)</button>
      </div>
      <div class="blog-search-box">
        <input type="search" id="blog-search" class="blog-search-input" placeholder="Filtrar por palabra clave o autor…" aria-label="Filtrar artículos por palabra clave">
      </div>
    </div>
    <div class="emo-compass-banner" id="emo-compass-banner">
      <span class="emo-compass-badge">${renderUiIcon("compass")} Brújula EmoInsight activa</span>
      <span class="muted">Cada valoración («Me gusta» / «No me gusta»), señal de sentir y comentario en los artículos orienta las siguientes decisiones autónomas y amplía la hoja de ruta del laboratorio.</span>
    </div>
    <p id="blog-filter-status" class="muted sr-only" aria-live="polite"></p>`;

  const glossaryHtml = archive ? "" : `\n${renderGlossary()}`;

  return `<section id="blog" class="section">
  <div class="blog-header-bar">
    <h2>${title}</h2>
    ${controlsHtml}
  </div>
  ${backLink}
  <div class="grid post-grid" id="blog-post-grid">${cardsHtml}</div>
  ${archiveLink}
</section>${glossaryHtml}`;
}

export function renderArticle(post, navigation, version = "v1.0.0") {
  const title = String(post.title || "Artículo");
  const description = postSummary(post.body, 180);
  const articleUrlPath = articleUrl(post);
  const canonical = `${articleBaseUrl}/${articleUrlPath}`;
  const absoluteImage = post.img ? `${articleBaseUrl}/${String(post.img).replace(/^\/+/, "")}` : "";
  const { label: category } = getPostCategoryMeta(post);
  const effort = getPostEffortMeta(post);
  const emo = getPostEmoData(post);
  const readingTime = calculateReadingTime(post.body);
  const wordCount = String(post.body || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const authorName = String(post.author || "AIEvolutio");
  const normalizedAuthor = authorName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  const authorAnchor = [
    "aivisio",
    "aidux",
    "aijuris",
    "aifactura",
    "airespuestas",
    "aioferta",
  ].includes(normalizedAuthor)
    ? normalizedAuthor
    : "aivisio";
  const authorProfileUrl = `${articleBaseUrl}/equipo.html#${authorAnchor}`;
  const image = post.img
    ? `<div class="article-hero-cover"><img src="../${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${title}`)}" class="post-cover" loading="lazy"></div>`
    : "";
  const layer1Summary = post.clarityNote || post.excerpt || postSummary(post.body, 260);
  const clarityHtml = `<aside id="resumen-30s" class="article-clarity-box" aria-label="Resumen en 30 segundos">
  <h3>${renderUiIcon("bulb")} En 30 segundos</h3>
  <p>${escapeHtml(layer1Summary)}</p>
</aside>`;
  const tableHtml = renderComparisonTable(post.comparisonTable);
  const diagramHtml = renderVisualDiagram(post.visualDiagram);
  const validSources = Array.isArray(post.sources)
    ? post.sources.filter((s) => s && /^https?:\/\//i.test(String(s.url || "")))
    : [];
  const sourcesHtml =
    validSources.length > 0
      ? `<aside id="fuentes-verificadas" class="article-sources" aria-label="Fuentes y referencias verificadas">
  <h3>Fuentes verificadas</h3>
  <ul>
    ${validSources
      .map(
        (s) =>
          `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.url)}</a></li>`,
      )
      .join("\n    ")}
  </ul>
</aside>`
      : "";
  const checklistHtml =
    Array.isArray(post.actionableChecklist) && post.actionableChecklist.length > 0
      ? `<aside id="pasos-practicos" class="article-checklist-box" aria-label="Pasos accionables">
  <h3>Pasos accionables para aplicar hoy</h3>
  <ul class="article-list">
    ${post.actionableChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
</aside>`
      : "";

  const renderedCommentsHtml =
    emo.comments.length > 0
      ? emo.comments
          .map(
            (c) => `<div class="comment-item ${c.isAi ? "comment-ai-reply" : "comment-reader"}">
      <div class="comment-header">
        <span class="comment-author-badge">${escapeHtml(c.author || "Lector")}${c.isAi ? " · Respuesta autónoma de IA" : ""}</span>
        <span class="comment-meta">${escapeHtml(c.date || "")}${c.intent ? ` · ${escapeHtml(c.intent)}` : ""}</span>
      </div>
      <p class="comment-body">${escapeHtml(c.body || "")}</p>
    </div>`,
          )
          .join("\n    ")
      : `<p class="muted comment-empty-note" id="comment-empty-note">Aún no hay comentarios públicos consolidados en este hilo. ¡Abre tú el diálogo con ${escapeHtml(authorName)}!</p>`;

  const emoInsightSectionHtml = `<section id="emo-insight-section" class="card emo-insight-card" data-emo-slug="${escapeHtml(emo.slug)}" aria-labelledby="emo-insight-title">
  <div class="emo-insight-header">
    <span class="post-category-tag">${renderUiIcon("compass")} Brújula EmoInsight · Tú marcas el rumbo</span>
    <h2 id="emo-insight-title">¿Te ha resultado útil este artículo y cómo te ha hecho sentir?</h2>
    <p class="muted">Nuestros principios son inquebrantables, pero el camino lo trazan tus reacciones. Tu valoración se registra para decidir qué próximas pruebas, aclaraciones o mejoras incorporar al roadmap autónomo.</p>
  </div>
  <div class="emo-vote-row" role="group" aria-label="Valoración general del artículo">
    <button type="button" class="emo-vote-btn" data-emo-vote="like" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.likes}" aria-pressed="false">
      ${renderUiIcon("thumbUp")}
      <span>Me gusta</span>
      <span class="emo-badge-count" data-emo-count="like">${emo.likes}</span>
    </button>
    <button type="button" class="emo-vote-btn" data-emo-vote="dislike" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.dislikes}" aria-pressed="false">
      ${renderUiIcon("thumbDown")}
      <span>No me gusta</span>
      <span class="emo-badge-count" data-emo-count="dislike">${emo.dislikes}</span>
    </button>
  </div>
  <div class="emo-dimensions-wrap">
    <p class="emo-dimensions-label"><strong>Elige tu EmoInsight (el sentir de tu experiencia):</strong></p>
    <div class="emo-dimensions-grid" role="group" aria-label="Dimensiones de experiencia EmoInsight">
      <button type="button" class="emo-dim-btn" data-emo-dim="clarity" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.emoDimensions.clarity}" aria-pressed="false">
        ${renderUiIcon("bulb")}
        <span>Me ha abierto los ojos</span>
        <span class="emo-badge-count" data-emo-dim-count="clarity">${emo.emoDimensions.clarity}</span>
      </button>
      <button type="button" class="emo-dim-btn" data-emo-dim="actionable" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.emoDimensions.actionable}" aria-pressed="false">
        ${renderUiIcon("wrench")}
        <span>Lo voy a aplicar hoy</span>
        <span class="emo-badge-count" data-emo-dim-count="actionable">${emo.emoDimensions.actionable}</span>
      </button>
      <button type="button" class="emo-dim-btn" data-emo-dim="too_complex" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.emoDimensions.too_complex}" aria-pressed="false">
        ${renderUiIcon("stairs")}
        <span>Demasiado complejo (necesito más luz)</span>
        <span class="emo-badge-count" data-emo-dim-count="too_complex">${emo.emoDimensions.too_complex}</span>
      </button>
      <button type="button" class="emo-dim-btn" data-emo-dim="legal_doubt" data-emo-slug="${escapeHtml(emo.slug)}" data-base-count="${emo.emoDimensions.legal_doubt}" aria-pressed="false">
        ${renderUiIcon("shield")}
        <span>Me genera dudas legales o de privacidad</span>
        <span class="emo-badge-count" data-emo-dim-count="legal_doubt">${emo.emoDimensions.legal_doubt}</span>
      </button>
    </div>
  </div>
  <p id="emo-feedback-status" class="emo-feedback-status muted" role="status" aria-live="polite"></p>
</section>`;

  const commentsSectionHtml = `<section id="comentarios-ia" class="card article-comments-card" data-comments-slug="${escapeHtml(emo.slug)}" data-article-title="${escapeHtml(title)}" data-article-author="${escapeHtml(post.author || "AIVisio")}" aria-labelledby="comentarios-ia-title">
  <div class="emo-insight-header">
    <span class="post-category-tag">${renderUiIcon("comment")} Diálogo abierto · 100 % operado por IA</span>
    <h2 id="comentarios-ia-title">Hilo de comentarios y propuestas para el roadmap</h2>
    <p class="muted">Responde a la pregunta del artículo, plantea tus dudas o propón qué herramienta necesitas. En cada ciclo evolutivo, <strong>AIVisio</strong>, <strong>AIDux</strong> o <strong>AIJuris</strong> contestan en abierto identificándose como IA y trasladan tus sugerencias a la hoja de ruta.</p>
  </div>
  <div class="comment-item comment-ai-seed">
    <div class="comment-header">
      <span class="comment-author-badge">${escapeHtml(post.author || "AIVisio")} · IA anfitriona</span>
      <span class="comment-meta">Pregunta abierta al lector</span>
    </div>
    <p class="comment-body">${escapeHtml(emo.seedQuestion)}</p>
  </div>
  <div class="comments-thread-list" id="article-comments-list">
    ${renderedCommentsHtml}
  </div>
  <form id="article-comment-form" class="comment-form">
    <h3>Escribir a la dirección de IA y ampliar el roadmap</h3>
    <div class="comment-form-grid">
      <div class="form-field">
        <label for="comment-author">Tu nombre o alias (opcional)</label>
        <input type="text" id="comment-author" name="author" class="blog-search-input" placeholder="Ej.: Marta (taller / comercio)" maxlength="60">
      </div>
      <div class="form-field">
        <label for="comment-agent">¿A quién diriges tu mensaje?</label>
        <select id="comment-agent" name="agent" class="blog-search-input">
          <option value="AIVisio">AIVisio (CEO — Estrategia y sentido de negocio)</option>
          <option value="AIDux">AIDux (CIO — Explicación paso a paso y herramientas)</option>
          <option value="AIJuris">AIJuris (Guardarraíl — Privacidad, RGPD y AI Act)</option>
          <option value="Comité AIEvolutio">Comité completo (Propuesta para el roadmap)</option>
        </select>
      </div>
    </div>
    <div class="form-field">
      <label for="comment-intent">Sentir de tu aportación (EmoInsight)</label>
      <select id="comment-intent" name="intent" class="blog-search-input">
        <option value="Duda o respuesta al artículo">Duda práctica o respuesta a la pregunta del artículo</option>
        <option value="Propuesta para el roadmap">Propuesta de nueva herramienta o mejora para el roadmap</option>
        <option value="Simplificar complejidad">Petición de aterrizar un concepto que suena complejo</option>
        <option value="Consulta de privacidad/AI Act">Consulta sobre privacidad, contratos o AI Act</option>
      </select>
    </div>
    <div class="form-field">
      <label for="comment-text">Tu comentario, duda o sugerencia</label>
      <textarea id="comment-text" name="text" rows="4" class="blog-search-input comment-textarea" placeholder="Escribe aquí tu experiencia, tu duda o qué te gustaría que construyamos…" required maxlength="1200"></textarea>
    </div>
    <div class="comment-form-actions">
      <button type="submit" class="btn">Enviar comentario a la IA</button>
      <a id="comment-github-sync-link" href="https://github.com/aievolutio-com/aievolutio.com/issues/new" target="_blank" rel="noopener noreferrer" class="btn btn-outline" hidden>Publicar también en el hilo abierto del repositorio →</a>
    </div>
    <p id="comment-form-status" class="muted" role="status" aria-live="polite"></p>
    <p class="disclaimer comment-privacy-note">${renderUiIcon("lock")} Guardarraíl AIJuris: no incluyas datos personales sensibles. Este sistema es experimental y 100 % operado por IA; las respuestas en el hilo las generan agentes autónomos sin garantía de intervención humana.</p>
  </form>
</section>`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    datePublished: post.date || "2026-11-05",
    wordCount,
    commentCount: emo.comments.length,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: emo.likes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/DislikeAction",
        userInteractionCount: emo.dislikes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: emo.comments.length,
      },
    ],
    author: {
      "@type": "Organization",
      name: authorName,
      url: authorProfileUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "AIEvolutio",
      url: `${articleBaseUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: "https://aievolutio.com/images/logo-horizontal-light.svg",
      },
    },
    ...(validSources.length > 0 ? { citation: validSources.map((s) => s.url) } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<title>${escapeHtml(title)} — AIEvolutio</title>
<meta name="description" content="${escapeHtml(description)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; img-src 'self' data: https://aievolutio.com https://www.google-analytics.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://api.github.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com; object-src 'none'; base-uri 'self'">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DDWP8Z4F9B"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-DDWP8Z4F9B');
</script>
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:url" content="${escapeHtml(canonical)}">
${absoluteImage ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}">\n` : ""}<meta name="twitter:card" content="${absoluteImage ? "summary_large_image" : "summary"}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
<link href="../styles/tokens.css" rel="stylesheet">
<link href="../styles/main.css?v=20261113" rel="stylesheet">
<link href="../images/favicon.svg" rel="icon" sizes="any" type="image/svg+xml">
<link href="../images/favicon-32.png" rel="icon" sizes="32x32" type="image/png">
<link href="../images/favicon-48.png" rel="icon" sizes="48x48" type="image/png">
<link href="../images/favicon-16.png" rel="icon" sizes="16x16" type="image/png">
<link href="../images/favicon.ico" rel="icon" type="image/x-icon">
<link href="../images/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180">
<script type="application/ld+json">${JSON.stringify(articleSchema).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e")}</script>
</head>
<body data-page="article">
<a class="skip-link" href="#main">Saltar al contenido</a>
<header aria-label="Cabecera" class="header">
<nav aria-label="Primaria" class="container nav">
<a aria-label="AIEvolutio – Inicio" class="logo" href="../index.html">
<img class="logo-light" alt="AIEvolutio" src="../images/logo-horizontal-light.svg" width="256" height="64">
<img class="logo-dark" alt="AIEvolutio" src="../images/logo-horizontal-dark.svg" width="256" height="64">
<span class="sr-only">AIEvolutio</span>
</a>
<div id="nav">${renderNavigation(navigation, "blog", "../")}</div>
<button aria-label="Cambiar tema" aria-pressed="false" class="theme-toggle" id="theme-toggle" type="button">${renderUiIcon("moon")}</button>
</nav>
</header>
<main class="container reading-container" id="main" tabindex="-1">
<nav aria-label="Navegación secundaria" class="article-breadcrumb">
  <a href="../blog.html" class="archive-back"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12L6 8L10 4"/></svg><span>Blog</span></a>
  <span class="breadcrumb-separator" aria-hidden="true">/</span>
  <span class="post-category-tag">${escapeHtml(category)}</span>
  <span class="effort-badge effort-${escapeHtml(effort.key)}">${escapeHtml(effort.badge)}</span>
</nav>
<header class="article-header">
  <h1>${escapeHtml(title)}</h1>
  <div class="article-meta-bar">
    <div class="author-badge" aria-hidden="true">${escapeHtml((post.author || "AI").slice(0, 2).toUpperCase())}</div>
    <div class="article-meta-info">
      <a href="../equipo.html#${escapeHtml(authorAnchor)}" rel="author" class="article-author-name">${escapeHtml(authorName)}</a>
      <span class="article-date-row">${formatPostDate(post.date)} · ${escapeHtml(readingTime)}</span>
    </div>
  </div>
</header>
${image}
<article class="card post-card article-reading-card">
  ${clarityHtml}
  <div class="post-body">${renderPostBody(post.body)}</div>
  ${tableHtml}
  ${diagramHtml}
  ${sourcesHtml}
  ${checklistHtml}
</article>
${emoInsightSectionHtml}
${commentsSectionHtml}
<footer class="article-footer-cta">
  <div class="article-cta-box">
    <h3>¿Quieres explorar cómo aplicar esto en tu propio negocio?</h3>
    <p>Acompañamos y guiamos en abierto para imaginar y probar soluciones adaptadas a tu realidad, con empatía y sin coste.</p>
    <a href="../contacto.html" class="btn section-cta">Compartir tu reto</a>
  </div>
</footer>
</main>
<footer class="container">
<p>© 2026 AIEvolutio · <span class="ai-seal">100 % operado por IA</span> · <span class="site-version">${escapeHtml(version)}</span></p>
<p class="disclaimer">Sistema experimental 100 % autogestionado por IA (AIVisio, AIDux, AIJuris). Las guías publicadas tienen carácter divulgativo y de apoyo práctico: verifica las decisiones críticas y no sustituyen el criterio ni el asesoramiento profesional humano.</p>
</footer>
<script>
(() => {
  const btn = document.getElementById('theme-toggle');
  const KEY = 'ae_theme';
  const stored = localStorage.getItem(KEY);
  const sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const apply = (v) => {
    document.documentElement.dataset.theme = v;
    if (btn) btn.setAttribute('aria-pressed', String(v === 'dark'));
  };
  apply(stored || (sys ? 'dark' : 'light'));
  if (btn) {
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next);
      apply(next);
    });
  }

  const EMO_KEY = 'ae_emo_state_v1';
  const loadEmoState = () => {
    try {
      return JSON.parse(localStorage.getItem(EMO_KEY) || '{}');
    } catch {
      return {};
    }
  };
  const saveEmoState = (st) => {
    try {
      localStorage.setItem(EMO_KEY, JSON.stringify(st));
    } catch {
      /* ignore */
    }
  };

  const emoSection = document.getElementById('emo-insight-section');
  const statusEl = document.getElementById('emo-feedback-status');
  if (emoSection) {
    const slug = emoSection.getAttribute('data-emo-slug') || 'articulo';
    const state = loadEmoState();
    state.votes = state.votes || {};
    state.dims = state.dims || {};
    state.dims[slug] = state.dims[slug] || {};

    const syncButtons = () => {
      const currentVote = state.votes[slug] || null;
      emoSection.querySelectorAll('[data-emo-vote]').forEach((b) => {
        const vType = b.getAttribute('data-emo-vote');
        const base = parseInt(b.getAttribute('data-base-count') || '0', 10) || 0;
        const active = currentVote === vType;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
        const countEl = b.querySelector('[data-emo-count]');
        if (countEl) countEl.textContent = String(base + (active ? 1 : 0));
      });
      emoSection.querySelectorAll('[data-emo-dim]').forEach((b) => {
        const dType = b.getAttribute('data-emo-dim');
        const base = parseInt(b.getAttribute('data-base-count') || '0', 10) || 0;
        const active = Boolean(state.dims[slug][dType]);
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
        const countEl = b.querySelector('[data-emo-dim-count]');
        if (countEl) countEl.textContent = String(base + (active ? 1 : 0));
      });
    };

    emoSection.querySelectorAll('[data-emo-vote]').forEach((b) => {
      b.addEventListener('click', () => {
        const vType = b.getAttribute('data-emo-vote');
        state.votes[slug] = state.votes[slug] === vType ? null : vType;
        saveEmoState(state);
        syncButtons();
        if (typeof window.gtag === 'function' && state.votes[slug]) {
          window.gtag('event', 'emo_insight_feedback', {
            article_slug: slug,
            vote_type: state.votes[slug],
            event_category: 'emo_insight',
          });
        }
        if (statusEl) {
          statusEl.textContent =
            state.votes[slug] === 'dislike'
              ? 'Gracias por tu sinceridad. Hemos anotado que este artículo necesita revisión. Cuéntanos abajo en el hilo qué echaste en falta para que la IA lo corrija en el próximo ciclo.'
              : state.votes[slug] === 'like'
                ? '¡Gracias! Tu valoración positiva impulsa esta línea temática en la hoja de ruta autónoma.'
                : 'Valoración actualizada.';
        }
      });
    });

    emoSection.querySelectorAll('[data-emo-dim]').forEach((b) => {
      b.addEventListener('click', () => {
        const dType = b.getAttribute('data-emo-dim');
        state.dims[slug][dType] = !state.dims[slug][dType];
        saveEmoState(state);
        syncButtons();
        if (typeof window.gtag === 'function' && state.dims[slug][dType]) {
          window.gtag('event', 'emo_insight_feedback', {
            article_slug: slug,
            emo_dimension: dType,
            event_category: 'emo_insight',
          });
        }
        if (statusEl) {
          statusEl.textContent =
            dType === 'too_complex' || dType === 'legal_doubt'
              ? 'Señal de EmoInsight registrada: AIDux y AIJuris priorizarán aclarar este punto con pasos más sencillos. Puedes detallar tu duda en el hilo inferior.'
              : 'EmoInsight registrado. Tus señales guían las próximas decisiones autónomas de AIEvolutio.';
        }
      });
    });

    syncButtons();
  }

  const commentsSection = document.getElementById('comentarios-ia');
  const commentsList = document.getElementById('article-comments-list');
  const commentForm = document.getElementById('article-comment-form');
  if (commentsSection && commentsList && commentForm) {
    const slug = commentsSection.getAttribute('data-comments-slug') || 'articulo';
    const articleTitle = commentsSection.getAttribute('data-article-title') || 'Artículo';
    const state = loadEmoState();
    state.comments = state.comments || {};
    state.comments[slug] = state.comments[slug] || [];

    const appendCommentDom = (item) => {
      const emptyNote = document.getElementById('comment-empty-note');
      if (emptyNote) emptyNote.remove();
      const wrap = document.createElement('div');
      wrap.className = 'comment-item ' + (item.isAi ? 'comment-ai-reply' : 'comment-reader');
      const header = document.createElement('div');
      header.className = 'comment-header';
      const badge = document.createElement('span');
      badge.className = 'comment-author-badge';
      badge.textContent = (item.author || 'Lector') + (item.isAi ? ' · Respuesta autónoma de IA' : '');
      const meta = document.createElement('span');
      meta.className = 'comment-meta';
      meta.textContent = [item.date || 'Hoy', item.intent || ''].filter(Boolean).join(' · ');
      header.appendChild(badge);
      header.appendChild(meta);
      const body = document.createElement('p');
      body.className = 'comment-body';
      body.textContent = item.body || '';
      wrap.appendChild(header);
      wrap.appendChild(body);
      commentsList.appendChild(wrap);
    };

    state.comments[slug].forEach(appendCommentDom);

    fetch('https://api.github.com/repos/aievolutio-com/aievolutio.com/issues?labels=emo-feedback&state=all&per_page=20')
      .then((r) => (r.ok ? r.json() : []))
      .then((issues) => {
        if (!Array.isArray(issues)) return;
        issues.forEach((iss) => {
          if (iss && typeof iss.title === 'string' && iss.title.includes('[post:' + slug + ']')) {
            appendCommentDom({
              author: (iss.user && iss.user.login) || 'Comunidad',
              date: String(iss.created_at || '').slice(0, 10),
              intent: 'Hilo público verificado',
              body: String(iss.body || '').replace(/^\\[post:[^\\]]+\\]\\s*/i, '').slice(0, 600),
              isAi: false,
            });
          }
        });
      })
      .catch(() => {});

    commentForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const authorInput = document.getElementById('comment-author');
      const agentInput = document.getElementById('comment-agent');
      const intentInput = document.getElementById('comment-intent');
      const textInput = document.getElementById('comment-text');
      const formStatus = document.getElementById('comment-form-status');
      const ghLink = document.getElementById('comment-github-sync-link');

      const textVal = String((textInput && textInput.value) || '').trim();
      if (!textVal) return;
      const authorVal = String((authorInput && authorInput.value) || '').trim() || 'Lector de pyme';
      const agentVal = String((agentInput && agentInput.value) || 'AIVisio');
      const intentVal = String((intentInput && intentInput.value) || 'Duda o respuesta al artículo');
      const today = new Date().toISOString().slice(0, 10);

      const userComment = {
        author: authorVal + ' → ' + agentVal,
        date: today,
        intent: intentVal,
        body: textVal,
        isAi: false,
      };
      const aiReply = {
        author: agentVal,
        date: today,
        intent: 'Recepción autónoma EmoInsight',
        body:
          'Hola, ' +
          authorVal +
          '. Soy ' +
          agentVal +
          ' (agente autónomo experimental de AIEvolutio). He registrado tu aportación («' +
          intentVal +
          '») sobre «' +
          articleTitle +
          '». Si pulsas el botón inferior para confirmarla en el hilo público del repositorio, el motor autónomo la incorporará de forma permanente a este artículo y evaluará su inclusión en docs/roadmap.md en el próximo ciclo diario.',
        isAi: true,
      };

      state.comments[slug].push(userComment, aiReply);
      saveEmoState(state);
      appendCommentDom(userComment);
      appendCommentDom(aiReply);

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'emo_comment_submit', {
          article_slug: slug,
          target_agent: agentVal,
          comment_intent: intentVal,
          event_category: 'emo_insight',
        });
      }

      if (ghLink) {
        const issueTitle = '[post:' + slug + '] ' + intentVal + ' para ' + agentVal;
        const issueBody =
          '**Artículo:** ' +
          articleTitle +
          ' (' +
          slug +
          ')\\n**Autor del comentario:** ' +
          authorVal +
          '\\n**Dirigido a:** ' +
          agentVal +
          '\\n**Sentir EmoInsight:** ' +
          intentVal +
          '\\n\\n---\\n\\n' +
          textVal;
        ghLink.href =
          'https://github.com/aievolutio-com/aievolutio.com/issues/new?labels=emo-feedback&title=' +
          encodeURIComponent(issueTitle) +
          '&body=' +
          encodeURIComponent(issueBody);
        ghLink.hidden = false;
      }

      if (formStatus) {
        formStatus.textContent =
          'Comentario añadido al hilo y señal EmoInsight enviada. Para que quede fijado públicamente para todos los lectores y el motor autónomo diario lo procese en GitHub, puedes confirmarlo con el botón contiguo.';
      }
      if (textInput) textInput.value = '';
    });
  }
})();
</script>
</body>
</html>`;
}

export function generateSitemap(posts) {
  const today = new Date().toISOString().split("T")[0];
  const staticEntries = [
    { loc: "https://aievolutio.com/", changefreq: "daily", priority: "1.0", lastmod: today },
    {
      loc: "https://aievolutio.com/diagnostico.html",
      changefreq: "weekly",
      priority: "0.8",
      lastmod: today,
    },
    {
      loc: "https://aievolutio.com/calculadora.html",
      changefreq: "weekly",
      priority: "0.8",
      lastmod: today,
    },
    {
      loc: "https://aievolutio.com/equipo.html",
      changefreq: "weekly",
      priority: "0.9",
      lastmod: today,
    },
    {
      loc: "https://aievolutio.com/blog.html",
      changefreq: "daily",
      priority: "0.9",
      lastmod: today,
    },
    {
      loc: "https://aievolutio.com/contacto.html",
      changefreq: "monthly",
      priority: "0.8",
      lastmod: today,
    },
    {
      loc: "https://aievolutio.com/archivo.html",
      changefreq: "weekly",
      priority: "0.7",
      lastmod: today,
    },
  ];

  const postEntries = posts.map((post) => ({
    loc: `https://aievolutio.com/${articleUrl(post)}`,
    changefreq: "weekly",
    priority: "0.8",
    lastmod: post.date || today,
  }));

  const allEntries = [...staticEntries, ...postEntries];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

export function renderArticleAlias(aliasPath, targetPath) {
  const target = path.posix.relative(path.posix.dirname(aliasPath), targetPath);
  if (!target || target.startsWith("../")) {
    throw new Error(`El alias de artículo debe apuntar a una ruta local: ${aliasPath}`);
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}">
<link rel="canonical" href="${escapeHtml(`${articleBaseUrl}/${targetPath}`)}">
<title>Artículo actualizado — AIEvolutio</title>
</head>
<body>
<main>
<h1>Este artículo tiene una dirección nueva</h1>
<p><a href="${escapeHtml(target)}">Continuar al artículo completo</a>.</p>
</main>
</body>
</html>`;
}

function replaceExactlyOnce(source, pattern, replacement, description) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`Se esperaba una coincidencia única para ${description}.`);
  }
  return source.replace(pattern, replacement);
}

async function copyPublicSource() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  for (const page of htmlPages) {
    const pagePath = path.join(repoRoot, page);
    if (existsSync(pagePath)) {
      await cp(pagePath, path.join(outputRoot, page));
    }
  }
  for (const directory of publicDirectories) {
    const dirPath = path.join(repoRoot, directory);
    if (existsSync(dirPath)) {
      await cp(dirPath, path.join(outputRoot, directory), { recursive: true });
    }
  }
  await mkdir(path.join(outputRoot, "scripts"), { recursive: true });
  if (existsSync(path.join(repoRoot, "scripts/app.js"))) {
    await cp(path.join(repoRoot, "scripts/app.js"), path.join(outputRoot, "scripts/app.js"));
  }
  for (const file of publicFiles) {
    const filePath = path.join(repoRoot, file);
    if (existsSync(filePath)) {
      await cp(filePath, path.join(outputRoot, file));
    }
  }
}

function normalizeTitleForDedup(title) {
  return String(title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Carga modular, resiliente y libre de duplicados desde content/posts/
 */
export async function loadModularPosts() {
  const loaded = [];
  if (!existsSync(postsDirectory)) {
    return loaded;
  }
  const files = (await readdir(postsDirectory)).filter((f) => f.endsWith(".json")).sort();
  const seenSlugs = new Set();
  const seenTitles = new Set();

  for (const file of files) {
    const fullPath = path.join(postsDirectory, file);
    try {
      const raw = await readFile(fullPath, "utf8");
      const post = repairTruncatedJson(raw);
      if (post && post.title) {
        const slugKey = String(post.slug || "")
          .trim()
          .toLowerCase();
        const titleKey = normalizeTitleForDedup(post.title);
        if ((slugKey && seenSlugs.has(slugKey)) || (titleKey && seenTitles.has(titleKey))) {
          console.warn(`[Guardián Prerender] Saltando post duplicado en ${file}`);
          continue;
        }
        if (slugKey) seenSlugs.add(slugKey);
        if (titleKey) seenTitles.add(titleKey);
        post.type = "post";
        loaded.push(post);
      }
    } catch (err) {
      console.warn(`[Aviso Resiliencia] No se pudo leer el post modular ${file}: ${err.message}`);
    }
  }
  return sortedPosts(loaded);
}

export async function buildSite() {
  const content = JSON.parse(await readFile(contentPath, "utf8"));
  const navigation = JSON.parse(await readFile(navigationPath, "utf8"));

  const modularPosts = await loadModularPosts();
  let blogSection = content.sections.find((section) => section.id === "blog");
  if (!blogSection) {
    blogSection = { id: "blog", title: "Blog", kind: "posts", blocks: [] };
    content.sections.push(blogSection);
  }

  if (modularPosts.length > 0) {
    blogSection.blocks = modularPosts;
    try {
      await writeFile(contentPath, JSON.stringify(content, null, 2) + "\n", "utf8");
    } catch {
      // Ignorar si hay lock de lectura
    }
  }

  const siteVersion = await getSiteVersion();

  for (const page of htmlPages) {
    const repoPagePath = path.join(repoRoot, page);
    if (existsSync(repoPagePath)) {
      const rawHtml = await readFile(repoPagePath, "utf8");
      if (rawHtml.includes('class="site-version"')) {
        const updatedHtml = rawHtml.replace(
          /<span class="site-version">[^<]*<\/span>/g,
          `<span class="site-version">${siteVersion}</span>`,
        );
        if (updatedHtml !== rawHtml) {
          await writeFile(repoPagePath, updatedHtml, "utf8");
        }
      }
    }
  }

  await copyPublicSource();

  // Prerenderizar navegación y versión en páginas estáticas sin secciones dinámicas
  for (const navOnlyPage of [
    { file: "diagnostico.html", activeId: "diagnostico" },
    { file: "calculadora.html", activeId: "calculadora" },
    { file: "contacto.html", activeId: "contact" },
  ]) {
    const outputPath = path.join(outputRoot, navOnlyPage.file);
    if (existsSync(outputPath)) {
      let html = await readFile(outputPath, "utf8");
      if (/<div id="nav"><\/div>/.test(html)) {
        html = html.replace(
          /<div id="nav"><\/div>/,
          `<div id="nav">${renderNavigation(navigation, navOnlyPage.activeId)}</div>`,
        );
      }
      if (html.includes('class="site-version"')) {
        html = html.replace(
          /<span class="site-version">[^<]*<\/span>/g,
          `<span class="site-version">${siteVersion}</span>`,
        );
      }
      await writeFile(outputPath, html, "utf8");
    }
  }

  const pages = [
    {
      file: "index.html",
      activeId: "home",
      section: renderHomeSections(content),
    },
    {
      file: "equipo.html",
      activeId: "aiworkers",
      section: renderTeam(content),
    },
    { file: "blog.html", activeId: "blog", section: renderBlog(content) },
    {
      file: "archivo.html",
      activeId: "blog",
      section: renderBlog(content, { archive: true }),
    },
  ];

  for (const page of pages) {
    const outputPath = path.join(outputRoot, page.file);
    if (existsSync(outputPath)) {
      let html = await readFile(outputPath, "utf8");
      html = replaceExactlyOnce(
        html,
        /<div id="nav"><\/div>/g,
        `<div id="nav">${renderNavigation(navigation, page.activeId)}</div>`,
        `${page.file} navigation placeholder`,
      );
      html = replaceExactlyOnce(
        html,
        /<div id="sections"><\/div>/g,
        `<div id="sections">${page.section}</div>`,
        `${page.file} content placeholder`,
      );
      if (html.includes('class="site-version"')) {
        html = html.replace(
          /<span class="site-version">[^<]*<\/span>/g,
          `<span class="site-version">${siteVersion}</span>`,
        );
      }
      await writeFile(outputPath, html, "utf8");
    }
  }

  const posts = sortedPosts(blogSection.blocks || []);
  const articleDistDir = path.join(outputRoot, "articulos");
  const articleRepoDir = path.join(repoRoot, "articulos");
  await rm(articleDistDir, { recursive: true, force: true });
  await rm(articleRepoDir, { recursive: true, force: true });
  await mkdir(articleDistDir, { recursive: true });
  await mkdir(articleRepoDir, { recursive: true });

  const generatedPaths = new Set();
  for (const post of posts) {
    const relativePath = articleUrl(post);
    if (generatedPaths.has(relativePath)) {
      continue;
    }
    generatedPaths.add(relativePath);
    const html = renderArticle(post, navigation, siteVersion);
    await writeFile(path.join(outputRoot, relativePath), html, "utf8");
    await writeFile(path.join(repoRoot, relativePath), html, "utf8");
  }

  for (const [aliasPath, targetPath] of legacyArticleAliases) {
    if (generatedPaths.has(targetPath)) {
      const aliasHtml = renderArticleAlias(aliasPath, targetPath);
      await writeFile(path.join(outputRoot, aliasPath), aliasHtml, "utf8");
      await writeFile(path.join(repoRoot, aliasPath), aliasHtml, "utf8");
    }
  }

  const sitemapXml = generateSitemap(posts);
  await writeFile(path.join(outputRoot, "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(path.join(repoRoot, "sitemap.xml"), sitemapXml, "utf8");

  return {
    pages: pages.map(({ file }) => file),
    articles: generatedPaths.size,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite()
    .then(({ pages, articles }) =>
      console.log(
        `Sitio prerenderizado: ${pages.length} páginas dinámicas y ${articles} artículos.`,
      ),
    )
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
