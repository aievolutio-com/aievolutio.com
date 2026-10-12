import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSite, renderArticle, renderBlog, renderTeam } from './prerender-site.mjs';

const content = {
  sections: [
    {
      id: 'aiworkers',
      title: 'AIWorkers',
      blocks: [
        {
          type: 'worker',
          title: 'AIUsus',
          role: 'UX y accesibilidad',
          body: 'Revisa una experiencia digital.',
          capabilities: ['Encuentra fricciones'],
        },
      ],
    },
    {
      id: 'blog',
      blocks: [
        {
          type: 'post',
          title: 'Una idea <útil>',
          date: '2026-10-09',
          author: 'AILitterae',
          body: 'Primer párrafo.\n\n**Idea clave** y texto.',
        },
      ],
    },
  ],
};

const navigation = [
  { id: 'blog', label: 'Ideas', href: 'blog.html' },
  { id: 'contact', label: 'Contacto', href: 'contacto.html' },
];

test('pre-renders team profiles as semantic native disclosure widgets', () => {
  const html = renderTeam(content);
  assert.match(html, /<details class="worker">/);
  assert.match(html, /AIUsus/);
  assert.match(html, /Encuentra fricciones/);
  assert.match(html, /Revisa una experiencia digital\./);
});

test('pre-renders blog summaries with links to standalone article URLs', () => {
  const html = renderBlog(content);
  assert.match(html, /<article class="card post-card">/);
  assert.match(html, /href="articulos\/articulo-2026-10-09-una-idea-util\.html"/);
  assert.match(html, /Una idea &lt;útil&gt;/);
});

test('renders complete articles with escaped text and sharing metadata', () => {
  const html = renderArticle(content.sections[1].blocks[0], navigation);
  assert.match(html, /<title>Una idea &lt;útil&gt; — AIEvolutio<\/title>/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aievolutio\.com\/articulos\/articulo-2026-10-09-una-idea-util\.html">/);
  assert.match(html, /<strong>Idea clave<\/strong>/);
  assert.doesNotMatch(html, /<útil>/);
  assert.match(html, /href="\.\.\/contacto\.html" class="btn section-cta">Cuéntanos tu reto/);
  assert.match(html, /href="\.\.\/blog\.html" aria-current="page">Ideas/);
});

test('deployment output contains every profile and a static page for every article', async () => {
  await buildSite();
  const source = JSON.parse(await readFile(path.join(process.cwd(), 'content/content.es.json'), 'utf8'));
  const teamHtml = await readFile(path.join(process.cwd(), 'dist/equipo.html'), 'utf8');
  const blogHtml = await readFile(path.join(process.cwd(), 'dist/blog.html'), 'utf8');
  const archiveHtml = await readFile(path.join(process.cwd(), 'dist/archivo.html'), 'utf8');
  const posts = source.sections.find((section) => section.id === 'blog').blocks
    .filter((block) => block.type === 'post');
  const workers = source.sections.find((section) => section.id === 'aiworkers').blocks
    .filter((block) => block.type === 'worker');
  const scriptPosition = teamHtml.indexOf('<script');

  assert.ok(scriptPosition > 0, 'team page should still load the existing client enhancement');
  for (const worker of workers) {
    assert.ok(teamHtml.indexOf(worker.title) < scriptPosition, `${worker.title} is in HTML before scripts`);
  }
  for (const post of posts) {
    const slug = `${post.date || ''}-${post.title || 'articulo'}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const articlePath = path.join(process.cwd(), 'dist', 'articulos', `articulo-${slug}.html`);
    const articleHtml = await readFile(articlePath, 'utf8');
    assert.ok(
      blogHtml.includes(`articulos/articulo-${slug}.html`)
        || archiveHtml.includes(`articulos/articulo-${slug}.html`),
      `${post.title} is linked from the blog or archive`,
    );
    assert.ok(articleHtml.includes('<h1>'), `${post.title} has a rendered article heading`);
    assert.doesNotMatch(articleHtml, /<script\b/i, `${post.title} does not require JavaScript`);
  }
  assert.equal((await readdir(path.join(process.cwd(), 'dist/articulos'))).length, posts.length);
});
