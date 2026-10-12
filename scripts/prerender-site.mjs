import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'dist');
const contentPath = path.join(repoRoot, 'content/content.es.json');
const navigationPath = path.join(repoRoot, 'content/navigation.json');
const htmlPages = ['index.html', 'equipo.html', 'blog.html', 'archivo.html', 'contacto.html'];
const publicDirectories = ['assets', 'content', 'images', 'styles'];
const publicFiles = ['CNAME', '_headers', 'site.webmanifest'];
const articleBaseUrl = 'https://aievolutio.com';

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

function sortedPosts(blocks = []) {
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
  const text = String(body || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

function renderPostBody(body) {
  return String(body || '')
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split('\n').map((line) => line
        .split(/(\*\*.+?\*\*)/g)
        .map((part) => part.startsWith('**') && part.endsWith('**') && part.length > 4
          ? `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
          : escapeHtml(part))
        .join(''))
        .join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('\n');
}

function renderNavigation(items, activeId, prefix = '') {
  return items.map((item) => {
    const current = item.id === activeId ? ' aria-current="page"' : '';
    const href = prefix && !/^(?:[a-z]+:|#|\/)/i.test(String(item.href || ''))
      ? `${prefix}${item.href}`
      : item.href;
    return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(item.label || 'Inicio')}</a>`;
  }).join('\n');
}

function renderWorker(worker) {
  const name = worker.name || worker.title || '';
  const capabilities = Array.isArray(worker.capabilities) && worker.capabilities.length
    ? `<ul class="list list-primary">${worker.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join('')}</ul>`
    : '';
  const avatar = worker.img
    ? `<img src="${escapeHtml(worker.img)}" alt="${escapeHtml(worker.alt || name)}" loading="lazy" class="avatar">`
    : `<div class="worker-avatar" aria-hidden="true"><span>${escapeHtml(name.replace(/^AI/, '').slice(0, 2).toUpperCase())}</span></div>`;
  const testLink = /^https?:\/\//i.test(String(worker.href || ''))
    ? `<a href="${escapeHtml(worker.href)}" class="btn" target="_blank" rel="noopener noreferrer">${escapeHtml(worker.cta || `Probar ${name}`)}</a>`
    : '';
  return `<details class="worker">
  <summary><strong>${escapeHtml(name)}</strong>${worker.role ? ` — ${escapeHtml(worker.role)}` : ''}<span class="hint" aria-hidden="true">Ver capacidades</span><span class="hint-open" aria-hidden="true">Ocultar</span></summary>
  <div class="worker-body">${avatar}<div class="worker-content">${capabilities}${worker.body ? `<p>${escapeHtml(worker.body)}</p>` : ''}${testLink}</div></div>
</details>`;
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

function renderPostCard(post) {
  const url = articleUrl(post);
  const metadata = [formatPostDate(post.date), post.author].filter(Boolean).join(' · ');
  const image = post.img
    ? `<img src="${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${post.title || 'el artículo'}`)}" class="post-cover" loading="lazy">`
    : '';
  return `<article class="card post-card">
  <h3><a href="${escapeHtml(url)}">${escapeHtml(post.title || 'Entrada')}</a></h3>
  <p class="muted post-meta">${escapeHtml(metadata)}</p>
  ${image}
  <div class="post-body">${renderPostBody(postSummary(post.body))}</div>
  <a href="${escapeHtml(url)}" class="text-link">Leer artículo</a>
</article>`;
}

export function renderBlog(content, { archive = false } = {}) {
  const blog = content.sections.find((section) => section.id === 'blog');
  if (!blog) throw new Error('Falta la sección blog para generar los artículos.');
  const posts = sortedPosts(blog.blocks || []);
  const visiblePosts = archive ? posts.slice(4) : posts.slice(0, 4);
  const title = archive ? 'Artículos anteriores' : 'Artículos recientes';
  const backLink = archive
    ? '<a href="blog.html" class="archive-back">← Ver artículos recientes</a>'
    : '';
  const archiveLink = !archive && posts.length > 4
    ? '<a href="archivo.html" class="btn section-cta">Ver artículos anteriores</a>'
    : '';
  return `<section id="blog" class="section">
  <h2>${title}</h2>
  ${backLink}
  <div class="grid post-grid">${visiblePosts.map(renderPostCard).join('\n')}</div>
  ${archiveLink}
</section>`;
}

export function renderArticle(post, navigation) {
  const title = String(post.title || 'Artículo');
  const description = postSummary(post.body, 180);
  const articleUrlPath = articleUrl(post);
  const canonical = `${articleBaseUrl}/${articleUrlPath}`;
  const absoluteImage = post.img ? `${articleBaseUrl}/${String(post.img).replace(/^\/+/, '')}` : '';
  const image = post.img
    ? `<img src="../${escapeHtml(post.img)}" alt="${escapeHtml(post.alt || `Imagen editorial para ${title}`)}" class="post-cover">`
    : '';
  const metadata = [formatPostDate(post.date), post.author].filter(Boolean).join(' · ');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<title>${escapeHtml(title)} — AIEvolutio</title>
<meta name="description" content="${escapeHtml(description)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:url" content="${escapeHtml(canonical)}">
${absoluteImage ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}">\n` : ''}<meta name="twitter:card" content="${absoluteImage ? 'summary_large_image' : 'summary'}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link href="../styles/tokens.css" rel="stylesheet">
<link href="../styles/main.css?v=20261007" rel="stylesheet">
<link href="../images/favicon.ico" rel="icon" type="image/x-icon">
</head>
<body data-page="article">
<a class="skip-link" href="#main">Saltar al contenido</a>
<header aria-label="Cabecera" class="header">
<nav aria-label="Primaria" class="container nav">
<a aria-label="AIEvolutio – Inicio" class="logo" href="../index.html#home">
<img alt="AIEvolutio" src="../images/logo-slogan-es.png?v=20261005">
<span class="sr-only">AIEvolutio</span>
</a>
<div id="nav">${renderNavigation(navigation, 'blog', '../')}</div>
</nav>
</header>
<main class="container" id="main" tabindex="-1">
<section class="hero page-hero">
<p class="eyebrow">Ideas, exploración y práctica</p>
<h1>${escapeHtml(title)}</h1>
<p>Guías e ideas prácticas sobre inteligencia artificial, trabajo y evolución humana.</p>
</section>
<section class="section">
<a href="../blog.html" class="archive-back">← Volver a artículos</a>
<article class="card post-card">
<p class="muted post-meta">${escapeHtml(metadata)}</p>
${image}
<div class="post-body">${renderPostBody(post.body)}</div>
</article>
<a href="../contacto.html" class="btn section-cta">Cuéntanos tu reto</a>
</section>
</main>
<footer class="container">
<p>© 2026 AIEvolutio</p>
<p class="disclaimer">Los AIWorkers son herramientas experimentales. Sus respuestas pueden contener errores y no constituyen asesoramiento profesional.</p>
</footer>
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
    await cp(path.join(repoRoot, page), path.join(outputRoot, page));
  }
  for (const directory of publicDirectories) {
    await cp(path.join(repoRoot, directory), path.join(outputRoot, directory), { recursive: true });
  }
  await mkdir(path.join(outputRoot, 'scripts'), { recursive: true });
  await cp(path.join(repoRoot, 'scripts/app.js'), path.join(outputRoot, 'scripts/app.js'));
  for (const file of publicFiles) {
    await cp(path.join(repoRoot, file), path.join(outputRoot, file));
  }
}

