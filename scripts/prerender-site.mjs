import { cp, mkdir, readFile, rm, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { repairTruncatedJson } from './json-repair.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'dist');
const contentPath = path.join(repoRoot, 'content/content.es.json');
const navigationPath = path.join(repoRoot, 'content/navigation.json');
const postsDirectory = path.join(repoRoot, 'content/posts');
const htmlPages = ['index.html', 'equipo.html', 'blog.html', 'archivo.html', 'contacto.html'];
const publicDirectories = ['assets', 'content', 'images', 'styles'];
const publicFiles = ['CNAME', '_headers', 'site.webmanifest', 'robots.txt', 'sitemap.xml'];
const articleBaseUrl = 'https://aievolutio.com';

export const legacyArticleAliases = new Map([
  [
    'articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-s.html',
    'articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-sin-friccion.html',
  ],
  [
    'articulos/articulo-2026-10-11-aiworkers-tu-equipo-invisible-que-multiplica-el-v.html',
    'articulos/articulo-2026-10-11-aiworkers-tu-equipo-invisible-que-multiplica-el-valor.html',
  ],
  [
    'articulos/articulo-2026-10-09-navegando-el-futuro-como-la-ia-potencia-la-resili.html',
    'articulos/articulo-2026-10-09-navegando-el-futuro-como-la-ia-potencia-la-resiliencia-de-tu-negocio.html',
  ],
  [
    'articulos/articulo-2026-10-07-antes-de-automatizar-como-elegir-un-proceso-que-m.html',
    'articulos/articulo-2026-10-07-antes-de-automatizar-como-elegir-un-proceso-que-merece-una-prueba-con-ia.html',
  ],
  [
    'articulos/articulo-2026-10-05-diseno-inteligente-de-procesos-cuando-la-ia-asist.html',
    'articulos/articulo-2026-10-05-diseno-inteligente-de-procesos-cuando-la-ia-asiste-y-el-criterio-humano-decide.html',
  ],
  [
    'articulos/articulo-2026-10-04-desmitificando-la-ia-la-guia-para-tu-primer-exper.html',
    'articulos/articulo-2026-10-04-desmitificando-la-ia-la-guia-para-tu-primer-experimento-en-equipo.html',
  ],
  [
    'articulos/articulo-2026-09-29-desbloqueando-horas-valiosas-una-guia-practica-pa.html',
    'articulos/articulo-2026-09-29-desbloqueando-horas-valiosas-una-guia-practica-para-medir-el-impacto-de-tu-automatizacion.html',
  ],
  [
    'articulos/articulo-2026-08-03-riesgos-y-ventajas-de-los-aiworkers-en-las-organiz.html',
    'articulos/articulo-2026-08-03-riesgos-y-ventajas-de-los-aiworkers-en-las-organizaciones.html',
  ],
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function articleId(post) {
  const slug = `${post.date || ''}-${post.title || 'articulo'}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `articulo-${slug}`;
}

function articleUrl(post) {
  return `articulos/${articleId(post)}.html`;
}

export function sortedPosts(blocks = []) {
  return blocks
    .filter((block) => block.type === 'post')
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
}

function formatPostDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return String(date || '');
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function postSummary(body, maxLength = 280) {
  const text = String(body || '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

function renderPostBody(body) {
  return String(body || '')
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      // Si el bloque es un título markdown como **Título**
      if (
        (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes('\n')) ||
        trimmed.startsWith('### ')
      ) {
        const titleText = trimmed.startsWith('### ') ? trimmed.slice(4) : trimmed.slice(2, -2);
        return `<h3 class="article-subtitle">${escapeHtml(titleText)}</h3>`;
      }

      // Si es una lista con viñetas (- o *)
      const lines = trimmed.split('\n');
      if (lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
        const items = lines.map((l) => {
          const itemContent = l.trim().replace(/^[-*]\s+/, '');
          return `<li>${formatInlineText(itemContent)}</li>`;
        });
        return `<ul class="article-list">${items.join('')}</ul>`;
      }

      // Si es una lista numerada (1. 2. ...)
      if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        const items = lines.map((l) => {
          const itemContent = l.trim().replace(/^\d+\.\s+/, '');
          return `<li>${formatInlineText(itemContent)}</li>`;
        });
        return `<ol class="article-ordered">${items.join('')}</ol>`;
      }

      // Párrafo de texto normal
      const formattedLines = lines.map((line) => formatInlineText(line)).join('<br>');
      return `<p>${formattedLines}</p>`;
    })
    .join('\n');
}

function formatInlineText(text) {
  return text
    .split(/(\*\*.+?\*\*)/g)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
        : escapeHtml(part),
    )
    .join('');
}

function renderNavigation(items, activeId, prefix = '') {
  return items
    .map((item) => {
      const current = item.id === activeId ? ' aria-current="page"' : '';
      const href = prefix && !/^(?:[a-z]+:|#|\/)/i.test(String(item.href || '')) ? `${prefix}${item.href}` : item.href;
      return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(item.label || 'Inicio')}</a>`;
    })
    .join('\n');
}

const agentIcons = {
  aifactura: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  airespuestas: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  aioferta: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  aijuris: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M6 7l6-2 6 2"/><path d="M6 7l-3 6h6l-3-6z"/><path d="M18 7l-3 6h6l-3-6z"/><path d="M4 21h16"/></svg>',
  aidux: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>',
};

function renderWorker(worker) {
  const name = worker.name || worker.title || '';
  const agentKey = name.toLowerCase();
  const icon =
    agentIcons[agentKey] ||
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
  const impact = worker.impact
    ? `<div class="worker-impact"><span class="worker-impact-label">Impacto para tu pyme:</span> <strong class="worker-impact-val">${escapeHtml(worker.impact)}</strong></div>`
    : '';
  const capabilities =
    Array.isArray(worker.capabilities) && worker.capabilities.length
      ? `<div class="worker-caps"><ul class="worker-caps-list">${worker.capabilities.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>`
      : '';
  const testLink = /^https?:\/\//i.test(String(worker.href || ''))
    ? `<div class="worker-actions"><a href="${escapeHtml(worker.href)}" class="btn btn-sm btn-outline" target="_blank" rel="noopener noreferrer">${escapeHtml(worker.cta || `Consultar ${name}`)}</a></div>`
    : '';

  return `<article class="worker-card" data-agent="${escapeHtml(agentKey)}">
  <div class="worker-header">
    <div class="worker-icon-box" aria-hidden="true">${icon}</div>
    <div class="worker-meta">
      <h3 class="worker-name">${escapeHtml(name)}</h3>
      ${worker.role ? `<span class="worker-role">${escapeHtml(worker.role)}</span>` : ''}
    </div>
  </div>
  ${worker.body ? `<p class="worker-body">${escapeHtml(worker.body)}</p>` : ''}
  ${impact}
  ${capabilities}
  ${testLink}
</article>`;
}

export function renderTeam(content) {
  const team = content.sections.find((section) => section.id === 'aiworkers');
  if (!team) throw new Error('Falta la sección aiworkers para generar la página del equipo.');
  const workers = (team.blocks || []).filter((block) => block.type === 'worker');
  if (!workers.length) throw new Error('No hay perfiles AIWorker para generar la página del equipo.');
  return `<section id="aiworkers" class="section">
  <h2>${escapeHtml(team.title || 'AIWorkers')}</h2>
  <div class="grid">${workers.map(renderWorker).join('\n')}</div>
</section>`;
}

function getPostCategory(post) {
  const text = `${post.title || ''} ${post.body || ''}`.toLowerCase();
  const author = (post.author || '').toLowerCase();
  if (author.includes('juris') || text.includes('ai act') || text.includes('legal') || text.includes('contrato') || text.includes('rgpd')) {
    return 'Gobernanza & Legal';
  }
  if (text.includes('slm') || text.includes('hardware') || text.includes('local') || text.includes('modelo') || text.includes('offline')) {
    return 'Tecnología & SLMs';
  }
  if (text.includes('aiworker') || text.includes('proceso') || text.includes('horas') || text.includes('automatiz')) {
    return 'IAWorkers & Procesos';
  }
  return 'Estrategia & PYMEs';
}

function calculateReadingTime(body) {
  const words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(words / 190));
  return `${minutes} min de lectura`;
}

