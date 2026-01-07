import { getConnection } from "../src/database/database.js";

async function migratePlans() {
    let connection;
    try {
        console.log("🔌 Connecting to database...");
        connection = await getConnection();

        // 1. Obtener todos los planes existentes
        const [planes] = await connection.query("SELECT id_plan, descripcion_plan as descripcion FROM plan_pago");
        console.log(`📋 Logged ${planes.length} plans to migrate.`);

        for (const plan of planes) {
            console.log(`Processing Plan: ${plan.descripcion} (ID: ${plan.id_plan})`);

            // Verificar si ya tiene versión inicial
            const [versions] = await connection.query(
                "SELECT id FROM plan_template_version WHERE id_plan = ?",
                [plan.id_plan]
            );

            if (versions.length > 0) {
                console.log(`   ⚠️ Plan ${plan.id_plan} already has versions. Skipping migration.`);
                continue;
            }

            // crear Versión 1 (PUBLISHED)
            const [res] = await connection.query(
                "INSERT INTO plan_template_version (id_plan, version, status, created_at, published_at) VALUES (?, 1, 'PUBLISHED', NOW(), NOW())",
                [plan.id_plan]
            );
            const versionId = res.insertId;
            console.log(`   ✅ Created Version 1 (ID: ${versionId})`);

            // 2. Migrar Módulos (plan_modulo)
            const [modulos] = await connection.query(
                "SELECT id_modulo FROM plan_modulo WHERE id_plan = ?",
                [plan.id_plan]
            );

            if (modulos.length > 0) {
                const values = modulos.map(m => [versionId, m.id_modulo]);
                await connection.query(
                    "INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo) VALUES ?",
                    [values]
                );
                console.log(`   ✅ Migrated ${modulos.length} modules.`);
            }

            // 3. Migrar Submódulos (plan_submodulo)
            const [submodulos] = await connection.query(
                "SELECT id_submodulo FROM plan_submodulo WHERE id_plan = ?",
                [plan.id_plan]
            );

            if (submodulos.length > 0) {
                const valuesSub = submodulos.map(s => [versionId, s.id_submodulo]);
                await connection.query(
                    "INSERT INTO plan_entitlement_submodulo (template_version_id, id_submodulo) VALUES ?",
                    [valuesSub]
                );
                console.log(`   ✅ Migrated ${submodulos.length} submodules.`);
            }
        }

        console.log("🏁 Migration to Templates completed.");

    } catch (error) {
        console.error("❌ Fatal error during migration:", error);
    } finally {
        if (connection) connection.release();
    }
}

migratePlans();
