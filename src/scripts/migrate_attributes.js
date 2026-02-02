import { getConnection } from '../database/database.js';

const migrate = async () => {
    let connection;
    try {
        console.log("🚀 Starting Attribute Migration...");
        connection = await getConnection();

        // 1. Get Tenants (to migrate for everyone)
        // actually, Tonalidades might be tenant-specific, so we loop through all known tenants or just do a global query if ID_TENANT is in the table.
        // The safe way is to select DISTINCT id_tenant from tonalidad.
        const [tenants] = await connection.query("SELECT DISTINCT id_tenant FROM tonalidad UNION SELECT DISTINCT id_tenant FROM talla");

        // 0. Update ENUM to support new types
        console.log("  Updating Schema ENUM...");
        await connection.query("ALTER TABLE atributo MODIFY COLUMN tipo_input ENUM('TEXT','SELECT','MULTI_SELECT','CHECKBOX','NUMBER','DATE','COLOR','SIZE') NOT NULL DEFAULT 'SELECT'");

        for (const t of tenants) {
            const tenantId = t.id_tenant;
            console.log(`\nProcessing Tenant ID: ${tenantId}`);

            // --- COLORS ---
            // 1. Find or Create 'Color' Attribute for this tenant
            let colorAttrId;
            const [colorAttr] = await connection.query("SELECT id_atributo FROM atributo WHERE nombre = 'Color' AND id_tenant = ?", [tenantId]);

            if (colorAttr.length > 0) {
                colorAttrId = colorAttr[0].id_atributo;
                // Update type to COLOR if needed
                await connection.query("UPDATE atributo SET tipo_input = 'COLOR' WHERE id_atributo = ?", [colorAttrId]);
            } else {
                console.log("  Creating 'Color' system attribute...");
                const [ins] = await connection.query("INSERT INTO atributo (nombre, tipo_input, slug, id_tenant) VALUES ('Color', 'COLOR', 'color', ?)", [tenantId]);
                colorAttrId = ins.insertId;
            }

            // 2. Migrate Values
            const [tonalidades] = await connection.query("SELECT * FROM tonalidad WHERE id_tenant = ?", [tenantId]);
            console.log(`  Found ${tonalidades.length} tonalidades.`);

            for (const color of tonalidades) {
                // Check if exists
                const [exists] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [colorAttrId, color.nombre]);

                if (exists.length === 0) {
                    const metadata = JSON.stringify({ hex: color.codigo_hex || color.hex_code || '#000000' });
                    await connection.query("INSERT INTO atributo_valor (id_atributo, valor, metadata, id_tenant) VALUES (?, ?, ?, ?)",
                        [colorAttrId, color.nombre, metadata, tenantId]);
                }
            }

            // --- SIZES ---
            // 1. Find or Create 'Talla' Attribute
            let sizeAttrId;
            const [sizeAttr] = await connection.query("SELECT id_atributo FROM atributo WHERE nombre = 'Talla' AND id_tenant = ?", [tenantId]);

            if (sizeAttr.length > 0) {
                sizeAttrId = sizeAttr[0].id_atributo;
                await connection.query("UPDATE atributo SET tipo_input = 'SIZE' WHERE id_atributo = ?", [sizeAttrId]);
            } else {
                console.log("  Creating 'Talla' system attribute...");
                const [ins] = await connection.query("INSERT INTO atributo (nombre, tipo_input, slug, id_tenant) VALUES ('Talla', 'SIZE', 'talla', ?)", [tenantId]);
                sizeAttrId = ins.insertId;
            }

            // 2. Migrate Values
            const [tallas] = await connection.query("SELECT * FROM talla WHERE id_tenant = ?", [tenantId]);
            console.log(`  Found ${tallas.length} tallas.`);

            for (const talla of tallas) {
                const [exists] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [sizeAttrId, talla.nombre]);

                if (exists.length === 0) {
                    await connection.query("INSERT INTO atributo_valor (id_atributo, valor, id_tenant) VALUES (?, ?, ?)",
                        [sizeAttrId, talla.nombre, tenantId]);
                }
            }
        }

        console.log("\n✅ Migration Completed Successfully.");

    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

migrate();
