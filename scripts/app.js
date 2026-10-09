(() => {
  const state = { content: null };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s)); // eslint-disable-line no-unused-vars

  function isAllowedHref(value) {
    const href = String(value ?? '').trim();
    if (!href) return false;
    if (href.startsWith('#')) return true;
    try {
      return ['http:', 'https:', 'mailto:'].includes(new URL(href, document.baseURI).protocol);
    } catch {
      return false;
    }
  }

  function isExternalHref(value) {
    return /^https?:\/\//i.test(String(value ?? '').trim());
  }

  async function loadContent(lang = 'es') {
    // Use relative path so it works on localhost, previews (with <base>), and production
    const res = await fetch(`content/content.${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar el contenido');
    state.content = await res.json();
  }

  // Optional: separate navigation file overrides the one inside content.es.json
  async function loadNavigationOverride() {
    try {
      const res = await fetch('content/navigation.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch { /* ignore */ }
    return null;
  }

  function renderNav(items) {
    const nav = $('#nav');
    const page = document.body.dataset.page || 'home';
    const activeId = page === 'blog' || page === 'blog-archive'
      ? 'blog'
      : page === 'team' ? 'aiworkers' : page === 'contact' ? 'contact' : 'home';
    nav.replaceChildren(...items.map((item) => {
      const attrs = {
        href: isAllowedHref(item.href) ? item.href : 'index.html',
      };
      if (item.id === activeId) attrs['aria-current'] = 'page';
      return el('a', attrs, [item.label || 'Inicio']);
    }));
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

  function sortedPosts(blocks) {
    return blocks
      .filter((block) => block.type === 'post')
      .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
  }

  function postSummary(body, maxLength = 280) {
    const text = String(body || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
  }

  function formatPostDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return String(date || '');
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }

  function renderPost(post, preview, showTitle = true) {
    const id = articleId(post);
    const articleAttrs = { class: 'card post-card' };
    if (!preview) articleAttrs.id = id;
    const article = el('article', articleAttrs, []);
    if (showTitle) {
      const title = el('h3');
      if (preview) {
        title.append(el('a', { href: `blog.html#${id}` }, [post.title || 'Entrada']));
      } else {
        title.textContent = post.title || 'Entrada';
      }
      article.append(title);
    }
    const metadata = [formatPostDate(post.date), post.author].filter(Boolean).join(' · ');
    article.append(el('p', { class: 'muted post-meta' }, [metadata]));
    if (post.img) {
      article.append(el('img', {
        src: post.img,
        alt: post.alt || `Imagen editorial para ${post.title || 'el artículo'}`,
        class: 'post-cover',
        loading: 'lazy',
      }));
    }
    article.append(renderPostBody(preview ? postSummary(post.body) : post.body));
    if (preview) {
      article.append(el('a', { href: `blog.html#${id}`, class: 'text-link' }, ['Leer artículo']));
    }
    return article;
  }

  function renderPostBody(body) {
    const content = el('div', { class: 'post-body' });
    const paragraphs = String(body || '').trim().split(/\n\s*\n/).filter(Boolean);

    paragraphs.forEach((paragraph) => {
      const element = el('p');
      paragraph.split('\n').forEach((line, index) => {
        if (index) element.append(el('br'));
        line.split(/(\*\*.+?\*\*)/g).forEach((part) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            element.append(el('strong', {}, [part.slice(2, -2)]));
          } else {
            element.append(part);
          }
        });
      });
      content.append(element);
    });

    return content;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k.startsWith('aria-') || k === 'role') node.setAttribute(k, v);
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else node[k] = v;
    });
    children.forEach(ch => node.append(ch));
    return node;
  }

  function renderSection(sec) {
    const section = el('section', { id: sec.id, class: 'section' }, []);
    const page = document.body.dataset.page || 'home';
    const posts = sec.id === 'blog' ? sortedPosts(sec.blocks || []) : [];
    const selectedPost = page === 'blog'
      ? posts.find((post) => articleId(post) === window.location.hash.slice(1))
      : null;
    const sectionTitle = sec.id === 'blog' && page === 'home'
      ? 'Ideas recientes'
      : sec.id === 'blog' && page === 'blog'
        ? selectedPost ? 'Artículo' : 'Artículos recientes'
        : sec.id === 'blog' && page === 'blog-archive'
          ? 'Artículos anteriores'
          : sec.title;
    const h = el('h2', {}, [sectionTitle]);
    section.append(h);

    if (selectedPost) {
      section.append(el('a', { href: 'blog.html', class: 'archive-back' }, ['← Volver a artículos recientes']));
    } else if (page === 'blog-archive') {
      section.append(el('a', { href: 'blog.html', class: 'archive-back' }, ['← Ver artículos recientes']));
    }
    const containerClass = sec.kind === 'grid' || (sec.id === 'aiworkers' && page === 'team')
      ? 'grid'
      : sec.id === 'blog'
        ? `grid post-grid${selectedPost ? ' post-grid-single' : ''}`
        : '';
    const container = el('div', { class: containerClass });
    let blocks = sec.blocks || [];
    if (sec.id === 'aiworkers' && page === 'home') {
      blocks = blocks.filter((block) => block.type === 'worker').slice(0, 3);
    }
    if (sec.id === 'blog') {
      if (page === 'blog') {
        blocks = selectedPost ? [selectedPost] : posts.slice(0, 4);
      } else if (page === 'blog-archive') {
        blocks = posts.slice(4);
      } else {
        blocks = posts.slice(0, 3);
      }
    }

    blocks.forEach(b => {
      if (b.type === 'p') {
        const attrs = {};
        if (b.class) attrs.class = b.class;
        container.append(el('p', attrs, [b.body]));
      }
      if (b.type === 'list') {
        const ul = el('ul', { class: `list ${b.style ? 'list-' + b.style : ''}${b.class ? ' ' + b.class : ''}` });
        (b.items || []).forEach(it => {
          const text = (typeof it === 'string') ? it : (it.text || '');
          ul.append(el('li', {}, [text]));
        });
        container.append(ul);
      }
      if (b.type === 'worker') {
        // Collapsible worker profile: summary shows name + role + hint; details show photo + capabilities
        const details = el('details', { class: 'worker' });
        const name = b.name || b.title || '';
        const role = b.role || '';
        const summary = el('summary', {}, [
          el('strong', {}, [name]),
          role ? ` — ${role}` : '',
          el('span', { class: 'hint', 'aria-hidden': 'true' }, ['Ver capacidades']),
          el('span', { class: 'hint-open', 'aria-hidden': 'true' }, ['Ocultar'])
        ]);
        details.append(summary);
        const bodyWrap = el('div', { class: 'worker-body' });
        if (b.img) {
          bodyWrap.append(el('img', {
            src: b.img,
            alt: b.alt || name,
            loading: 'lazy',
            class: 'avatar',
            'data-lightbox': 'true',
            tabIndex: 0,
            role: 'button',
            'aria-label': 'Ampliar imagen',
            title: 'Ampliar imagen',
          }));
        } else {
          bodyWrap.append(el('div', {
            class: 'worker-avatar',
            'aria-hidden': 'true',
          }, [el('span', {}, [name.replace(/^AI/, '').slice(0, 2).toUpperCase()])]));
        }
        const contentWrap = el('div', { class: 'worker-content' });
        if (Array.isArray(b.capabilities) && b.capabilities.length) {
          const ul = el('ul', { class: 'list list-primary' });
          b.capabilities.forEach(cap => ul.append(el('li', {}, [cap])));
          contentWrap.append(ul);
        }
        if (b.body) contentWrap.append(el('p', {}, [b.body]));
        // Optional external test link (e.g., to a GPT). Opens in new tab.
        if (isExternalHref(b.href)) {
          const label = b.cta || (name ? `Probar ${name}` : 'Probar');
          const a = el('a', { href: b.href, class: 'btn', target: '_blank', rel: 'noopener noreferrer' }, [label]);
          contentWrap.append(a);
        }
        bodyWrap.append(contentWrap);
        details.append(bodyWrap);
        container.append(details);
      }
      if (b.type === 'quote') {
        // Support optional image and author/version. Format: "cita." (AUTHOR v.X.Y.Z)
        const fig = el('figure', { class: 'quote' });
  if (b.img) fig.append(el('img', { src: b.img, alt: b.alt || b.author || '', loading: 'lazy', 'data-lightbox': 'true', tabIndex: 0, role: 'button', 'aria-label': 'Ampliar imagen', title: 'Ampliar imagen' }));
        const text = String(b.body || '').trim();
        const hasDot = /[.!?]$/.test(text);
        const quoted = '"' + (text.replace(/^"|"$/g, '')) + (hasDot ? '' : '.') + '"';
        const wrap = el('div', { class: 'quote-text' });
        wrap.append(el('blockquote', {}, [quoted]));
        if (b.author) {
          wrap.append(' ');
          const author = (b.author || '').toString().toUpperCase();
          const cap = `(${author}${b.version ? ' ' + b.version : ''})`;
          wrap.append(el('figcaption', {}, [cap]));
        }
        fig.append(wrap);
        container.append(fig);
      }
      if (b.type === 'image') {
        const fig = el('figure', { class: 'image' });
        fig.append(el('img', { src: b.src, alt: b.alt || '', loading: 'lazy' }));
        if (b.caption) fig.append(el('figcaption', {}, [b.caption]));
        container.append(fig);
      }
      if (b.type === 'link' && isAllowedHref(b.href)) container.append(el('a', { href: b.href, class: 'btn' }, [b.title || b.href]));
      if (b.type === 'card') {
        const c = el('div', { class: 'card' });
  if (b.img) c.append(el('img', { src: b.img, alt: b.alt || b.title || '', loading: 'lazy', class: 'avatar', 'data-lightbox': 'true', tabIndex: 0, role: 'button', 'aria-label': 'Ampliar imagen', title: 'Ampliar imagen' }));
        c.append(el('h3', {}, [b.title || '']));
        if (b.body) {
          // Detect inline "Resultado típico:" to present it as a highlighted label on a new line
          const bodyStr = String(b.body);
          const lower = bodyStr.toLowerCase();
          const marker = 'resultado típico:';
          const idx = lower.indexOf(marker);
          if (idx !== -1) {
            const before = bodyStr.slice(0, idx).trim();
            const after = bodyStr.slice(idx + marker.length).trim();
            if (before) c.append(el('p', {}, [before]));
            const resWrap = el('div', { class: 'result' });
            resWrap.append(el('div', { class: 'result-label' }, ['Resultado típico']));
            if (after) resWrap.append(el('p', { class: 'result-value' }, [after]));
            c.append(resWrap);
          } else {
            c.append(el('p', {}, [b.body]));
          }
        }
        if (Array.isArray(b.items) && b.items.length) {
          const ul = el('ul', { class: `list ${b.listStyle ? 'list-' + b.listStyle : ''}` });
          b.items.forEach(it => ul.append(el('li', {}, [it])));
          c.append(ul);
        }
        container.append(c);
      }
      if (b.type === 'event') container.append(el('div', { class: 'card', role: 'article' }, [el('h3', {}, [b.title || 'Evento']), el('p', {}, [b.date || '']), el('p', {}, [b.body || ''])]));
      if (b.type === 'post') {
        const isArticle = page === 'blog' && selectedPost === b;
        const isPreview = page === 'home' || ((page === 'blog' || page === 'blog-archive') && !selectedPost);
        container.append(renderPost(b, isPreview, !isArticle));
      }
      if (b.type === 'links') {
        const row = el('div', { class: b.class || '' });
        (b.items || []).filter((item) => isAllowedHref(item.href)).forEach((item) => row.append(el('a', { href: item.href, class: 'btn' }, [item.title || item.href])));
        container.append(row);
      }
      if (b.type === 'contact') {
        // Dynamic contact form (email not exposed directly). b.fields meta drives inputs.
        const form = el('form', { class: 'contact-form', noValidate: true });
        const startTime = Date.now();
        const hpName = b.honeypot || 'hp_field';
        (b.fields || []).forEach(f => {
          const wrap = el('label', { class: 'field' });
          const span = el('span', { class: 'field-label' }, [f.label || f.name]);
          wrap.append(span);
          let input;
          if (f.type === 'textarea') {
            input = el('textarea', { name: f.name, required: !!f.required });
            if (f.minlength) input.minLength = f.minlength;
            if (f.maxlength) input.maxLength = f.maxlength;
            if (f.placeholder) input.placeholder = f.placeholder;
          } else {
            input = el('input', { type: f.type || 'text', name: f.name, required: !!f.required });
            if (f.minlength) input.minLength = f.minlength;
            if (f.maxlength) input.maxLength = f.maxlength;
            if (f.placeholder) input.placeholder = f.placeholder;
          }
          wrap.append(input);
          form.append(wrap);
        });
        // Honeypot (hidden)
        const hpWrap = el('div', { class: 'hp' });
        const hpInput = el('input', { type: 'text', name: hpName, tabIndex: -1, autoComplete: 'off' });
        hpWrap.append(hpInput);
        form.append(hpWrap);
        const status = el('p', { class: 'form-status', 'aria-live': 'polite' });
        const submitBtn = el('button', { type: 'submit', class: 'btn' }, ['Enviar']);
        form.append(submitBtn);
        form.append(status);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            status.textContent = '';
            if (hpInput.value) { status.textContent = 'Descartado.'; return; }
            const minDelay = b.minDelayMs || 1500;
            const elapsed = Date.now() - startTime;
            if (elapsed < minDelay) {
              status.textContent = 'Espera un momento antes de enviar…';
              return;
            }
            // Basic validation
            let hasError = false;
            (b.fields || []).forEach(f => {
              const node = form.querySelector(`[name="${f.name}"]`);
              if (node && f.required && !node.value.trim()) { hasError = true; node.classList.add('field-error'); }
              else if (node) node.classList.remove('field-error');
            });
            if (hasError) { status.textContent = 'Revisa los campos obligatorios.'; return; }
            submitBtn.disabled = true;
            status.textContent = 'Enviando…';
            try {
              const payload = {};
              (b.fields || []).forEach(f => {
                const node = form.querySelector(`[name="${f.name}"]`);
                payload[f.name] = node ? node.value.trim() : '';
              });
              payload._t = Date.now();
              const ep = b.endpoint || '/api/contact';
              const method = (b.method || 'POST').toUpperCase();
              // For now, attempt fetch; if fails (no backend), show success fallback to avoid UX dead end.
              let ok = true;
              if (b.mode === 'local') {
                // Local mode: build mailto link with obfuscated target; open user agent mail client.
                // Safe base64 decode (browser only; non-browser lint will treat as no-op)
                const decode = (v) => {
                  try {
                    if (typeof window !== 'undefined' && typeof window.atob === 'function') return window.atob(v);
                  } catch { /* ignore */ }
                  return '';
                };
                const user = b.userB64 ? decode(b.userB64) : 'contacto';
                const domain = b.domainB64 ? decode(b.domainB64) : 'example.com';
                const to = user + '@' + domain;
                const subject = encodeURIComponent('Contacto desde sitio AIEvolutio');
                const body = encodeURIComponent(`Nombre: ${payload.nombre || ''}\nEmail: ${payload.email || ''}\n\n${payload.mensaje || ''}`);
                const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
                // Open in a new window (fallback to location if blocked)
                const w = window.open(mailto, '_blank');
                if (!w) window.location.href = mailto;
                status.textContent = b.success || 'Mensaje preparado en tu gestor de correo.';
                form.reset();
                ok = true;
              } else {
                try {
                  const res = await fetch(ep, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  ok = res.ok;
                } catch { /* network / local fallback */ ok = false; }
                if (ok) {
                  status.textContent = b.success || 'Enviado correctamente.';
                  form.reset();
                } else {
                  status.textContent = b.error || 'Error al enviar.';
                }
              }
            } finally {
              submitBtn.disabled = false;
            }
        });

        container.append(form);
      }
    });

    if (page === 'blog' && sec.id === 'blog' && !selectedPost && posts.length > 4) {
      container.append(el('a', {
        href: 'archivo.html',
        class: 'btn section-cta',
      }, ['Ver artículos anteriores']));
    }
    if (page === 'home' && sec.id === 'blog') {
      container.append(el('a', { href: 'blog.html', class: 'btn section-cta' }, ['Explorar todos los artículos']));
    }
    if (page === 'home' && sec.id === 'aiworkers') {
      container.append(el('a', { href: 'equipo.html', class: 'btn section-cta' }, ['Conocer al equipo']));
    }

    section.append(container);
    return section;
  }

  function renderSections(sections) {
    const mount = $('#sections');
    mount.replaceChildren();
    const page = document.body.dataset.page || 'home';
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const visibleSections = page === 'blog' || page === 'blog-archive'
      ? sections.filter((section) => section.id === 'blog')
      : page === 'team'
        ? sections.filter((section) => section.id === 'aiworkers')
        : page === 'contact'
          ? []
          : sections.filter((section) => section.id !== 'home');
    visibleSections.forEach((section) => {
      if (section.id !== 'eventos') {
        mount.append(renderSection(section));
        return;
      }

      const upcomingEvents = (section.blocks || []).filter((event) => (
        event.type !== 'event' || !/^\d{4}-\d{2}-\d{2}$/.test(event.date || '') || event.date >= today
      ));
      if (upcomingEvents.length) {
        mount.append(renderSection({ ...section, blocks: upcomingEvents }));
      }
    });
  }

  function updateBlogView() {
    if (document.body.dataset.page !== 'blog' || !state.content) return;
    const blogSection = state.content.sections.find((section) => section.id === 'blog');
    const posts = sortedPosts(blogSection ? blogSection.blocks : []);
    const selectedPost = posts.find((post) => articleId(post) === window.location.hash.slice(1));
    const pageTitle = $('#page-title');
    if (pageTitle) pageTitle.textContent = selectedPost?.title || 'Ideas para evolucionar';
    document.title = selectedPost
      ? `${selectedPost.title} — AIEvolutio`
      : 'Ideas para evolucionar — AIEvolutio';
    renderSections(state.content.sections);
    if (selectedPost) document.getElementById(articleId(selectedPost))?.scrollIntoView();
  }

  function setupTheme() {
    const btn = $('#theme-toggle');
    const KEY = 'ae_theme';
    function apply(v) {
      document.documentElement.dataset.theme = v;
      if (btn) btn.setAttribute('aria-pressed', v === 'dark');
    }
    const stored = localStorage.getItem(KEY);
    apply(stored || 'dark');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
      localStorage.setItem(KEY, next); apply(next);
    });
  }

  function setupLightbox() {
    const root = document.getElementById('lightbox');
    if (!root) return;
    const img = root.querySelector('img');
    const caption = root.querySelector('.lightbox-caption');
    const closeBtn = root.querySelector('.lightbox-close');
    const backdrop = root.querySelector('.lightbox-backdrop');

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      caption.textContent = alt || '';
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      img.src = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.matches && t.matches('img[data-lightbox]')) {
        open(t.src, t.alt);
      }
    });
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.key === 'Enter' || e.key === ' ') {
        if (t && t.matches && t.matches('img[data-lightbox]')) {
          e.preventDefault();
          open(t.src, t.alt);
        }
      }
    });
  }

  async function main() {
    try {
      await loadContent('es');
      const navOverride = await loadNavigationOverride();
      renderNav(navOverride || state.content.navigation);
      if (document.body.dataset.page === 'blog') {
        window.addEventListener('hashchange', updateBlogView);
        updateBlogView();
      } else {
        renderSections(state.content.sections);
      }
      const currentYear = $('#current-year');
      if (currentYear) currentYear.textContent = String(new Date().getFullYear());
      setupTheme();
      setupLightbox();
      if (window.location.hash) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
      }
    } catch (e) {
      console.error(e);
      $('#sections').innerHTML = '<p>Error cargando contenido.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();