/**
 * Import one-shot: sucursales ERP empresa #2 → ecom_sucursal + variantes/inventario demo.
 * Uso: npm run seed:ecommerce-sucursales-erp
 */
import { getConnection } from "../database/database.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { ensureDefaultVariante } from "../services/ecommerce/InventoryService.js";

const ID_EMPRESA = Number(process.env.ECOM_SYNC_ID_EMPRESA || 2);
const SLUG = process.env.ECOM_SYNC_SLUG || "textiles_creando_moda";

async function main() {
  const erp = await getConnection();
  const ecom = await getEcommerceConnection();
  try {
    const [[empresa]] = await erp.query(
      `SELECT id_empresa, id_tenant FROM empresa WHERE id_empresa = ? LIMIT 1`,
      [ID_EMPRESA]
    );
    if (!empresa) {
      throw new Error(`Empresa id_empresa=${ID_EMPRESA} no encontrada.`);
    }

    const [[tienda]] = await ecom.query(`SELECT id_tienda, telefono FROM tienda WHERE slug = ? LIMIT 1`, [
      SLUG,
    ]);
    if (!tienda) {
      throw new Error(`Tienda slug=${SLUG} no encontrada. Ejecuta sync:empresa-ecommerce primero.`);
    }

    const [sucursalesErp] = await erp.query(
      `SELECT nombre_sucursal, ubicacion, estado_sucursal
       FROM sucursal WHERE id_tenant = ? AND estado_sucursal = 1
       ORDER BY nombre_sucursal ASC`,
      [empresa.id_tenant]
    );

    if (!sucursalesErp.length) {
      console.warn("[warn] Sin sucursales activas en ERP; creando 3 demo locales.");
      sucursalesErp.push(
        { nombre_sucursal: "Miraflores", ubicacion: "Av. Larco 123, Miraflores, Lima" },
        { nombre_sucursal: "San Isidro", ubicacion: "Av. Conquistadores 456, San Isidro, Lima" },
        { nombre_sucursal: "Lima Centro", ubicacion: "Jr. de la Unión 789, Cercado de Lima" }
      );
    }

    await ecom.beginTransaction();

    const idsSucursales = [];
    let first = true;
    for (const s of sucursalesErp) {
      const nombre = String(s.nombre_sucursal || "").trim();
      const direccion = String(s.ubicacion || "Dirección pendiente").trim();
      if (!nombre) continue;

      const [[existing]] = await ecom.query(
        `SELECT id_sucursal FROM ecom_sucursal WHERE id_tienda = ? AND nombre = ? LIMIT 1`,
        [tienda.id_tienda, nombre]
      );

      if (existing) {
        await ecom.query(
          `UPDATE ecom_sucursal SET direccion = ?, telefono = COALESCE(telefono, ?),
           allow_pickup = 1, allow_delivery = 0, activo = 1, es_default = ?
           WHERE id_sucursal = ? AND id_tienda = ?`,
          [direccion, tienda.telefono, first ? 1 : 0, existing.id_sucursal, tienda.id_tienda]
        );
        idsSucursales.push(existing.id_sucursal);
      } else {
        const [ins] = await ecom.query(
          `INSERT INTO ecom_sucursal
            (id_tienda, nombre, direccion, telefono, whatsapp, allow_pickup, allow_delivery, es_default, activo)
           VALUES (?, ?, ?, ?, ?, 1, 0, ?, 1)`,
          [tienda.id_tienda, nombre, direccion, tienda.telefono, tienda.telefono, first ? 1 : 0]
        );
        idsSucursales.push(ins.insertId);
      }
      first = false;
    }

    const [productos] = await ecom.query(
      `SELECT id_producto, sku, stock FROM producto
       WHERE id_tienda = ? AND activo = 1 AND (sku LIKE 'WF-%' OR sku IS NOT NULL)
       ORDER BY id_producto ASC`,
      [tienda.id_tienda]
    );

    let repartidos = 0;
    for (const p of productos) {
      const variante = await ensureDefaultVariante(ecom, tienda.id_tienda, p.id_producto, p.sku);
      const stockTotal = Math.max(0, Number(p.stock) || 0);
      const n = idsSucursales.length || 1;
      const base = Math.floor(stockTotal / n);
      let resto = stockTotal % n;

      for (let i = 0; i < idsSucursales.length; i++) {
        const id_sucursal = idsSucursales[i];
        const qty = base + (resto > 0 ? 1 : 0);
        if (resto > 0) resto -= 1;

        const [[inv]] = await ecom.query(
          `SELECT id_inventario FROM ecom_inventario
           WHERE id_variante = ? AND id_sucursal = ? AND id_tienda = ? LIMIT 1`,
          [variante.id_variante, id_sucursal, tienda.id_tienda]
        );
        if (inv) {
          await ecom.query(
            `UPDATE ecom_inventario SET stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
            [qty, inv.id_inventario, tienda.id_tienda]
          );
        } else {
          await ecom.query(
            `INSERT INTO ecom_inventario
              (id_tienda, id_variante, id_sucursal, stock_fisico, stock_min)
             VALUES (?, ?, ?, ?, 2)`,
            [tienda.id_tienda, variante.id_variante, id_sucursal, qty]
          );
        }
        repartidos++;
      }
    }

    await ecom.query(
      `UPDATE tienda SET fulfillment_default = 'pickup' WHERE id_tienda = ?`,
      [tienda.id_tienda]
    );

    await ecom.commit();
    console.log(
      `[ok] ${idsSucursales.length} sucursales, ${productos.length} productos, ${repartidos} filas inventario (tienda ${SLUG}).`
    );
  } catch (err) {
    try {
      await ecom.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    erp.release();
    ecom.release();
  }
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exitCode = 1;
});
