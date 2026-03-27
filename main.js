/* ================================================
   MythraLux Edu — main.js
   Dashboard: load apps, render cards, search,
   filter, app viewer, ads, sync banner
   ================================================ */
'use strict';

// ── State ────────────────────────────────────────
const M = {
  apps:           [],
  filtered:       [],
  activeCategory: 'All',
  searchQuery:    '',
  currentApp:     null,
  pollTimer:      null,
  lang:           localStorage.getItem(CONFIG.CACHE.LANG) || 'en',
  theme:          localStorage.getItem(CONFIG.CACHE.THEME) || 'dark',
};

// Category icon map
const CAT_ICONS = {
  All: 'grid', Quiz: 'book-open', Notes: 'file-text',
  Download: 'download', Writing: 'pen-tool', Games: 'gamepad-2',
  Tools: 'wrench', More: 'more-horizontal',
};

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();

  // Apply saved theme + lang
  applyTheme(M.theme);
  applyLang(M.lang);

  // Init profile + feedback UI
  if (typeof initProfile  === 'function') initProfile();
  if (typeof initFeedback === 'function') initFeedback();

  // Build sidebar categories
  buildCategoryNav();
  buildFilterChips();

  // Load apps
  await _loadApps();

  // Start polling
  M.pollTimer = setInterval(_silentPoll, CONFIG.POLL_MS);

  // Search listener (desktop)
  document.getElementById('search-input').addEventListener('input', e => onSearch(e.target.value));

  setTimeout(() => lucide.createIcons(), 100);
});

// ── DATA LOADING ─────────────────────────────────
async function _loadApps() {
  const cached = _getCache();
  if (cached) {
    M.apps = cached;
    _showContent();
    _bgFetch();
  } else {
    await _bgFetch(true);
  }
}

async function _bgFetch(blocking = false) {
  const url = CONFIG.SHEETS.MASTER_APPS + '&_cb=' + Date.now();
  const p = new Promise((res, rej) => {
    Papa.parse(url, {
      download: true, header: false, skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const raw     = data.map(r => r.join('\x1F')).join('\x1E');
          const newHash = _djb2(raw);
          const oldHash = localStorage.getItem(CONFIG.CACHE.APPS_HASH) || '';

          if (newHash === oldHash && M.apps.length) { console.log('[Apps] No change'); res(M.apps); return; }

          const apps = _parseApps(data);
          if (!apps.length) throw new Error('No apps in sheet');

          const wasChange = M.apps.length > 0;
          M.apps = apps;
          _setCache(apps, newHash);

          if (wasChange) { _showSyncBanner(); }
          _showContent();
          res(apps);
        } catch (e) { rej(e); }
      },
      error: e => rej(e),
    });
  });

  if (blocking) {
    try { await p; }
    catch (e) {
      // Fallback to built-in apps
      M.apps = CONFIG.FALLBACK_APPS;
      _showContent();
      console.warn('[Apps] Sheet failed, using fallback:', e.message);
    }
  } else {
    p.catch(e => console.warn('[Apps] Background fetch failed:', e.message));
  }
}

async function _silentPoll() {
  console.log('[Apps] ⏱ polling…');
  await _bgFetch(false);
}

function _parseApps(rows) {
  const apps = []; const seen = new Set();
  rows.forEach((r, i) => {
    if (i === 0) { if (['appid','id',''].includes((r[0]||'').toLowerCase())) return; }
    if (r.length < 6) return;
    const appId    = (r[0]||'').trim();
    const name     = (r[1]||'').trim();
    const desc     = (r[2]||'').trim();
    const url      = (r[3]||'').trim();
    const thumb    = (r[4]||'').trim();
    const category = (r[5]||'Other').trim();
    const featured = (r[6]||'').toString().trim().toUpperCase() === 'TRUE';
    const type     = (r[7]||'iframe').trim().toLowerCase();
    const tags     = (r[8]||'').trim();
    const status   = (r[9]||'active').trim().toLowerCase();
    if (!appId || !name) return;
    if (seen.has(appId)) return;
    seen.add(appId);
    apps.push({ appId, name, description: desc, url, thumbnail: thumb, category, featured, type, tags, status });
  });
  return apps;
}

