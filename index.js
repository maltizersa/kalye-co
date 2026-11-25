/* ==========================================================================
   NFC Digital Business Card + Google Reviews
   --------------------------------------------------------------------------
   Every piece of content and branding comes from index.json.
   To set up a new client, edit index.json only — no HTML/CSS changes needed.

   Views (hash routing, so one URL works for both NFC cards and counter stands):
     index.html            → Business card
     index.html#reviews    → Google Reviews page
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Config                                                             */
  /* ------------------------------------------------------------------ */
  const DATA_URL = 'index.json';
  const VIEWS = ['card', 'reviews'];

  const THEME_DEFAULTS = {
    mode: 'light',
    primary: '#1F4D3F',
    accent: '#E0A458',
    background: '#F4EFE7',
    surface: '#FFFFFF',
    text: '#1E1B18',
    muted: '#6B645C',
    font: 'Plus Jakarta Sans',
    fontWeights: '400;500;600;700;800',
    radius: 22,
  };

  // Supported social platforms → Bootstrap Icon + brand color.
  // Platforms without a color use the theme text color (works in dark mode).
  const SOCIALS = {
    facebook:  { icon: 'facebook',       label: 'Facebook',  color: '#1877F2' },
    instagram: { icon: 'instagram',      label: 'Instagram', color: '#E1306C' },
    tiktok:    { icon: 'tiktok',         label: 'TikTok' },
    youtube:   { icon: 'youtube',        label: 'YouTube',   color: '#FF0000' },
    linkedin:  { icon: 'linkedin',       label: 'LinkedIn',  color: '#0A66C2' },
    x:         { icon: 'twitter-x',      label: 'X' },
    threads:   { icon: 'threads',        label: 'Threads' },
    pinterest: { icon: 'pinterest',      label: 'Pinterest', color: '#E60023' },
    telegram:  { icon: 'telegram',       label: 'Telegram',  color: '#26A5E4' },
    whatsapp:  { icon: 'whatsapp',       label: 'WhatsApp',  color: '#25D366' },
    messenger: { icon: 'messenger',      label: 'Messenger', color: '#0084FF' },
    github:    { icon: 'github',         label: 'GitHub' },
    shopee:    { icon: 'bag-fill',       label: 'Shopee',    color: '#EE4D2D' },
    lazada:    { icon: 'bag-heart-fill', label: 'Lazada',    color: '#F57224' },
    website:   { icon: 'globe2',         label: 'Website' },
  };

  // Quick action buttons under the name. Order/selection comes from
  // settings.quickActions in index.json. Missing contact data = hidden.
  const QUICK_ACTIONS = {
    call:      (c) => c.phone     && { icon: 'telephone-fill',      label: 'Call',       href: `tel:${c.phone}` },
    sms:       (c) => c.phone     && { icon: 'chat-left-text-fill', label: 'Text',       href: `sms:${c.phone}` },
    email:     (c) => c.email     && { icon: 'envelope-fill',       label: 'Email',      href: `mailto:${c.email}` },
    messenger: (c) => c.messenger && { icon: 'messenger',           label: 'Messenger',  href: `https://m.me/${encodeURIComponent(c.messenger)}` },
    whatsapp:  (c) => c.whatsapp  && { icon: 'whatsapp',            label: 'WhatsApp',   href: `https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}` },
    viber:     (c) => c.viber     && { icon: 'chat-dots-fill',      label: 'Viber',      href: `viber://chat?number=${encodeURIComponent(c.viber)}` },
    map:       (c) => (c.mapsUrl || c.address) && { icon: 'geo-alt-fill', label: 'Directions', href: mapsHref(c) },
    website:   (c) => c.website   && { icon: 'globe2',              label: 'Website',    href: c.website },
  };

  const DAYS = [
    ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
    ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
  ];

  const state = { data: null, qrView: 'card' };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (value = '') => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'sms:', 'viber:'];
  function safeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url, location.href);
      return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? url : '';
    } catch {
      return '';
    }
  }

  const isExternal = (url) => /^https?:\/\//i.test(url);
  const linkAttrs = (url) => (isExternal(url) ? ' target="_blank" rel="noopener"' : '');

  /** Renders an <a> when the URL is valid, otherwise a <div>. */
  function linkTag(href, cls, inner, extra = '') {
    const url = safeUrl(href);
    return url
      ? `<a class="${cls}" href="${esc(url)}"${linkAttrs(url)} ${extra}>${inner}</a>`
      : `<div class="${cls}" ${extra}>${inner}</div>`;
  }

  const prettyUrl = (url = '') => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

  function mapsHref(c) {
    return c.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  }

  function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function fullName(p = {}) {
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.name || '';
  }

  /** Fills an element with an image, falling back to initials if missing/broken. */
  function setImageOrInitials(el, src, name) {
    const url = safeUrl(src);
    el.textContent = initials(name);
    if (!url) return;
    const img = new Image();
    img.alt = name;
    img.onload = () => { el.textContent = ''; el.appendChild(img); };
    img.src = url;
  }

  function stars(rating = 0) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const icon = rating >= i - 0.25 ? 'star-fill' : rating >= i - 0.75 ? 'star-half' : 'star';
      html += `<i class="bi bi-${icon}"></i>`;
    }
    return `<span class="stars" role="img" aria-label="${esc(rating)} out of 5 stars">${html}</span>`;
  }

  const hueFrom = (str = '') => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

  function toggleBlock(name, show) {
    $$(`[data-block="${name}"]`).forEach((el) => el.classList.toggle('d-none', !show));
  }

  /* ---------- Color helpers (auto text color on brand backgrounds) ---------- */
  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /** Picks white or near-black text, whichever has more contrast. */
  function readableOn(hex) {
    const L = luminance(hex);
    const contrastWhite = 1.05 / (L + 0.05);
    const contrastBlack = (L + 0.05) / 0.05;
    return contrastWhite >= contrastBlack ? '#FFFFFF' : '#111111';
  }

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */
  function applyTheme(theme = {}) {
    const t = { ...THEME_DEFAULTS, ...theme };
    const root = document.documentElement;
    const dark = t.mode === 'dark';

    root.setAttribute('data-bs-theme', dark ? 'dark' : 'light');

    const vars = {
      '--brand': t.primary,
      '--accent': t.accent,
      '--bg': t.background,
      '--surface': t.surface,
      '--text': t.text,
      '--muted': t.muted,
      '--on-brand': readableOn(t.primary),
      '--on-accent': readableOn(t.accent),
      '--brand-ink': t.brandText || (dark ? t.accent : t.primary),
      '--radius': `${parseInt(t.radius, 10) || THEME_DEFAULTS.radius}px`,
    };
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));

    $('meta[name="theme-color"]').setAttribute('content', t.primary);

    return loadFont(t.font, t.fontWeights);
  }

  /** Loads a Google Font. Resolves when ready (or after a short timeout). */
  function loadFont(family, weights) {
    if (!family) return Promise.resolve();
    document.documentElement.style.setProperty(
      '--font', `"${family}", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
    );

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights}&display=swap`;

    const ready = new Promise((resolve) => {
      link.onload = () => {
        document.fonts.load(`700 1em "${family}"`).then(resolve, resolve);
      };
      link.onerror = resolve;
    });
    document.head.appendChild(link);

    const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
    return Promise.race([ready, timeout]);
  }

  /* ------------------------------------------------------------------ */
  /* Render: Business card                                              */
  /* ------------------------------------------------------------------ */
  function renderCard(d) {
    const p = d.profile || {};
    const c = d.contact || {};
    const name = fullName(p);
    const company = p.company || '';

    // Cover
    const cover = $('#cover');
    const coverUrl = safeUrl(p.cover);
    if (coverUrl) {
      cover.classList.add('has-image');
      cover.style.setProperty('--cover-img', `url("${coverUrl.replace(/"/g, '%22')}")`);
    }
    setImageOrInitials($('#coverLogo'), p.logo, company || name);
    $('#coverCompany').textContent = company;

    // Profile
    setImageOrInitials($('#avatar'), p.avatar, name);
    $('#verified').classList.toggle('d-none', !p.verified);
    $('#fullName').textContent = name;
    $('#jobTitle').textContent = p.title || '';
    $('#company').textContent = company;
    $('#roleSep').classList.toggle('d-none', !(p.title && company));
    $('#tagline').textContent = p.tagline || '';

    // Quick actions
    const keys = d.settings?.quickActions || ['call', 'email', 'map', 'website'];
    const actions = keys.map((k) => QUICK_ACTIONS[k]?.(c)).filter(Boolean).slice(0, 4);
    const qa = $('#quickActions');
    qa.style.setProperty('--cols', actions.length || 1);
    qa.innerHTML = actions.map((a) => linkTag(
      a.href, 'qa',
      `<span class="qa-icon"><i class="bi bi-${esc(a.icon)}"></i></span><span>${esc(a.label)}</span>`,
      `aria-label="${esc(a.label)}"`,
    )).join('');
    qa.classList.toggle('d-none', actions.length === 0);

    // About
    $('#aboutText').textContent = p.bio || '';
    toggleBlock('about', Boolean(p.bio));

    // Contact list
    const rows = [
      c.phone   && { icon: 'telephone', label: 'Mobile',  value: c.phoneDisplay || c.phone, href: `tel:${c.phone}` },
      c.email   && { icon: 'envelope',  label: 'Email',   value: c.email,                   href: `mailto:${c.email}` },
      c.website && { icon: 'globe2',    label: 'Website', value: prettyUrl(c.website),      href: c.website },
      c.address && { icon: 'geo-alt',   label: 'Address', value: c.address,                 href: mapsHref(c) },
    ].filter(Boolean);
    $('#contactList').innerHTML = rows.map((r) => linkTag(r.href, 'contact-row', `
      <span class="contact-icon"><i class="bi bi-${r.icon}"></i></span>
      <span class="min-w-0">
        <span class="contact-label d-block">${esc(r.label)}</span>
        <span class="contact-value d-block">${esc(r.value)}</span>
      </span>
      <i class="bi bi-chevron-right contact-chev"></i>`)).join('');
    toggleBlock('contact', rows.length > 0);

    // Quick links
    const links = (d.links || []).filter((l) => l.label && l.url);
    $('#linksList').innerHTML = links.map((l) => linkTag(l.url, 'link-btn', `
      <i class="bi bi-${esc(l.icon || 'link-45deg')} link-icon"></i>
      <span>${esc(l.label)}</span>
      <i class="bi bi-arrow-up-right"></i>`)).join('');
    toggleBlock('links', links.length > 0);

    // Socials
    const socials = (d.socials || []).filter((s) => s.url);
    $('#socialGrid').innerHTML = socials.map((s) => {
      const meta = SOCIALS[s.platform] || { icon: 'link-45deg', label: s.platform };
      const color = meta.color ? `style="--c:${meta.color}"` : '';
      return linkTag(s.url, 'social',
        `<i class="bi bi-${esc(meta.icon)}"></i><span>${esc(s.label || meta.label)}</span>`,
        `${color} aria-label="${esc(s.label || meta.label)}"`);
    }).join('');
    toggleBlock('socials', socials.length > 0);

    // Services
    const services = d.services || [];
    $('#servicesGrid').innerHTML = services.map((s) => `
      <div class="col-6 col-lg-3">
        <div class="service">
          <span class="service-icon"><i class="bi bi-${esc(s.icon || 'check2-circle')}"></i></span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description || '')}</p>
        </div>
      </div>`).join('');
    toggleBlock('services', services.length > 0);

    // Hours
    renderHours(d);

    // Review teaser
    const r = d.reviews || {};
    const hasReviews = Boolean(r.googlePlaceId || r.writeReviewUrl);
    $('#teaserRating').textContent = r.rating ? Number(r.rating).toFixed(1) : '';
    $('#teaserStars').innerHTML = r.rating ? stars(r.rating) : '';
    $('#teaserTotal').textContent = r.totalReviews ? `${Number(r.totalReviews).toLocaleString()} Google reviews` : 'Google reviews';
    toggleBlock('reviewTeaser', hasReviews);

    // Footer
    $('#year').textContent = new Date().getFullYear();
    $('#footerCompany').textContent = company || name;
    const pb = d.settings?.poweredBy;
    if (pb?.label) {
      const brand = safeUrl(pb.url)
        ? `<a href="${esc(pb.url)}"${linkAttrs(pb.url)}>${esc(pb.label)}</a>`
        : `<strong>${esc(pb.label)}</strong>`;
      $('#poweredBy').innerHTML = `Powered by ${brand}${pb.cta ? ` · ${esc(pb.cta)}` : ''}`;
    }
  }

  /* ---------- Business hours with live "Open now" status ---------- */
  function nowIn(timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(new Date());
      const get = (type) => parts.find((x) => x.type === type)?.value;
      return { day: get('weekday').toLowerCase().slice(0, 3), minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
    } catch {
      const n = new Date();
      return { day: DAYS[(n.getDay() + 6) % 7][0], minutes: n.getHours() * 60 + n.getMinutes() };
    }
  }

  const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const formatTime = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`;
  };

  function renderHours(d) {
    const schedule = d.hours?.schedule || [];
    if (!schedule.length) { toggleBlock('hours', false); return; }

    const now = nowIn(d.settings?.timezone);
    const findSlot = (day) => schedule.find((s) => (s.days || []).includes(day));

    $('#hoursList').innerHTML = DAYS.map(([key, label]) => {
      const slot = findSlot(key);
      const time = slot ? `${formatTime(slot.open)} – ${formatTime(slot.close)}` : '<span class="is-closed">Closed</span>';
      return `<div class="hours-row${key === now.day ? ' today' : ''}"><span>${label}</span><span>${time}</span></div>`;
    }).join('');

    const today = findSlot(now.day);
    let open = false;
    if (today) {
      const o = toMinutes(today.open);
      const cl = toMinutes(today.close);
      open = cl > o ? now.minutes >= o && now.minutes < cl : now.minutes >= o || now.minutes < cl;
    }
    const pill = $('#hoursStatus');
    pill.className = `status-pill ${open ? 'open' : 'closed'}`;
    pill.textContent = open ? `Open now · until ${formatTime(today.close)}` : 'Closed now';
    toggleBlock('hours', true);
  }

  /* ------------------------------------------------------------------ */
  /* Render: Google Reviews                                             */
  /* ------------------------------------------------------------------ */
  function reviewLinks(r = {}) {
    const id = r.googlePlaceId ? encodeURIComponent(r.googlePlaceId) : '';
    return {
      write: safeUrl(r.writeReviewUrl) || (id ? `https://search.google.com/local/writereview?placeid=${id}` : ''),
      read: safeUrl(r.readReviewsUrl) || (id ? `https://search.google.com/local/reviews?placeid=${id}` : ''),
    };
  }

  function renderReviews(d) {
    const p = d.profile || {};
    const r = d.reviews || {};
    const company = p.company || fullName(p);
    const links = reviewLinks(r);

    setImageOrInitials($('#rvLogo'), p.logo, company);
    $('#rvTitle').textContent = company;
    $('#rvAddress').textContent = d.contact?.address || '';

    // Summary
    const rating = Number(r.rating) || 0;
    const total = Number(r.totalReviews) || 0;
    $('#rvRating').textContent = rating ? rating.toFixed(1) : '–';
    $('#rvStars').innerHTML = stars(rating);
    $('#rvTotal').textContent = `${total.toLocaleString()} reviews`;

    const breakdown = r.breakdown || {};
    const sum = Object.values(breakdown).reduce((a, b) => a + Number(b || 0), 0) || 1;
    $('#rvBars').innerHTML = [5, 4, 3, 2, 1].map((n) => {
      const pct = Math.round((Number(breakdown[n] || 0) / sum) * 100);
      return `<div class="bar-row"><span class="num">${n}</span><div class="bar"><span data-w="${pct}"></span></div></div>`;
    }).join('');

    // Call to action — every star links to the same Google form.
    // (No "review gating": Google's policy forbids filtering out unhappy customers.)
    $('#rvHeadline').textContent = r.headline || 'Enjoyed your experience?';
    $('#rvMessage').textContent = r.message || 'Your review helps our small business grow. It only takes 30 seconds.';
    $('#rvCtaStars').innerHTML = [1, 2, 3, 4, 5].map((n) => (links.write
      ? `<a href="${esc(links.write)}" target="_blank" rel="noopener" style="--n:${n}" aria-label="Rate ${n} star${n > 1 ? 's' : ''} on Google"><i class="bi bi-star-fill"></i></a>`
      : `<a style="--n:${n}"><i class="bi bi-star-fill"></i></a>`)).join('');

    const writeBtn = $('#rvWriteBtn');
    const readBtn = $('#rvReadBtn');
    if (links.write) writeBtn.href = links.write; else writeBtn.classList.add('disabled');
    if (links.read) readBtn.href = links.read; else readBtn.classList.add('d-none');

    // Featured reviews
    const featured = r.featured || [];
    $('#rvFeatured').innerHTML = featured.map((f) => `
      <article class="review-card">
        <div class="review-head">
          <span class="review-avatar" style="--h:${hueFrom(f.name)}">${esc(initials(f.name))}</span>
          <div class="min-w-0">
            <div class="review-name">${esc(f.name)}</div>
            <div class="review-meta">${stars(Number(f.rating) || 5)}<span>${esc(f.date || '')}</span></div>
          </div>
          <i class="bi bi-google review-source" title="Posted on Google"></i>
        </div>
        <p class="review-text">${esc(f.text)}</p>
      </article>`).join('');
    toggleBlock('featured', featured.length > 0);
  }

  function animateBars() {
    $$('#rvBars .bar span').forEach((bar) => { bar.style.width = '0'; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('#rvBars .bar span').forEach((bar) => { bar.style.width = `${bar.dataset.w}%`; });
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                             */
  /* ------------------------------------------------------------------ */
  const currentView = () => {
    const hash = location.hash.replace('#', '');
    return VIEWS.includes(hash) ? hash : 'card';
  };

  function showView(name) {
    VIEWS.forEach((v) => $(`#view-${v}`).classList.toggle('d-none', v !== name));
    $$('.nav-btn[data-view]').forEach((btn) => {
      const active = btn.dataset.view === name;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    replayReveal($(`#view-${name}`));
    if (name === 'reviews') animateBars();
  }

  function replayReveal(root) {
    $$('.reveal', root).filter((el) => !el.classList.contains('d-none')).forEach((el, i) => {
      el.style.setProperty('--i', i);
      el.classList.remove('reveal-in');
      void el.offsetWidth; // restart animation
      el.classList.add('reveal-in');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Actions: vCard, share, QR, toast                                   */
  /* ------------------------------------------------------------------ */
  const vEsc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

  function buildVCard(d) {
    const p = d.profile || {};
    const c = d.contact || {};
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${vEsc(p.lastName)};${vEsc(p.firstName)};;;`,
      `FN:${vEsc(fullName(p))}`,
      p.company && `ORG:${vEsc(p.company)}`,
      p.title && `TITLE:${vEsc(p.title)}`,
      c.phone && `TEL;TYPE=CELL,VOICE:${c.phone}`,
      c.email && `EMAIL;TYPE=INTERNET,WORK:${c.email}`,
      c.website && `URL:${c.website}`,
      c.address && `ADR;TYPE=WORK:;;${vEsc(c.address)};;;;`,
      ...(d.socials || []).filter((s) => s.url).map((s) => `X-SOCIALPROFILE;TYPE=${vEsc(s.platform)}:${s.url}`),
      p.tagline && `NOTE:${vEsc(p.tagline)}`,
      'END:VCARD',
    ].filter(Boolean);
    return lines.join('\r\n');
  }

  function saveContact() {
    const d = state.data;
    const blob = new Blob([buildVCard(d)], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fullName(d.profile) || 'contact').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Contact downloaded — open it to save');
  }

  function baseUrl() {
    const configured = state.data?.settings?.publicUrl;
    return (configured || location.href).split('#')[0];
  }
  const shareUrl = (view) => (view === 'reviews' ? `${baseUrl()}#reviews` : baseUrl());

  async function shareCard() {
    const p = state.data.profile || {};
    const payload = {
      title: `${fullName(p)} · ${p.company || ''}`.trim(),
      text: p.tagline || 'Here’s my digital business card.',
      url: shareUrl('card'),
    };
    if (navigator.share) {
      try { await navigator.share(payload); return; } catch (err) { if (err.name === 'AbortError') return; }
    }
    copyText(payload.url, 'Link copied to clipboard');
  }

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast(message);
  }

  function qrDarkColor() {
    const primary = state.data?.theme?.primary || THEME_DEFAULTS.primary;
    return luminance(primary) < 0.18 ? primary : '#111111'; // keep it scannable
  }

  function renderQr(view) {
    state.qrView = view;
    $$('.seg button').forEach((b) => {
      const on = b.dataset.qr === view;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });

    const box = $('#qrCode');
    const url = shareUrl(view);
    box.innerHTML = '';
    $('#qrUrl').textContent = prettyUrl(url);

    if (typeof QRCode === 'undefined') {
      box.innerHTML = '<p class="small muted m-0 p-4">QR library failed to load.</p>';
      return;
    }
    new QRCode(box, {
      text: url,
      width: 400,
      height: 400,
      colorDark: qrDarkColor(),
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function downloadQr() {
    const src = $('#qrCode canvas');
    if (!src) return;
    const pad = 40;
    const out = document.createElement('canvas');
    out.width = src.width + pad * 2;
    out.height = src.height + pad * 2;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, pad, pad);

    const company = (state.data.profile?.company || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = `${company}-${state.qrView === 'reviews' ? 'google-review' : 'business-card'}-qr.png`;
    a.click();
    toast('QR code saved');
  }

  let toastInstance = null;
  function toast(message) {
    $('#toastMsg').textContent = message;
    toastInstance = toastInstance || bootstrap.Toast.getOrCreateInstance($('#toast'));
    toastInstance.show();
  }

  /* ------------------------------------------------------------------ */
  /* Meta + events                                                      */
  /* ------------------------------------------------------------------ */
  function applyMeta(d) {
    const p = d.profile || {};
    const name = fullName(p);
    document.title = [name, p.company].filter(Boolean).join(' · ') || 'Digital Business Card';
    $('meta[name="description"]').setAttribute('content', p.tagline || `${name} — digital business card`);
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => showView(currentView()));
    $('#saveContact').addEventListener('click', saveContact);
    $('#shareBtn').addEventListener('click', shareCard);

    const qrModal = $('#qrModal');
    $('#qrBtn').addEventListener('click', () => {
      renderQr(currentView());
      bootstrap.Modal.getOrCreateInstance(qrModal).show();
    });
    $$('.seg button').forEach((b) => b.addEventListener('click', () => renderQr(b.dataset.qr)));
    $('#qrCopy').addEventListener('click', () => copyText(shareUrl(state.qrView), 'Link copied to clipboard'));
    $('#qrDownload').addEventListener('click', downloadQr);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  function showError(err) {
    console.error(err);
    const msg = location.protocol === 'file:'
      ? 'Open this project through a local web server (for example VS Code “Live Server”). Browsers block loading index.json directly from a file.'
      : 'Please check that index.json exists and is valid JSON.';
    $('#errorMsg').textContent = msg;
    $('#loader').classList.add('d-none');
    $('#error').classList.remove('d-none');
  }

  async function init() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load ${DATA_URL} (HTTP ${res.status})`);
      const data = await res.json();
      state.data = data;

      const fontReady = applyTheme(data.theme);
      applyMeta(data);
      renderCard(data);
      renderReviews(data);
      bindEvents();
      await fontReady;

      $('#loader').classList.add('d-none');
      $('#app').classList.remove('d-none');
      $('#bottomNav').classList.remove('d-none');
      showView(currentView());
    } catch (err) {
      showError(err);
    }
  }

  init();
})();