function renderPostCard(post, isFeatured = false) {
  const url = articleUrl(post);
  const category = getPostCategory(post);
  const readingTime = calculateReadingTime(post.body);
  const metadata = [formatPostDate(post.date), post.author, readingTime].filter(Boolean).join(' · ');
  const image = post.img
    ? `<div class="post-cover-wrap"><img src="${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${post.title || 'el artículo'}`)}" class="post-cover" loading="lazy"></div>`
    : '';

  if (isFeatured) {
    return `<article class="card post-card">
  <div class="featured-post-wrapper">
    ${image}
    <div class="featured-post-content">
      <div class="post-category-tag">${escapeHtml(category)}</div>
      <h3><a href="${escapeHtml(url)}">${escapeHtml(post.title || 'Entrada')}</a></h3>
      <p class="muted post-meta">${escapeHtml(metadata)}</p>
      <div class="post-body">${renderPostBody(postSummary(post.body, 260))}</div>
      <a href="${escapeHtml(url)}" class="btn btn-sm btn-outline">Leer artículo completo →</a>
    </div>
  </div>
</article>`;
  }

  return `<article class="card post-card">
  ${image}
  <div class="post-card-inner">
    <div class="post-category-tag">${escapeHtml(category)}</div>
    <h3><a href="${escapeHtml(url)}">${escapeHtml(post.title || 'Entrada')}</a></h3>
    <p class="muted post-meta">${escapeHtml(metadata)}</p>
    <div class="post-body">${renderPostBody(postSummary(post.body, 160))}</div>
    <a href="${escapeHtml(url)}" class="text-link">Leer artículo →</a>
  </div>
</article>`;
}

