# Riverbend Fall Classic — demo tournament site

**Live demo:** https://riverbend-demo-eight.vercel.app

A fictional youth baseball tournament site used as a portfolio piece for the offer
"I build your tournament registration and bracket page." Nothing here is a real event.

Pages: home, registration → payment → confirmation (with email preview), bracket and pool standings,
field map and schedule, and an operator dashboard with CSV export.

## Stack

- Plain HTML, CSS and JavaScript. No framework, no database, no runtime dependencies.
- `build.mjs` stitches `src/*.html` with the shared header and footer in `partials/` into `public/`.
- Two Vercel serverless functions in `api/` create and verify Stripe Checkout sessions (test mode only).
- Registrations made on the demo are kept in the visitor's browser (localStorage); the dashboard shows those plus seeded fictional teams.

## Run locally

```bash
npm run dev
```

Opens on http://localhost:4173. With no `/api` locally, the payment step runs simulated.

## Deploy (Vercel)

```bash
vercel --prod
```

`vercel.json` runs the build and serves `public/` with clean URLs.

### Turn on Stripe test mode (optional)

Without a key the payment step is simulated and says so on screen. To use real Stripe Checkout in test mode,
add your **test** secret key (starts with `sk_test_`) in the Vercel project settings as `STRIPE_SECRET_KEY`, then redeploy.
The functions refuse any key that isn't a test key.

## Footer credit

Set `builder.name` and `builder.url` in `assets/data.js` to show "Built by …" in the footer.

## Scores (Lighthouse, mobile, simulated slow 4G)

Performance 100 · Accessibility 100 · Best practices 100 on every page; LCP ≈ 1.1 s.
