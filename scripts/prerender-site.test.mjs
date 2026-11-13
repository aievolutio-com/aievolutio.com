import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  PLAIN_GLOSSARY_ITEMS,
  buildSite,
  getGlossaryItems,
  getPostEffortMeta,
  getPostEmoData,
  legacyArticleAliases,
  renderArticle,
  renderArticleAlias,
  renderBlog,
  renderTeam,
} from "./prerender-site.mjs";
import {
  ROADMAP_TECH_QUEUE,
  computeTitleSimilarity,
  getRenderedPageList,
  isDuplicatePost,
} from "./autonomous-evolution.mjs";

const content = {
  sections: [
    {
      id: "aiworkers",
      title: "AIWorkers",
      blocks: [
        {
          type: "worker",
          title: "AIUsus",
          role: "UX y accesibilidad",
          body: "Revisa una experiencia digital.",
          capabilities: ["Encuentra fricciones"],
        },
      ],
    },
    {
      id: "blog",
      blocks: [
        {
          type: "post",
          title: "Una idea <útil>",
          date: "2026-10-09",
          author: "AILitterae",
          body: "Primer párrafo.\n\n**Idea clave** y texto.",
        },
      ],
    },
  ],
};

const navigation = [
  { id: "blog", label: "Ideas", href: "blog.html" },
  { id: "contact", label: "Contacto", href: "contacto.html" },
];

test("pre-renders team profiles as semantic modern worker cards", () => {
  const html = renderTeam(content);
  assert.match(html, /<article class="worker-card"/);
  assert.match(html, /AIUsus/);
  assert.match(html, /Encuentra fricciones/);
  assert.match(html, /Revisa una experiencia digital\./);
});

test("pre-renders blog summaries with links to standalone article URLs", () => {
  const html = renderBlog(content);
  assert.match(html, /<article class="card post-card">/);
  assert.match(html, /href="articulos\/articulo-2026-10-09-una-idea-util\.html"/);
  assert.match(html, /Una idea &lt;útil&gt;/);
});

test("renders complete articles with escaped text and sharing metadata", () => {
  const html = renderArticle(content.sections[1].blocks[0], navigation);
  assert.match(html, /<title>Una idea &lt;útil&gt; — AIEvolutio<\/title>/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/aievolutio\.com\/articulos\/articulo-2026-10-09-una-idea-util\.html">/,
  );
  assert.match(html, /<strong>Idea clave<\/strong>/);
  assert.doesNotMatch(html, /<útil>/);
  assert.match(html, /href="\.\.\/contacto\.html" class="btn section-cta">Compartir tu reto/);
  assert.match(html, /href="\.\.\/blog\.html" aria-current="page">Ideas/);
});

test("redirects the known truncated legacy article URL to its canonical page", () => {
  const alias = renderArticleAlias(
    "articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-s.html",
    "articulos/articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-sin-friccion.html",
  );
  assert.match(
    alias,
    /http-equiv="refresh" content="0; url=articulo-2026-10-30-cumplimiento-del-ai-act-europeo-para-pymes-guia-sin-friccion\.html"/,
  );
  assert.match(alias, /name="robots" content="noindex, follow"/);
  assert.throws(
    () => renderArticleAlias("articulos/antiguo.html", "../blog.html"),
    /debe apuntar a una ruta local/,
  );
});

test("builds redirects for all known truncated legacy article URLs", async () => {
  await buildSite();
  for (const [aliasPath, targetPath] of legacyArticleAliases) {
    const alias = await readFile(path.join(process.cwd(), "dist", aliasPath), "utf8");
    assert.ok(
      alias.includes(`url=${path.posix.basename(targetPath)}`),
      `${aliasPath} redirects to its canonical article`,
    );
    await access(path.join(process.cwd(), "dist", targetPath));
  }
});

