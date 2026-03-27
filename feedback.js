/* ================================================
   MythraLux Edu — feedback.js
   Feedback modal → Apps Script → Telegram + Sheet
   ================================================ */
'use strict';

let _fbRating = 0;

function initFeedback() {
  // Populate app dropdown from loaded apps
  const sel = document.getElementById('fb-app');
  if (!sel) return;

  // Character counter
  const msg = document.getElementById('fb-message');
  const cnt = document.getElementById('fb-char');
  if (msg && cnt) {
    msg.addEventListener('input', () => { cnt.textContent = msg.value.length; });
  }
}

function _populateFbApps() {
  const sel = document.getElementById('fb-app');
  if (!sel || !window.M?.apps?.length) return;
  const lang = window.M?.lang || 'en';
  sel.innerHTML = `<option value="Platform">${lang==='bn'?'সাধারণ মতামত':'General Platform'}</option>`;
  window.M.apps.filter(a => a.status === 'active').forEach(a => {
    const o = document.createElement('option'); o.value = a.name; o.textContent = a.name; sel.appendChild(o);
  });
}

function openFeedback() {
  _populateFbApps();
  _fbRating = 0;
  _updateStars(0);
  document.getElementById('fb-message').value = '';
  document.getElementById('fb-char').textContent = '0';
  document.getElementById('modal-feedback').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeFeedback() {
  document.getElementById('modal-feedback').classList.add('hidden');
  document.body.style.overflow = '';
}

function setRating(val) {
  _fbRating = val;
  _updateStars(val);
}

function _updateStars(val) {
  document.querySelectorAll('.star-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.val) <= val);
  });
}

async function submitFeedback() {
  const lang    = window.M?.lang || 'en';
  const message = document.getElementById('fb-message').value.trim();
  const app     = document.getElementById('fb-app').value;
  const profile = typeof Profile !== 'undefined' ? Profile.get() : {};

  if (!message) {
    showToast('⚠️ ' + (lang === 'bn' ? 'মতামত লিখুন' : 'Please write a message'));
    return;
  }

  const btn = document.getElementById('btn-submit-feedback');
  btn.disabled = true;
  btn.innerHTML = `<div class="loader" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>`;

  const payload = {
    type:    'feedback',
    name:    profile.name  || 'Anonymous',
    class:   profile.class || 'Unknown',
    app,
    rating:  _fbRating,
    message,
    lang,
    ts:      new Date().toISOString(),
  };

  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for no CORS preflight
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      closeFeedback();
      showToast('🙏 ' + (lang === 'bn' ? 'ধন্যবাদ! মতামত পৌঁছে গেছে' : 'Thank you! Feedback received'));
    } else {
      throw new Error('Server error');
    }
  } catch {
    // Fallback: copy message for user
    closeFeedback();
    showToast('⚠️ ' + (lang === 'bn' ? 'সরাসরি পাঠানো যায়নি' : 'Could not send — please try later'));
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:4px"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      ${lang === 'bn' ? 'পাঠান' : 'Send Feedback'}`;
  }
}
