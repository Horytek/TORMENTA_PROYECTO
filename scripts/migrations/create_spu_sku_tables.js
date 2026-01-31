
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Creating new SPU/SKU Schema tables...");
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. atributo
        await connection.query(`
            CREATE TABLE IF NOT EXISTS atributo (
                id_atributo   INT NOT NULL AUTO_INCREMENT,
                id_tenant     INT UNSIGNED NOT NULL,
                nombre        VARCHAR(80) NOT NULL,
                codigo        VARCHAR(50) NOT NULL,
                tipo_input    ENUM('select','text','number','boolean','color','button') NOT NULL DEFAULT 'select',
                slug          VARCHAR(80) NULL,
                PRIMARY KEY (id_atributo),
                UNIQUE KEY uq_attr (id_tenant, codigo),
                INDEX idx_attr_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. atributo_valor
        await connection.query(`
            CREATE TABLE IF NOT EXISTS atributo_valor (
                id_valor      INT NOT NULL AUTO_INCREMENT,
                id_atributo   INT NOT NULL,
                id_tenant     INT UNSIGNED NOT NULL,
                valor         VARCHAR(120) NOT NULL,
                codigo        VARCHAR(80) NULL,
                metadata      JSON NULL,
                PRIMARY KEY (id_valor),
                KEY idx_val_attr (id_atributo),
                UNIQUE KEY uq_attr_val (id_tenant, id_atributo, valor)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. categoria_atributo (Smart Link)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categoria_atributo (
                id_categoria  INT NOT NULL,
                id_atributo   INT NOT NULL,
                id_tenant     INT UNSIGNED NOT NULL,
                orden         INT DEFAULT 0,
                obligatorio   TINYINT(1) DEFAULT 0,
                PRIMARY KEY (id_categoria, id_atributo),
                INDEX idx_cat_attr_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. producto_atributo (Configuration per SPU)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS producto_atributo (
                id_producto   INT NOT NULL,
                id_atributo   INT NOT NULL,
                id_tenant     INT UNSIGNED NOT NULL,
                usa_en_sku    TINYINT(1) NOT NULL DEFAULT 1,
                orden         INT NOT NULL DEFAULT 0,
                PRIMARY KEY (id_producto, id_atributo),
                INDEX idx_prod_attr_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 5. producto_atributo_valor (Available values per SPU)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS producto_atributo_valor (
                id_producto   INT NOT NULL,
                id_valor      INT NOT NULL,
                id_tenant     INT UNSIGNED NOT NULL,
                PRIMARY KEY (id_producto, id_valor),
                INDEX idx_prod_val_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 6. producto_sku (The Variant)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS producto_sku (
                id_sku           INT NOT NULL AUTO_INCREMENT,
                id_producto      INT NOT NULL,
                id_tenant        INT UNSIGNED NOT NULL,
                sku              VARCHAR(64) NULL,
                cod_barras       VARCHAR(100) NULL,
                precio           DECIMAL(10,2) NULL,
                stock_cache      INT DEFAULT 0,
                attributes_json  JSON NULL COMMENT 'Snapshot for fast read',
                attrs_key        VARCHAR(512) NOT NULL DEFAULT '',
                estado           TINYINT(1) DEFAULT 1,
                f_creacion       DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_sku),
                INDEX idx_sku_prod (id_producto),
                INDEX idx_sku_tenant (id_tenant),
                UNIQUE KEY uq_sku_prod_key (id_tenant, id_producto, attrs_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 7. sku_atributo_valor (Strict Link from SKU to Value)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sku_atributo_valor (
                id_sku        INT NOT NULL,
                id_atributo   INT NOT NULL,
                id_valor      INT NOT NULL,
                id_tenant     INT UNSIGNED NOT NULL,
                PRIMARY KEY (id_sku, id_atributo),
                INDEX idx_sku_attr_val (id_valor),
                INDEX idx_sku_attr_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 8. inventario_stock (New Core Inventory)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS inventario_stock (
                id_stock     INT NOT NULL AUTO_INCREMENT,
                id_sku       INT NOT NULL,
                id_almacen   INT NOT NULL,
                id_tenant    INT UNSIGNED NOT NULL,
                stock        INT NOT NULL DEFAULT 0,
                reservado    INT NOT NULL DEFAULT 0,
                PRIMARY KEY (id_stock),
                UNIQUE KEY uq_stock_sku_alm (id_tenant, id_sku, id_almacen),
                INDEX idx_inv_sku (id_sku),
                INDEX idx_inv_alm (id_almacen)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.commit();
        console.log("All tables created successfully.");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
