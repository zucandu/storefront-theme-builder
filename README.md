# Storefront Theme Builder

A standalone development environment for designing and previewing Zucandu storefront themes — **no Laravel, no backend, no database required**.

All data comes from static JSON fixtures in `src/data/`. Theme components are copied as-is from v3; only the Pinia stores and bootstrap are rewritten to use mock data instead of real API calls.

---

## Stack

- **Vite 8** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia 3** — state management
- **Vue Router 5** — routing
- **Tailwind CSS v4** — styling
- **vue-i18n 11** — internationalization

---

## Setup & Running

> Use **pnpm** — some packages use the `workspace:` protocol which npm does not support.

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
# → http://localhost:5173

# Production build
pnpm build
```

---

## Pages to Preview

| URL | Page |
|-----|------|
| `/` | Homepage |
| `/category/furniture` | Category listing |
| `/product/classic-wooden-chair` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout |
| `/login` | Login |
| `/register` | Register |
| `/account/order/list` | Account (login first) |
| `/blog/listing` | Blog |
| `/search/result?keyword=chair` | Search results |
| `/track-order/form` | Order tracking |
| `/return-exchange/form` | Return & exchange |

---

## Dev Panel

A **⚙** button in the bottom-right corner opens the Dev Panel (visible in dev mode only):

- **Login as Jane** — toggle mock customer login/logout
- **Add Chair to Cart** — add a mock product to the cart
- **USD / EUR** — switch currency

---

## Project Structure

```
src/
├── main.js                   # App bootstrap (mocks zucConfig, no Laravel/Axios)
├── router.js                 # Vue Router (no language prefix)
├── i18n.js                   # vue-i18n setup
├── DevPanel.vue              # Dev-only floating panel
│
├── themes/
│   └── default/              # Theme files copied from v3 (edit these to design)
│       ├── Storefront.vue
│       ├── storefront/       # 41 page components + components/
│       └── storefront/css/   # style.css (Tailwind v4)
│
├── stores/                   # Fully rewritten — load JSON instead of API calls
│   ├── settings.js
│   ├── cart.js
│   ├── wishlist.js
│   ├── order.js
│   ├── auth/customer.js
│   ├── catalog/{product,listing}.js
│   ├── utils/{banner,menu,post,contact}.js
│   └── payments/{cod,bankTransfer}.js
│
├── composables/              # Copied from v3, axios calls patched out
├── locales/en.json           # Copied from v3
└── data/                     # Static mock data
    ├── settings.json
    ├── listing.json
    ├── product.json
    ├── banners.json
    ├── menu-main.json
    ├── menu-footer.json
    ├── cart.json
    ├── posts.json
    ├── article.json
    └── account.json
```

---

## Creating a New Theme

1. Copy `src/themes/default/` → `src/themes/my-new-theme/`
2. Update the `@theme` alias in `vite.config.js` to point to the new theme:
   ```js
   '@theme': fileURLToPath(new URL('./src/themes/my-new-theme', import.meta.url)),
   ```
3. Edit the Vue components freely
4. Stores and mock data are shared — no changes needed there

---

## Mock Data

All content lives in `src/data/*.json`. Edit these files directly to change what the storefront displays — store name, products, banners, menus, blog posts, account details, etc.

Default mock account: **jane.smith@example.com** (any password works via the Dev Panel).

---

## Known Limitations (by design)

The following render correctly in the UI but have no real backend logic:

- Payment processing (Stripe, Square, PayPal) — stubs only
- Newsletter subscription — always returns success
- Image upload — file input only, nothing is sent to a server
- Invoice PDF — renders HTML only
- Order tracking / return & exchange — displays mock data
