
export const resolveSku = async (connection, id_producto, id_tonalidad, id_talla, id_tenant) => {
    // 1. Fetch tables to map Names
    // We assume standard "color" and "talla" codes in 'atributo' table.

    // Check cache or fetch? For now fetch DB for safety in transaction.

    let colorValName = null;
    let sizeValName = null;

    if (id_tonalidad) {
        const [res] = await connection.query("SELECT nombre FROM tonalidad WHERE id_tonalidad = ?", [id_tonalidad]);
        if (res.length) colorValName = res[0].nombre;
    }

    if (id_talla) {
        const [res] = await connection.query("SELECT nombre FROM talla WHERE id_talla = ?", [id_talla]);
        if (res.length) sizeValName = res[0].nombre;
    }

    // Resolve Attr/Val IDs
    const attrLinks = [];
    const attributes = {};
    const skuNameParts = [];

    // Fetch Product Name
    const [prod] = await connection.query("SELECT descripcion, precio FROM producto WHERE id_producto = ?", [id_producto]);
    if (!prod.length) throw new Error(`Producto ${id_producto} not found`);
    skuNameParts.push(prod[0].descripcion);

    if (colorValName) {
        const [att] = await connection.query("SELECT id_atributo FROM atributo WHERE codigo = 'color' AND id_tenant = ?", [id_tenant]);
        if (att.length) {
            const attrId = att[0].id_atributo;
            // Get/Create Val
            let valId;
            const [av] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [attrId, colorValName]);
            if (av.length) valId = av[0].id_valor;
            else {
                const [ins] = await connection.query("INSERT INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)", [attrId, id_tenant, colorValName]);
                valId = ins.insertId;
            }
            attrLinks.push({ id_atributo: attrId, id_valor: valId });
            attributes["Color"] = colorValName;
            skuNameParts.push(colorValName);
        }
    }

    if (sizeValName) {
        const [att] = await connection.query("SELECT id_atributo FROM atributo WHERE codigo = 'talla' AND id_tenant = ?", [id_tenant]);
        if (att.length) {
            const attrId = att[0].id_atributo;
            // Get/Create Val
            let valId;
            const [av] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [attrId, sizeValName]);
            if (av.length) valId = av[0].id_valor;
            else {
                const [ins] = await connection.query("INSERT INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)", [attrId, id_tenant, sizeValName]);
                valId = ins.insertId;
            }
            attrLinks.push({ id_atributo: attrId, id_valor: valId });
            attributes["Talla"] = sizeValName;
            skuNameParts.push(sizeValName);
        }
    }

    // Generate Key
    attrLinks.sort((a, b) => a.id_atributo - b.id_atributo);
    const attrs_key = attrLinks.map(l => `${l.id_atributo}:${l.id_valor}`).join('|');
    const sku_name = skuNameParts.join(' - ');

    // Find SKU
    const [existing] = await connection.query(
        "SELECT id_sku FROM producto_sku WHERE id_producto = ? AND attrs_key = ? AND id_tenant = ?",
        [id_producto, attrs_key, id_tenant]
    );

    if (existing.length) return existing[0].id_sku;

    // Create SKU
    const [ins] = await connection.query(`
        INSERT INTO producto_sku (id_producto, id_tenant, sku, precio, attributes_json, attrs_key)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [id_producto, id_tenant, sku_name.substring(0, 64), prod[0].precio, JSON.stringify(attributes), attrs_key]);

    const newSkuId = ins.insertId;

    // Link Strict
    for (const l of attrLinks) {
        await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [newSkuId, l.id_atributo, l.id_valor, id_tenant]);
    }

    return newSkuId;
};