function retryLoad() {
  localStorage.removeItem(CONFIG.CACHE.APPS);
  localStorage.removeItem(CONFIG.CACHE.APPS_HASH);
  document.getElementById('state-error').classList.add('hidden');
  document.getElementById('state-loading').classList.remove('hidden');
  _loadApps();
}

// ── RENDER ───────────────────────────────────────
function _showContent() {
  document.getElementById('state-loading').classList.add('hidden');
  document.getElementById('state-error').classList.add('hidden');
  document.getElementById('state-empty').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');
  _applyFilter();
}

function _applyFilter() {
  const q    = M.searchQuery.toLowerCase();
  const cat  = M.activeCategory;
  const active = M.apps.filter(a => a.status === 'active');
  const coming  = M.apps.filter(a => a.status === 'coming-soon');

  let filtered = active;
  if (cat !== 'All') filtered = filtered.filter(a => a.category === cat);
  if (q)             filtered = filtered.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.tags.toLowerCase().includes(q)
  );

  if (!filtered.length && (q || cat !== 'All')) {
    document.getElementById('state-empty').classList.remove('hidden');
    document.getElementById('empty-query').textContent = q
      ? `No results for "${q}"`
      : `No ${cat} apps yet`;
    document.getElementById('content').classList.add('hidden');
    return;
  }

  document.getElementById('state-empty').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');

  // Featured
  const featured = filtered.filter(a => a.featured);
  const featSection = document.getElementById('featured');
  featSection.style.display = featured.length ? '' : 'none';
  if (featured.length) renderFeatured(featured);

  // All apps (with ads)
  renderAppGrid(filtered, coming);

  // Count badge
  document.getElementById('app-count-badge').textContent = `${filtered.length} apps`;

  // Update section title on category filter
  const titleEl = document.getElementById('section-all-title');
  if (titleEl) {
    const span = titleEl.querySelector('span');
    if (span) span.textContent = cat === 'All'
      ? (M.lang === 'bn' ? 'সব অ্যাপ' : 'All Apps')
      : cat;
  }

  setTimeout(() => lucide.createIcons(), 50);
}

function renderFeatured(apps) {
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = apps.map(a => `
    <div class="featured-card" onclick="openApp('${a.appId}')" role="button" tabindex="0">
      <div class="fc-top">
        <div class="fc-thumb">
          ${a.thumbnail
            ? `<img src="${a.thumbnail}" alt="${a.name}" loading="lazy" onerror="this.style.display='none'">`
            : _appEmoji(a.category)}
        </div>
        <div class="fc-meta">
          <p class="fc-name">${a.name}</p>
          <p class="fc-desc">${a.description || 'Open app to explore'}</p>
        </div>
      </div>
      <div class="fc-footer">
        <span class="fc-cat-badge">${a.category}</span>
        <span class="fc-open-btn">
          ${M.lang === 'bn' ? 'খুলুন' : 'Open'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>`).join('');
}

function renderAppGrid(apps, coming) {
  const grid = document.getElementById('apps-grid');
  let html = '';
  let count = 0;

  apps.forEach(a => {
    if (count > 0 && count % CONFIG.ADSENSE.insertAfter === 0) {
      html += _adCardHTML();
    }
    html += _appCardHTML(a);
    count++;
  });

  grid.innerHTML = html;

  // Coming soon
  const cSection = document.getElementById('coming-soon-section');
  const cGrid    = document.getElementById('coming-grid');
  if (coming.length && M.activeCategory === 'All' && !M.searchQuery) {
    cSection.classList.remove('hidden');
    cGrid.innerHTML = coming.map(_appCardHTML).join('');
  } else {
    cSection.classList.add('hidden');
  }
}

function _appCardHTML(a) {
  const statusBadge = a.status === 'coming-soon'
    ? `<span class="ac-status-badge coming-soon">${M.lang === 'bn' ? 'শীঘ্রই' : 'Soon'}</span>`
    : a.status === 'maintenance'
    ? `<span class="ac-status-badge maintenance">🔧</span>` : '';

  return `
    <div class="app-card" onclick="openApp('${a.appId}')" role="button" tabindex="0">
      ${statusBadge}
      <div class="ac-thumb">
        ${a.thumbnail
          ? `<img src="${a.thumbnail}" alt="${a.name}" loading="lazy" onerror="this.style.display='none'">`
          : _appEmoji(a.category)}
      </div>
      <div>
        <p class="ac-name">${a.name}</p>
        <p class="ac-cat">${a.category}</p>
      </div>
    </div>`;
}

