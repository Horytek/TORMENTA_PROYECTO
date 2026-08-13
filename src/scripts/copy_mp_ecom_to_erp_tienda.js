/**
 * Copia credenciales MercadoPago de la tienda Ecommerce (db_ecommerce)
 * de Textiles Creando Moda hacia tienda_config del tenant ERP.
 *
 * Uso:
 *   node src/scripts/copy_mp_ecom_to_erp_tienda.js
 *   node src/scripts/copy_mp_ecom_to_erp_tienda.js --tenant=1
 *   node src/scripts/copy_mp_ecom_to_erp_tienda.js --ecom-slug=textiles-creando-moda
 *
 * No imprime tokens. Requiere .env con acceso a ambas BDs.
 */
import { getConnection } from "../database/database.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { decryptMpToken, encryptMpToken } from "../utils/ecommerceCrypto.js";
import { getOrCreateConfig } from "../services/catalogo/TiendaConfigService.js";

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const idTenant = Number(arg("tenant", "1"));
  const ecomSlug = arg("ecom-slug", null);
  const ecomNameLike = arg("name-like", "%CREANDO MODA%");

  const erp = await getConnection();
  const ecom = await getEcommerceConnection();
  try {
    let tienda;
    if (ecomSlug) {
      [[tienda]] = await ecom.query(
        `SELECT t.id_tienda, t.nombre, t.slug, m.public_key, m.access_token_enc, m.modo
         FROM tienda t
         INNER JOIN mp_cuenta m ON m.id_tienda = t.id_tienda
         WHERE t.slug = ? LIMIT 1`,
        [ecomSlug]
      );
    } else {
      [[tienda]] = await ecom.query(
        `SELECT t.id_tienda, t.nombre, t.slug, m.public_key, m.access_token_enc, m.modo
         FROM tienda t
         INNER JOIN mp_cuenta m ON m.id_tienda = t.id_tienda
         WHERE t.nombre LIKE ?
         ORDER BY t.id_tienda LIMIT 1`,
        [ecomNameLike]
      );
    }

    if (!tienda?.access_token_enc) {
      throw new Error(
        "No se encontró mp_cuenta para Textiles Creando Moda en db_ecommerce. Prueba --ecom-slug=..."
      );
    }

    // Re-cifrar por si TOKEN_SECRET difiere entre entornos (misma util)
    let plain;
    try {
      plain = decryptMpToken(tienda.access_token_enc);
    } catch {
      throw new Error("No se pudo descifrar access_token_enc de ecommerce");
    }
    const enc = encryptMpToken(plain);

    const [[empresa]] = await erp.query(
      `SELECT id_tenant, nombreComercial, razonSocial FROM empresa WHERE id_tenant = ? LIMIT 1`,
      [idTenant]
    );
    if (!empresa) {
      throw new Error(`No existe empresa ERP id_tenant=${idTenant}`);
    }
    await getOrCreateConfig(erp, idTenant);

    const [[cfg]] = await erp.query(
      `SELECT id_tenant, slug FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
      [idTenant]
    );
    if (!cfg) {
      throw new Error(`No se pudo crear tienda_config para id_tenant=${idTenant}`);
    }

    const niceSlug = String(tienda.slug || "")
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    await erp.query(
      `UPDATE tienda_config
       SET mp_public_key = ?, mp_access_token_enc = ?, mp_modo = ?, activo = 1,
           checkout_habilitado = 1,
           nombre_publico = COALESCE(NULLIF(nombre_publico, ''), ?),
           slug = CASE
             WHEN slug IS NULL OR slug = '' OR slug LIKE 't%' THEN ?
             ELSE slug
           END
       WHERE id_tenant = ?`,
      [
        tienda.public_key,
        enc,
        tienda.modo || "prod",
        empresa.nombreComercial || empresa.razonSocial || tienda.nombre,
        niceSlug || cfg.slug || `t${idTenant}`,
        idTenant,
      ]
    );

    const [[cfgAfter]] = await erp.query(
      `SELECT id_tenant, slug FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
      [idTenant]
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          from_ecom: { id_tienda: tienda.id_tienda, nombre: tienda.nombre, slug: tienda.slug },
          to_erp: { id_tenant: idTenant, slug: cfgAfter?.slug || cfg.slug },
          mp_modo: tienda.modo || "prod",
          mp_public_key_set: Boolean(tienda.public_key),
          token_copied: true,
        },
        null,
        2
      )
    );
  } finally {
    erp.release();
    ecom.release();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