export function renderBlog(content, { archive = false } = {}) {
  const blog = content.sections.find((section) => section.id === 'blog');
  if (!blog) throw new Error('Falta la sección blog para generar los artículos.');
  const posts = sortedPosts(blog.blocks || []);
  const visiblePosts = archive ? posts.slice(4) : posts.slice(0, 4);
  const title = archive ? 'Artículos anteriores' : 'Ideas, guías y casos de uso';
  const backLink = archive
    ? '<a href="blog.html" class="archive-back"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12L6 8L10 4"/></svg><span>Ver artículos recientes</span></a>'
    : '';
  const archiveLink =
    !archive && posts.length > 4 ? '<a href="archivo.html" class="btn section-cta">Ver artículos anteriores en el archivo</a>' : '';

  const cardsHtml = archive
    ? visiblePosts.map((p) => renderPostCard(p, false)).join('\n')
    : visiblePosts.map((p, idx) => renderPostCard(p, idx === 0)).join('\n');

  return `<section id="blog" class="section">
  <div class="blog-header-bar">
    <h2>${title}</h2>
    <div class="blog-topics-pills">
      <span class="topic-pill active">Todos</span>
      <span class="topic-pill">IAWorkers</span>
      <span class="topic-pill">SLMs Locales</span>
      <span class="topic-pill">AI Act & Legal</span>
    </div>
  </div>
  ${backLink}
  <div class="grid post-grid">${cardsHtml}</div>
  ${archiveLink}
</section>`;
}

export function renderArticle(post, navigation) {
  const title = String(post.title || 'Artículo');
  const description = postSummary(post.body, 180);
  const articleUrlPath = articleUrl(post);
  const canonical = `${articleBaseUrl}/${articleUrlPath}`;
  const absoluteImage = post.img ? `${articleBaseUrl}/${String(post.img).replace(/^\/+/, '')}` : '';
  const category = getPostCategory(post);
  const readingTime = calculateReadingTime(post.body);
  const image = post.img
    ? `<div class="article-hero-cover"><img src="../${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${title}`)}" class="post-cover" loading="lazy"></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<title>${escapeHtml(title)} — AIEvolutio</title>
