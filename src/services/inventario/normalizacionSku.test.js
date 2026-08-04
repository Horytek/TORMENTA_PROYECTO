import { describe, it, expect } from "vitest";
import {
  claveCanonica,
  planificarNormalizacion,
  construirIndiceValores,
  normalizarEtiqueta,
  MOTIVO,
} from "./normalizacionSku.js";

/**
 * De esto depende que `resolveSku` encuentre una variante existente en vez de
 * crear una nueva. Si la clave sale mal, el stock se dispersa entre duplicados
 * y nadie se entera hasta que el kardex no cuadra.
 *
 * Los casos borde importan más de lo normal porque la entrada es dato real y
 * sucio: etiquetas con tilde, atributos numéricos heredados del esquema viejo,
 * y JSON vacío.
 */

const VALORES = [
  { id_valor: 31, id_atributo: 1, valor: "Azul Clasico" },
  { id_valor: 6, id_atributo: 1, valor: "Negro" },
  { id_valor: 19, id_atributo: 2, valor: "S" },
  { id_valor: 18, id_atributo: 2, valor: "M" },
  { id_valor: 17, id_atributo: 2, valor: "L" },
];
const indice = construirIndiceValores(VALORES);

describe("normalizarEtiqueta", () => {
  it("ignora tildes, mayúsculas y espacios", () => {
    expect(normalizarEtiqueta(" Azul Clásico ")).toBe("azul clasico");
    expect(normalizarEtiqueta("NEGRO")).toBe("negro");
  });
});

describe("claveCanonica", () => {
  it("arma la clave en el formato que espera resolveSku", () => {
    expect(claveCanonica({ 1: "Azul Clasico", 2: "S" }, indice).clave).toBe("1:31|2:19");
  });

  it("ordena por id_atributo aunque el json venga al revés", () => {
    // Si no se ordenara, "2:19|1:31" nunca encontraría a "1:31|2:19".
    expect(claveCanonica({ 2: "S", 1: "Azul Clasico" }, indice).clave).toBe("1:31|2:19");
  });

  it("resuelve etiquetas con tilde contra el catálogo sin tilde", () => {
    expect(claveCanonica({ 1: "Azul Clásico", 2: "s" }, indice).clave).toBe("1:31|2:19");
  });

  it("acepta el json como string, que es como viene de MySQL", () => {
    expect(claveCanonica('{"1":"Negro","2":"M"}', indice).clave).toBe("1:6|2:18");
  });

  it("no adivina cuando la etiqueta no existe en el catálogo", () => {
    // El caso real: 1062 SKU con el color guardado como "1", "2", "3" —
    // números heredados del esquema viejo cuyo significado ya no consta.
    const r = claveCanonica({ 1: "1", 2: "S" }, indice);
    expect(r.clave).toBeNull();
    expect(r.motivo).toBe(MOTIVO.VALOR_DESCONOCIDO);
    expect(r.detalle).toContain("atributo 1");
  });

  it("distingue un producto simple de un json roto", () => {
    expect(claveCanonica({}, indice).motivo).toBe(MOTIVO.SIN_ATRIBUTOS);
    expect(claveCanonica(null, indice).motivo).toBe(MOTIVO.SIN_ATRIBUTOS);
    expect(claveCanonica("{no es json", indice).motivo).toBe(MOTIVO.JSON_ILEGIBLE);
  });
});

describe("planificarNormalizacion", () => {
  const sku = (id_sku, id_producto, attrs_key, attributes_json) => ({ id_sku, id_producto, attrs_key, attributes_json });

  it("propone actualizar solo lo que cambia", () => {
    const plan = planificarNormalizacion(
      [
        sku(1, 10, "Azul Clasico|S", { 1: "Azul Clasico", 2: "S" }),
        sku(2, 10, "1:6|2:18", { 1: "Negro", 2: "M" }),
      ],
      indice
    );
    expect(plan.actualizar).toEqual([
      { id_sku: 1, id_producto: 10, claveVieja: "Azul Clasico|S", claveNueva: "1:31|2:19" },
    ]);
    expect(plan.yaCanonicos).toEqual([2]);
  });

  it("NO fusiona: si la clave nueva ya la ocupa otro SKU, lo manda a revisión", () => {
    // Dos variantes con stock real no se unen por una coincidencia de clave.
    const plan = planificarNormalizacion(
      [
        sku(1, 10, "1:31|2:19", { 1: "Azul Clasico", 2: "S" }),
        sku(2, 10, "Azul Clasico|S", { 1: "Azul Clasico", 2: "S" }),
      ],
      indice
    );
    expect(plan.actualizar).toEqual([]);
    expect(plan.conflictos).toHaveLength(1);
    expect(plan.conflictos[0]).toMatchObject({ id_sku: 2, ocupadaPor: 1 });
  });

  it("dos SKU del mismo producto no pueden tomar la misma clave en una corrida", () => {
    const plan = planificarNormalizacion(
      [
        sku(1, 10, "Azul Clasico|S", { 1: "Azul Clasico", 2: "S" }),
        sku(2, 10, "azul clasico|s", { 1: "Azul Clásico", 2: "S" }),
      ],
      indice
    );
    expect(plan.actualizar).toHaveLength(1);
    expect(plan.conflictos).toHaveLength(1);
  });

  it("la misma clave en productos distintos no es conflicto", () => {
    const plan = planificarNormalizacion(
      [
        sku(1, 10, "Azul Clasico|S", { 1: "Azul Clasico", 2: "S" }),
        sku(2, 20, "Azul Clasico|S", { 1: "Azul Clasico", 2: "S" }),
      ],
      indice
    );
    expect(plan.actualizar).toHaveLength(2);
    expect(plan.conflictos).toEqual([]);
  });

  it("separa lo que no tiene fuente confiable en vez de inventarlo", () => {
    const plan = planificarNormalizacion([sku(9, 10, "1|0", { 1: "1", 2: "0" })], indice);
    expect(plan.actualizar).toEqual([]);
    expect(plan.sinFuente).toHaveLength(1);
    expect(plan.sinFuente[0].motivo).toBe(MOTIVO.VALOR_DESCONOCIDO);
  });

  it("una lista vacía no revienta", () => {
    expect(planificarNormalizacion([], indice).actualizar).toEqual([]);
    expect(planificarNormalizacion(undefined, indice).actualizar).toEqual([]);
  });
});
