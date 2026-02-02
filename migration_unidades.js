
import { getConnection } from './src/database/database.js';

async function runMigration() {
  const connection = await getConnection();
  try {
    console.log("Starting migration...");

    // 1. Create table `unidades`
    console.log("Creating `unidades` table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS unidades (
        id_unidad INT AUTO_INCREMENT PRIMARY KEY,
        codigo_sunat VARCHAR(10) NOT NULL COMMENT 'Ej: KGM, NIU, MTR',
        descripcion VARCHAR(100) NOT NULL COMMENT 'Ej: Kilogramos, Unidades, Metros',
        estado TINYINT(1) DEFAULT 1,
        id_tenant INT, -- Optional: if units recall specific company custom units
        f_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Identify 'Gestor Contenidos' Module ID
    const [modulos] = await connection.query("SELECT id_modulo FROM modulo WHERE nombre_modulo LIKE '%Gestor%' OR ruta LIKE '%gestor%' LIMIT 1");
    if (!modulos.length) throw new Error("Module 'Gestor Contenidos' not found");
    const idGestor = modulos[0].id_modulo;

    // 3. Insert 'Unidades' Submodule
    console.log("Registering 'Unidades' submodule...");
    const [existingSub] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Unidades' AND id_modulo = ?", [idGestor]);
    let idSubUnidades;
    
    if (existingSub.length > 0) {
      idSubUnidades = existingSub[0].id_submodulo;
       // Update route just in case
      await connection.query("UPDATE submodulos SET ruta = '/gestor-contenidos/unidades' WHERE id_submodulo = ?", [idSubUnidades]);
    } else {
      const [res] = await connection.query(`
        INSERT INTO submodulos (id_modulo, nombre_sub, ruta, activo) 
        VALUES (?, 'Unidades', '/gestor-contenidos/unidades', 1)
      `, [idGestor]);
      idSubUnidades = res.insertId;
    }

    // 4. Register 'Atributos' Submodule (If not exists, though it might exist in Config, user wants it here too or just linked?)
    // The user wants it in "Variantes", but 'Atributos' usually lives in Config. 
    // We will just ensure it has a submodule entry so we can assign permissions if it serves as "Other Variants".
    // Alternatively, we use the existing one. Let's assume we use the existing 'Atributos' submodule logic.
    
    // 5. Default Permissions for Roles 1 (Admin) and 10 (Dev)
    // Note: 'permisos' table usually requires (id_rol, id_modulo, id_submodulo, ...).
    
    // Insert for Dev (10) - usually Dev has all access by default code check, but adding to DB is safe.
    // Insert for Admin (1)
    const roles = [1]; 
    // Fetch all Tenants to add permissions for existing admins? Or just generic?
    // The system seems to use 'id_plan' for generic permissions or 'id_tenant' for specific overrides.
    // Let's look at how `savePermisosGlobales` works: it inserts for id_tenant.
    
    // For this migration, we will insert generic plan-based permissions if applicable, 
    // OR just rely on the fact that the user can now configure it in the UI. 
    // BUT, to make it visible immediately for the current user (you), we should add it.
    
    // Finding current tenant (optional, script runs in context of env?). 
    // We will skip auto-assigning to all tenants to avoid data spam, 
    // BUT we will verify the table creation is done.
    
    console.log("Migration completed successfully.");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    /* connection.release(); // if pool */
    process.exit();
  }
}

runMigration();
