/* ================================================
   MythraLux Edu — profile.js
   Local profile: name, class, bio, avatar (IndexedDB)
   ================================================ */
'use strict';

const Profile = (() => {
  const KEY = CONFIG.CACHE.PROFILE;
  const DB_NAME = CONFIG.CACHE.AVATAR_DB;
  let _db = null;

  // ── IndexedDB for avatar ──────────────────────
  async function _openDB() {
    if (_db) return _db;
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('avatar');
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror   = () => rej(req.error);
    });
  }

  async function saveAvatar(base64) {
    try {
      const db = await _openDB();
      const tx = db.transaction('avatar', 'readwrite');
      tx.objectStore('avatar').put(base64, 'current');
    } catch(e) {
      // Fallback: localStorage (compressed)
      try { localStorage.setItem('mlx_avatar', base64.substring(0, 200000)); } catch {}
    }
  }

  async function loadAvatar() {
    try {
      const db = await _openDB();
      return new Promise(res => {
        const tx  = db.transaction('avatar', 'readonly');
        const req = tx.objectStore('avatar').get('current');
        req.onsuccess = () => res(req.result || null);
        req.onerror   = () => res(null);
      });
    } catch {
      return localStorage.getItem('mlx_avatar') || null;
    }
  }

  // ── Profile data ─────────────────────────────
  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...get(), ...data })); } catch {}
  }

  return { get, save, saveAvatar, loadAvatar };
})();

// ── INIT ─────────────────────────────────────────
function initProfile() {
  _loadProfileUI();
  // Drag & drop avatar
  const zone = document.getElementById('avatar-zone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; const f = e.dataTransfer.files[0]; if (f) _processAvatarFile(f); });
  }
}

async function _loadProfileUI() {
  const p = Profile.get();
  // Header
  _updateHeaderAvatar(await Profile.loadAvatar());
  // Sidebar
  const nameEl  = document.getElementById('sp-name');
  const classEl = document.getElementById('sp-class');
  if (nameEl)  nameEl.textContent  = p.name  || 'Set up Profile';
  if (classEl) classEl.textContent = p.class || (M?.lang === 'bn' ? 'ট্যাপ করুন' : 'Tap to edit');
  // Profile stats from Quiz Master localStorage
  _renderProfileStats();
}

function _updateHeaderAvatar(base64) {
  const img  = document.getElementById('header-avatar');
  const ph   = document.getElementById('header-avatar-placeholder');
  const spAv = document.getElementById('sp-avatar');

  if (base64) {
    if (img)  { img.src = base64; img.classList.remove('hidden'); }
    if (ph)   ph.classList.add('hidden');
    if (spAv) spAv.innerHTML = `<img src="${base64}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  }
}

function _renderProfileStats() {
  const el = document.getElementById('profile-stats');
  if (!el) return;
  const stats = _getQuizStats();
  el.innerHTML = [
    { val: stats.totalQuizzes || 0,   key: M?.lang==='bn'?'কুইজ':'Quizzes' },
    { val: (stats.bestPercent||0)+'%', key: M?.lang==='bn'?'সেরা':'Best' },
    { val: _getStreak()+'🔥',          key: M?.lang==='bn'?'স্ট্রিক':'Streak' },
  ].map(s => `<div class="ps-item"><div class="ps-val">${s.val}</div><div class="ps-key">${s.key}</div></div>`).join('');
}

function _getQuizStats() { try { return JSON.parse(localStorage.getItem('qm_stats') || '{}'); } catch { return {}; } }
function _getStreak()    { return parseInt(localStorage.getItem('qm_streak') || '0'); }

// ── OPEN / CLOSE ──────────────────────────────────
async function openProfile() {
  const p = Profile.get();
  // Fill form
  document.getElementById('pf-name').value    = p.name    || '';
  document.getElementById('pf-class').value   = p.class   || '';
  document.getElementById('pf-bio').value     = p.bio     || '';
  document.getElementById('pf-subject').value = p.subject || '';

  // Avatar
  const av = await Profile.loadAvatar();
  const img = document.getElementById('profile-avatar-img');
  const ph  = document.getElementById('profile-avatar-placeholder');
  if (av) { img.src = av; img.classList.remove('hidden'); ph.classList.add('hidden'); }
  else    { img.classList.add('hidden'); ph.classList.remove('hidden'); }

  _renderProfileStats();
  document.getElementById('modal-profile').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  document.getElementById('modal-profile').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── SAVE ─────────────────────────────────────────
function saveProfile() {
  const data = {
    name:    document.getElementById('pf-name').value.trim(),
    class:   document.getElementById('pf-class').value,
    bio:     document.getElementById('pf-bio').value.trim(),
    subject: document.getElementById('pf-subject').value.trim(),
  };
  Profile.save(data);
  closeProfile();
  _loadProfileUI();
  showToast('✅ ' + (M?.lang === 'bn' ? 'প্রোফাইল সেভ হয়েছে' : 'Profile saved!'));
}

// ── AVATAR UPLOAD ─────────────────────────────────
function triggerAvatarUpload() {
  document.getElementById('avatar-file-input').click();
}

function onAvatarFile(e) {
  const f = e.target.files[0];
  if (f) _processAvatarFile(f);
}

function _processAvatarFile(file) {
  if (!file.type.startsWith('image/')) { showToast('⚠️ Please upload an image file'); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    const base64 = await _resizeAvatar(e.target.result);
    await Profile.saveAvatar(base64);
    // Update preview
    const img = document.getElementById('profile-avatar-img');
    const ph  = document.getElementById('profile-avatar-placeholder');
    img.src   = base64; img.classList.remove('hidden'); ph.classList.add('hidden');
    _updateHeaderAvatar(base64);
  };
  reader.readAsDataURL(file);
}

function _resizeAvatar(dataUrl) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const cv  = document.createElement('canvas');
      const MAX = 200;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      cv.width  = img.width  * ratio;
      cv.height = img.height * ratio;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      res(cv.toDataURL('image/jpeg', 0.82));
    };
    img.src = dataUrl;
  });
}
