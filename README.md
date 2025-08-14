# 🧭 Compass – Competitive Landscape Mapper

A lightweight, no-backend database tool that helps PMs compare competitors, visualize positioning, and export a matrix.

## Features
- Input competitor URLs → auto-detect common features (free trial, integrations, SSO, API, AI, etc.)
- Competitive matrix table + CSV export
- Positioning map (feature richness vs. simple uniqueness proxy)
- Snippets panel showing title/meta/first content
- All server-side fetching happens in a Next.js API route to avoid CORS issues

> Note: Detection is keyword-based and intentionally simple (and transparent). You can extend it with LLMs if you add your own API keys.

## Quick Start
```bash
# 1) Install deps
npm install

# 2) Run dev server
npm run dev

# 3) Open
http://localhost:3000
```

## Tech
- Next.js 14 (App Router, TS)
- TailwindCSS (utility styling)
- Cheerio (HTML parsing)
- Recharts (charts)
- Zod (for future input validation)

## Extend Ideas
- Add LLM summarization via an API key to extract features more robustly.
- Allow manual edits + save/share via URL hash or JSON download.
- Add frameworks: RICE score per competitor, SWOT generator, messaging angle suggestions.
- One-click export to Notion/Slides.

— Built to showcase PM craft: research, frameworks, and actionable visuals.
