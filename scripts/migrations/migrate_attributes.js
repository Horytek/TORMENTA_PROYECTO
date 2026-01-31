
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Migrating Attributes...");
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Ensure basic attributes exist per tenant
        // For simplicity, we assume tenant_id = 1 for migration if missing, or we iterate tenants.
        // Let's assume global migration for tenant 1 for now or fetch tenants.
        const [tenants] = await connection.query("SELECT id_tenant, nombre FROM tenant");

        for (const tenant of tenants) {
            const tId = tenant.id_tenant;
            console.log(`Processing Tenant: ${tenant.nombre} (${tId})`);

            // Helper to ensure attribute
            const ensureAttr = async (code, name, type) => {
                let [rows] = await connection.query("SELECT id_atributo FROM atributo WHERE id_tenant = ? AND codigo = ?", [tId, code]);
                if (rows.length === 0) {
                    const [res] = await connection.query(
                        "INSERT INTO atributo (id_tenant, nombre, codigo, tipo_input) VALUES (?, ?, ?, ?)",
                        [tId, name, code, type]
                    );
                    return res.insertId;
                }
                return rows[0].id_atributo;
            };

            const idColor = await ensureAttr('color', 'Color', 'color');
            const idTalla = await ensureAttr('talla', 'Talla', 'button');
            const idTemporada = await ensureAttr('temporada', 'Temporada', 'select');
            const idMaterial = await ensureAttr('material', 'Material', 'select');

            // 2. Migrate Tonalidades -> Atributo Valor (Color)
            const [colors] = await connection.query("SELECT id_tonalidad, nombre, hex_code FROM tonalidad WHERE id_tenant = ?", [tId]);
            for (const col of colors) {
                // Check if exists
                const [exists] = await connection.query(
                    "SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?",
                    [idColor, col.nombre]
                );

                if (exists.length === 0) {
                    await connection.query(
                        "INSERT INTO atributo_valor (id_atributo, id_tenant, valor, metadata) VALUES (?, ?, ?, ?)",
                        [idColor, tId, col.nombre, JSON.stringify({ hex: col.hex_code })]
                    );
                }
            }
            console.log(`Migrated ${colors.length} colors.`);

            // 3. Migrate Tallas -> Atributo Valor (Talla)
            const [sizes] = await connection.query("SELECT id_talla, nombre FROM talla WHERE id_tenant = ?", [tId]);
            for (const siz of sizes) {
                const [exists] = await connection.query(
                    "SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?",
                    [idTalla, siz.nombre]
                );
                if (exists.length === 0) {
                    await connection.query(
                        "INSERT INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)",
                        [idTalla, tId, siz.nombre]
                    );
                }
            }
            console.log(`Migrated ${sizes.length} sizes.`);

            // 4. Migrate Legacy Product Columns (Temporada, Material)
            // Need to check if tables 'temporada' or 'material' exist first 
            // OR if they are just strings in 'producto'?
            // User said "Ten en cuenta los atributos actuales...". 
            // Usually these are tables. Let's try to select from them if they exist.

            try {
                const [temps] = await connection.query(`SELECT nombre FROM temporada WHERE id_tenant = ?`, [tId]);
                for (const t of temps) {
                    await connection.query("INSERT IGNORE INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)", [idTemporada, tId, t.nombre]);
                }
                console.log(`Migrated seasons.`);
            } catch (e) { console.log("Temporada table not found or error, skipping."); }

            try {
                const [mats] = await connection.query(`SELECT nombre_material FROM material WHERE id_tenant = ?`, [tId]);
                for (const m of mats) {
                    await connection.query("INSERT IGNORE INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)", [idMaterial, tId, m.nombre_material]);
                }
                console.log(`Migrated materials.`);
            } catch (e) { console.log("Material table not found or error, skipping."); }
        }

        await connection.commit();
        console.log("Attribute Migration Complete.");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
