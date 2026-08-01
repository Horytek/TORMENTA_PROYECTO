
/**
 * Código de barras de una variante: código del producto padre + id_sku.
 * id_sku es AUTO_INCREMENT (único por sí solo), así que la concatenación ya
 * es única sin necesidad de generador con reintentos. Si el producto padre no
 * tiene código (caso raro, productos viejos sin autogeneración), la variante
 * tampoco lo tiene — no hay de dónde derivarlo.
 */
export const codigoBarrasSku = (codBarrasProducto, id_sku) =>
    codBarrasProducto ? `${codBarrasProducto}-${id_sku}` : null;

/**
 * EAN-13 válido (13 dígitos + dígito verificador real) por SKU, para
 * imprimir en etiquetas que cualquier lector de tienda pueda escanear —
 * `codigoBarrasSku` es alfanumérico y no cumple el estándar EAN-13.
 *
 * Prefijo "20": GS1 reserva el rango 20-29 para "restricted circulation
 * numbers" — códigos de uso interno de una empresa, no productos
 * registrados globalmente. Es exactamente este caso, así que no hay
 * conflicto con un producto real de otra marca.
 *
 * id_sku es AUTO_INCREMENT global, así que el código ya es único sin
 * generador con reintentos ni consulta a BD.
 */
export const generarEan13 = (id_sku) => {
    const base = `20${String(id_sku).padStart(10, "0")}`; // 12 dígitos
    let suma = 0;
    for (let i = 0; i < base.length; i++) {
        // Posición 1-indexada impar (1,3,5…) pesa 1; par pesa 3 — estándar EAN-13.
        suma += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return base + digitoVerificador;
};

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
    const [prod] = await connection.query("SELECT descripcion, precio, cod_barras FROM producto WHERE id_producto = ?", [id_producto]);
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

    const cod_barras_sku = codigoBarrasSku(prod[0].cod_barras, newSkuId);
    if (cod_barras_sku) {
        await connection.query("UPDATE producto_sku SET cod_barras = ? WHERE id_sku = ?", [cod_barras_sku, newSkuId]);
    }
    await connection.query("UPDATE producto_sku SET ean13 = ? WHERE id_sku = ?", [generarEan13(newSkuId), newSkuId]);

    // Link Strict
    for (const l of attrLinks) {
        await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [newSkuId, l.id_atributo, l.id_valor, id_tenant]);
    }

    return newSkuId;
};
