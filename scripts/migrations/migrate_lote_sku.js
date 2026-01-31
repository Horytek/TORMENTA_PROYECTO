
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sslCA = process.env.DB_SSL_CA
    ? Buffer.from(
        process.env.DB_SSL_CA
            .replace(/^"+|"+$/g, "")
            .replace(/\\n/g, "\n"),
        "utf-8"
    )
    : undefined;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'tormenta_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(sslCA && { ssl: { ca: sslCA } })
};

const pool = createPool(dbConfig);

async function ensureColumn(connection, table, column, definition) {
    try {
        const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
        if (cols.length === 0) {
            console.log(`Adding ${column} to ${table}...`);
            await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        } else {
            console.log(`${column} already exists in ${table}.`);
        }
    } catch (e) {
        console.warn(`Could not check/add column ${column} to ${table}: ${e.message}`);
    }
}

async function run() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Connected to DB.");

        const table = 'detalle_lote_inventario';

        // 1. Add id_sku column
        await ensureColumn(connection, table, 'id_sku', 'INT NULL AFTER id_producto');

        // 2. Load Attribute Mappings (Legacy ID -> AtributoValor ID)
        const [tenants] = await connection.query("SELECT id_tenant FROM tenant");

        for (const tenant of tenants) {
            const tId = tenant.id_tenant;
            console.log(`Processing Tenant ${tId}...`);

            // Get Attribute Defs
            const [attrDefs] = await connection.query("SELECT id_atributo, codigo FROM atributo WHERE id_tenant = ?", [tId]);
            const colorAttrId = attrDefs.find(a => a.codigo === 'color')?.id_atributo;
            const sizeAttrId = attrDefs.find(a => a.codigo === 'talla')?.id_atributo;

            if (!colorAttrId || !sizeAttrId) {
                console.log(`Skipping Tenant ${tId}: Missing color/talla attributes.`);
                continue;
            }

            // Build Legacy->Val Maps
            const colorMap = new Map();
            const sizeMap = new Map();

            const [tons] = await connection.query("SELECT id_tonalidad, nombre FROM tonalidad WHERE id_tenant = ?", [tId]);
            for (const t of tons) {
                const [av] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [colorAttrId, t.nombre]);
                if (av.length) colorMap.set(t.id_tonalidad, av[0].id_valor);
            }

            const [tals] = await connection.query("SELECT id_talla, nombre FROM talla WHERE id_tenant = ?", [tId]);
            for (const t of tals) {
                const [av] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [sizeAttrId, t.nombre]);
                if (av.length) sizeMap.set(t.id_talla, av[0].id_valor);
            }

            // Helper to find SKU
            const findSku = async (id_prod, id_ton, id_tal) => {
                const attrLinks = [];
                if (id_ton && colorMap.has(id_ton)) {
                    attrLinks.push({ id_atributo: colorAttrId, id_valor: colorMap.get(id_ton) });
                }
                if (id_tal && sizeMap.has(id_tal)) {
                    attrLinks.push({ id_atributo: sizeAttrId, id_valor: sizeMap.get(id_tal) });
                }

                if (attrLinks.length === 0) return null;

                attrLinks.sort((a, b) => a.id_atributo - b.id_atributo);
                const attrs_key = attrLinks.map(l => `${l.id_atributo}:${l.id_valor}`).join('|');

                const [sku] = await connection.query(
                    "SELECT id_sku FROM producto_sku WHERE id_producto = ? AND attrs_key = ? AND id_tenant = ?",
                    [id_prod, attrs_key, tId]
                );
                return sku.length ? sku[0].id_sku : null;
            };

            // Migrate Data
            console.log(`Migrating ${table} for Tenant ${tId}...`);
            const pk = 'id_detalle_lote';

            // Note: Verify PK name if unsure, assuming standard naming
            // Or use dynamic lookup:
            const [pkRows] = await connection.query(`SHOW KEYS FROM ${table} WHERE Key_name = 'PRIMARY'`);
            const actualPk = pkRows.length ? pkRows[0].Column_name : 'id';

            const [rows] = await connection.query(
                `SELECT ${actualPk}, id_producto, id_tonalidad, id_talla FROM ${table} 
                 WHERE id_tenant = ? AND id_sku IS NULL AND (id_tonalidad IS NOT NULL OR id_talla IS NOT NULL)`,
                [tId]
            );

            console.log(`Found ${rows.length} rows to migrate in ${table}.`);

            for (const row of rows) {
                const skuId = await findSku(row.id_producto, row.id_tonalidad, row.id_talla);
                if (skuId) {
                    await connection.query(`UPDATE ${table} SET id_sku = ? WHERE ${actualPk} = ?`, [skuId, row[actualPk]]);
                }
            }
        }

        console.log("Migration Complete.");

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
