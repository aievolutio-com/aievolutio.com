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
const publicFiles = ['CNAME', '_headers', 'site.webmanifest'];
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
      const lines = paragraph
        .split('\n')
        .map((line) =>
          line
            .split(/(\*\*.+?\*\*)/g)
            .map((part) =>
              part.startsWith('**') && part.endsWith('**') && part.length > 4
                ? `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
                : escapeHtml(part),
            )
            .join(''),
        )
        .join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('\n');
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
  aivisio: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  aidux: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>',
  aijuris: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M6 7l6-2 6 2"/><path d="M6 7l-3 6h6l-3-6z"/><path d="M18 7l-3 6h6l-3-6z"/><path d="M4 21h16"/></svg>',
  aiusus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="6" cy="7" r="1"/><circle cx="9" cy="7" r="1"/></svg>',
  aiarchitectus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M10 6.5h4"/><path d="M6.5 10v4"/><path d="M17.5 10v4"/><path d="M10 17.5h4"/></svg>',
  ailitterae: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>',
  aimutatio: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  aimercatus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  aiexperientia: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
};

function renderWorker(worker) {
  const name = worker.name || worker.title || '';
  const agentKey = name.toLowerCase();
  const icon =
    agentIcons[agentKey] ||
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
  const capabilities =
    Array.isArray(worker.capabilities) && worker.capabilities.length
      ? `<div class="worker-caps">
    <span class="worker-caps-label">Especialidades prácticas</span>
    <ul class="worker-caps-list">${worker.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join('')}</ul>
  </div>`
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
  const backLink = archive ? '<a href="blog.html" class="archive-back">← Ver artículos recientes</a>' : '';
  const archiveLink =
    !archive && posts.length > 4 ? '<a href="archivo.html" class="btn section-cta">Ver artículos anteriores</a>' : '';
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
<link href="../styles/tokens.css" rel="stylesheet">
<link href="../styles/main.css?v=20261101" rel="stylesheet">
<link href="../images/favicon.ico" rel="icon" type="image/x-icon">
</head>
<body data-page="article">
<a class="skip-link" href="#main">Saltar al contenido</a>
<header aria-label="Cabecera" class="header">
<nav aria-label="Primaria" class="container nav">
<a aria-label="AIEvolutio – Inicio" class="logo" href="../index.html">
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
