/**
 * Stub local — sincroniza catálogo ERP → db_ecommerce para dev offline.
 * El video usa la API de producción vía export_creando_moda_video_catalog.js.
 *
 * Uso: npm run sync:erp-catalog-ecommerce
 */
console.log(`
sync_erp_catalog_to_ecommerce — stub local

Para el video Remotion, usa la API de producción:
  npm run export:creando-moda-video

Para sincronizar metadata de tienda (logo, theme):
  npm run sync:empresa-ecommerce

Este script no modifica datos. Implementación completa pendiente si se
requiere replicar catálogo ERP en MySQL local.
`);