function _adCardHTML() {
  if (!CONFIG.ADSENSE.enabled) {
    // Placeholder — swap for real AdSense tag when approved
    return `<div class="ad-card">
      <div class="ad-placeholder">
        <span class="ad-label">Ad</span>
        <span style="font-size:.72rem;color:var(--text-3)">Advertisement</span>
      </div>
    </div>`;
  }
  return `<div class="ad-card">
    <ins class="adsbygoogle" style="display:block"
      data-ad-client="${CONFIG.ADSENSE.client}"
      data-ad-slot="${CONFIG.ADSENSE.slots.banner}"
      data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>
  </div>`;
}

function _appEmoji(cat) {
  const map = { Quiz:'📝', Notes:'📖', Download:'📥', Writing:'✍️', Games:'🎮', Tools:'🔧', More:'⭐' };
  return `<span style="font-size:1.6rem">${map[cat] || '⚡'}</span>`;
}

// ── CATEGORY NAV ─────────────────────────────────
function buildCategoryNav() {
  const nav = document.getElementById('category-nav');
  if (!nav) return;
  nav.innerHTML = CONFIG.CATEGORIES.map(cat => `
    <button class="cat-nav-btn ${cat === 'All' ? 'active' : ''}" onclick="filterCategory('${cat}')">
      <i data-lucide="${CAT_ICONS[cat] || 'circle'}" class="w-4 h-4"></i>
      ${cat}
    </button>`).join('');
}

function buildFilterChips() {
  const row = document.getElementById('filter-chips-row');
  if (!row) return;
  row.innerHTML = CONFIG.CATEGORIES.map(cat =>
    `<button class="chip ${cat === 'All' ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`
  ).join('');
}

function filterCategory(cat) {
  M.activeCategory = cat;
  M.searchQuery    = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-input-mobile').value = '';
  document.getElementById('search-clear').classList.add('hidden');

  // Sidebar
  document.querySelectorAll('.cat-nav-btn').forEach(b => b.classList.toggle('active', b.textContent.trim() === cat));
  // Chips
  document.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b.textContent.trim() === cat));

  _applyFilter();
}

// ── SEARCH ───────────────────────────────────────
function onSearch(val) {
  M.searchQuery = val.trim();
  document.getElementById('search-clear').classList.toggle('hidden', !val);
  // Sync both inputs
  document.getElementById('search-input').value        = val;
  document.getElementById('search-input-mobile').value = val;
  _applyFilter();
}

function clearSearch() {
  onSearch('');
  document.getElementById('search-input').focus();
}

