(() => {
  const state = { content: null };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function isAllowedHref(value) {
    const href = String(value ?? "").trim();
    if (!href) return false;
    if (href.startsWith("#")) return true;
    try {
      return ["http:", "https:", "mailto:"].includes(
        new URL(href, document.baseURI).protocol,
      );
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
      .sort((left, right) =>
        String(right.date || "").localeCompare(String(left.date || "")),
      );
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")))
      return String(date || "");
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));
  }

  function getPostCategoryMeta(post) {
    const text =
      `${post.title || ""} ${post.body || ""} ${post.category || ""}`.toLowerCase();
    const author = (post.author || "").toLowerCase();
    if (
      author.includes("juris") ||
      text.includes("ai act") ||
      text.includes("legal") ||
      text.includes("contrato") ||
      text.includes("rgpd") ||
      text.includes("guardarrail")
    ) {
      return { label: "Guardarrail Ético & Legal", filterKey: "legal" };
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
      return { label: "Visión & Estrategia", filterKey: "estrategia" };
    }
    if (
      text.includes("slm") ||
      text.includes("mcp") ||
      text.includes("hardware") ||
      text.includes("local") ||
      text.includes("modelo") ||
      text.includes("offline")
    ) {
      return { label: "Tecnología & SLMs", filterKey: "tecnologia" };
    }
    return { label: "IAWorkers & Procesos", filterKey: "tecnologia" };
  }

  function calculateReadingTime(body) {
    const words = String(body || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = Math.max(2, Math.ceil(words / 190));
    return `${minutes} min de lectura`;
  }

  function renderPost(post, preview, showTitle = true) {
    const id = articleId(post);
    const { label: category, filterKey } = getPostCategoryMeta(post);
    const readingTime = calculateReadingTime(post.body);
    const searchAttr =
      `${post.title || ""} ${post.author || ""} ${category} ${post.excerpt || ""}`.toLowerCase();
    const articleAttrs = {
      class: "card post-card",
      "data-filter-cat": filterKey,
      "data-author": post.author || "AIEvolutio",
      "data-search": searchAttr,
    };
    if (!preview) articleAttrs.id = id;

    const inner = el("div", { class: "post-card-inner" });
    inner.append(el("div", { class: "post-category-tag" }, [category]));

    if (showTitle) {
      const title = el("h3");
      if (preview) {
        title.append(
          el("a", { href: articleUrl(post) }, [post.title || "Entrada"]),
        );
      } else {
        title.textContent = post.title || "Entrada";
      }
      inner.append(title);
    }

    const metadata = [formatPostDate(post.date), post.author, readingTime]
      .filter(Boolean)
      .join(" · ");
    inner.append(el("p", { class: "muted post-meta" }, [metadata]));
    inner.append(
      renderPostBody(preview ? postSummary(post.body, 180) : post.body),
    );

    if (preview) {
      inner.append(
        el("a", { href: articleUrl(post), class: "text-link" }, [
          "Leer artículo →",
        ]),
      );
    }

    const article = el("article", articleAttrs);
    if (post.img) {
      const coverWrap = el("div", { class: "post-cover-wrap" });
      coverWrap.append(
        el("img", {
          src: post.img,
          alt:
            post.alt || `Imagen editorial para ${post.title || "el artículo"}`,
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
        (trimmed.startsWith("**") &&
          trimmed.endsWith("**") &&
          !trimmed.includes("\n")) ||
        trimmed.startsWith("### ")
      ) {
        const titleText = trimmed.startsWith("### ")
          ? trimmed.slice(4)
          : trimmed.slice(2, -2);
        content.append(el("h3", { class: "article-subtitle" }, [titleText]));
        return;
      }

      const lines = trimmed.split("\n");
      if (
        lines.every(
          (l) => l.trim().startsWith("- ") || l.trim().startsWith("* "),
        )
      ) {
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
        ? posts.find(
            (post) => articleId(post) === window.location.hash.slice(1),
          )
        : null;
    const sectionTitle =
      sec.id === "blog" && page === "home"
        ? "Ideas recientes para llevar el volante"
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
        el("a", { href: "blog.html", class: "archive-back" }, [
          "← Volver a artículos recientes",
        ]),
      );
    } else if (page === "blog-archive") {
      section.append(
        el("a", { href: "blog.html", class: "archive-back" }, [
          "← Ver artículos recientes",
        ]),
      );
    }
    const containerClass =
      sec.kind === "grid" ||
      (sec.id === "aiworkers" && (page === "team" || page === "home"))
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
        const card = el("article", {
          class: "worker-card",
          "data-agent": agentKey,
        });

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

        if (b.body) {
          card.append(el("p", { class: "worker-body" }, [b.body]));
        }

        if (b.impact) {
          const impactBox = el("div", { class: "worker-impact" });
          impactBox.append(
            el("span", { class: "worker-impact-label" }, [
              "Impacto para tu pyme: ",
            ]),
          );
          impactBox.append(
            el("strong", { class: "worker-impact-val" }, [b.impact]),
          );
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
        const quoted =
          '"' + text.replace(/^"|"$/g, "") + (hasDot ? "" : ".") + '"';
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
        fig.append(
          el("img", { src: b.src, alt: b.alt || "", loading: "lazy" }),
        );
        if (b.caption) fig.append(el("figcaption", {}, [b.caption]));
        container.append(fig);
      }
      if (b.type === "link" && isAllowedHref(b.href))
        container.append(
          el("a", { href: b.href, class: "btn" }, [b.title || b.href]),
        );
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
            resWrap.append(
              el("div", { class: "result-label" }, ["Resultado típico"]),
            );
            if (after)
              resWrap.append(el("p", { class: "result-value" }, [after]));
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
          page === "home" ||
          ((page === "blog" || page === "blog-archive") && !selectedPost);
        container.append(renderPost(b, isPreview, !isArticle));
      }
      if (b.type === "links") {
        const row = el("div", { class: b.class || "" });
        (b.items || [])
          .filter((item) => isAllowedHref(item.href))
          .forEach((item) =>
            row.append(
              el("a", { href: item.href, class: "btn" }, [
                item.title || item.href,
              ]),
            ),
          );
        container.append(row);
      }
    });

    if (
      page === "blog" &&
      sec.id === "blog" &&
      !selectedPost &&
      posts.length > 6
    ) {
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
        el("a", { href: "blog.html", class: "btn section-cta" }, [
          "Explorar todos los artículos",
        ]),
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
            : sections.filter((section) => section.id !== "home");
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

  function updateBlogView() {
    if (document.body.dataset.page !== "blog" || !state.content) return;
    const blogSection = state.content.sections.find(
      (section) => section.id === "blog",
    );
    const posts = sortedPosts(blogSection ? blogSection.blocks : []);
    const selectedPost = posts.find(
      (post) => articleId(post) === window.location.hash.slice(1),
    );
    const mount = $("#sections");
    // Si ya existe contenido prerenderizado en #sections y no se solicita un hash de artículo concreto,
    // preservamos el DOM prerenderizado con filtros y diseño editorial completo.
    if (!selectedPost && mount && mount.children.length > 0) {
      setupBlogFilters();
      return;
    }
    const pageTitle = $("#page-title");
    if (pageTitle)
      pageTitle.textContent =
        selectedPost?.title || "Ideas para llevar el volante";
    document.title = selectedPost
      ? `${selectedPost.title} — AIEvolutio`
      : "Ideas para llevar el volante — AIEvolutio";
    renderSections(state.content.sections);
    setupBlogFilters();
    if (selectedPost)
      document.getElementById(articleId(selectedPost))?.scrollIntoView();
  }

  function setupTheme() {
    const btn = $("#theme-toggle");
    const KEY = "ae_theme";
    function apply(v) {
      document.documentElement.dataset.theme = v;
      if (btn) {
        btn.setAttribute("aria-pressed", v === "dark");
        btn.setAttribute(
          "title",
          v === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
        );
      }
    }
    const stored = localStorage.getItem(KEY);
    const systemDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  function setupVolanteDiagnostic() {
    const root = document.getElementById("volante-diagnostic");
    if (!root) return;

    const scores = { visio: 15, dux: 15, juris: 10 };

    function updateDiagnosis() {
      const avg = Math.round((scores.visio + scores.dux + scores.juris) / 3);
      const badgeEl = document.getElementById("volante-status-badge");
      const leadEl = document.getElementById("volante-lead-agent");
      const scoreEl = document.getElementById("volante-score-num");
      const stateEl = document.getElementById("volante-curve-state");
      const descEl = document.getElementById("volante-prescription");

      if (scoreEl) scoreEl.textContent = `${avg}%`;

      if (scores.juris < 40) {
        if (badgeEl) badgeEl.textContent = "Alerta: sin guardarraíl de protección";
        if (leadEl) leadEl.textContent = "Prioridad: AIJuris (Guardarraíl)";
        if (stateEl) stateEl.textContent = "Vulnerable";
        if (descEl) {
          descEl.textContent =
            "Antes de conectar herramientas, es prioritario proteger la privacidad y los secretos de tu negocio con el guardarraíl de AIJuris: aislar datos sensibles en local, revisar acuerdos con proveedores y garantizar el respeto al RGPD y al AI Act europeo.";
        }
      } else if (scores.visio < 50) {
        if (badgeEl) badgeEl.textContent = "Oportunidad: definir el rumbo";
        if (leadEl) leadEl.textContent = "Prioridad: AIVisio (Dirección y estrategia)";
        if (stateEl) stateEl.textContent = "Explorando";
        if (descEl) {
          descEl.textContent =
            "Contáis con prudencia, pero falta abrir la mirada hacia nuevas oportunidades: AIVisio ayuda a plantear las preguntas adecuadas para descubrir qué servicios diferenciales podéis ofrecer ahora que el conocimiento práctico es accesible a cualquier pequeña empresa.";
        }
      } else if (scores.dux < 50) {
        if (badgeEl) badgeEl.textContent = "Reto: aterrizar en la práctica técnica";
        if (leadEl) leadEl.textContent = "Prioridad: AIDux (Dirección tecnológica)";
        if (stateEl) stateEl.textContent = "En marcha";
        if (descEl) {
          descEl.textContent =
            "Tenéis clara la meta y cuidáis la seguridad, pero la operativa diaria se frena en tareas manuales. Es el momento de que AIDux aterrice soluciones sencillas y modelos compactos locales para devolver horas útiles al equipo.";
        }
      } else if (avg < 85) {
        if (badgeEl) badgeEl.textContent = "Progreso: integración equilibrada";
        if (leadEl) leadEl.textContent = "Sinergia: AIVisio · AIDux · AIJuris";
        if (stateEl) stateEl.textContent = "Equilibrado";
        if (descEl) {
          descEl.textContent =
            "Vuestra organización avanza con criterio y equilibrio. El siguiente paso consiste en consolidar automatizaciones útiles y transformar el tiempo recuperado en mayor atención humana y cercanía con vuestros clientes.";
        }
      } else {
        if (badgeEl) badgeEl.textContent = "Madurez: rumbo claro y sostenible";
        if (leadEl) leadEl.textContent = "Equilibrio AIEvolutio";
        if (stateEl) stateEl.textContent = "Avanzado";
        if (descEl) {
          descEl.textContent =
            "Rumbo firme y maduro: combináis visión humana (AIVisio), artesanía técnica sobria (AIDux) y protección ética y legal estricta (AIJuris) para hacer posible lo que antes parecía inalcanzable.";
        }
      }

      if (typeof window.gtag === "function") {
        window.gtag("event", "volante_diagnosis", {
          visio_score: scores.visio,
          dux_score: scores.dux,
          juris_score: scores.juris,
          total_score: avg,
        });
      }
    }

    root.querySelectorAll(".volante-btn[data-dim]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dim = btn.getAttribute("data-dim");
        if (!dim) return;
        root
          .querySelectorAll(`.volante-btn[data-dim="${dim}"]`)
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        scores[dim] = parseInt(btn.getAttribute("data-score") || "0", 10) || 0;
        updateDiagnosis();
      });
    });

    updateDiagnosis();
  }

  function setupRoiCalculator() {
    const root = document.getElementById("roi-calculator");
    if (!root) return;

    const data = {
      facturas: {
        worker: "AIFactura",
        role: "Facturas y asientos contables",
        hours: [12, 24, 45],
        savings: [300, 600, 1125],
        desc: "Extracción automática de importes, CIFs y conceptos desde facturas y tickets en PDF directos a tu gestoría o ERP.",
        link: "equipo.html",
      },
      whatsapp: {
        worker: "AIRespuestas",
        role: "Atención 24/7 y citas en WhatsApp",
        hours: [15, 30, 60],
        savings: [375, 750, 1500],
        desc: "Respuesta inmediata a clientes potenciales fuera del horario comercial y filtrado de citas en tu calendario.",
        link: "equipo.html",
      },
      presupuestos: {
        worker: "AIOferta",
        role: "Presupuestos rápidos en PDF",
        hours: [10, 20, 38],
        savings: [250, 500, 950],
        desc: "Transforma notas de voz de WhatsApp o correos en propuestas formales desglosadas listas para revisar y enviar en 10 minutos.",
        link: "equipo.html",
      },
      legal: {
        worker: "AIJuris",
        role: "Guardarrail ético-legal, contratos y AI Act",
        hours: [8, 16, 32],
        savings: [400, 800, 1600],
        desc: "Detección preventiva de cláusulas abusivas y adecuación al Reglamento Europeo de IA sin minutas infladas.",
        link: "https://chatgpt.com/g/g-68bb49c6392081918c1bd85b74a78b0d-aijuris",
      },
    };

    let teamSizeIndex = 0;
    let currentTask = "facturas";

    function update() {
      const item = data[currentTask] || data.facturas;
      const h = item.hours[teamSizeIndex];
      const s = item.savings[teamSizeIndex];

      const hoursEl = root.querySelector(".roi-res-hours");
      const moneyEl = root.querySelector(".roi-res-money");
      const workerEl = root.querySelector(".roi-res-worker");
      const descEl = root.querySelector(".roi-res-desc");
      const linkEl = root.querySelector(".roi-res-link");

      if (hoursEl) hoursEl.textContent = `~${h} h/mes`;
      if (moneyEl) moneyEl.textContent = `~${s} €/mes`;
      if (workerEl) workerEl.textContent = item.worker;
      if (descEl) descEl.textContent = item.desc;
      if (linkEl) {
        linkEl.href = item.link;
        linkEl.textContent = `Conocer a ${item.worker} →`;
      }

      if (typeof window.gtag === "function") {
        window.gtag("event", "roi_calculation", {
          task: currentTask,
          team_size_idx: teamSizeIndex,
          estimated_hours: h,
        });
      }
    }

    root.querySelectorAll("[data-team-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        root
          .querySelectorAll("[data-team-size]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        teamSizeIndex = parseInt(btn.dataset.teamSize, 10) || 0;
        update();
      });
    });

    root.querySelectorAll("[data-task]").forEach((btn) => {
      btn.addEventListener("click", () => {
        root
          .querySelectorAll("[data-task]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentTask = btn.dataset.task;
        update();
      });
    });

    update();
  }

  async function main() {
    setupTheme();
    setupLightbox();
    setupVolanteDiagnostic();
    setupRoiCalculator();
    setupBlogFilters();
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
        (page === "team" || page === "blog-archive") &&
        mount &&
        mount.children.length > 0
      ) {
        // Preservar el DOM prerenderizado estáticamente para evitar regresiones visuales
      } else {
        renderSections(state.content.sections);
      }

      if (window.location.hash) {
        document
          .getElementById(window.location.hash.slice(1))
          ?.scrollIntoView();
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
