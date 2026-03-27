⚡ MythraLux Edu
Smart Learning Platform — Quiz, Notes, Tools & More
MythraLux Edu is a streamlined, lightweight dashboard designed for modern learners. It integrates Google Sheets as a headless CMS, Google Apps Script for backend logic, and AI-powered tools into a seamless PWA experience.
🌐 Live Demo: juyel-dev.github.io/MythraLux-Edu
🗂️ File Structure
| File / Folder | Description |
|---|---|
| index.html | The main dashboard shell and entry point. |
| styles.css | Design system featuring Light/Dark mode support. |
| config.js | Centralized configuration (Sheet URLs, Firebase, etc.). |
| main.js | Core dashboard logic and dynamic app loader. |
| profile.js | Profile management using LocalStorage & IndexedDB. |
| feedback.js | Feedback routing system (Website → Telegram). |
| pwa/ | Progressive Web App assets (Manifest & Service Worker). |
| apps-script/ | Backend logic (Code.gs) for Google Apps Script. |
🚀 Quick Setup Guide
1. Configure Master App Sheet
Open your Google Sheet and ensure the headers match the following structure. SHEETS.MASTER_APPS in config.js should point here.
 * Columns:
   * A: appId | B: name | C: description | D: url | E: thumbnail
   * F: category | G: featured (TRUE/FALSE) | H: type (iframe/redirect)
   * I: tags | J: status (active/coming-soon/maintenance)
2. Deploy Apps Script
 * Navigate to apps-script/Code.gs.
 * Create a new project at script.google.com.
 * Paste the code and add your Gemini & HuggingFace API keys.
 * Deploy as a Web App:
   * Execute as: Me
   * Who has access: Anyone
 * Copy the Web App URL and paste it into config.js.
3. Deploy to GitHub Pages
git add .
git commit -m "Initial release: MythraLux Edu v1"
git push origin main

Go to Settings → Pages → Select main branch → Save.
🧩 Key Features
 * No-Code App Management: Simply add a new row to your Google Sheet to update the dashboard instantly.
 * AI Integration: Built-in support for Gemini and HuggingFace via the Apps Script backend.
 * Smart Feedback: User feedback is automatically routed to both a Google Sheet and a Telegram Bot.
 * Offline Ready: Fully functional PWA for a mobile-app-like experience.
💬 Feedback Flow
> User → Website → Apps Script → Google Sheet + Telegram Bot
> 
ধন্যবাদ! Made with ❤️ by juyel-dev
