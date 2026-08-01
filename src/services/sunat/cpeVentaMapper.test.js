import { describe, it, expect } from "vitest";
import {
  construirPayloadDesdeVenta,
  mapearTipoComprobante,
  partirNumComprobante,
} from "./cpeVentaMapper.js";

/**
 * Este mapper es el punto donde se decide QUÉ se declara ante SUNAT.
 * Antes esos importes los mandaba el navegador y el backend los firmaba sin
 * mirar; ahora salen de la BD. Los tests fijan las dos cosas que importan:
 * que el total declarado sea exactamente el cobrado, y que se niegue a emitir
 * cuando los datos no dan.
 */

const empresaValida = {
  id_empresa: 2,
  ruc: "20610588981",
  razonSocial: "HORYTEK SAC",
  direccion: "CAL. SAN MARTIN NRO. 1573",
  distrito: "JOSE LEONARDO ORTIZ",
  provincia: "CHICLAYO",
  departamento: "LAMBAYEQUE",
  ubigueo: "130112",
};

const ventaBase = (extra = {}) => ({
  id_venta: 1,
  num_comprobante: "B001-00000901",
  nom_tipocomp: "Boleta",
  f_venta: "2026-07-25",
  hora_creacion: "14:30:00",
  moneda: "PEN",
  ...extra,
});

const linea = (extra = {}) => ({
  id_producto: 10,
  nombre: "POLO OVERSIZE",
  undm: "NIU",
  cantidad: 1,
  precio: 118,
  descuento: 0,
  total: 118,
  ...extra,
});

const construir = ({ venta = {}, detalles = [linea()], cliente = {}, empresa = empresaValida } = {}) =>
  construirPayloadDesdeVenta({ venta: ventaBase(venta), detalles, cliente, empresa });

describe("mapearTipoComprobante", () => {
  it("mapea al catálogo 01 de SUNAT", () => {
    expect(mapearTipoComprobante("Factura")).toBe("01");
    expect(mapearTipoComprobante("Boleta")).toBe("03");
  });

  it("no distingue mayúsculas ni espacios sobrantes", () => {
    expect(mapearTipoComprobante("  FACTURA ")).toBe("01");
    expect(mapearTipoComprobante("boleta")).toBe("03");
  });

  it("devuelve null para lo que no es comprobante electrónico", () => {
    // Nota de venta es un documento interno: no se declara.
    for (const tipo of ["Nota de venta", "Guia de remision", "", null, undefined]) {
      expect(mapearTipoComprobante(tipo)).toBeNull();
    }
  });
});

describe("partirNumComprobante", () => {
  it("separa serie y correlativo", () => {
    expect(partirNumComprobante("F001-00000123")).toEqual({ serie: "F001", correlativo: "00000123" });
  });

  it("rellena el correlativo a 8 dígitos", () => {
    expect(partirNumComprobante("B001-123").correlativo).toBe("00000123");
  });

  it("normaliza la serie a mayúsculas", () => {
    expect(partirNumComprobante("f001-1").serie).toBe("F001");
  });

  it("rechaza formatos que SUNAT no acepta", () => {
    for (const malo of ["F1-123", "0001-123", "F001", "F001-", "", null, "F001-123456789"]) {
      expect(() => partirNumComprobante(malo), String(malo)).toThrow(/formato esperado/i);
    }
  });
});

