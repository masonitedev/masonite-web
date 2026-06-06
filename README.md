# masonite.dev

Sitio estático para [masonite.dev](https://masonite.dev) — la web del framework **Masonite** ("The Blueprint Workshop"), desplegada con GitHub Pages.

## Estructura

- `index.html` — landing page (hero con sprite animado, pilares, DX showcase, scroll-build de la pirámide, grid de features, banda Masonite 5, CTA)
- `changelog.html` — changelog: memorial de Joe Mancuso, mudanza a `masonitedev`, release 5.0 y guía de upgrade 4.x → 5.x
- `styles.css` — sistema de diseño (paletas de marca via CSS variables, Sora + JetBrains Mono)
- `sprites.js` — motor de sprites pixel-art procedurales en canvas (re-tematizables, respetan `prefers-reduced-motion`)
- `app.js` — comportamiento compartido (nav, tabs de código, botones de copiar, accordion del footer, scroll reveal)

Sin build step: HTML/CSS/JS estático puro. Cada push a `main` despliega.

## Deploy

1. Push a `main` (deploy automático vía Pages).

2. En GitHub: **Settings → Pages → Build and deployment**
   - Source: *Deploy from a branch*
   - Branch: `main` / `/ (root)`

3. Configurar DNS de `masonite.dev`:
   - **Apex (`masonite.dev`)** — registros `A` apuntando a las IPs de GitHub Pages:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - **`www` (opcional)** — registro `CNAME` apuntando a `<usuario>.github.io`

4. En **Settings → Pages → Custom domain** verificar que aparezca `masonite.dev` (el archivo `CNAME` del repo lo mantiene entre deploys) y activar **Enforce HTTPS** una vez que el certificado esté listo.
