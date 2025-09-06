(() => {
  const state = { content: null };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s)); // eslint-disable-line no-unused-vars

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
    } catch (_) { /* ignore */ }
    return null;
  }

  function renderNav(items) {
    const nav = $('#nav');
    nav.innerHTML = items.map(i => `<a href="${i.href}">${i.label}</a>`).join('');
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v; else if (k.startsWith('aria-') || k === 'role') node.setAttribute(k, v); else node[k] = v;
    });
    children.forEach(ch => node.append(ch));
    return node;
  }

  function renderSection(sec) {
    const section = el('section', { id: sec.id, class: 'section' }, []);
    const h = el('h2', {}, [sec.title]);
    section.append(h);

    const container = el('div', { class: sec.kind === 'grid' ? 'grid' : '' });

  (sec.blocks || []).forEach(b => {
      if (b.type === 'p') container.append(el('p', {}, [b.body]));
      if (b.type === 'list') {
        const ul = el('ul', { class: `list ${b.style ? 'list-' + b.style : ''}` });
        (b.items || []).forEach(it => {
          const text = (typeof it === 'string') ? it : (it.text || '');
          ul.append(el('li', {}, [text]));
        });
        container.append(ul);
      }
      if (b.type === 'worker') {
        // Collapsible worker profile: summary shows name + role; details show photo + capabilities
        const details = el('details', { class: 'worker' });
        const name = b.name || b.title || '';
        const role = b.role || '';
        const summary = el('summary', {}, [el('strong', {}, [name]), role ? ` — ${role}` : '']);
        details.append(summary);
        const bodyWrap = el('div', { class: 'worker-body' });
        if (b.img) bodyWrap.append(el('img', { src: b.img, alt: b.alt || name, class: 'avatar' }));
        if (Array.isArray(b.capabilities) && b.capabilities.length) {
          const ul = el('ul', { class: 'list list-primary' });
          b.capabilities.forEach(cap => ul.append(el('li', {}, [cap])));
          bodyWrap.append(ul);
        }
        if (b.body) bodyWrap.append(el('p', {}, [b.body]));
        details.append(bodyWrap);
        container.append(details);
      }
      if (b.type === 'quote') {
        // Support optional image and author/version. Format: "cita." (AUTHOR v.X.Y.Z)
        const fig = el('figure', { class: 'quote' });
        if (b.img) fig.append(el('img', { src: b.img, alt: b.alt || b.author || '' }));
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
        fig.append(el('img', { src: b.src, alt: b.alt || '' }));
        if (b.caption) fig.append(el('figcaption', {}, [b.caption]));
        container.append(fig);
      }
      if (b.type === 'link') container.append(el('a', { href: b.href, class: 'btn' }, [b.title || b.href]));
      if (b.type === 'card') {
        const c = el('div', { class: 'card' });
        if (b.img) c.append(el('img', { src: b.img, alt: b.alt || b.title || '', class: 'avatar' }));
        c.append(el('h3', {}, [b.title || '']));
        c.append(el('p', {}, [b.body || '']));
        container.append(c);
      }
      if (b.type === 'event') container.append(el('div', { class: 'card', role: 'article' }, [el('h3', {}, [b.title || 'Evento']), el('p', {}, [b.date || '']), el('p', {}, [b.body || ''])]));
      if (b.type === 'post') container.append(el('article', { class: 'card' }, [el('h3', {}, [b.title || 'Entrada']), el('p', { class: 'muted' }, [b.date || '']), el('p', {}, [b.body || ''])]));
      if (b.type === 'links') {
        const row = el('div', { class: b.class || '' });
        (b.items || []).forEach(it => row.append(el('a', { href: it.href, class: 'btn' }, [it.title || it.href])));
        container.append(row);
      }
    });

    section.append(container);
    return section;
  }

  function renderSections(sections) {
    const mount = $('#sections');
    mount.innerHTML = '';
    sections.filter(s => s.id !== 'home').forEach(sec => mount.append(renderSection(sec)));
  }

  function setupTheme() {
    const btn = $('#theme-toggle');
    const KEY = 'ae_theme';
    function apply(v) {
      document.documentElement.dataset.theme = v;
      btn.setAttribute('aria-pressed', v === 'dark');
    }
    const stored = localStorage.getItem(KEY);
    apply(stored || 'dark');
    btn.addEventListener('click', () => {
      const next = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
      localStorage.setItem(KEY, next); apply(next);
    });
  }

  async function main() {
    try {
      await loadContent('es');
  const navOverride = await loadNavigationOverride();
  renderNav(navOverride || state.content.navigation);
      renderSections(state.content.sections);
      setupTheme();
    } catch (e) {
      console.error(e);
      $('#sections').innerHTML = '<p>Error cargando contenido.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();