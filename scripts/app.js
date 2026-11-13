(() => {
  const state = { content: null };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function isAllowedHref(value) {
    const href = String(value ?? "").trim();
    if (!href) return false;
    if (href.startsWith("#")) return true;
    try {
      return ["http:", "https:", "mailto:"].includes(new URL(href, document.baseURI).protocol);
    } catch {
      return false;
    }
  }

  function isExternalHref(value) {
    return /^https?:\/\//i.test(String(value ?? "").trim());
  }

  async function loadContent(lang = "es") {
    const res = await fetch(`content/content.${lang}.json`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("No se pudo cargar el contenido");
    state.content = await res.json();
  }

  async function loadNavigationOverride() {
    try {
      const res = await fetch("content/navigation.json", { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch {
      /* ignore */
    }
    return null;
  }

  function renderNav(items) {
    const nav = $("#nav");
    if (!nav) return;
    const page = document.body.dataset.page || "home";
    const activeId =
      page === "blog" || page === "blog-archive"
        ? "blog"
        : page === "diagnostico"
          ? "diagnostico"
          : page === "calculadora"
            ? "calculadora"
            : page === "team"
              ? "aiworkers"
              : page === "contact"
                ? "contact"
                : "home";
    nav.replaceChildren(
      ...items.map((item) => {
        const attrs = {
          href: isAllowedHref(item.href) ? item.href : "index.html",
        };
        if (item.id === activeId) attrs["aria-current"] = "page";
        return el("a", attrs, [item.label || "Inicio"]);
      }),
    );
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

  function sortedPosts(blocks) {
    return blocks
      .filter((block) => block.type === "post")
      .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  }

  function postSummary(body, maxLength = 220) {
    const text = String(body || "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
  }

  function formatPostDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return String(date || "");
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));
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

  function getPostEffortMeta(post) {
    const explicit = String(post.effortLevel || "").toLowerCase();
    const slugAndTitle = `${post.slug || ""} ${post.title || ""}`.toLowerCase();
    if (explicit === "basic" || slugAndTitle.includes("diccionario-sin-miedo")) {
      return {
        key: "basic",
        shortBadge: "Básico (1 tarde · 0 €)",
      };
    }
    if (explicit === "advanced") {
      return {
        key: "advanced",
        shortBadge: "Avanzado (perfil técnico)",
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
      };
    }
    return {
      key: "basic",
      shortBadge: "Básico (1 tarde · 0 €)",
    };
  }

  function calculateReadingTime(body) {
    const words = String(body || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = Math.max(2, Math.ceil(words / 190));
    return `${minutes} min de lectura`;
  }

  function renderPost(post, preview, showTitle = true, summaryLimit = 180) {
    const id = articleId(post);
    const { label: category, filterKey } = getPostCategoryMeta(post);
    const effort = getPostEffortMeta(post);
    const readingTime = calculateReadingTime(post.body);
    const searchAttr =
      `${post.title || ""} ${post.author || ""} ${category} ${effort.shortBadge} ${post.excerpt || ""}`.toLowerCase();
    const articleAttrs = {
      class: "card post-card",
      "data-filter-cat": filterKey,
      "data-effort": effort.key,
      "data-author": post.author || "AIEvolutio",
      "data-search": searchAttr,
    };
    if (!preview) articleAttrs.id = id;

    const inner = el("div", { class: "post-card-inner" });
    const tagsRow = el("div", { class: "post-tags-row" });
    tagsRow.append(el("div", { class: "post-category-tag" }, [category]));
    tagsRow.append(el("span", { class: `effort-badge effort-${effort.key}` }, [effort.shortBadge]));
    inner.append(tagsRow);

    if (showTitle) {
      const title = el("h3");
      if (preview) {
        title.append(el("a", { href: articleUrl(post) }, [post.title || "Entrada"]));
      } else {
        title.textContent = post.title || "Entrada";
      }
      inner.append(title);
    }

    const metadata = [formatPostDate(post.date), post.author, readingTime]
      .filter(Boolean)
      .join(" · ");
    inner.append(el("p", { class: "muted post-meta" }, [metadata]));
    const previewSource = summaryLimit < 180 && post.excerpt ? post.excerpt : post.body;
    inner.append(renderPostBody(preview ? postSummary(previewSource, summaryLimit) : post.body));

    if (preview) {
      inner.append(el("a", { href: articleUrl(post), class: "text-link" }, ["Leer artículo →"]));
    }

    const article = el("article", articleAttrs);
    if (post.img) {
      const coverWrap = el("div", { class: "post-cover-wrap" });
      coverWrap.append(
        el("img", {
          src: post.img,
          alt: post.alt || `Imagen editorial para ${post.title || "el artículo"}`,
          class: "post-cover",
          loading: "lazy",
        }),
      );
      article.append(coverWrap);
    }
    article.append(inner);
    return article;
  }

  function appendInlineFormatted(parent, text) {
    String(text || "")
      .split(/(\*\*.+?\*\*)/g)
      .forEach((part) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          parent.append(el("strong", {}, [part.slice(2, -2)]));
        } else {
          parent.append(part);
        }
      });
  }

  function renderPostBody(body) {
    const content = el("div", { class: "post-body" });
    const paragraphs = String(body || "")
      .trim()
      .split(/\n\s*\n/)
      .filter(Boolean);

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (
        (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("\n")) ||
        trimmed.startsWith("### ")
      ) {
        const titleText = trimmed.startsWith("### ") ? trimmed.slice(4) : trimmed.slice(2, -2);
        content.append(el("h3", { class: "article-subtitle" }, [titleText]));
        return;
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
        const bodyRows = lines.slice(2).map(parseRow);
        const wrap = el("div", { class: "article-table-wrap" });
        const table = el("table", { class: "article-table" });
        const thead = el("thead");
        const headTr = el("tr");
        headers.forEach((hText) => {
          const th = el("th", { scope: "col" });
          appendInlineFormatted(th, hText);
          headTr.append(th);
        });
        thead.append(headTr);
        table.append(thead);
        const tbody = el("tbody");
        bodyRows.forEach((cells) => {
          const tr = el("tr");
          cells.forEach((cText) => {
            const td = el("td");
            appendInlineFormatted(td, cText);
            tr.append(td);
          });
          tbody.append(tr);
        });
        table.append(tbody);
        wrap.append(table);
        content.append(wrap);
        return;
      }
      if (lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "))) {
        const ul = el("ul", { class: "article-list" });
        lines.forEach((l) => {
          const li = el("li");
          appendInlineFormatted(li, l.trim().replace(/^[-*]\s+/, ""));
          ul.append(li);
        });
        content.append(ul);
        return;
      }

      if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        const ol = el("ol", { class: "article-ordered" });
        lines.forEach((l) => {
          const li = el("li");
          appendInlineFormatted(li, l.trim().replace(/^\d+\.\s+/, ""));
          ol.append(li);
        });
        content.append(ol);
        return;
      }

      const element = el("p");
      lines.forEach((line, index) => {
        if (index) element.append(el("br"));
        appendInlineFormatted(element, line);
      });
      content.append(element);
    });

    return content;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k.startsWith("aria-") || k === "role") node.setAttribute(k, v);
      else if (k.startsWith("data-")) node.setAttribute(k, v);
      else node[k] = v;
    });
    children.forEach((ch) => node.append(ch));
    return node;
  }

  function renderSection(sec) {
    const section = el("section", { id: sec.id, class: "section" }, []);
    const page = document.body.dataset.page || "home";
    const posts = sec.id === "blog" ? sortedPosts(sec.blocks || []) : [];
    const selectedPost =
      page === "blog"
        ? posts.find((post) => articleId(post) === window.location.hash.slice(1))
        : null;
    const sectionTitle =
      sec.id === "blog" && page === "home"
        ? "Guías recientes en lenguaje llano"
        : sec.id === "blog" && page === "blog"
          ? selectedPost
            ? "Artículo"
            : "Ideas, guías y casos de uso"
          : sec.id === "blog" && page === "blog-archive"
            ? "Artículos anteriores"
            : sec.title;
    const h = el("h2", {}, [sectionTitle]);
    section.append(h);

    if (selectedPost) {
      section.append(
        el("a", { href: "blog.html", class: "archive-back" }, ["← Volver a artículos recientes"]),
      );
    } else if (page === "blog-archive") {
      section.append(
        el("a", { href: "blog.html", class: "archive-back" }, ["← Ver artículos recientes"]),
      );
    }
    if (sec.id === "vision") {
      const visionGrid = el("div", { class: "vision-grid" });
      const textCol = el("div", { class: "vision-text" });
      const paragraphs = (sec.blocks || []).filter((b) => b.type === "p");
      const quoteBlock = (sec.blocks || []).find((b) => b.type === "quote");
      const fractalBlock = (sec.blocks || []).find((b) => b.type === "fractal");

      const paragraphsToRender = page === "home" ? paragraphs.slice(0, 1) : paragraphs;
      paragraphsToRender.forEach((p) => {
        textCol.append(el("p", {}, [p.body]));
      });
      visionGrid.append(textCol);

      if (quoteBlock) {
        const card = el("figure", { class: "vision-quote-card" });
        const badge = el("div", { class: "vision-quote-badge" });
        badge.innerHTML =
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span>AIVisio · Dirección y estrategia</span>';
        card.append(badge);

        const text = String(quoteBlock.body || "").trim();
        const hasDot = /[.!?]$/.test(text);
        const quoted = '"' + text.replace(/^"|"$/g, "") + (hasDot ? "" : ".") + '"';
        card.append(el("blockquote", {}, [quoted]));

        if (quoteBlock.author) {
          card.append(el("figcaption", {}, [quoteBlock.author]));
        }
        visionGrid.append(card);
      }

      section.append(visionGrid);

      if (fractalBlock) {
        const fractalWrap = el("div", { class: "vision-fractal" });
        if (fractalBlock.title) {
          fractalWrap.append(el("h3", { class: "fractal-title" }, [fractalBlock.title]));
        }
        const grid = el("div", { class: "fractal-grid" });
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
        const fractalItemsToRender =
          page === "home" ? (fractalBlock.items || []).slice(0, 4) : fractalBlock.items || [];
        fractalItemsToRender.forEach((item) => {
          const card = el("div", { class: "card fractal-card" });
          const header = el("div", { class: "fractal-card-header" });
          const iconBox = el("div", { class: "fractal-icon" });
          iconBox.innerHTML = fractalIcons[item.icon] || fractalIcons.sparkles;
          header.append(iconBox, el("h4", {}, [item.title]));
          card.append(header, el("p", {}, [item.body]));
          grid.append(card);
        });
        fractalWrap.append(grid);
        section.append(fractalWrap);
      }

      return section;
    }

    const containerClass =
      sec.kind === "grid" || (sec.id === "aiworkers" && (page === "team" || page === "home"))
        ? "grid"
        : sec.id === "blog"
          ? `grid post-grid${selectedPost ? " post-grid-single" : ""}`
          : "";
    const container = el("div", { class: containerClass });
    let blocks = sec.blocks || [];
    if (sec.id === "aiworkers" && page === "home") {
      blocks = blocks.filter((block) => block.type === "worker").slice(0, 3);
    }
    if (sec.id === "blog") {
      if (page === "blog") {
        blocks = selectedPost ? [selectedPost] : posts.slice(0, 6);
      } else if (page === "blog-archive") {
        blocks = posts.slice(6);
      } else {
        blocks = posts.slice(0, 3);
      }
    }

    blocks.forEach((b) => {
      if (b.type === "p") {
        const attrs = {};
        if (b.class) attrs.class = b.class;
        container.append(el("p", attrs, [b.body]));
      }
      if (b.type === "list") {
        const ul = el("ul", {
          class: `list ${b.style ? "list-" + b.style : ""}${b.class ? " " + b.class : ""}`,
        });
        (b.items || []).forEach((it) => {
          const text = typeof it === "string" ? it : it.text || "";
          ul.append(el("li", {}, [text]));
        });
        container.append(ul);
      }
      if (b.type === "worker") {
        const name = b.name || b.title || "";
        const agentKey = name.toLowerCase();
        const cardAttrs = {
          class: "worker-card",
          "data-agent": agentKey,
        };
        if (page === "team" && agentKey) cardAttrs.id = agentKey;
        const card = el("article", cardAttrs);

        const header = el("div", { class: "worker-header" });
        const iconBox = el("div", {
          class: "worker-icon-box",
          "aria-hidden": "true",
        });
        const agentIcons = {
          aivisio:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/><circle cx="12" cy="12" r="1.5"/></svg>',
          aifactura:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
          airespuestas:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
          aioferta:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
          aijuris:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M6 7l6-2 6 2"/><path d="M6 7l-3 6h6l-3-6z"/><path d="M18 7l-3 6h6l-3-6z"/><path d="M4 21h16"/></svg>',
          aidux:
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>',
        };
        iconBox.innerHTML =
          agentIcons[agentKey] ||
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
        header.append(iconBox);

        const meta = el("div", { class: "worker-meta" });
        meta.append(el("h3", { class: "worker-name" }, [name]));
        if (b.role) {
          meta.append(el("span", { class: "worker-role" }, [b.role]));
        }
        header.append(meta);
        card.append(header);

        const workerSummary = page === "home" && b.impact ? b.impact : b.body;
        if (workerSummary) {
          card.append(el("p", { class: "worker-body" }, [workerSummary]));
        }

        if (page !== "home") {
          if (b.impact) {
            const impactBox = el("div", { class: "worker-impact" });
            impactBox.append(
              el("span", { class: "worker-impact-label" }, ["Impacto para tu pyme: "]),
            );
            impactBox.append(el("strong", { class: "worker-impact-val" }, [b.impact]));
            card.append(impactBox);
          }

          if (Array.isArray(b.capabilities) && b.capabilities.length) {
            const capsWrap = el("div", { class: "worker-caps" });
            const capsList = el("ul", { class: "worker-caps-list" });
            b.capabilities.forEach((cap) => {
              capsList.append(el("li", {}, [cap]));
            });
            capsWrap.append(capsList);
            card.append(capsWrap);
          }

          if (isExternalHref(b.href)) {
            const label = b.cta || (name ? `Probar ${name}` : "Probar");
            const actions = el("div", { class: "worker-actions" });
            actions.append(
              el(
                "a",
                {
                  href: b.href,
                  class: "btn btn-sm btn-outline",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                [label],
              ),
            );
            card.append(actions);
          }
        }

        container.append(card);
      }
      if (b.type === "quote") {
        const fig = el("figure", { class: "quote" });
        if (b.img)
          fig.append(
            el("img", {
              src: b.img,
              alt: b.alt || b.author || "",
              loading: "lazy",
              "data-lightbox": "true",
              tabIndex: 0,
              role: "button",
              "aria-label": "Ampliar imagen",
              title: "Ampliar imagen",
            }),
          );
        const text = String(b.body || "").trim();
        const hasDot = /[.!?]$/.test(text);
        const quoted = '"' + text.replace(/^"|"$/g, "") + (hasDot ? "" : ".") + '"';
        const wrap = el("div", { class: "quote-text" });
        wrap.append(el("blockquote", {}, [quoted]));
        if (b.author) {
          wrap.append(" ");
          const author = (b.author || "").toString().toUpperCase();
          const cap = `(${author}${b.version ? " " + b.version : ""})`;
          wrap.append(el("figcaption", {}, [cap]));
        }
        fig.append(wrap);
        container.append(fig);
      }
      if (b.type === "image") {
        const fig = el("figure", { class: "image" });
        fig.append(el("img", { src: b.src, alt: b.alt || "", loading: "lazy" }));
        if (b.caption) fig.append(el("figcaption", {}, [b.caption]));
        container.append(fig);
      }
      if (b.type === "link" && isAllowedHref(b.href))
        container.append(el("a", { href: b.href, class: "btn" }, [b.title || b.href]));
      if (b.type === "card") {
        const c = el("div", { class: "card" });
        if (b.img)
          c.append(
            el("img", {
              src: b.img,
              alt: b.alt || b.title || "",
              loading: "lazy",
              class: "avatar",
              "data-lightbox": "true",
              tabIndex: 0,
              role: "button",
              "aria-label": "Ampliar imagen",
              title: "Ampliar imagen",
            }),
          );
        c.append(el("h3", {}, [b.title || ""]));
        if (b.body) {
          const bodyStr = String(b.body);
          const lower = bodyStr.toLowerCase();
          const marker = "resultado típico:";
          const idx = lower.indexOf(marker);
          if (idx !== -1) {
            const before = bodyStr.slice(0, idx).trim();
            const after = bodyStr.slice(idx + marker.length).trim();
            if (before) c.append(el("p", {}, [before]));
            const resWrap = el("div", { class: "result" });
            resWrap.append(el("div", { class: "result-label" }, ["Resultado típico"]));
            if (after) resWrap.append(el("p", { class: "result-value" }, [after]));
            c.append(resWrap);
          } else {
            c.append(el("p", {}, [b.body]));
          }
        }
        if (Array.isArray(b.items) && b.items.length) {
          const ul = el("ul", {
            class: `list ${b.listStyle ? "list-" + b.listStyle : ""}`,
          });
          b.items.forEach((it) => ul.append(el("li", {}, [it])));
          c.append(ul);
        }
        container.append(c);
      }
      if (b.type === "event")
        container.append(
          el("div", { class: "card", role: "article" }, [
            el("h3", {}, [b.title || "Evento"]),
            el("p", {}, [b.date || ""]),
            el("p", {}, [b.body || ""]),
          ]),
        );
      if (b.type === "post") {
        const isArticle = page === "blog" && selectedPost === b;
        const isPreview =
          page === "home" || ((page === "blog" || page === "blog-archive") && !selectedPost);
        container.append(renderPost(b, isPreview, !isArticle, page === "home" ? 80 : 180));
      }
      if (b.type === "links") {
        const row = el("div", { class: b.class || "" });
        (b.items || [])
          .filter((item) => isAllowedHref(item.href))
          .forEach((item) =>
            row.append(el("a", { href: item.href, class: "btn" }, [item.title || item.href])),
          );
        container.append(row);
      }
    });

    if (page === "blog" && sec.id === "blog" && !selectedPost && posts.length > 6) {
      container.append(
        el(
          "a",
          {
            href: "archivo.html",
            class: "btn section-cta",
          },
          ["Ver artículos anteriores"],
        ),
      );
    }
    if (page === "home" && sec.id === "blog") {
      container.append(
        el("a", { href: "blog.html", class: "btn section-cta" }, ["Explorar todos los artículos"]),
      );
    }
    if (page === "home" && sec.id === "aiworkers") {
      container.append(
        el("a", { href: "equipo.html", class: "btn section-cta" }, [
          "Conocer la organización y sus AIWorkers",
        ]),
      );
    }

    section.append(container);
    return section;
  }

  function renderSections(sections) {
    const mount = $("#sections");
    if (!mount) return;
    mount.replaceChildren();
    const page = document.body.dataset.page || "home";
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const visibleSections =
      page === "blog" || page === "blog-archive"
        ? sections.filter((section) => section.id === "blog")
        : page === "team"
          ? sections.filter((section) => section.id === "aiworkers")
          : page === "contact"
            ? []
            : sections.filter((section) => ["vision", "aiworkers", "blog"].includes(section.id));
    visibleSections.forEach((section) => {
      if (section.id !== "eventos") {
        mount.append(renderSection(section));
        return;
      }

      const upcomingEvents = (section.blocks || []).filter(
        (event) =>
          event.type !== "event" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(event.date || "") ||
          event.date >= today,
      );
      if (upcomingEvents.length) {
        mount.append(renderSection({ ...section, blocks: upcomingEvents }));
      }
    });
  }

  function setupBlogFilters() {
    const blogSection = $("#blog");
    if (!blogSection) return;
    const pills = $$(".topic-pill[data-filter]", blogSection);
    const searchInput = $("#blog-search", blogSection);
    const statusEl = $("#blog-filter-status", blogSection);
    const cards = $$(".post-card", blogSection);
    if (!cards.length) return;

    let activeFilter = "all";
    let searchQuery = "";

    function applyFilter() {
      let visibleCount = 0;
      cards.forEach((card) => {
        const metaHolder = card.querySelector("[data-filter-cat]") || card;
        const cat = metaHolder.getAttribute("data-filter-cat") || "";
        const searchData = (
          metaHolder.getAttribute("data-search") ||
          card.textContent ||
          ""
        ).toLowerCase();
        const matchesCat = activeFilter === "all" || cat === activeFilter;
        const matchesSearch = !searchQuery || searchData.includes(searchQuery);
        const show = matchesCat && matchesSearch;
        card.hidden = !show;
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });
      if (statusEl) {
        statusEl.textContent = `Mostrando ${visibleCount} artículos.`;
      }
    }

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          p.classList.remove("active");
          p.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("active");
        pill.setAttribute("aria-pressed", "true");
        activeFilter = pill.getAttribute("data-filter") || "all";
        applyFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilter();
      });
    }
  }

  function setupGlossaryFilters() {
    const glossarySection = $("#glosario-llano");
    if (!glossarySection) return;
    const pills = $$(".glossary-pill[data-effort-filter]", glossarySection);
    const searchInput = $("#glossary-search", glossarySection);
    const statusEl = $("#glossary-filter-status", glossarySection);
    const cards = $$(".glossary-card", glossarySection);
    if (!cards.length) return;

    let activeEffort = "all";
    let searchQuery = "";

    function applyFilter() {
      let visibleCount = 0;
      cards.forEach((card) => {
        const effort = card.getAttribute("data-effort") || "";
        const searchData = (
          card.getAttribute("data-glossary-search") ||
          card.textContent ||
          ""
        ).toLowerCase();
        const matchesEffort = activeEffort === "all" || effort === activeEffort;
        const matchesSearch = !searchQuery || searchData.includes(searchQuery);
        const show = matchesEffort && matchesSearch;
        card.hidden = !show;
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });
      if (statusEl) {
        statusEl.textContent = `Mostrando ${visibleCount} conceptos del glosario.`;
      }
    }

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          p.classList.remove("active");
          p.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("active");
        pill.setAttribute("aria-pressed", "true");
        activeEffort = pill.getAttribute("data-effort-filter") || "all";
        applyFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilter();
      });
    }
  }

  function updateBlogView() {
    if (document.body.dataset.page !== "blog" || !state.content) return;
    const blogSection = state.content.sections.find((section) => section.id === "blog");
    const posts = sortedPosts(blogSection ? blogSection.blocks : []);
    const selectedPost = posts.find((post) => articleId(post) === window.location.hash.slice(1));
    const mount = $("#sections");
    // Si ya existe contenido prerenderizado en #sections y no se solicita un hash de artículo concreto,
    // preservamos el DOM prerenderizado con filtros y diseño editorial completo.
    if (!selectedPost && mount && mount.children.length > 0) {
      setupBlogFilters();
      setupGlossaryFilters();
      return;
    }
    const pageTitle = $("#page-title");
    if (pageTitle) pageTitle.textContent = selectedPost?.title || "Guías en lenguaje llano";
    document.title = selectedPost
      ? `${selectedPost.title} — AIEvolutio`
      : "Guías en lenguaje llano — AIEvolutio";
    renderSections(state.content.sections);
    setupBlogFilters();
    setupGlossaryFilters();
    if (selectedPost) document.getElementById(articleId(selectedPost))?.scrollIntoView();
  }

  function setupTheme() {
    const btn = $("#theme-toggle");
    const KEY = "ae_theme";
    function apply(v) {
      document.documentElement.dataset.theme = v;
      if (btn) {
        btn.setAttribute("aria-pressed", v === "dark");
        btn.setAttribute("title", v === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      }
    }
    const stored = localStorage.getItem(KEY);
    const systemDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    apply(stored || (systemDark ? "dark" : "light"));
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme;
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);
      apply(next);
    });
  }

  function setupLightbox() {
    const root = document.getElementById("lightbox");
    if (!root) return;
    const img = root.querySelector("img");
    const caption = root.querySelector(".lightbox-caption");
    const closeBtn = root.querySelector(".lightbox-close");
    const backdrop = root.querySelector(".lightbox-backdrop");

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      caption.textContent = alt || "";
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      closeBtn.focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      img.src = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.matches && t.matches("img[data-lightbox]")) {
        open(t.src, t.alt);
      }
    });
    document.addEventListener("keydown", (e) => {
      const t = e.target;
      if (e.key === "Enter" || e.key === " ") {
        if (t && t.matches && t.matches("img[data-lightbox]")) {
          e.preventDefault();
          open(t.src, t.alt);
        }
      }
    });
  }

  function setupMaturityDiagnostic() {
    const root = document.getElementById("maturity-diagnostic");
    if (!root) return;

    const scores = { priority: 25, base: 20, guardrail: 20 };
    const choices = { priority: "facturas", base: "basica", guardrail: "privacidad" };

    function goToStep(stepNum) {
      const target = String(stepNum);
      root.querySelectorAll("[data-wizard-step]").forEach((tab) => {
        const isCurrent = tab.getAttribute("data-wizard-step") === target;
        tab.classList.toggle("active", isCurrent);
        tab.setAttribute("aria-selected", String(isCurrent));
      });
      root.querySelectorAll("[data-step-panel]").forEach((panel) => {
        panel.hidden = panel.getAttribute("data-step-panel") !== target;
      });
    }

    function updateDiagnosis() {
      const avg = Math.round((scores.priority + scores.base + scores.guardrail) / 3);
      const badgeEl = document.getElementById("maturity-status-badge");
      const leadEl = document.getElementById("maturity-lead-agent");
      const scoreEl = document.getElementById("maturity-score-num");
      const stateEl = document.getElementById("maturity-level-label");
      const descEl = document.getElementById("maturity-prescription");
      const ctaEl = document.getElementById("maturity-cta-link");

      if (scoreEl) scoreEl.textContent = `${avg} %`;

      if (choices.guardrail === "privacidad" || scores.guardrail < 40) {
        if (badgeEl) badgeEl.textContent = "Prioridad de protección";
        if (leadEl) leadEl.textContent = "AIJuris + AIFactura";
        if (stateEl) stateEl.textContent = "Inicio prudente";
        if (descEl) {
          descEl.textContent =
            "Conviene empezar con una estantería sencilla: crea una lista breve de qué documentos no deben salir de tu equipo y prueba una plantilla sin coste con datos de ejemplo antes de contratar cuotas.";
        }
        if (ctaEl) {
          ctaEl.href =
            "articulos/articulo-2026-11-10-ia-confidencial-en-tu-propio-ordenador-como-procesar-contratos-locales-cumpliendo-el-rgpd-sin-pasar-por-la-nube.html";
          ctaEl.textContent = "Leer guía práctica de privacidad local";
        }
      } else if (scores.base < 50) {
        if (badgeEl) badgeEl.textContent = "Orden previo de carpetas";
        if (leadEl) leadEl.textContent = "AIDux + AIRespuestas";
        if (stateEl) stateEl.textContent = "Base en marcha";
        if (descEl) {
          descEl.textContent =
            "El mayor retorno llega ordenando primero tus preguntas frecuentes y documentos modelo en carpetas claras. Una vez ordenado ese punto, un asistente ligero ahorra tiempo sin perder supervisión humana.";
        }
        if (ctaEl) {
          ctaEl.href = "blog.html#glosario-llano";
          ctaEl.textContent = "Consultar diccionario en lenguaje llano";
        }
      } else if (avg < 75) {
        if (badgeEl) badgeEl.textContent = "Bricolaje guiado";
        if (leadEl) leadEl.textContent = "AIVisio + AIOferta";
        if (stateEl) stateEl.textContent = "Equilibrado";
        if (descEl) {
          descEl.textContent =
            "Tienes buena base documental y criterio preventivo. El siguiente paso útil es automatizar borradores repetitivos manteniendo revisión humana obligatoria y evitando suscripciones que no uses.";
        }
        if (ctaEl) {
          ctaEl.href = "calculadora.html";
          ctaEl.textContent = "Calcular carga horaria con tus datos";
        }
      } else {
        if (badgeEl) badgeEl.textContent = "Madurez sostenible";
        if (leadEl) leadEl.textContent = "AIVisio · AIDux · AIJuris";
        if (stateEl) stateEl.textContent = "Avanzado";
        if (descEl) {
          descEl.textContent =
            "Combinas privacidad preventiva, orden operativo y control de costes. Revisa periódicamente el saldo real de horas liberadas y prioriza herramientas abiertas o ejecutables en tu propio equipo.";
        }
        if (ctaEl) {
          ctaEl.href = "equipo.html";
          ctaEl.textContent = "Explorar la arquitectura del equipo";
        }
      }

      if (typeof window.gtag === "function") {
        window.gtag("event", "maturity_diagnosis", {
          priority_choice: choices.priority,
          base_choice: choices.base,
          guardrail_choice: choices.guardrail,
          total_score: avg,
        });
      }
    }

    root.querySelectorAll("[data-wizard-step]").forEach((tab) => {
      tab.addEventListener("click", () => {
        goToStep(tab.getAttribute("data-wizard-step") || "1");
      });
    });

    root.querySelectorAll("[data-wizard-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        goToStep(btn.getAttribute("data-wizard-next") || "2");
      });
    });

    root.querySelectorAll("[data-wizard-prev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        goToStep(btn.getAttribute("data-wizard-prev") || "1");
      });
    });

    root.querySelectorAll(".maturity-btn[data-dim]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dim = btn.getAttribute("data-dim");
        if (!dim) return;
        root.querySelectorAll(`.maturity-btn[data-dim="${dim}"]`).forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        scores[dim] = parseInt(btn.getAttribute("data-score") || "0", 10) || 0;
        choices[dim] = btn.getAttribute("data-value") || choices[dim];
        updateDiagnosis();
      });
    });

    goToStep("1");
    updateDiagnosis();
  }

  function setupRoiCalculator() {
    const root = document.getElementById("roi-calculator");
    if (!root) return;

    const tasks = {
      facturas: {
        worker: "AIFactura",
        anchor: "aifactura",
      },
      whatsapp: {
        worker: "AIRespuestas",
        anchor: "airespuestas",
      },
      presupuestos: {
        worker: "AIOferta",
        anchor: "aioferta",
      },
      legal: {
        worker: "AIJuris",
        anchor: "aijuris",
      },
    };

    const hoursInput = document.getElementById("calc-hours-input");
    const rateInput = document.getElementById("calc-rate-input");
    const subInput = document.getElementById("calc-sub-input");

    let currentTask = "facturas";
    let currentFactor = 0.4;

    function clampNum(val, min, max, fallback) {
      const parsed = Number.parseFloat(String(val ?? ""));
      if (!Number.isFinite(parsed)) return fallback;
      return Math.min(max, Math.max(min, parsed));
    }

    function syncPresets(selector, attr, activeValue) {
      root.querySelectorAll(selector).forEach((btn) => {
        const matches = Number(btn.getAttribute(attr)) === Number(activeValue);
        btn.classList.toggle("active", matches);
        btn.setAttribute("aria-pressed", String(matches));
      });
    }

    function update() {
      const item = tasks[currentTask] || tasks.facturas;
      const hoursPerWeek = clampNum(hoursInput?.value, 1, 80, 4);
      const hourlyRate = clampNum(rateInput?.value, 5, 250, 25);
      const monthlySub = clampNum(subInput?.value, 0, 5000, 0);

      const monthlyHours = hoursPerWeek * 4.33 * currentFactor;
      const netEuro = Math.round(monthlyHours * hourlyRate - monthlySub);

      const hoursEl = root.querySelector(".roi-res-hours");
      const moneyEl = root.querySelector(".roi-res-money");
      const workerEl = root.querySelector(".roi-res-worker");
      const noteEl = document.getElementById("calc-formula-note");
      const linkEl = root.querySelector(".roi-res-link");

      if (hoursEl) hoursEl.textContent = `~${monthlyHours.toFixed(1).replace(".", ",")} h/mes`;
      if (moneyEl) moneyEl.textContent = `~${netEuro} €/mes`;
      if (workerEl) workerEl.textContent = item.worker;
      if (noteEl) {
        noteEl.textContent = `Fórmula transparente: ${hoursPerWeek} h/sem × 4,33 semanas × ${Math.round(currentFactor * 100)} % × ${hourlyRate} €/h − ${monthlySub} €/mes de cuota. Siempre sujeto a validación humana.`;
      }
      if (linkEl) {
        linkEl.href = `equipo.html#${item.anchor}`;
        linkEl.textContent = `Conocer a ${item.worker}`;
      }

      syncPresets("[data-hours-preset]", "data-hours-preset", hoursPerWeek);
      syncPresets("[data-rate-preset]", "data-rate-preset", hourlyRate);

      if (typeof window.gtag === "function") {
        window.gtag("event", "roi_calculation", {
          task: currentTask,
          hours_per_week: hoursPerWeek,
          factor_pct: Math.round(currentFactor * 100),
          estimated_hours: Number(monthlyHours.toFixed(1)),
        });
      }
    }

    root.querySelectorAll("[data-hours-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (hoursInput) hoursInput.value = btn.getAttribute("data-hours-preset") || "4";
        update();
      });
    });

    root.querySelectorAll("[data-rate-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (rateInput) rateInput.value = btn.getAttribute("data-rate-preset") || "25";
        update();
      });
    });

    [hoursInput, rateInput, subInput].forEach((input) => {
      if (input) {
        input.addEventListener("input", update);
      }
    });

    root.querySelectorAll("[data-task]").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll("[data-task]").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        currentTask = btn.dataset.task || "facturas";
        update();
      });
    });

    root.querySelectorAll("[data-factor]").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll("[data-factor]").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        currentFactor = clampNum(btn.getAttribute("data-factor"), 0.1, 0.9, 0.4);
        update();
      });
    });

    update();
  }

  function setupEmoCardActions() {
    const EMO_KEY = "ae_emo_state_v1";
    const loadState = () => {
      try {
        return JSON.parse(localStorage.getItem(EMO_KEY) || "{}");
      } catch {
        return {};
      }
    };
    const saveState = (st) => {
      try {
        localStorage.setItem(EMO_KEY, JSON.stringify(st));
      } catch {
        /* ignore */
      }
    };

    const syncAllCardButtons = () => {
      const st = loadState();
      const votes = st.votes || {};
      const comments = st.comments || {};
      document.querySelectorAll(".emo-mini-btn[data-emo-vote]").forEach((btn) => {
        const slug = btn.getAttribute("data-emo-slug") || "";
        const vType = btn.getAttribute("data-emo-vote") || "";
        const base = parseInt(btn.getAttribute("data-base-count") || "0", 10) || 0;
        const active = votes[slug] === vType;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
        const countEl = btn.querySelector("[data-emo-count]");
        if (countEl) countEl.textContent = String(base + (active ? 1 : 0));
      });
      document.querySelectorAll("[data-emo-comments-count]").forEach((elCount) => {
        const slug = elCount.getAttribute("data-emo-comments-count") || "";
        const localArr = Array.isArray(comments[slug]) ? comments[slug] : [];
        if (localArr.length > 0) {
          elCount.textContent = String(localArr.length);
        }
      });
    };

    document.querySelectorAll(".emo-mini-btn[data-emo-vote]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.getAttribute("data-emo-slug") || "";
        const vType = btn.getAttribute("data-emo-vote") || "";
        if (!slug || !vType) return;
        const st = loadState();
        st.votes = st.votes || {};
        st.votes[slug] = st.votes[slug] === vType ? null : vType;
        saveState(st);
        syncAllCardButtons();
        if (typeof window.gtag === "function" && st.votes[slug]) {
          window.gtag("event", "emo_insight_feedback", {
            article_slug: slug,
            vote_type: st.votes[slug],
            event_category: "emo_insight",
          });
        }
      });
    });

    syncAllCardButtons();
  }

  async function main() {
    setupTheme();
    setupLightbox();
    setupMaturityDiagnostic();
    setupRoiCalculator();
    setupBlogFilters();
    setupGlossaryFilters();
    setupEmoCardActions();
    const currentYear = $("#current-year");
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    try {
      await loadContent("es");
      const navOverride = await loadNavigationOverride();
      renderNav(navOverride || state.content.navigation);
      const page = document.body.dataset.page || "home";
      const mount = $("#sections");

      if (page === "blog") {
        window.addEventListener("hashchange", updateBlogView);
        updateBlogView();
      } else if (
        (page === "home" || page === "team" || page === "blog-archive") &&
        mount &&
        mount.children.length > 0
      ) {
        // Preservar el DOM prerenderizado estáticamente para evitar regresiones visuales y FOUC
      } else {
        renderSections(state.content.sections);
      }

      if (window.location.hash) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
      }
    } catch (e) {
      console.error(e);
      const mount = $("#sections");
      if (mount && mount.children.length === 0) {
        mount.innerHTML = "<p>Error cargando contenido.</p>";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