test("deployment output contains every profile and a static page for every article", async () => {
  await buildSite();
  const source = JSON.parse(
    await readFile(path.join(process.cwd(), "content/content.es.json"), "utf8"),
  );
  const indexHtml = await readFile(path.join(process.cwd(), "dist/index.html"), "utf8");
  const diagHtml = await readFile(path.join(process.cwd(), "dist/diagnostico.html"), "utf8");
  const calcHtml = await readFile(path.join(process.cwd(), "dist/calculadora.html"), "utf8");
  const teamHtml = await readFile(path.join(process.cwd(), "dist/equipo.html"), "utf8");
  const blogHtml = await readFile(path.join(process.cwd(), "dist/blog.html"), "utf8");
  const archiveHtml = await readFile(path.join(process.cwd(), "dist/archivo.html"), "utf8");
  const sitemapXml = await readFile(path.join(process.cwd(), "dist/sitemap.xml"), "utf8");

  assert.ok(
    indexHtml.includes('<section id="vision"'),
    "index.html includes static vision section",
  );
  assert.ok(
    indexHtml.includes("Una exploración fractal"),
    "index.html includes fractal exploration",
  );
  assert.doesNotMatch(
    indexHtml,
    /<section id="iniciativas"/,
    "index.html limits Home strictly to 4 clean blocks (no #iniciativas)",
  );
  assert.doesNotMatch(
    indexHtml,
    /class="experiment-banner"|volante-diagnostic/,
    "index.html removes defensive experiment-banner and decoupled utilities",
  );
  assert.match(indexHtml, /class="ai-seal">100 % operado por IA</);
  assert.ok(
    indexHtml.includes('<section id="aiworkers"'),
    "index.html includes static aiworkers section",
  );
  assert.ok(indexHtml.includes('<section id="blog"'), "index.html includes static blog section");
  assert.ok(
    indexHtml.includes(`<span class="site-version">v${source.meta.version}</span>`),
    `index.html includes site-version v${source.meta.version}`,
  );
  assert.match(diagHtml, /id="maturity-diagnostic"/);
  assert.match(calcHtml, /id="roi-calculator"/);
  assert.match(sitemapXml, /https:\/\/aievolutio\.com\/diagnostico\.html/);
  assert.match(sitemapXml, /https:\/\/aievolutio\.com\/calculadora\.html/);
  const posts = source.sections
    .find((section) => section.id === "blog")
    .blocks.filter((block) => block.type === "post");
  const office = source.sections
    .find((section) => section.id === "oficina")
    .blocks.find((block) => block.type === "image");
  assert.equal(office.src, "images/oficina.webp");
  assert.ok(office.alt);
  assert.ok((await stat(path.join(process.cwd(), "dist", office.src))).size < 200 * 1024);
  const workers = source.sections
    .find((section) => section.id === "aiworkers")
    .blocks.filter((block) => block.type === "worker");
  const scriptPosition = teamHtml.indexOf('<script defer src="scripts/app.js');

  assert.ok(scriptPosition > 0, "team page should still load the existing client enhancement");
  for (const worker of workers) {
    assert.ok(
      teamHtml.indexOf(worker.title) < scriptPosition,
      `${worker.title} is in HTML before scripts`,
    );
  }
  for (const post of posts) {
    const slug = `${post.date || ""}-${post.title || "articulo"}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const articlePath = path.join(process.cwd(), "dist", "articulos", `articulo-${slug}.html`);
    const articleHtml = await readFile(articlePath, "utf8");
    assert.ok(
      blogHtml.includes(`articulos/articulo-${slug}.html`) ||
        archiveHtml.includes(`articulos/articulo-${slug}.html`),
      `${post.title} is linked from the blog or archive`,
    );
    assert.ok(articleHtml.includes("<h1>"), `${post.title} has a rendered article heading`);
    assert.doesNotMatch(
      articleHtml,
      /<script\b[^>]*src="[^"]*scripts\/app\.js/i,
      `${post.title} does not require application scripts`,
    );
  }
  assert.equal(
    (await readdir(path.join(process.cwd(), "dist/articulos"))).length,
    posts.length + legacyArticleAliases.size,
  );

  const outputRoot = path.resolve(process.cwd(), "dist");
  const htmlFiles = [
    ...[
      "index.html",
      "diagnostico.html",
      "calculadora.html",
      "equipo.html",
      "blog.html",
      "archivo.html",
      "contacto.html",
    ].map((file) => path.join(outputRoot, file)),
    ...(await readdir(path.join(outputRoot, "articulos")))
      .filter((file) => file.endsWith(".html"))
      .map((file) => path.join(outputRoot, "articulos", file)),
  ];
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    assert.doesNotMatch(
      html,
      /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u,
      `${path.basename(htmlFile)} contains zero structural UI emojis`,
    );
    for (const [, reference] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
      const [pathname, fragment] = reference.split("#", 2);
      const resourcePath = pathname.split("?")[0];
      const targetPath = resourcePath
        ? resourcePath.startsWith("/")
          ? path.resolve(outputRoot, `.${resourcePath}`)
          : path.resolve(path.dirname(htmlFile), resourcePath)
        : htmlFile;
      assert.ok(
        targetPath === outputRoot || targetPath.startsWith(`${outputRoot}${path.sep}`),
        `${reference} stays inside the generated site`,
      );
      await access(targetPath);
      if (fragment && targetPath.endsWith(".html")) {
        const targetHtml = await readFile(targetPath, "utf8");
        const escapedFragment = decodeURIComponent(fragment).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const hasStaticAnchor = new RegExp(`\\b(?:id|name)=["']${escapedFragment}["']`).test(
          targetHtml,
        );
        const hasRenderedHomeAnchor =
          targetPath === path.join(outputRoot, "index.html") &&
          source.sections.some((section) => section.id === decodeURIComponent(fragment));
        assert.ok(
          hasStaticAnchor || hasRenderedHomeAnchor,
          `${reference} points to an existing page anchor`,
        );
      }
    }
  }
});

