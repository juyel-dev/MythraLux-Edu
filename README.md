⚡ MythraLux Edu
Smart Learning Platform — Quiz, Notes, Tools & More
Live: juyel-dev.github.io/MythraLux-Edu
🗂️ File Structure
MythraLux-Edu/
├── index.html          ← Main dashboard shell
├── styles.css          ← Design system (light/dark)
├── config.js           ← All configs (Sheet URLs, Firebase...)
├── main.js             ← Dashboard logic + app loader
├── profile.js          ← Profile system (local + IndexedDB)
├── feedback.js         ← Feedback → Telegram
├── pwa/
│   ├── manifest.json
│   └── service-worker.js
├── apps-script/
│   └── Code.gs         ← Deploy in Google Apps Script
└── README.md
🚀 Setup
1. Master App Sheet
Open config.js — SHEETS.MASTER_APPS is already set.
Add apps with columns:
A=appId | B=name | C=description | D=url | E=thumbnail
F=category | G=featured(TRUE/FALSE) | H=type(iframe/redirect)
I=tags | J=status(active/coming-soon/maintenance)
2. Apps Script
Open apps-script/Code.gs
Create new Apps Script project
Paste code, add your Gemini + HuggingFace API keys
Deploy as Web App (Execute as: Me, Anyone can access)
Copy Web App URL → already set in config.js
3. Deploy to GitHub Pages
git add .
git commit -m "MythraLux Edu v1"
git push origin main
Settings → Pages → main branch → Save
🧩 Add New App (No Code!)
Just add a row to Master App Sheet — done. ✅
💬 Feedback Flow
User → Website → Apps Script → Google Sheet + Telegram Bot
ধন্যবাদ! Made with ❤️ by juyel-dev