function toggleMobileSearch() {
  const bar = document.getElementById('mobile-search-bar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) document.getElementById('search-input-mobile').focus();
}

// ── APP VIEWER ───────────────────────────────────
function openApp(appId) {
  const app = M.apps.find(a => a.appId === appId);
  if (!app) return;
  if (app.status === 'coming-soon') { showToast(`⏳ ${app.name} — ${M.lang==='bn'?'শীঘ্রই আসছে':'Coming Soon'}`); return; }
  if (!app.url) { showToast('⚠️ App URL not set'); return; }

  M.currentApp = app;

  if (app.type === 'redirect') { window.open(app.url, '_blank', 'noopener'); return; }

  // iframe mode
  document.getElementById('av-name').textContent = app.name;
  document.getElementById('av-cat').textContent  = app.category;

  const thumb = document.getElementById('av-thumb');
  thumb.innerHTML = app.thumbnail
    ? `<img src="${app.thumbnail}" alt="${app.name}" style="width:100%;height:100%;object-fit:cover">`
    : _appEmoji(app.category);

  const iframe = document.getElementById('app-iframe');
  iframe.src   = '';
  iframe.classList.add('hidden');
  document.getElementById('av-loading').classList.remove('hidden');

  setTimeout(() => { iframe.src = app.url; }, 100);

  document.getElementById('app-viewer').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Ad in viewer
  _injectViewerAd();

  setTimeout(() => lucide.createIcons(), 50);

  // Track (via Apps Script analytics — optional)
  _trackAppOpen(app);
}

function onIframeLoad() {
  document.getElementById('av-loading').classList.add('hidden');
  document.getElementById('app-iframe').classList.remove('hidden');
}

function closeAppViewer() {
  document.getElementById('app-viewer').classList.add('hidden');
  document.getElementById('app-iframe').src = '';
  document.body.style.overflow = '';
  M.currentApp = null;
}

function openInNewTab() {
  if (M.currentApp?.url) window.open(M.currentApp.url, '_blank', 'noopener');
}

function _injectViewerAd() {
  const slot = document.getElementById('av-ad-slot');
  if (!slot) return;
  if (!CONFIG.ADSENSE.enabled) {
    slot.innerHTML = `<span class="ad-label">Ad</span><span style="font-size:.72rem;color:var(--text-3)">Advertisement space</span>`;
    return;
  }
  slot.innerHTML = `<ins class="adsbygoogle" style="display:block"
    data-ad-client="${CONFIG.ADSENSE.client}" data-ad-slot="${CONFIG.ADSENSE.slots.sticky}"
    data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
}

function _trackAppOpen(app) {
  // Fire-and-forget analytics ping to Apps Script
  try {
    fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'app_open', appId: app.appId, appName: app.name, ts: Date.now() }),
    }).catch(() => {});
  } catch {}
}

// ── THEME ────────────────────────────────────────
function toggleTheme() {
  M.theme = M.theme === 'dark' ? 'light' : 'dark';
  applyTheme(M.theme);
}

function applyTheme(theme) {
  M.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(CONFIG.CACHE.THEME, theme);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = theme === 'dark' ? '#0d0c1a' : '#f4f5fb';
  setTimeout(() => lucide.createIcons(), 50);
}

// ── LANGUAGE ─────────────────────────────────────
function setLang(lang) {
  M.lang = lang;
  applyLang(lang);
}

function applyLang(lang) {
  M.lang = lang;
  localStorage.setItem(CONFIG.CACHE.LANG, lang);
  document.documentElement.setAttribute('data-lang', lang);
  document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
  document.getElementById('lang-bn')?.classList.toggle('active', lang === 'bn');

  document.querySelectorAll('[data-lang-en]').forEach(el => {
    el.textContent = lang === 'bn'
      ? (el.getAttribute('data-lang-bn') || el.getAttribute('data-lang-en'))
      : el.getAttribute('data-lang-en');
  });

  // Update search placeholder
  const si = document.getElementById('search-input');
  const sm = document.getElementById('search-input-mobile');
  const ph = lang === 'bn' ? 'অ্যাপ খুঁজুন…' : 'Search apps…';
  if (si) si.placeholder = ph;
  if (sm) sm.placeholder = ph;
}

// ── SYNC BANNER ──────────────────────────────────
function _showSyncBanner() {
  const container = document.getElementById('sync-banners');
  if (!container) return;
  const b = document.createElement('div');
  b.className = 'sync-banner';
  b.style.cssText = 'border-color:rgba(79,110,247,.4);color:#4f6ef7;background:rgba(79,110,247,.12)';
  b.innerHTML = `<span>🔄</span><span>${M.lang==='bn'?'অ্যাপ তালিকা আপডেট হয়েছে':'App list updated'}</span><button class="sync-dismiss" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(b);
  setTimeout(() => b.remove(), 6000);
}

// ── MISC ─────────────────────────────────────────
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function showToast(msg, dur = 2800) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg });
  document.body.appendChild(t); setTimeout(() => t.remove(), dur);
}

function openBookmarks() {
  // Opens Quiz Master bookmarks if available — or shows a toast
  showToast('📌 ' + (M.lang === 'bn' ? 'বুকমার্ক শীঘ্রই আসছে' : 'Bookmarks coming soon'));
}

// ── CACHE ────────────────────────────────────────
function _getCache() {
  try { const r = localStorage.getItem(CONFIG.CACHE.APPS); return r ? JSON.parse(r) : null; } catch { return null; }
}
function _setCache(apps, hash) {
  try {
    localStorage.setItem(CONFIG.CACHE.APPS,      JSON.stringify(apps));
    localStorage.setItem(CONFIG.CACHE.APPS_HASH, hash);
    localStorage.setItem(CONFIG.CACHE.APPS_TS,   Date.now());
  } catch {}
}
function _djb2(s) { let h=5381; for(let i=0;i<s.length;i++){h=((h<<5)+h)^s.charCodeAt(i);h=h>>>0;} return h.toString(36); }