test("adversarial anti-duplication guard blocks duplicate slugs and similar titles", () => {
  const existing = [
    {
      title: "Modelos SLM locales: IA de alto rendimiento en hardware modesto de oficina",
      slug: "modelos-slm-locales-alto-rendimiento-pymes",
      date: "2026-10-31",
    },
  ];

  // Exact duplicate with new date
  const clone = {
    title: "Modelos SLM locales: IA de alto rendimiento en hardware modesto de oficina",
    slug: "modelos-slm-locales-alto-rendimiento-pymes",
    date: "2026-11-05",
  };
  assert.equal(isDuplicatePost(clone, existing).duplicate, true);

  // Paraphrased high-similarity title
  const paraphrased = {
    title: "Modelos SLM locales: alto rendimiento en hardware de oficina para pymes",
    slug: "slm-en-oficina-pymes",
    date: "2026-11-05",
  };
  assert.ok(computeTitleSimilarity(paraphrased.title, existing[0].title) >= 0.48);
  assert.equal(isDuplicatePost(paraphrased, existing).duplicate, true);

  // Distinct topic by AIVisio
  const unique = {
    title:
      "El abaratamiento del conocimiento: cómo hacer posible en tu empresa lo que antes parecía inalcanzable",
    slug: "abaratamiento-conocimiento-curva-exponencial-volante",
    date: "2026-11-05",
  };
  assert.equal(isDuplicatePost(unique, existing).duplicate, false);
});

test("rendered page summary lists each dynamic page once", () => {
  assert.deepEqual(
    getRenderedPageList(["index.html", "equipo.html", "blog.html", "archivo.html"]),
    [
      "index.html",
      "diagnostico.html",
      "calculadora.html",
      "contacto.html",
      "equipo.html",
      "blog.html",
      "archivo.html",
    ],
  );
});

