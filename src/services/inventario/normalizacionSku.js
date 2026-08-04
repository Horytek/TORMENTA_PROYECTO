/**
 * Normalización de `producto_sku.attrs_key`.
 *
 * La clave canónica es `id_atributo:id_valor|…` ordenada por atributo — es la
 * que construye `resolveSku` (`src/utils/skuHelper.js`) para buscar una
 * variante. Todo lo que no esté en ese formato es invisible para él: no
 * encuentra el SKU y **crea uno nuevo**, dispersando el stock entre duplicados.
 *
 * ⚠️ La fuente de verdad es `attributes_json`, NO `sku_atributo_valor`.
 * Se verificó sobre la base real que `sku_atributo_valor` está corrupta: usa
 * `id_valor = 1` para todos los atributos, o sea afirma cosas como
 * "Talla = Azul". Reconstruir desde ahí hacía colapsar 186 SKU distintos en la
 * misma clave `1:1|2:1` y habría fusionado variantes que no son la misma.
 *
 * `attributes_json` tiene la forma `{ "<id_atributo>": "<etiqueta>" }`, por
 * ejemplo `{"1":"Azul Clasico","2":"S"}`. La etiqueta se resuelve contra
 * `atributo_valor` del tenant.
 */

/** Compara etiquetas ignorando tildes, mayúsculas y espacios de sobra. */
export const normalizarEtiqueta = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Índice de búsqueda `id_atributo§etiqueta → id_valor`.
 * @param {{id_valor:number, id_atributo:number, valor:string}[]} valores
 */
export const construirIndiceValores = (valores) => {
  const indice = new Map();
  for (const v of valores ?? []) {
    indice.set(`${Number(v.id_atributo)}§${normalizarEtiqueta(v.valor)}`, Number(v.id_valor));
  }
  return indice;
};

/** Motivos por los que un SKU no se puede normalizar automáticamente. */
export const MOTIVO = {
  SIN_ATRIBUTOS: "SIN_ATRIBUTOS",       // producto simple, no es una variante
  JSON_ILEGIBLE: "JSON_ILEGIBLE",       // attributes_json no parsea
  VALOR_DESCONOCIDO: "VALOR_DESCONOCIDO", // la etiqueta no existe en atributo_valor
};

/**
 * Calcula la clave canónica de un SKU a partir de su `attributes_json`.
 *
 * @returns {{clave:string}|{clave:null, motivo:string, detalle?:string}}
 */
export function claveCanonica(attributes_json, indiceValores) {
  let atributos;
  try {
    atributos = typeof attributes_json === "string" ? JSON.parse(attributes_json) : attributes_json;
  } catch {
    return { clave: null, motivo: MOTIVO.JSON_ILEGIBLE };
  }

  const entradas = Object.entries(atributos ?? {});
  if (entradas.length === 0) return { clave: null, motivo: MOTIVO.SIN_ATRIBUTOS };

  const pares = [];
  for (const [idAtributo, etiqueta] of entradas) {
    const idValor = indiceValores?.get?.(`${Number(idAtributo)}§${normalizarEtiqueta(etiqueta)}`);
    // Ojo: un id_valor 0 no existe en la tabla, así que `!idValor` alcanza; lo
    // que NO se puede es tratar un valor ausente como 0 y seguir.
    if (idValor == null) {
      return {
        clave: null,
        motivo: MOTIVO.VALOR_DESCONOCIDO,
        detalle: `atributo ${idAtributo} = ${JSON.stringify(etiqueta)}`,
      };
    }
    pares.push([Number(idAtributo), idValor]);
  }

  // Orden por id_atributo: `resolveSku` arma la clave en el orden en que la
  // base devuelve los vínculos, así que dos claves con los mismos pares en
  // distinto orden no se encontrarían entre sí.
  pares.sort((a, b) => a[0] - b[0]);
  return { clave: pares.map(([a, v]) => `${a}:${v}`).join("|") };
}

/**
 * Decide qué hacer con cada SKU sin escribir nada.
 *
 * 🔴 Nunca propone fusionar ni borrar: si la clave nueva ya la ocupa otro SKU
 * del mismo producto, el caso se marca `conflictos` para revisión humana. Dos
 * variantes con stock real no se pueden unir por una coincidencia de clave sin
 * que alguien confirme que son la misma prenda.
 *
 * @param {{id_sku:number, id_producto:number, attrs_key:string, attributes_json:*}[]} skus
 * @returns {{actualizar:{id_sku:number, id_producto:number, claveVieja:string, claveNueva:string}[],
 *            yaCanonicos:number[], conflictos:object[], sinFuente:object[]}}
 */
export function planificarNormalizacion(skus, indiceValores) {
  const lista = skus ?? [];
  // Clave ocupada hoy por producto, para detectar choques antes de escribir.
  const ocupadas = new Map();
  for (const s of lista) {
    ocupadas.set(`${s.id_producto}|${s.attrs_key ?? ""}`, s.id_sku);
  }

  const actualizar = [];
  const yaCanonicos = [];
  const conflictos = [];
  const sinFuente = [];

  for (const s of lista) {
    const r = claveCanonica(s.attributes_json, indiceValores);
    if (r.clave === null) {
      sinFuente.push({ id_sku: s.id_sku, id_producto: s.id_producto, attrs_key: s.attrs_key, motivo: r.motivo, detalle: r.detalle });
      continue;
    }
    if (r.clave === s.attrs_key) {
      yaCanonicos.push(s.id_sku);
      continue;
    }
    const duenio = ocupadas.get(`${s.id_producto}|${r.clave}`);
    if (duenio != null && duenio !== s.id_sku) {
      conflictos.push({ id_sku: s.id_sku, id_producto: s.id_producto, claveVieja: s.attrs_key, claveNueva: r.clave, ocupadaPor: duenio });
      continue;
    }
    actualizar.push({ id_sku: s.id_sku, id_producto: s.id_producto, claveVieja: s.attrs_key ?? "", claveNueva: r.clave });
    // Reservar para que dos SKU del mismo producto no apunten a la misma clave
    // dentro de la misma corrida.
    ocupadas.set(`${s.id_producto}|${r.clave}`, s.id_sku);
  }

  return { actualizar, yaCanonicos, conflictos, sinFuente };
}

export default { claveCanonica, planificarNormalizacion, construirIndiceValores, normalizarEtiqueta, MOTIVO };
