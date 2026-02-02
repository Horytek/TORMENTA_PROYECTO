
import { getConnection } from "../database/database.js";

const runMigration = async () => {
    let connection;
    try {
        console.log("Connecting...");
        connection = await getConnection();

        console.log("Dropping existing clean_name if exists...");
        await connection.query("DROP FUNCTION IF EXISTS clean_name");

        console.log("Creating clean_name function...");
        const createFunctionSQL = `
            CREATE FUNCTION clean_name(str VARCHAR(255)) 
            RETURNS VARCHAR(255) CHARSET utf8mb4
            DETERMINISTIC
            BEGIN
                DECLARE temp VARCHAR(255);
                SET temp = LOWER(str);
                SET temp = REPLACE(temp, 'á', 'a');
                SET temp = REPLACE(temp, 'é', 'e');
                SET temp = REPLACE(temp, 'í', 'i');
                SET temp = REPLACE(temp, 'ó', 'o');
                SET temp = REPLACE(temp, 'ú', 'u');
                SET temp = REPLACE(temp, 'ñ', 'n');
                -- Remove non-alphanumeric chars (basic approach for now)
                SET temp = REGEXP_REPLACE(temp, '[^a-z0-9]', '');
                RETURN temp;
            END;
        `;

        // Note: REGEXP_REPLACE might depend on MySQL version (8.0+). 
        // If older MySQL (5.7), we might need a simpler version or just spaces/trim.
        // Assuming MySQL 8.0 based on project context, but will start with a safer standard SQL replace chain if REGEXP fails or use a simpler trim+lower for compatibility if unsure.
        // Let's stick to simple normalization first to avoid version issues: Lowercase + Trim + Accents.

        const simpleCleanName = `
            CREATE FUNCTION clean_name(str VARCHAR(255)) 
            RETURNS VARCHAR(255) CHARSET utf8mb4
            DETERMINISTIC
            BEGIN
                DECLARE temp VARCHAR(255);
                SET temp = TRIM(LOWER(str));
                SET temp = REPLACE(temp, 'á', 'a');
                SET temp = REPLACE(temp, 'é', 'e');
                SET temp = REPLACE(temp, 'í', 'i');
                SET temp = REPLACE(temp, 'ó', 'o');
                SET temp = REPLACE(temp, 'ú', 'u');
                SET temp = REPLACE(temp, 'ñ', 'n');
                SET temp = REPLACE(temp, ' ', '');
                RETURN temp;
            END;
        `;

        await connection.query(simpleCleanName);
        console.log("Function clean_name created successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
