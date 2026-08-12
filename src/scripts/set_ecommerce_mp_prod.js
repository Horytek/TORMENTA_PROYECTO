/**
 * Guarda credenciales MP de PRODUCCIÓN en mp_cuenta de la tienda (empresa 2 / textiles).
 * No imprime tokens. Uso:
 *   MP_PROD_PUBLIC_KEY=... MP_PROD_ACCESS_TOKEN=... node src/scripts/set_ecommerce_mp_prod.js
 * Opcional: ECOM_MP_SLUG=textiles_creando_moda
 */
import "dotenv/config";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { encryptMpToken, decryptMpToken } from "../utils/ecommerceCrypto.js";

const SLUG = process.env.ECOM_MP_SLUG || "textiles_creando_moda";
const PUBLIC_KEY = process.env.MP_PROD_PUBLIC_KEY || "";
const ACCESS_TOKEN = process.env.MP_PROD_ACCESS_TOKEN || "";

async function main() {
  if (!PUBLIC_KEY.startsWith("APP_USR-") || !ACCESS_TOKEN.startsWith("APP_USR-")) {
    throw new Error("Faltan MP_PROD_PUBLIC_KEY / MP_PROD_ACCESS_TOKEN (producción APP_USR-…).");
  }
  if (PUBLIC_KEY.includes("f16a9fa9") || ACCESS_TOKEN.includes("TEST")) {
    throw new Error("Parecen credenciales de prueba; abortando.");
  }

  const connection = await getEcommerceConnection();
  try {
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, estado FROM tienda WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    if (!tienda) throw new Error(`Tienda slug=${SLUG} no encontrada.`);

    const enc = encryptMpToken(ACCESS_TOKEN);
    // Verifica cifrado con el TOKEN_SECRET actual (debe coincidir con el del backend en prod).
    const roundtrip = decryptMpToken(enc);
    if (roundtrip !== ACCESS_TOKEN) throw new Error("Roundtrip de cifrado falló.");

    await connection.query(
      `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
       VALUES (?, ?, ?, 'prod', NOW())
       ON DUPLICATE KEY UPDATE
         public_key = VALUES(public_key),
         access_token_enc = VALUES(access_token_enc),
         modo = 'prod',
         conectado_en = NOW()`,
      [tienda.id_tienda, PUBLIC_KEY, enc]
    );

    const [[mp]] = await connection.query(
      `SELECT public_key, modo, conectado_en,
              LEFT(public_key, 16) AS pk_prefix,
              CHAR_LENGTH(access_token_enc) AS enc_len
       FROM mp_cuenta WHERE id_tienda = ? LIMIT 1`,
      [tienda.id_tienda]
    );

    // Confirma que el token guardado desencripta y arranca como APP_USR-
    const stored = decryptMpToken(
      (
        await connection.query(`SELECT access_token_enc FROM mp_cuenta WHERE id_tienda = ?`, [
          tienda.id_tienda,
        ])
      )[0][0].access_token_enc
    );
    if (!stored.startsWith("APP_USR-")) throw new Error("Token guardado inválido.");

    console.log(
      JSON.stringify(
        {
          ok: true,
          id_tienda: tienda.id_tienda,
          slug: tienda.slug,
          nombre: tienda.nombre,
          modo: mp.modo,
          public_key_prefix: `${mp.pk_prefix}…`,
          enc_len: mp.enc_len,
          conectado_en: mp.conectado_en,
          message: "mp_cuenta actualizado a producción",
        },
        null,
        2
      )
    );
  } finally {
    connection.release();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
