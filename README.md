# masonite.dev

Sitio estático para [masonite.dev](https://masonite.dev), desplegado con GitHub Pages.

## Deploy

1. Crear el repo en GitHub y hacer push:

   ```sh
   git remote add origin git@github.com:<usuario>/masonite-web.git
   git push -u origin main
   ```

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
