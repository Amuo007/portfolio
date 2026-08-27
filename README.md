# Amrinder Singh — Portfolio

Personal portfolio of Amrinder Singh, Computer Science student at the University of Houston building full-stack, AI, and AR applications.

**Live site:** [amuo007.github.io/portfolio](https://amuo007.github.io/portfolio/)

## Features

- **Clean, simple light design** — fast, responsive, and readable on any device
- **Live GitHub projects** — all public non-fork repositories fetched from the GitHub API, with language filters, README viewer, stats, and a contribution graph; responses are cached in `localStorage` to stay under the unauthenticated rate limit
- **Name gate** — a playful intro dialog with a skip button that refuses to be caught
- **Contact form** — submissions delivered through an n8n webhook
- **Analytics** — self-hosted Matomo events for navigation, engagement, and section dwell time
- **Accessible & polished** — scroll-reveal animations with full `prefers-reduced-motion` support, skip-to-content link, focus management in dialogs, semantic landmarks
- **SEO** — Open Graph/Twitter cards, JSON-LD structured data, canonical URL, sitemap

## Tech stack

- **React 19** with **Vite 7** (SWC) — multi-page build: the main portfolio plus an unlisted `/instagram/` page
- **Tailwind CSS 4**
- **Three.js** — background and mini-game on the unlisted page (kept out of the main bundle)
- **GitHub Actions → GitHub Pages** — every push to `main` deploys automatically

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Requires Node.js 22+.

## Structure

```
index.html            Main page shell: SEO tags, theme bootstrap, base CSS, Matomo
src/App.jsx           Portfolio page (hero, experience, projects, skills, education, contact)
src/PortfolioGate.jsx Name gate dialog
instagram/            Unlisted page linked only from the Instagram bio
public/               Static assets (resume, sitemap, OG image)
```
