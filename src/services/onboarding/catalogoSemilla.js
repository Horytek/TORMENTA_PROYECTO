/**
 * Catálogo semilla para tiendas de ropa.
 *
 * Un tenant recién creado llega con cero marcas, cero categorías y cero
 * subcategorías, y con los atributos Color/Talla sin ningún valor. Con eso
 * `ProductForm` no deja guardar ni una prenda: exige marca, categoría y
 * subcategoría, y el bloque de variantes aparece vacío. Diez pasos antes de
 * poder registrar el primer producto es la razón por la que 81 de 82 tenants
 * nunca cargaron nada.
 *
 * Esto lo resuelve dejando el catálogo listo para el rubro: el cliente entra,
 * escribe nombre y precio, y ya tiene tallas y colores para tildar.
 */

/** Colores frecuentes en tienda de ropa, con su hex para la UI de variantes. */
const COLORES = [
  ["Negro", "#111827"], ["Blanco", "#f8fafc"], ["Gris", "#6b7280"],
  ["Azul", "#2563eb"], ["Azul marino", "#1e3a5f"], ["Celeste", "#38bdf8"],
  ["Rojo", "#dc2626"], ["Vino", "#7f1d1d"], ["Rosado", "#f472b6"],
  ["Verde", "#16a34a"], ["Verde militar", "#4d5d3a"], ["Amarillo", "#facc15"],
  ["Mostaza", "#ca8a04"], ["Naranja", "#ea580c"], ["Beige", "#d6c7a8"],
  ["Marrón", "#78350f"], ["Crema", "#fdf6e3"], ["Morado", "#7c3aed"],
];

/**
 * Alfabéticas y numéricas en el mismo atributo, como ya las tiene el tenant 1:
 * una tienda vende polos por talla de letra y jeans por talla de cintura.
 */
const TALLAS = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "26", "28", "30", "32", "34", "36", "38", "40", "42", "44",
  "Única",
];

const CATEGORIAS = [
  { nombre: "Ropa superior", subcategorias: ["Polos", "Camisas", "Blusas", "Casacas", "Chompas", "Poleras"] },
  { nombre: "Ropa inferior", subcategorias: ["Pantalones", "Jeans", "Shorts", "Faldas", "Joggers"] },
  { nombre: "Vestidos y enterizos", subcategorias: ["Vestidos", "Enterizos", "Conjuntos"] },
  { nombre: "Ropa interior y baño", subcategorias: ["Ropa interior", "Ropa de baño", "Medias", "Pijamas"] },
  { nombre: "Calzado", subcategorias: ["Zapatillas", "Zapatos", "Sandalias"] },
  { nombre: "Accesorios", subcategorias: ["Gorras", "Correas", "Carteras", "Bufandas"] },
];

const MARCA_POR_DEFECTO = "Sin marca";

/**
 * Los dos atributos que definen una variante de ropa.
 * `tipo_input` es un ENUM en MAYÚSCULAS ('COLOR','SELECT','SIZE'…) y `codigo`
 * es NOT NULL sin valor por defecto — ambos se copian del tenant 1, que es el
 * único con atributos bien formados.
 */
const ATRIBUTOS = [
  { nombre: "Color", codigo: "color", slug: "color", tipo_input: "COLOR", es_filtro: 1, valores: COLORES.map(([valor, hex]) => ({ valor, hex })) },
  { nombre: "Talla", codigo: "talla", slug: "talla", tipo_input: "SELECT", es_filtro: 0, valores: TALLAS.map((valor) => ({ valor, hex: null })) },
];

export const CATALOGO_ROPA = { MARCA_POR_DEFECTO, CATEGORIAS, ATRIBUTOS, COLORES, TALLAS };

/**
 * Busca el atributo por nombre dentro del tenant, y lo crea si no está.
 * Los tenants existentes ya traen Color/Talla/Material sembrados, pero sin
 * valores; no se asume que siempre sea así.
 */