export async function buildSite() {
  const content = JSON.parse(await readFile(contentPath, 'utf8'));
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  await copyPublicSource();

  const pages = [
    { file: 'equipo.html', activeId: 'aiworkers', section: renderTeam(content) },
    { file: 'blog.html', activeId: 'blog', section: renderBlog(content) },
    { file: 'archivo.html', activeId: 'blog', section: renderBlog(content, { archive: true }) },
  ];
  for (const page of pages) {
    const outputPath = path.join(outputRoot, page.file);
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

  const blog = content.sections.find((section) => section.id === 'blog');
  const posts = sortedPosts(blog?.blocks || []);
  const articleDirectory = path.join(outputRoot, 'articulos');
  await mkdir(articleDirectory, { recursive: true });
  const generatedPaths = new Set();
  for (const post of posts) {
    const relativePath = articleUrl(post);
    if (generatedPaths.has(relativePath)) {
      throw new Error(`La URL de artículo está duplicada: ${relativePath}`);
    }
    generatedPaths.add(relativePath);
    const outputPath = path.join(outputRoot, relativePath);
    await writeFile(outputPath, renderArticle(post, navigation), 'utf8');
  }
  return { pages: pages.map(({ file }) => file), articles: generatedPaths.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite()
    .then(({ pages, articles }) => console.log(`Sitio prerenderizado: ${pages.length} páginas dinámicas y ${articles} artículos.`))
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
