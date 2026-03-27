/* ================================================
   MythraLux Edu — config.js
   Central configuration — change here, works everywhere
   ================================================ */

const CONFIG = {

  // ── Platform ────────────────────────────────────
  PLATFORM: {
    name:     'MythraLux Edu',
    tagline:  'Learn Smart · শেখো স্মার্টভাবে',
    version:  '1.0.0',
    url:      'https://juyel-dev.github.io/MythraLux-Edu',
    github:   'https://github.com/juyel-dev',
  },

  // ── Google Sheets (CSV export links) ────────────
  SHEETS: {
    MASTER_APPS: 'https://docs.google.com/spreadsheets/d/1EH8_tnjqKY4n8g0TozYm5bjBsBWmx2U0n6WZbv389gY/export?format=csv',
    FEEDBACK:    'https://docs.google.com/spreadsheets/d/1ALh-TAxMrjndxe5DwRqvcMpf9qtnnTRSQNnTM52UiJw/export?format=csv',
    // AI_CONFIG fetched via Apps Script — key hidden
  },

  // ── Apps Script Backend ──────────────────────────
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyvcw4zIR3jYVBM7ApAI3JRWZjPZI9QFDN7WT6zmk3w2RQDkkfGq7U_rhoxEC8ZpM03Rw/exec',

  // ── Firebase ────────────────────────────────────
  FIREBASE: {
    apiKey:            'AIzaSyCB_pdjKq9zRu2tl8no-IapvQ9GBztHjps',
    authDomain:        'master-quiz-347db.firebaseapp.com',
    projectId:         'master-quiz-347db',
    storageBucket:     'master-quiz-347db.firebasestorage.app',
    messagingSenderId: '187431577690',
    appId:             '1:187431577690:web:362c1a3e3f5d6614749063',
    measurementId:     'G-G89D9NV3T2',
  },

  // ── Telegram (via Apps Script — token hidden) ────
  TELEGRAM: {
    chatId: '7929275539', // your chat ID
    // Bot token lives ONLY in Apps Script — never here
  },

  // ── GitHub Image CDN ─────────────────────────────
  GITHUB: {
    username:   'juyel-dev',
    imageRepos: ['Geography-Images', 'Biology-Images'],
    cdnBase:    'https://cdn.jsdelivr.net/gh/juyel-dev',
  },

  // ── AdSense (placeholder — fill when ready) ──────
  ADSENSE: {
    enabled:     false,           // → true when AdSense approved
    client:      'ca-pub-XXXXXXXXXX',
    slots: {
      banner:    'XXXXXXXXXX',
      result:    'XXXXXXXXXX',
      sticky:    'XXXXXXXXXX',
    },
    insertAfter: 3,               // Ad after every N app cards
  },

  // ── Polling ──────────────────────────────────────
  POLL_MS: 5 * 60 * 1000,        // 5 minutes

  // ── Cache keys ───────────────────────────────────
  CACHE: {
    APPS:       'mlx_apps_v1',
    APPS_HASH:  'mlx_apps_hash',
    APPS_TS:    'mlx_apps_ts',
    PROFILE:    'mlx_profile_v1',
    THEME:      'mlx_theme',
    LANG:       'mlx_lang',
    AVATAR_DB:  'MythraLuxAvatarDB',
  },

  // ── App categories (display order) ───────────────
  CATEGORIES: ['All', 'Quiz', 'Notes', 'Download', 'Writing', 'Games', 'Tools', 'More'],

  // ── Default apps (shown if Sheet fails) ──────────
  FALLBACK_APPS: [
    {
      appId: 'quiz-master', name: 'Quiz Master',
      description: 'Interactive MCQ quiz for all classes and subjects',
      url: 'https://juyel-dev.github.io/quiz-master',
      thumbnail: '', category: 'Quiz', featured: true,
      type: 'iframe', tags: 'quiz,mcq,exam,practice', status: 'active',
    },
  ],
};