describe("construirPayloadDesdeVenta — importes", () => {
  it("declara exactamente el total cobrado, sin arrastre de céntimos", () => {
    // Regresión del bug legacy: redondeaba el valor unitario a 2 decimales y
    // recién ahí multiplicaba, declarando S/234.91 sobre una venta de S/234.89.
    const { payload, totales } = construir({
      venta: { igv: 35.83 },
      detalles: [linea({ cantidad: 7, total: 234.89 })],
    });

    expect(totales.mtoImpVenta).toBe(234.89);
    expect(payload.mtoImpVenta).toBe(234.89);
    expect(payload.mtoOperGravadas + payload.mtoIGV).toBeCloseTo(234.89, 2);
  });

  it("guarda el valor unitario con decimales suficientes para que la multiplicación cierre", () => {
    const { payload } = construir({
      venta: { igv: 35.83 },
      detalles: [linea({ cantidad: 7, total: 234.89 })],
    });
    const [item] = payload.details;

    // SUNAT admite hasta 10 decimales en el unitario justamente para esto.
    expect(item.mtoValorUnitario * item.cantidad).toBeCloseTo(item.mtoValorVenta, 6);
    expect(item.mtoPrecioUnitario * item.cantidad).toBeCloseTo(234.89, 6);
  });

  it("extrae la base gravada del total (los precios se guardan CON IGV)", () => {
    const { payload } = construir({ venta: { igv: 18 }, detalles: [linea({ total: 118 })] });
    expect(payload.mtoOperGravadas).toBe(100);
    expect(payload.mtoIGV).toBe(18);
    expect(payload.details[0].tipAfeIgv).toBe("10"); // gravado, operación onerosa
  });

  it("suma varias líneas sin perder céntimos", () => {
    const { payload } = construir({
      detalles: [
        linea({ cantidad: 3, total: 59.9 }),
        linea({ id_producto: 11, cantidad: 1, total: 40.1 }),
      ],
    });
    expect(payload.mtoImpVenta).toBe(100);
    expect(payload.details).toHaveLength(2);
  });

  it("toma los importes del detalle, no de campos sueltos de la venta", () => {
    // Un total inflado en la cabecera no debe llegar al comprobante.
    const { payload } = construir({
      venta: { total: 9999, mtoImpVenta: 9999 },
      detalles: [linea({ total: 118 })],
    });
    expect(payload.mtoImpVenta).toBe(118);
  });

  it("se niega a emitir si el IGV calculado no cuadra con el de la venta", () => {
    // Preferimos no emitir antes que declarar importes que no son los cobrados.
    expect(() =>
      construir({ venta: { igv: 999 }, detalles: [linea({ total: 118 })] })
    ).toThrow(/no coincide/i);
  });

  it("tolera diferencias de redondeo menores a un céntimo grande", () => {
    expect(() => construir({ venta: { igv: 18.03 }, detalles: [linea({ total: 118 })] })).not.toThrow();
  });

  it("una línea exonerada no extrae IGV: el total cobrado es toda la base", () => {
    const { payload } = construir({
      venta: { igv: 0 },
      detalles: [linea({ total: 100, tipo_afectacion_igv: "20" })],
    });
    expect(payload.mtoOperGravadas).toBe(0);
    expect(payload.mtoOperExoneradas).toBe(100);
    expect(payload.mtoOperInafectas).toBe(0);
    expect(payload.mtoIGV).toBe(0);
    expect(payload.details[0].tipAfeIgv).toBe("20");
    expect(payload.details[0].igv).toBe(0);
    expect(payload.details[0].mtoValorVenta).toBe(100);
  });

  it("una línea inafecta se comporta igual que exonerada, en su propia categoría", () => {
    const { payload } = construir({
      venta: { igv: 0 },
      detalles: [linea({ total: 50, tipo_afectacion_igv: "30" })],
    });
    expect(payload.mtoOperInafectas).toBe(50);
    expect(payload.mtoOperGravadas).toBe(0);
    expect(payload.mtoIGV).toBe(0);
  });

  it("mezcla gravado + exonerado + inafecto en la misma venta sin perder cuadre", () => {
    const { payload, totales } = construir({
      venta: { igv: 18 },
      detalles: [
        linea({ id_producto: 1, total: 118, tipo_afectacion_igv: "10" }), // 100 + 18 IGV
        linea({ id_producto: 2, total: 30, tipo_afectacion_igv: "20" }),
        linea({ id_producto: 3, total: 20, tipo_afectacion_igv: "30" }),
      ],
    });
    expect(payload.mtoOperGravadas).toBe(100);
    expect(payload.mtoOperExoneradas).toBe(30);
    expect(payload.mtoOperInafectas).toBe(20);
    expect(payload.mtoIGV).toBe(18);
    expect(payload.mtoImpVenta).toBe(168);
    expect(totales.mtoOperExoneradas).toBe(30);
  });

  it("un tipo de afectación fuera de catálogo cae a gravado, nunca queda sin impuesto por accidente", () => {
    const { payload } = construir({
      venta: { igv: 18 },
      detalles: [linea({ total: 118, tipo_afectacion_igv: "99" })],
    });
    expect(payload.details[0].tipAfeIgv).toBe("10");
    expect(payload.mtoOperGravadas).toBe(100);
  });

  it("escribe la leyenda 1000 en palabras", () => {
    const { payload } = construir({ venta: { igv: 18 }, detalles: [linea({ total: 118 })] });
    const leyenda = payload.legends.find((l) => l.code === "1000");
    expect(leyenda.value).toBe("CIENTO DIECIOCHO CON 00/100 SOLES");
  });
});