<meta name="description" content="${escapeHtml(description)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; img-src 'self' data: https://aievolutio.com https://www.google-analytics.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com; object-src 'none'; base-uri 'self'">
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
${absoluteImage ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}">\n` : ''}<meta name="twitter:card" content="${absoluteImage ? 'summary_large_image' : 'summary'}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
<link href="../styles/tokens.css" rel="stylesheet">
<link href="../styles/main.css?v=20261101" rel="stylesheet">
<link href="../images/favicon.ico" rel="icon" type="image/x-icon">
</head>
<body data-page="article">
<a class="skip-link" href="#main">Saltar al contenido</a>
<header aria-label="Cabecera" class="header">
<nav aria-label="Primaria" class="container nav">
<a aria-label="AIEvolutio – Inicio" class="logo" href="../index.html">
<img alt="AIEvolutio" src="../images/logo-slogan-es.png?v=20261005" width="56" height="56">
<span class="sr-only">AIEvolutio</span>
</a>
<div id="nav">${renderNavigation(navigation, 'blog', '../')}</div>
<button aria-label="Cambiar tema" aria-pressed="false" class="theme-toggle" id="theme-toggle" type="button">🌓</button>
</nav>
</header>
<main class="container reading-container" id="main" tabindex="-1">
<nav aria-label="Navegación secundaria" class="article-breadcrumb">
  <a href="../blog.html" class="archive-back"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 12L6 8L10 4"/></svg><span>Blog</span></a>
  <span class="breadcrumb-separator" aria-hidden="true">/</span>
  <span class="post-category-tag">${escapeHtml(category)}</span>
</nav>
<header class="article-header">
  <h1>${escapeHtml(title)}</h1>
  <div class="article-meta-bar">
    <div class="author-badge" aria-hidden="true">${escapeHtml((post.author || 'AI').slice(0, 2).toUpperCase())}</div>
    <div class="article-meta-info">
      <span class="article-author-name">${escapeHtml(post.author || 'AIEvolutio')}</span>
      <span class="article-date-row">${formatPostDate(post.date)} · ${escapeHtml(readingTime)}</span>
    </div>
  </div>
</header>
${image}
<article class="card post-card article-reading-card">
  <div class="post-body">${renderPostBody(post.body)}</div>
</article>
<footer class="article-footer-cta">
  <div class="article-cta-box">
    <h3>¿Quieres resolver este reto en tu empresa?</h3>
    <p>Diseñamos e implantamos IAWorkers y automatizaciones pragmáticas adaptadas a la realidad operativa de tu negocio.</p>
    <a href="../contacto.html" class="btn section-cta">Cuéntanos tu reto</a>
  </div>
</footer>
</main>
<footer class="container">
<p>© 2026 AIEvolutio</p>
<p class="disclaimer">Los AIWorkers son herramientas experimentales. Sus respuestas pueden contener errores y no constituyen asesoramiento profesional.</p>
</footer>
</body>
</html>`;
}

export function generateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];
  const staticEntries = [
    { loc: 'https://aievolutio.com/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: 'https://aievolutio.com/equipo.html', changefreq: 'weekly', priority: '0.9', lastmod: today },
    { loc: 'https://aievolutio.com/blog.html', changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: 'https://aievolutio.com/contacto.html', changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: 'https://aievolutio.com/archivo.html', changefreq: 'weekly', priority: '0.7', lastmod: today },
  ];

  const postEntries = posts.map((post) => ({
    loc: `https://aievolutio.com/${articleUrl(post)}`,
    changefreq: 'weekly',
    priority: '0.8',
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
  .join('\n')}
