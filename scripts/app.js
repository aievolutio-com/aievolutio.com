(() => {
  const state = { content: null };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  async function loadContent(lang = 'es') {
    const res = await fetch(`/content/content.${lang}.json`);
    if (!res.ok) throw new Error('No se pudo cargar el contenido');
    state.content = await res.json();
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
      if (b.type === 'quote') container.append(el('blockquote', {}, [b.body]));
      if (b.type === 'link') container.append(el('p', {}, [el('a', { href: b.href, class: 'btn' }, [b.title || b.href]) ]));
      if (b.type === 'card') container.append(el('div', { class: 'card' }, [el('h3', {}, [b.title || '']), el('p', {}, [b.body || ''])]));
      if (b.type === 'event') container.append(el('div', { class: 'card', role: 'article' }, [el('h3', {}, [b.title || 'Evento']), el('p', {}, [b.date || '']), el('p', {}, [b.body || ''])]));
      if (b.type === 'post') container.append(el('article', { class: 'card' }, [el('h3', {}, [b.title || 'Entrada']), el('p', { class: 'muted' }, [b.date || '']), el('p', {}, [b.body || ''])]));
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
      renderNav(state.content.navigation);
      renderSections(state.content.sections);
      setupTheme();
    } catch (e) {
      console.error(e);
      $('#sections').innerHTML = '<p>Error cargando contenido.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();