test("v1.2.0 renders multi-resolution favicons, effort badges, and plain-language glossary", async () => {
  await buildSite();
  const blogHtml = await readFile(path.join(process.cwd(), "dist/blog.html"), "utf8");
  assert.match(
    blogHtml,
    /href="images\/favicon\.svg" rel="icon" sizes="any" type="image\/svg\+xml"/,
  );
  assert.match(blogHtml, /href="images\/favicon-32\.png" rel="icon" sizes="32x32"/);
  assert.match(blogHtml, /id="glosario-llano"/);
  assert.match(blogHtml, /effort-badge effort-/);
  assert.ok(PLAIN_GLOSSARY_ITEMS.length >= 8);
  assert.equal(getPostEffortMeta({ effortLevel: "basic" }).key, "basic");
  assert.equal(getPostEffortMeta({ title: "Guía de protocolo MCP local" }).key, "intermediate");
});

test("v1.3.0 renders EmoInsight thermometer, ratings, comment threads, and roadmap tech queue", async () => {
  await buildSite();
  const blogHtml = await readFile(path.join(process.cwd(), "dist/blog.html"), "utf8");
  assert.match(blogHtml, /id="emo-compass-banner"/);
  assert.match(blogHtml, /data-emo-vote="like"/);
  assert.match(blogHtml, /data-emo-vote="dislike"/);
  assert.match(blogHtml, /#comentarios-ia/);

  const sampleArticleHtml = await readFile(
    path.join(
      process.cwd(),
      "dist/articulos/articulo-2026-11-08-diccionario-sin-miedo-que-son-el-protocolo-mcp-las-bases-vectoriales-y-los-modelos-locales.html",
    ),
    "utf8",
  );
  assert.match(sampleArticleHtml, /id="emo-insight-section"/);
  assert.match(sampleArticleHtml, /id="comentarios-ia"/);
  assert.match(sampleArticleHtml, /id="article-comment-form"/);
  assert.match(sampleArticleHtml, /InteractionCounter/);

  const emoData = getPostEmoData({
    slug: "diccionario-sin-miedo-mcp-bases-vectoriales-modelos-locales",
  });
  assert.equal(typeof emoData.likes, "number");
  assert.equal(typeof emoData.dislikes, "number");
  assert.ok(Array.isArray(emoData.comments));

  assert.ok(getGlossaryItems().length >= 10);
  assert.ok(Array.isArray(ROADMAP_TECH_QUEUE) && ROADMAP_TECH_QUEUE.length >= 6);
});

test("v1.4.0 renders 3-layer articles, Markdown tables, verified citations, TechArticle JSON-LD and rel=author links", () => {
  const h0Post = {
    type: "post",
    title: "Guía práctica de prueba sin cifras inventadas",
    slug: "guia-practica-prueba-sin-cifras",
    date: "2026-11-13",
    author: "AIDux",
    clarityNote: "En 30 segundos: equivale a montar una estantería sencilla en media hora.",
    body: "Párrafo inicial.\n\n| Opción | Esfuerzo |\n| :--- | :--- |\n| Local | Básico |\n\nCierre accionable.",
    visualDiagram: {
      title: "Flujo sencillo",
      nodes: [
        { title: "1. Carpeta", note: "Ordenada" },
        { title: "2. Modelo", note: "Local" },
        { title: "3. Revisión", note: "Humana" },
      ],
    },
    sources: [{ title: "Referencia oficial", url: "https://eur-lex.europa.eu/" }],
    actionableChecklist: ["Paso 1", "Paso 2", "Paso 3"],
  };

  const html = renderArticle(h0Post, navigation, "v1.4.0");
  assert.match(html, /id="resumen-30s"/);
  assert.match(html, /<table class="article-table">/);
  assert.match(html, /<svg class="visual-diagram-svg"/);
  assert.match(html, /id="fuentes-verificadas"/);
  assert.match(html, /href="https:\/\/eur-lex\.europa\.eu\/"/);
  assert.match(html, /id="pasos-practicos"/);
  assert.match(html, /href="\.\.\/equipo\.html#aidux" rel="author"/);
  assert.match(html, /"@type":"TechArticle"/);
  assert.match(html, /"citation":\["https:\/\/eur-lex\.europa\.eu\/"\]/);
  assert.doesNotMatch(html, /Inter:wght|experiment-banner|volante/i);
});
