/* ==========================================================================
   Studio Nima — versión sencilla (/sitios/)
   Misma fuente de datos que el portafolio: ../js/sites.js
   Depuración en consola : window.debug
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const log = (...a) => console.info('[nima/sitios]', ...a);

  document.documentElement.classList.add('js');

  const cfg = Object.assign({ github: 'studio-nima', exclude: [], contact: '', whatsapp: '' }, window.NIMA);
  const IMG = '../img/sites/';
  const state = { sites: [] };

  function normalize(s) {
    const repo = s.repo || s.slug;
    return {
      ...s,
      repo,
      name: s.name || repo.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url: s.url || `https://${cfg.github}.github.io/${repo}/`,
      deliverables: s.deliverables || [],
      bg: (s.theme && s.theme.bg) || '#ece8df',
      img: s.shots ? { cover: `${IMG}${s.shots}-desktop.jpg`, mobile: `${IMG}${s.shots}-mobile.jpg` } : null,
    };
  }
  state.sites = (window.SITES || []).map(normalize);

  /* Primera frase de la descripción: suficiente para una tarjeta */
  const short = (t) => (String(t || '').match(/^.*?[.!?](\s|$)/) || [t || ''])[0].trim();

  /* ------------------------------------------------------------------
     Contacto: WhatsApp si está configurado, si no correo
     ------------------------------------------------------------------ */
  function contactLinks() {
    const msg = 'Hola, me interesa un sitio web para mi negocio.';
    const wa = String(cfg.whatsapp || '').replace(/\D/g, '');
    $$('[data-contact]').forEach((a) => {
      if (wa) {
        a.href = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.classList.add('btn-wa');
      } else if (cfg.contact) {
        a.href = `mailto:${cfg.contact}?subject=${encodeURIComponent('Sitio web para mi negocio')}&body=${encodeURIComponent(msg)}`;
      }
    });
    if (cfg.contact) $$('[data-mail]').forEach((a) => { a.href = `mailto:${cfg.contact}`; a.textContent = cfg.contact; });
  }

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  function renderPhones() {
    const box = $('[data-phones]');
    if (!box) return;
    const withShots = state.sites.filter((s) => s.img).slice(0, 3);
    if (!withShots.length) { box.hidden = true; return; }
    // El más colorido al centro
    const order = withShots.length === 3 ? [withShots[1], withShots[2], withShots[0]] : withShots;
    box.innerHTML = order.map((s) => `
      <div class="hphone"><img src="${s.img.mobile}" alt="" decoding="async"></div>`).join('') + `
      <span class="sticker sticker-a"><i></i>Botón de WhatsApp</span>
      <span class="sticker sticker-b"><i></i>Listo para el celular</span>`;
  }

  function renderCards() {
    const box = $('[data-cards]');
    if (!box) return;
    box.innerHTML = state.sites.map((s) => `
      <a class="card rise" href="${esc(s.url)}" target="_blank" rel="noopener">
        <div class="card-shot" style="--c:${esc(s.bg)}">
          ${s.img
            ? `<img src="${s.img.cover}" alt="Sitio de ${esc(s.name)}" loading="lazy" decoding="async">`
            : `<iframe data-src="${esc(s.url)}" title="Vista de ${esc(s.name)}" loading="lazy" tabindex="-1"></iframe>`}
        </div>
        <div class="card-body">
          <div class="card-top">
            <span class="card-name">${esc(s.name)}</span>
            ${s.category ? `<span class="card-cat">${esc(s.category)}</span>` : ''}
          </div>
          ${s.description ? `<p class="card-desc">${esc(short(s.description))}</p>` : ''}
          ${s.deliverables.length ? `<ul class="card-tags">${s.deliverables.slice(0, 3).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <span class="card-link">Ver el sitio ↗</span>
        </div>
      </a>`).join('');

    $$('[data-count]').forEach((n) => { n.textContent = state.sites.length; });
    fitFrames();
    observe($$('.rise', box));
  }

  function fitFrames() {
    $$('.card-shot iframe').forEach((f) => {
      if (!f.src && f.dataset.src) f.src = f.dataset.src;
      const view = f.parentElement;
      if (view) view.style.setProperty('--scale', view.clientWidth / 1280);
    });
  }
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(fitFrames, 150); });

  /* ------------------------------------------------------------------
     Aparición al hacer scroll
     ------------------------------------------------------------------ */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target;
        const sib = t.parentElement ? [...t.parentElement.children] : [];
        t.style.transitionDelay = `${Math.min(sib.indexOf(t), 5) * 60}ms`;
        t.classList.add('is-in');
        io.unobserve(t);
      });
    }, { threshold: 0.1 })
    : null;
  function observe(nodes) {
    nodes.forEach((n) => (io ? io.observe(n) : n.classList.add('is-in')));
  }

  /* ------------------------------------------------------------------
     Sitios publicados en GitHub que aún no están en sites.js
     (misma caché que el portafolio)
     ------------------------------------------------------------------ */
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

    log('nuevos en GitHub:', fresh.map((r) => r.name));
    if (!fresh.length) return;
    state.sites = [
      ...fresh.map((r) => normalize({ repo: r.name, description: r.description || '', category: 'Sitio web' })),
      ...state.sites,
    ];
    renderCards();
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */
  function boot() {
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
    contactLinks();
    renderPhones();
    renderCards();
    observe($$('.feature, .step, .faq details').map((n) => { n.classList.add('rise'); return n; }));

    const top = $('.top');
    if (top) {
      const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 8);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    discover().catch((err) => log('GitHub no disponible:', err.message));
  }

  window.debug = { state, sites: () => state.sites, rediscover: () => { try { sessionStorage.removeItem('nima:repos'); } catch (_) { /* nada */ } return discover(); } };

  boot();
})();
