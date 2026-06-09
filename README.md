# masonite.dev

Static site for [masonite.dev](https://masonite.dev) — the home of the **Masonite** framework ("The Blueprint Workshop"), deployed via GitHub Pages.

## Structure

- `index.html` — Landing page (animated sprite hero, framework pillars, DX showcase, scroll-driven pyramid build, feature grid, Masonite 5 banner, CTA)
- `changelog.html` — Changelog: tribute to Joe Mancuso, migration to `masonitedev`, release 5.0, and upgrade guide (4.x → 5.x)
- `styles.css` — Design system (brand palettes via CSS custom properties, Sora + JetBrains Mono)
- `sprites.js` — Procedural pixel-art sprite engine built on canvas (themeable, respects `prefers-reduced-motion`)
- `app.js` — Shared behavior (nav, code tabs, copy buttons, footer accordion, scroll reveal)

No build step — pure static HTML/CSS/JS. Every push to `main` deploys automatically.

## Deployment

1. Push to `main` (auto-deploy via GitHub Pages).
2. In GitHub: **Settings → Pages → Build and deployment**
   - Source: *Deploy from a branch*
   - Branch: `main` / `/ (root)`
3. Configure DNS for `masonite.dev`:
   - **Apex (`masonite.dev`)** — `A` records pointing to GitHub Pages IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - **`www` (optional)** — `CNAME` record pointing to `<username>.github.io`
4. In **Settings → Pages → Custom domain**, confirm `masonite.dev` appears (the repo's `CNAME` file preserves this across deploys), then enable **Enforce HTTPS** once the certificate has been issued.
