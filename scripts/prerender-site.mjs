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

function renderWorker(worker) {
  const name = worker.name || worker.title || '';
  const capabilities =
    Array.isArray(worker.capabilities) && worker.capabilities.length
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