describe("construirPayloadDesdeVenta — cliente (catálogo 06)", () => {
  it("una factura exige RUC de 11 dígitos", () => {
    expect(() =>
      construir({ venta: { nom_tipocomp: "Factura", num_comprobante: "F001-00000001", igv: 18 }, cliente: { dni: "44556677" } })
    ).toThrow(/RUC de 11 dígitos/i);
  });

  it("una factura con RUC válido usa tipoDoc 6", () => {
    const { payload } = construir({
      venta: { nom_tipocomp: "Factura", num_comprobante: "F001-00000001", igv: 18 },
      cliente: { ruc: "20123456789", razon_social: "CLIENTE SAC" },
    });
    expect(payload.client).toMatchObject({ tipoDoc: "6", numDoc: "20123456789", rznSocial: "CLIENTE SAC" });
  });

  it("una boleta acepta DNI (tipoDoc 1)", () => {
    const { payload } = construir({ venta: { igv: 18 }, cliente: { dni: "44556677", nombres: "ANA", apellidos: "PEREZ" } });
    expect(payload.client).toMatchObject({ tipoDoc: "1", numDoc: "44556677", rznSocial: "ANA PEREZ" });
  });

  it("una boleta sin documento sale como venta genérica de mostrador", () => {
    const { payload } = construir({ venta: { igv: 18 }, cliente: {} });
    expect(payload.client).toMatchObject({ tipoDoc: "0", numDoc: "-", rznSocial: "CLIENTE VARIOS" });
  });
});

describe("construirPayloadDesdeVenta — se niega antes de firmar", () => {
  it("si la empresa no tiene ubigeo, que SUNAT exige", () => {
    expect(() => construir({ empresa: { ...empresaValida, ubigueo: null } })).toThrow(/ubigeo/i);
  });

  it("si la empresa no tiene RUC", () => {
    expect(() => construir({ empresa: { ...empresaValida, ruc: null } })).toThrow(/RUC/i);
  });

  it("si el tipo de documento no es electrónico", () => {
    expect(() => construir({ venta: { nom_tipocomp: "Nota de venta" } })).toThrow(/no es un comprobante electrónico/i);
  });

  it("si la venta no tiene líneas", () => {
    expect(() => construir({ detalles: [] })).toThrow(/no tiene líneas/i);
  });

  it("si una línea tiene cantidad cero o negativa", () => {
    expect(() => construir({ detalles: [linea({ cantidad: 0 })] })).toThrow(/cantidad inválida/i);
    expect(() => construir({ detalles: [linea({ cantidad: -1 })] })).toThrow(/cantidad inválida/i);
  });

  it("si no hay venta", () => {
    expect(() => construirPayloadDesdeVenta({ venta: null, detalles: [linea()] })).toThrow(/no se encontró la venta/i);
  });
});

describe("construirPayloadDesdeVenta — fecha de emisión", () => {
  it("arma la fecha con el offset de Perú desde f_venta y la hora", () => {
    const { payload } = construir({ venta: { igv: 18 } });
    expect(payload.fechaEmision).toBe("2026-07-25T14:30:00-05:00");
  });

  it("prefiere fecha_iso cuando ya viene completa", () => {
    const { payload } = construir({ venta: { igv: 18, fecha_iso: "2026-07-25T09:15:00-05:00" } });
    expect(payload.fechaEmision).toBe("2026-07-25T09:15:00-05:00");
  });

  it("acepta un objeto Date de mysql2", () => {
    const { payload } = construir({ venta: { igv: 18, f_venta: new Date("2026-07-25T00:00:00Z") } });
    expect(payload.fechaEmision).toMatch(/^2026-07-25T/);
  });

  it("rechaza una venta sin fecha utilizable", () => {
    expect(() => construir({ venta: { igv: 18, f_venta: null, fecha_iso: null } })).toThrow(/fecha de emisión/i);
  });
});