const asegurarAtributo = async (cx, { id_tenant, nombre, codigo, slug, tipo_input, es_filtro }) => {
  const [[fila]] = await cx.query(
    "SELECT id_atributo FROM atributo WHERE id_tenant = ? AND nombre = ? LIMIT 1",
    [id_tenant, nombre]
  );
  if (fila) return fila.id_atributo;

  const [res] = await cx.query(
    `INSERT INTO atributo (id_tenant, nombre, codigo, slug, tipo_input, es_filtro, es_visible, es_requerido)
     VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
    [id_tenant, nombre, codigo, slug, tipo_input, es_filtro]
  );
  return res.insertId;
};

/**
 * Siembra el catálogo de ropa de un tenant.
 *
 * Recibe la conexión desde afuera para participar de la transacción de quien
 * la llama: crear el tenant y dejarlo usable tienen que cuadrar o fallar
 * juntos. Mismo patrón que `services/costos/costoRepository.js`.
 *
 * 🔴 Solo siembra si el tenant NO tiene categorías. Un tenant con datos no se
 * toca jamás, ni al reejecutar: el catálogo es suyo, no nuestro.
 *
 * @returns {{sembrado:boolean, motivo?:string, categorias?:number,
 *            subcategorias?:number, valores?:number}}
 */
export const sembrarCatalogoRopa = async (cx, { id_tenant }) => {
  if (!Number.isInteger(Number(id_tenant)) || Number(id_tenant) <= 0) {
    throw new Error(`sembrarCatalogoRopa: id_tenant inválido (${id_tenant}).`);
  }

  const [[yaTiene]] = await cx.query(
    "SELECT COUNT(*) AS total FROM categoria WHERE id_tenant = ?",
    [id_tenant]
  );
  if (Number(yaTiene.total) > 0) {
    return { sembrado: false, motivo: "el tenant ya tiene catálogo" };
  }

  // Marca por defecto: `producto.id_marca` es obligatorio, así que sin al
  // menos una marca no se puede registrar nada.
  await cx.query(
    "INSERT INTO marca (nom_marca, estado_marca, id_tenant) VALUES (?, 1, ?)",
    [MARCA_POR_DEFECTO, id_tenant]
  );

  const idsCategoria = [];
  let subcategorias = 0;
  for (const cat of CATEGORIAS) {
    const [res] = await cx.query(
      "INSERT INTO categoria (nom_categoria, estado_categoria, id_tenant) VALUES (?, 1, ?)",
      [cat.nombre, id_tenant]
    );
    idsCategoria.push(res.insertId);

    for (const sub of cat.subcategorias) {
      await cx.query(
        "INSERT INTO sub_categoria (id_categoria, nom_subcat, estado_subcat, id_tenant) VALUES (?, ?, 1, ?)",
        [res.insertId, sub, id_tenant]
      );
      subcategorias += 1;
    }
  }

  let valores = 0;
  for (const attr of ATRIBUTOS) {
    const id_atributo = await asegurarAtributo(cx, { id_tenant, ...attr });

    for (const { valor, hex } of attr.valores) {
      // `uq_attr_val (id_tenant, id_atributo, valor)` ya existe: el IGNORE
      // hace que reejecutar no duplique ni reviente.
      const [res] = await cx.query(
        `INSERT IGNORE INTO atributo_valor (id_atributo, id_tenant, valor, metadata)
         VALUES (?, ?, ?, ?)`,
        [id_atributo, id_tenant, valor, hex ? JSON.stringify({ hex }) : null]
      );
      valores += res.affectedRows;
    }

    // Vincular el atributo a todas las categorías: es lo que hace que
    // `ProductForm` ofrezca talla y color al elegir la categoría, sin que el
    // cliente tenga que configurar plantillas primero.
    for (const id_categoria of idsCategoria) {
      await cx.query(
        `INSERT IGNORE INTO categoria_atributo (id_categoria, id_atributo, id_tenant, orden, obligatorio)
         VALUES (?, ?, ?, 0, 0)`,
        [id_categoria, id_atributo, id_tenant]
      );
    }
  }

  return {
    sembrado: true,
    categorias: idsCategoria.length,
    subcategorias,
    valores,
  };
};

export default { sembrarCatalogoRopa, CATALOGO_ROPA };
