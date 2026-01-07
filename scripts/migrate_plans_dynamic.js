
import { getConnection } from "../src/database/database.js";

const runMigration = async () => {
    let connection;
    try {
        console.log("Starting migration...");
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Alter funciones table
        console.log("Altering funciones table...");
        try {
            await connection.query("ALTER TABLE funciones ADD COLUMN codigo VARCHAR(50) NULL UNIQUE");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        try {
            await connection.query("ALTER TABLE funciones ADD COLUMN tipo_valor ENUM('boolean', 'numeric') NOT NULL DEFAULT 'boolean'");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        }

        // 2. Create plan_funciones table
        console.log("Creating plan_funciones table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS plan_funciones (
                id_plan_funcion INT AUTO_INCREMENT PRIMARY KEY,
                id_plan INT NOT NULL,
                id_funcion INT NOT NULL,
                valor VARCHAR(255) NOT NULL DEFAULT 'true',
                UNIQUE KEY unique_plan_func (id_plan, id_funcion),
                CONSTRAINT fk_pf_plan FOREIGN KEY (id_plan) REFERENCES plan_pago(id_plan) ON DELETE CASCADE,
                CONSTRAINT fk_pf_func FOREIGN KEY (id_funcion) REFERENCES funciones(id_funciones) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // 3. Migrate data
        console.log("Migrating existing plan data...");
        const [planes] = await connection.query("SELECT id_plan, funciones FROM plan_pago");

        for (const plan of planes) {
            if (!plan.funciones) continue;
            const funcIds = plan.funciones.split(',').map(id => parseInt(id.trim())).filter(n => !isNaN(n));

            for (const funcId of funcIds) {
                const [exists] = await connection.query("SELECT 1 FROM plan_funciones WHERE id_plan = ? AND id_funcion = ?", [plan.id_plan, funcId]);
                if (exists.length === 0) {
                    await connection.query("INSERT INTO plan_funciones (id_plan, id_funcion, valor) VALUES (?, ?, 'true')", [plan.id_plan, funcId]);
                }
            }
        }

        // 4. Update codes for known functions
        console.log("Updating function codes...");
        const updates = [
            { name: 'Múltiples sucursales', code: 'MULTI_BRANCH', type: 'boolean' },
            { name: 'Sucursales ilimitadas', code: 'UNLIMITED_BRANCHES', type: 'boolean' },
            { name: 'Atajo de funciones', code: 'SHORTCUTS', type: 'boolean' },
            { name: 'Uso del Chatbot', code: 'CHATBOT', type: 'boolean' },
            { name: 'Uso del log, mensajería y videollamadas internas', code: 'COMMUNICATION', type: 'boolean' }
        ];

        for (const up of updates) {
            await connection.query("UPDATE funciones SET codigo = ?, tipo_valor = ? WHERE funcion = ? AND codigo IS NULL", [up.code, up.type, up.name]);
        }

        // 5. Insert new features if not exist
        console.log("Inserting new features...");
        const newFeatures = [
            { funcion: 'Usuarios Máximos', codigo: 'MAX_USERS', tipo_valor: 'numeric', estado_usuario: 1 }
        ];

        for (const nf of newFeatures) {
            const [exists] = await connection.query("SELECT 1 FROM funciones WHERE codigo = ?", [nf.codigo]);
            if (exists.length === 0) {
                await connection.query("INSERT INTO funciones (funcion, codigo, tipo_valor, estado_funcion, id_tenant) VALUES (?, ?, ?, 1, 1)", [nf.funcion, nf.codigo, nf.tipo_valor]);
                console.log(`Inserted ${nf.codigo}`);
            }
        }

        await connection.commit();
        console.log("Migration completed successfully.");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