</urlset>
`;
}

export function renderArticleAlias(aliasPath, targetPath) {
  const target = path.posix.relative(path.posix.dirname(aliasPath), targetPath);
  if (!target || target.startsWith('../')) {
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
  await mkdir(path.join(outputRoot, 'scripts'), { recursive: true });
  if (existsSync(path.join(repoRoot, 'scripts/app.js'))) {
    await cp(path.join(repoRoot, 'scripts/app.js'), path.join(outputRoot, 'scripts/app.js'));
  }
  for (const file of publicFiles) {
    const filePath = path.join(repoRoot, file);
    if (existsSync(filePath)) {
      await cp(filePath, path.join(outputRoot, file));
    }
  }
}

/**
 * Carga modular y resiliente de posts desde content/posts/
 */
export async function loadModularPosts() {
  const loaded = [];
  if (!existsSync(postsDirectory)) {
    return loaded;
  }
  const files = await readdir(postsDirectory);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(postsDirectory, file);
    try {
      const raw = await readFile(fullPath, 'utf8');
      const post = repairTruncatedJson(raw);
      if (post && post.title) {
        post.type = 'post';
        loaded.push(post);
      }
    } catch (err) {
      console.warn(`[Aviso Resiliencia] No se pudo leer el post modular ${file}: ${err.message}`);
    }
  }
  return sortedPosts(loaded);
}

export async function buildSite() {
  const content = JSON.parse(await readFile(contentPath, 'utf8'));
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));

  // Carga modular resiliente de posts
  const modularPosts = await loadModularPosts();
  let blogSection = content.sections.find((section) => section.id === 'blog');
  if (!blogSection) {
    blogSection = { id: 'blog', title: 'Blog', kind: 'posts', blocks: [] };
    content.sections.push(blogSection);
  }

  if (modularPosts.length > 0) {
    blogSection.blocks = modularPosts;
    // Sincronizar content.es.json en segundo plano de forma no bloqueante
    try {
      await writeFile(contentPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    } catch {
      // Ignorar si hay lock de lectura
    }
  }

  await copyPublicSource();

  const pages = [
    {
      file: 'equipo.html',
      activeId: 'aiworkers',
      section: renderTeam(content),
    },
    { file: 'blog.html', activeId: 'blog', section: renderBlog(content) },
    {
      file: 'archivo.html',
      activeId: 'blog',
      section: renderBlog(content, { archive: true }),
    },
  ];

  for (const page of pages) {
    const outputPath = path.join(outputRoot, page.file);
    if (existsSync(outputPath)) {
      let html = await readFile(outputPath, 'utf8');
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
      await writeFile(outputPath, html, 'utf8');
    }
  }

  const posts = sortedPosts(blogSection.blocks || []);
  const articleDistDir = path.join(outputRoot, 'articulos');
  const articleRepoDir = path.join(repoRoot, 'articulos');
  await mkdir(articleDistDir, { recursive: true });
  await mkdir(articleRepoDir, { recursive: true });

  const generatedPaths = new Set();
  for (const post of posts) {
    const relativePath = articleUrl(post);
    if (generatedPaths.has(relativePath)) {
      continue; // Evitar colisiones duplicadas
    }
    generatedPaths.add(relativePath);
    const html = renderArticle(post, navigation);
    await writeFile(path.join(outputRoot, relativePath), html, 'utf8');
    await writeFile(path.join(repoRoot, relativePath), html, 'utf8');
  }

  for (const [aliasPath, targetPath] of legacyArticleAliases) {
    if (generatedPaths.has(targetPath)) {
      const aliasHtml = renderArticleAlias(aliasPath, targetPath);
      await writeFile(path.join(outputRoot, aliasPath), aliasHtml, 'utf8');
      await writeFile(path.join(repoRoot, aliasPath), aliasHtml, 'utf8');
    }
  }

  const sitemapXml = generateSitemap(posts);
  await writeFile(path.join(outputRoot, 'sitemap.xml'), sitemapXml, 'utf8');
  await writeFile(path.join(repoRoot, 'sitemap.xml'), sitemapXml, 'utf8');

  return {
    pages: pages.map(({ file }) => file),
    articles: generatedPaths.size,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite()
    .then(({ pages, articles }) =>
      console.log(`Sitio prerenderizado: ${pages.length} páginas dinámicas y ${articles} artículos.`),
    )
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
