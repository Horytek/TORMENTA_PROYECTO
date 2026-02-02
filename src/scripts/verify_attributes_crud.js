import { getConnection } from '../database/database.js';

const verify = async () => {
    let connection;
    try {
        console.log("🚀 Starting Verification...");
        connection = await getConnection();

        // 1. Create Test Attribute
        console.log("\n1. creating 'VerifColor' attribute...");
        const [attr] = await connection.query("INSERT INTO atributo (nombre, tipo_input, slug, codigo, id_tenant) VALUES ('VerifColor', 'COLOR', 'verif-color', 'VERIF001', 1)");
        const attrId = attr.insertId;
        console.log("   Attribute Created ID:", attrId);

        // 2. Create Value with Metadata (Simulate Controller Logic)
        console.log("\n2. Adding Value 'ElectricBlue' with HEX...");
        const hex = "#0000FF";
        const meta = JSON.stringify({ hex });
        const [val] = await connection.query("INSERT INTO atributo_valor (id_atributo, valor, metadata, id_tenant) VALUES (?, ?, ?, ?)", [attrId, 'ElectricBlue', meta, 1]);
        const valId = val.insertId;
        console.log("   Value Created ID:", valId);

        // 3. Read Verification
        console.log("\n3. Fetching Value to verify Metadata...");
        const [rows] = await connection.query("SELECT * FROM atributo_valor WHERE id_valor = ?", [valId]);
        const row = rows[0];
        console.log("   Row:", row);

        let parsedMeta;
        try {
            parsedMeta = JSON.parse(row.metadata);
        } catch (e) { parsedMeta = row.metadata }

        if (parsedMeta.hex === hex) {
            console.log("   ✅ Metadata Verification PASSED: Hex matches.");
        } else {
            console.error("   ❌ Metadata Verification FAILED:", parsedMeta);
        }

        // 4. Cleanup
        console.log("\n4. Cleaning up...");
        await connection.query("DELETE FROM atributo_valor WHERE id_valor = ?", [valId]);
        await connection.query("DELETE FROM atributo WHERE id_atributo = ?", [attrId]);
        console.log("   Cleanup Done.");

    } catch (e) {
        console.error("❌ Verification Failed:", e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

verify();
