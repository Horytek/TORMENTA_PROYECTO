/**
 * Checklist de prueba local para Ecommerce (sin secretos).
 *
 *   npm run db:migrate:ecommerce
 *   node src/scripts/ecommerce_sandbox_checklist.js
 *
 * MCP Mercado Pago (MPE) — app Horytek:
 * 1. get_credentials → usar solo variantes TEST (no commitear)
 * 2. Panel test-users (seller / buyer MPE)
 * 3. register → create-preference SaaS → webhook /api/webhook + Resend
 * 4. Admin: pegar public_key + access_token TEST del seller
 * 5. Storefront /tienda/:slug → carrito → checkout seller webhook
 */
console.log(`
=== Horytek Ecommerce — checklist sandbox ===

Migración:  npm run db:migrate:ecommerce
API:        /api/ecommerce/*

SaaS:  external_reference = ecommerce:{id_tienda} → /api/webhook + Resend
Cart:  external_reference = ecom_order:{id_tienda}:{codigo} → /api/ecommerce/webhook?id_tienda=

UI:
  /?mode=ecommerce
  /registro-ecommerce?plan=starter|pro
  /login?mode=ecommerce
  /ecommerce-admin
  /tienda/:slug

Planes: starter S/79 · pro S/129
`);
