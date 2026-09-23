/* ==========================================================================
   Studio Nima — portafolio
   Lista/galería de proyectos, ficha por proyecto (#/slug) con transiciones
   de telón, y descubrimiento automático de los sitios publicados en GitHub.
   Depuración en consola : window.debug
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'cubic-bezier(0.77, 0, 0.18, 1)';
  const D = (ms) => (reduce ? 1 : ms);
  const wait = (ms) => new Promise((r) => setTimeout(r, D(ms)));
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const log = (...a) => console.info('[nima]', ...a);

  const cfg = Object.assign({ github: 'studio-nima', exclude: [], contact: '' }, window.NIMA);
  const NEUTRAL = [
    { bg: '#26241f', fg: '#ece6db', accent: '#c9a77a' },
    { bg: '#e9e3d8', fg: '#1b1917', accent: '#8a6a3f' },
    { bg: '#1e2a2e', fg: '#e8eef0', accent: '#9cc3c9' },
  ];

  const state = { sites: [], current: null, busy: false, queued: false, dirHint: 0, view: 'list', lastFocus: null };
  const el = {
    list: $('[data-list]'),
    grid: $('[data-grid]'),
    preview: $('.preview'),
    previewInner: $('[data-preview]'),
    project: $('[data-project]'),
    curtain: $('.curtain'),
    ca: $('.curtain-a'),
    cb: $('.curtain-b'),
    cursor: $('.cursor'),
    glow: $('.glow'),
    live: $('[data-live]'),
    theme: $('meta[name="theme-color"]'),
  };
  const baseTitle = document.title;

  /* ------------------------------------------------------------------
     Datos
     ------------------------------------------------------------------ */
  function normalize(s, i) {
    const repo = s.repo || s.slug;
    const slug = (s.slug || repo).toLowerCase();
    const shots = s.shots ? `img/sites/${s.shots}` : null;
    return {
      ...s,
      repo,
      slug,
      name: s.name || prettify(repo),
      url: s.url || `https://${cfg.github}.github.io/${repo}/`,
      github: `https://github.com/${cfg.github}/${repo}`,
      theme: Object.assign({}, NEUTRAL[i % NEUTRAL.length], s.theme),
      palette: s.palette || [],
      fonts: s.fonts || [],
      deliverables: s.deliverables || [],
      img: shots ? { cover: `${shots}-desktop.jpg`, full: `${shots}-full.jpg`, mobile: `${shots}-mobile.jpg` } : null,
    };
  }
  function prettify(repo) {
    return repo.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const hostPath = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  state.sites = (window.SITES || []).map(normalize);

  /* Repos con GitHub Pages que aún no están en sites.js */
  async function discover() {
    const key = 'nima:repos';
    let repos = null;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (c && Date.now() - c.t < 10 * 60e3) repos = c.r;
    } catch (_) { /* sin storage */ }

    if (!repos) {
      const res = await fetch(`https://api.github.com/users/${cfg.github}/repos?per_page=100&sort=created`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      repos = (await res.json()).map((r) => ({
        name: r.name, description: r.description, has_pages: r.has_pages,
        fork: r.fork, archived: r.archived, created_at: r.created_at,
      }));
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), r: repos })); } catch (_) { /* nada */ }
    }

    const known = new Set(state.sites.map((s) => s.repo.toLowerCase()));
    const excl = new Set(cfg.exclude.map((x) => x.toLowerCase()));
    const fresh = repos
      .filter((r) => r.has_pages && !r.fork && !r.archived)
      .filter((r) => !known.has(r.name.toLowerCase()) && !excl.has(r.name.toLowerCase()))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    log('repos GitHub:', repos.length, '· nuevos:', fresh.map((r) => r.name));
    if (!fresh.length) return;

    const offset = state.sites.length;
    const extra = fresh.map((r, i) => normalize({
      repo: r.name,
      tagline: r.description || '',
      description: r.description || '',
      category: 'Sitio web',
      year: new Date(r.created_at).getFullYear(),
      auto: true,
    }, offset + i));
    state.sites = [...extra, ...state.sites];
    renderHome();
  }

  /* ------------------------------------------------------------------
     Plantillas
     ------------------------------------------------------------------ */
  function placeholder(s) {
    return `<div class="ph" style="--ph-bg:${s.theme.bg};--ph-fg:${s.theme.fg}">${esc(s.name)}</div>`;
  }

  function browserHTML(s, { eager = false } = {}) {
    const view = s.img
      ? `<img src="${s.img.full}" alt="Página de inicio de ${esc(s.name)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`
      : `<iframe data-src="${esc(s.url)}" title="Vista en vivo de ${esc(s.name)}" loading="lazy" tabindex="-1"></iframe>`;
    return `
      <div class="browser">
        <div class="browser-bar"><i></i><i></i><i></i><span class="browser-url">${esc(hostPath(s.url))}</span></div>
        <div class="browser-view">${view}</div>
      </div>`;
  }

  function metaLine(s) {
    return [s.category, s.place, s.year].filter(Boolean).map(esc).join(' · ');
  }

  function renderHome() {
    const S = state.sites;

    el.list.innerHTML = S.map((s, i) => `
      <li class="row">
        <a class="row-link" href="#/${s.slug}" data-slug="${s.slug}" data-cursor="Ver" style="--row-bg:${s.theme.bg}">
          <span class="row-thumb">${s.img ? `<img src="${s.img.cover}" alt="" loading="lazy">` : placeholder(s)}</span>
          <span class="row-n">${pad(i + 1)}</span>
          <span class="row-name">${esc(s.name)}</span>
          <span class="row-meta">${esc(s.category || '')}<span>${esc([s.place, s.year].filter(Boolean).join(' · '))}</span></span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </a>
      </li>`).join('');

    el.grid.innerHTML = S.map((s) => `
      <a class="card" href="#/${s.slug}" data-slug="${s.slug}" data-cursor="Ver">
        <div class="card-media" style="--card-bg:${s.theme.bg}">${browserHTML(s)}</div>
        <div class="card-info"><span class="card-name">${esc(s.name)}</span><span class="card-cat">${esc(s.category || '')}</span></div>
      </a>`).join('');

    el.previewInner.innerHTML = S.map((s) =>
      s.img ? `<img src="${s.img.cover}" alt="" data-for="${s.slug}" decoding="async">` : placeholder(s).replace('class="ph"', `class="ph" data-for="${s.slug}"`)
    ).join('');

    $$('[data-count]').forEach((n) => countTo(n, S.length));
    fitShots(document);
    observe($$('.row, .card'));
  }

  function projectHTML(s) {
    const S = state.sites;
    const i = S.indexOf(s);
    const next = S[(i + 1) % S.length];
    const facts = [
      ['Categoría', esc(s.category)],
      ['Ubicación', esc(s.place)],
      ['Año', esc(s.year)],
      ['Entregables', s.deliverables.length ? `<ul>${s.deliverables.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''],
      ['Paleta', s.palette.length ? `<div class="swatches">${s.palette.map((c) => `<span class="swatch"><i style="--c:${esc(c)}"></i>${esc(c)}</span>`).join('')}</div>` : ''],
      ['Tipografías', s.fonts.length ? `<ul class="fonts">${s.fonts.map((f) => `<li style="font-family:'${esc(f)}'">${esc(f)}</li>`).join('')}</ul>` : ''],
      ['Dirección', `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(hostPath(s.url))} ↗</a>`],
    ].filter(([, v]) => v);

    const multi = S.length > 1;
    return `
      <div class="p-bar">
        <button type="button" class="p-close" data-close><span class="p-close-x" aria-hidden="true">✕</span><span class="p-close-label">Todos los proyectos</span></button>
        <p class="p-counter"><b>${pad(i + 1)}</b> / ${pad(S.length)}</p>
        <div class="p-arrows" ${multi ? '' : 'hidden'}>
          <button type="button" data-step="-1" aria-label="Proyecto anterior">←</button>
          <button type="button" data-step="1" aria-label="Proyecto siguiente">→</button>
        </div>
      </div>

      <header class="p-hero">
        <p class="p-kicker p-anim" style="--i:0">${metaLine(s)}</p>
        <h1 class="p-title" tabindex="-1"><span class="line"><span style="--i:1">${esc(s.name)}</span></span></h1>
        ${s.tagline ? `<p class="p-tagline p-anim" style="--i:3">${esc(s.tagline)}</p>` : ''}
      </header>

      <div class="p-stage">
        <a class="p-anim" style="--i:4" href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="Visitar" aria-label="Abrir ${esc(s.name)} en una pestaña nueva">${browserHTML(s, { eager: true })}</a>
        ${s.img ? `<div class="phone p-anim" style="--i:6"><img src="${s.img.mobile}" alt="${esc(s.name)} en celular" decoding="async"></div>` : ''}
      </div>

      <div class="p-body">
        <div>
          ${s.description ? `<p class="p-desc p-anim" style="--i:7">${esc(s.description)}</p>` : ''}
          <div class="p-cta p-anim" style="--i:8">
            <a class="btn btn-solid" href="${esc(s.url)}" target="_blank" rel="noopener">Visitar el sitio <span aria-hidden="true">↗</span></a>
            <a class="btn" href="${esc(s.github)}" target="_blank" rel="noopener">Código en GitHub</a>
          </div>
        </div>
        <dl class="p-facts p-anim" style="--i:9">
          ${facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
        </dl>
      </div>

      ${multi ? `
      <a class="p-next" href="#/${next.slug}" data-next style="--next-bg:${next.theme.bg};--next-fg:${next.theme.fg};${next.fonts[0] ? `--next-font:'${esc(next.fonts[0])}'` : ''}">
        <span class="p-next-label">Siguiente proyecto</span>
        <span class="p-next-name"><span>${esc(next.name)}</span><span aria-hidden="true">→</span></span>
      </a>` : ''}`;
  }

  /* ------------------------------------------------------------------
     Capturas: desplazamiento de la página completa dentro del marco
     ------------------------------------------------------------------ */
  function fitShots(root) {
    $$('.browser-view img', root).forEach((img) => {
      const set = () => {
        const view = img.parentElement;
        if (!view || !img.naturalHeight) return;
        const shift = Math.min(0, view.clientHeight - img.clientHeight);
        img.style.setProperty('--shift', `${shift}px`);
        img.style.setProperty('--dur', `${Math.max(2.5, -shift / 700).toFixed(1)}s`);
        img.style.setProperty('--adur', `${Math.max(8, -shift / 160).toFixed(1)}s`);
      };
      if (img.complete) set(); else img.addEventListener('load', set, { once: true });
    });
    $$('.browser-view iframe', root).forEach((f) => {
      if (!f.src && f.dataset.src) f.src = f.dataset.src;
      const view = f.parentElement;
      if (view) view.style.setProperty('--scale', view.clientWidth / 1280);
    });
  }
  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => fitShots(document), 150);
  });

  /* ------------------------------------------------------------------
     Apariciones al hacer scroll
     ------------------------------------------------------------------ */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target;
        const sib = t.parentElement ? [...t.parentElement.children].filter((c) => c.matches('.row, .card')) : [];
        const k = Math.max(0, sib.indexOf(t));
        t.style.transitionDelay = t.matches('.row, .card') ? `${Math.min(k, 6) * 70}ms` : '';
        t.classList.add('is-in');
        io.unobserve(t);
        if (t.matches('.card')) fitShots(t);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' })
    : null;
  function observe(nodes) {
    nodes.forEach((n) => (io ? io.observe(n) : n.classList.add('is-in')));
  }

  function countTo(node, n) {
    const t0 = performance.now();
    const dur = D(1400);
    const from = parseInt(node.textContent, 10) || 0;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      node.textContent = pad(Math.round(from + (n - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------
     Intro
     ------------------------------------------------------------------ */
  async function intro(skip) {
    const box = $('.intro');
    const done = () => {
      if (box) box.classList.add('is-gone');
      document.body.classList.remove('is-loading');
    };
    if (!box || skip || reduce || !box.animate) { done(); return; }

    const letters = $$('.intro-word span', box);
    const count = $('.intro-count', box);
    letters.forEach((l, i) => l.animate(
      [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }],
      { duration: 1000, delay: 120 + i * 70, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    ));
    const t0 = performance.now();
    await new Promise((res) => {
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1500);
        if (count) count.textContent = pad(Math.round(p * 100)).padStart(3, '0');
        p < 1 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    });
    letters.forEach((l, i) => l.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-105%)' }],
      { duration: 700, delay: i * 50, easing: EASE, fill: 'forwards' }
    ));
    await wait(380);
    const out = box.animate(
      [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
      { duration: 1100, easing: EASE, fill: 'forwards' }
    );
    setTimeout(startHome, 420);
    await out.finished;
    done();
  }

  let homeStarted = false;
  function startHome() {
    if (homeStarted) return;
    homeStarted = true;
    $('.hero')?.classList.add('is-in');
    observe($$('.reveal'));
  }

  /* ------------------------------------------------------------------
     Telón (curtain) — helpers
     ------------------------------------------------------------------ */
  function clip(node, from, to, opts) {
    if (!node.animate) { node.style.clipPath = to; return Promise.resolve(); }
    const a = node.animate([{ clipPath: from }, { clipPath: to }], { duration: D(900), easing: EASE, fill: 'forwards', ...opts, duration: D(opts?.duration ?? 900) });
    return a.finished.then(() => {
      node.style.clipPath = to;
      a.cancel();
    });
  }
  function paintCurtain(theme) {
    el.ca.style.background = theme.accent;
    el.cb.style.background = theme.bg;
  }
  function resetCurtain() {
    el.ca.style.clipPath = el.cb.style.clipPath = 'inset(0 0 0 100%)';
    el.curtain.classList.remove('is-active');
  }

  function applyTheme(s) {
    const p = el.project;
    p.style.setProperty('--p-bg', s.theme.bg);
    p.style.setProperty('--p-fg', s.theme.fg);
    p.style.setProperty('--p-accent', s.theme.accent);
    p.style.setProperty('--p-font', s.fonts[0] ? `'${s.fonts[0]}', var(--f-display)` : 'var(--f-display)');
    if (el.theme) el.theme.content = s.theme.bg;
    document.title = `${s.name} · Studio Nima`;
  }

  function mountProject(s) {
    applyTheme(s);
    el.project.innerHTML = projectHTML(s);
    el.project.setAttribute('aria-label', s.name);
    el.project.scrollTop = 0;
    fitShots(el.project);
    if (el.live) el.live.textContent = `Proyecto: ${s.name}`;
  }

  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  function sourceRect(slug) {
    const sel = state.view === 'grid' ? `.card[data-slug="${slug}"] .card-media` : `.row-link[data-slug="${slug}"]`;
    const n = $(sel);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || !r.width) return null;
    return r;
  }
  const rectInset = (r) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 8px)`;

  /* ------------------------------------------------------------------
     Transiciones
     ------------------------------------------------------------------ */
  async function openProject(s, { instant = false } = {}) {
    state.lastFocus = document.activeElement;
    hidePreview();
    ensureFonts();

    if (!instant) {
      paintCurtain(s.theme);
      el.curtain.classList.add('is-active');
      const r = sourceRect(s.slug);
      const from = r ? rectInset(r) : 'inset(100% 0 0 0)';
      await Promise.all([
        clip(el.ca, from, 'inset(0 0 0 0 round 0px)', { duration: 900 }),
        clip(el.cb, from, 'inset(0 0 0 0 round 0px)', { duration: 900, delay: D(110) }),
      ]);
    }

    mountProject(s);
    el.project.hidden = false;
    document.body.classList.add('is-locked');
    state.current = s;
    resetCurtain();
    await nextFrame();
    el.project.classList.add('is-in');
    $('.p-title', el.project)?.focus({ preventScroll: true });
  }

  async function swapProject(s, dir) {
    const p = el.project;
    p.style.setProperty('--out', String(-dir));
    p.classList.add('is-out');
    p.classList.remove('is-in');

    paintCurtain(s.theme);
    el.curtain.classList.add('is-active');
    const from = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    await Promise.all([
      clip(el.ca, from, 'inset(0 0 0 0)', { duration: 850, delay: D(120) }),
      clip(el.cb, from, 'inset(0 0 0 0)', { duration: 850, delay: D(240) }),
    ]);

    p.classList.remove('is-out');
    mountProject(s);
    state.current = s;
    resetCurtain();
    await nextFrame();
    p.classList.add('is-in');
    $('.p-title', p)?.focus({ preventScroll: true });
  }

  async function closeProject() {
    const s = state.current;
    const p = el.project;
    p.style.setProperty('--out', '0');
    p.classList.add('is-out');
    p.classList.remove('is-in');
    await wait(260);

    paintCurtain(s.theme);
    el.ca.style.clipPath = el.cb.style.clipPath = 'inset(0 0 0 0)';
    el.curtain.classList.add('is-active');

    p.hidden = true;
    p.classList.remove('is-out');
    p.innerHTML = '';
    document.body.classList.remove('is-locked');
    document.title = baseTitle;
    if (el.theme) el.theme.content = '#0f0e0d';
    state.current = null;

    // Volver a la fila del proyecto que se cerró
    const back = $(`.row-link[data-slug="${s.slug}"]`) && state.view === 'list'
      ? $(`.row-link[data-slug="${s.slug}"]`)
      : $(`.card[data-slug="${s.slug}"]`);
    if (back) {
      const r = back.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight) {
        document.documentElement.style.scrollBehavior = 'auto';
        back.scrollIntoView({ block: 'center' });
        document.documentElement.style.scrollBehavior = '';
      }
    }
    setTint(s.theme.accent);

    await Promise.all([
      clip(el.cb, 'inset(0 0 0 0)', 'inset(0 0 100% 0)', { duration: 900 }),
      clip(el.ca, 'inset(0 0 0 0)', 'inset(0 0 100% 0)', { duration: 900, delay: D(120) }),
    ]);
    resetCurtain();
    (back || state.lastFocus)?.focus?.({ preventScroll: true });
  }

  /* ------------------------------------------------------------------
     Router (#/slug)
     ------------------------------------------------------------------ */
  const parse = () => (location.hash.match(/^#\/([\w-]+)/) || [])[1]?.toLowerCase() || null;
  let discovered = false;

  async function route() {
    if (state.busy) { state.queued = true; return; }
    const slug = parse();
    const site = slug ? state.sites.find((s) => s.slug === slug) : null;

    if (slug && !site) {
      if (!discovered) return; // se reintenta tras el descubrimiento
      log('proyecto desconocido:', slug);
      history.replaceState(null, '', location.pathname + location.search);
    }

    state.busy = true;
    try {
      if (site && !state.current) {
        await openProject(site, { instant: !homeStarted });
      } else if (site && state.current !== site) {
        const S = state.sites;
        let dir = state.dirHint;
        if (!dir) dir = S.indexOf(site) >= S.indexOf(state.current) ? 1 : -1;
        await swapProject(site, dir);
      } else if (!site && state.current) {
        await closeProject();
      }
    } catch (err) {
      console.error('[nima] error de transición', err);
      resetCurtain();
    } finally {
      state.dirHint = 0;
      state.busy = false;
      if (state.queued) { state.queued = false; route(); }
    }
  }
  addEventListener('hashchange', route);

  function go(slug, dir = 0) {
    state.dirHint = dir;
    location.hash = slug ? `#/${slug}` : '#/';
  }
  function step(dir) {
    const S = state.sites;
    if (!state.current || S.length < 2) return;
    const i = S.indexOf(state.current);
    go(S[(i + dir + S.length) % S.length].slug, dir);
  }

  /* ------------------------------------------------------------------
     Eventos de la ficha
     ------------------------------------------------------------------ */
  el.project.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { go(null); return; }
    const b = e.target.closest('[data-step]');
    if (b) { step(Number(b.dataset.step)); return; }
    if (e.target.closest('[data-next]')) state.dirHint = 1;
  });

  addEventListener('keydown', (e) => {
    if (!state.current || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') go(null);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  // Deslizar en móvil
  let touch = null;
  el.project.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, { passive: true });
  el.project.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - touch.t < 600) step(dx < 0 ? 1 : -1);
    touch = null;
  }, { passive: true });

  /* ------------------------------------------------------------------
     Vista lista / galería
     ------------------------------------------------------------------ */
  function setView(v, animate = true) {
    state.view = v === 'grid' ? 'grid' : 'list';
    $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    const show = state.view === 'grid' ? el.grid : el.list;
    const hide = state.view === 'grid' ? el.list : el.grid;
    hide.hidden = true;
    show.hidden = false;
    if (animate) {
      const items = $$('.row, .card', show);
      items.forEach((n) => { n.classList.remove('is-in'); n.style.transitionDelay = ''; });
      requestAnimationFrame(() => observe(items));
    }
    fitShots(show);
    try { localStorage.setItem('nima:view', state.view); } catch (_) { /* nada */ }
  }
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  /* ------------------------------------------------------------------
     Cursor, preview flotante y tinte del fondo (solo puntero fino)
     ------------------------------------------------------------------ */
  function setTint(color) {
    document.documentElement.style.setProperty('--tint', color);
  }
  function hidePreview() {
    el.preview.classList.remove('is-on');
  }

  if (fine) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const cur = { x: pos.x, y: pos.y };
    const prv = { x: pos.x, y: pos.y, r: 0 };

    addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    }, { passive: true });

    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.22;
      cur.y += (pos.y - cur.y) * 0.22;
      el.cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;

      const dx = pos.x - prv.x;
      prv.x += dx * 0.1;
      prv.y += (pos.y - prv.y) * 0.1;
      prv.r += (Math.max(-10, Math.min(10, dx * 0.06)) - prv.r) * 0.1;
      el.preview.style.transform = `translate3d(${prv.x}px, ${prv.y}px, 0) rotate(${prv.r}deg)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor]');
      el.cursor.classList.toggle('is-big', !!t);
      $('.cursor-label', el.cursor).textContent = t ? t.dataset.cursor : '';

      const row = e.target.closest('.row-link');
      if (row && !state.current) {
        const s = state.sites.find((x) => x.slug === row.dataset.slug);
        $$('[data-for]', el.previewInner).forEach((n) => n.classList.toggle('is-active', n.dataset.for === row.dataset.slug));
        el.preview.classList.add('is-on');
        if (s) setTint(s.theme.accent);
      }
    });
    el.list.addEventListener('mouseleave', hidePreview);
    document.addEventListener('mouseleave', () => el.cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => el.cursor.classList.remove('is-hidden'));
    addEventListener('scroll', () => { if (!el.list.matches(':hover')) hidePreview(); }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Tipografías de los clientes (títulos de ficha en su propia fuente)
     ------------------------------------------------------------------ */
  const loadedFonts = new Set();
  function ensureFonts() {
    const fams = [...new Set(state.sites.flatMap((s) => s.fonts))].filter((f) => !loadedFonts.has(f));
    if (!fams.length) return;
    fams.forEach((f) => loadedFonts.add(f));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }

  /* ------------------------------------------------------------------
     Varios
     ------------------------------------------------------------------ */
  function clock() {
    const n = $('[data-clock]');
    if (!n) return;
    const fmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
    const tick = () => { n.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20e3);
  }

  function boot() {
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
    if (cfg.contact) $$('a[data-mail]').forEach((a) => { a.href = `mailto:${cfg.contact}`; if (!a.children.length) a.textContent = cfg.contact; });
    $$('a[data-github]').forEach((a) => { a.href = `https://github.com/${cfg.github}`; });
    clock();

    let saved = 'list';
    try { saved = localStorage.getItem('nima:view') || 'list'; } catch (_) { /* nada */ }
    renderHome();
    setView(saved, false);

    const deep = !!parse();
    if (deep) { startHome(); route(); }
    intro(deep);

    discover()
      .catch((err) => log('descubrimiento GitHub no disponible:', err.message))
      .finally(() => { discovered = true; if (parse() && !state.current) route(); });

    if ('requestIdleCallback' in window) requestIdleCallback(ensureFonts, { timeout: 4000 });
    else setTimeout(ensureFonts, 2500);
  }

  window.debug = {
    state,
    sites: () => state.sites,
    go,
    step,
    rediscover: () => { try { sessionStorage.removeItem('nima:repos'); } catch (_) { /* nada */ } return discover(); },
  };

  boot();
})();
