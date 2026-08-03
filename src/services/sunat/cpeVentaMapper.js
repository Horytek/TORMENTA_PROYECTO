import { numeroALetras } from "../../utils/numeroALetras.js";
import { ErrorCpe, CATEGORIAS } from "./cpeErrores.js";

/**
 * Traduce una venta de la BD al payload que consume `ublInvoiceBuilder.js`.
 *
 * ES EL PUNTO CLAVE DE SEGURIDAD del subsistema: hoy los importes, la serie y
 * hasta el RUC del emisor los manda el NAVEGADOR y el backend los firma sin
 * verificar. Acá todo sale de la base de datos.
 *
 * Función pura: no toca BD ni red. Recibe filas ya leídas y devuelve el payload.
 *
 * Sobre el IGV: los precios de `detalle_venta` se guardan CON IGV incluido (es
 * lo que hace el POS y lo que asume el flujo legacy, que divide entre 1.18).
 */

export const TASA_IGV = 0.18;

/** Catálogo 07 SUNAT: solo estos tres son operaciones onerosas comunes en retail. Gravado es el default histórico. */
const AFECTACION_GRAVADO = "10";
const AFECTACIONES_VALIDAS = new Set(["10", "20", "30"]);

/** Normaliza lo que venga de `producto.tipo_afectacion_igv`; cualquier valor fuera de catálogo cae a Gravado, nunca a "sin impuesto" por accidente. */
function normalizarAfectacion(valor) {
  const texto = String(valor ?? "").trim();
  return AFECTACIONES_VALIDAS.has(texto) ? texto : AFECTACION_GRAVADO;
}

/** Diferencia máxima tolerada entre el total del comprobante y la suma de la venta. */
const TOLERANCIA_DESCUADRE = 0.05;

const redondear = (valor, decimales = 2) => {
  const factor = 10 ** decimales;
  return Math.round((Number(valor) + Number.EPSILON) * factor) / factor;
};

/** `nom_tipocomp` de la BD → código del catálogo 01 de SUNAT. */
export function mapearTipoComprobante(nombreTipo) {
  const nombre = String(nombreTipo || "").trim().toLowerCase();
  if (nombre === "factura") return "01";
  if (nombre === "boleta") return "03";
  return null; // Nota de venta y demás no son comprobantes electrónicos.
}

/** `F001-00000123` → `{ serie: 'F001', correlativo: '00000123' }`. */
export function partirNumComprobante(numComprobante) {
  const texto = String(numComprobante || "").trim();
  const match = /^([A-Za-z]\d{3})-(\d{1,8})$/.exec(texto);
  if (!match) {
    throw new ErrorCpe(
      "CPE_NUMERO_INVALIDO",
      `El número de comprobante "${texto}" no tiene el formato esperado (ej. F001-00000123).`,
      { categoria: CATEGORIAS.VALIDACION }
    );
  }
  return { serie: match[1].toUpperCase(), correlativo: match[2].padStart(8, "0") };
}

/**
 * Documento del cliente según el catálogo 06 de SUNAT.
 * Factura EXIGE RUC; boleta acepta DNI o venta genérica sin documento.
 */
function resolverCliente(cliente, tipoDoc) {
  const ruc = String(cliente?.ruc || "").trim();
  const dni = String(cliente?.dni || "").trim();
  const razonSocial = String(
    cliente?.razon_social || `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim()
  ).trim();

  if (tipoDoc === "01") {
    if (!/^\d{11}$/.test(ruc)) {
      throw new ErrorCpe(
        "CPE_CLIENTE_INVALIDO",
        "Una factura exige un cliente con RUC de 11 dígitos.",
        { categoria: CATEGORIAS.VALIDACION }
      );
    }
    return { tipoDoc: "6", numDoc: ruc, rznSocial: razonSocial || "CLIENTE" };
  }

  // Boleta
  if (/^\d{11}$/.test(ruc)) return { tipoDoc: "6", numDoc: ruc, rznSocial: razonSocial || "CLIENTE" };
  if (/^\d{8}$/.test(dni)) return { tipoDoc: "1", numDoc: dni, rznSocial: razonSocial || "CLIENTE" };
  // Venta genérica (mostrador): SUNAT admite doc "0" para boletas menores.
  return { tipoDoc: "0", numDoc: "-", rznSocial: razonSocial || "CLIENTE VARIOS" };
}

/** Datos del emisor. Copia el mapeo que ya usa `ventas.controller.js`. */
function resolverEmpresa(empresa) {
  if (!empresa?.ruc) {
    throw new ErrorCpe("CPE_EMPRESA_INCOMPLETA", "La empresa emisora no tiene RUC configurado.", {
      categoria: CATEGORIAS.CONFIG,
    });
  }
  if (!empresa?.ubigueo) {
    throw new ErrorCpe(
      "CPE_EMPRESA_INCOMPLETA",
      "La empresa emisora no tiene ubigeo configurado, y SUNAT lo exige en el comprobante.",
      { categoria: CATEGORIAS.CONFIG, detalle: { id_empresa: empresa?.id_empresa } }
    );
  }

  return {
    ruc: String(empresa.ruc).trim(),
    razonSocial: empresa.razonSocial || empresa.nombreComercial || "",
    nombreComercial: empresa.nombreComercial || empresa.razonSocial || "",
    address: {
      ubigueo: String(empresa.ubigueo).trim(),
      direccion: empresa.direccion || "",
      provincia: empresa.provincia || "",
      departamento: empresa.departamento || "",
      distrito: empresa.distrito || "",
      codLocal: "0000",
    },
  };
}

/**
 * Desglose por línea.
 *
 * Corrige el arrastre de centavos del legacy (`client/src/services/
 * ventas.services.js`), que redondea el valor unitario a 2 decimales y RECIÉN
 * ahí multiplica por la cantidad — con lo que el total del XML puede no cuadrar
 * con el de la venta. Acá se parte del TOTAL de la línea (el importe real
 * cobrado) y el unitario se guarda con más decimales, que es lo que SUNAT
 * admite (hasta 10) para que la multiplicación cierre.
 */
function construirLineas(detalles) {
  return detalles.map((detalle, indice) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const totalLinea = redondear(Number(detalle.total) || 0);

    if (cantidad <= 0) {
      throw new ErrorCpe(
        "CPE_VALIDACION",
        `La línea ${indice + 1} tiene cantidad inválida (${detalle.cantidad}).`,
        { categoria: CATEGORIAS.VALIDACION }
      );
    }

    const tipAfeIgv = normalizarAfectacion(detalle.tipo_afectacion_igv);
    const esGravado = tipAfeIgv === AFECTACION_GRAVADO;

    // El total incluye IGV solo en líneas gravadas — exonerado/inafecto no
    // tienen IGV que extraer, el total cobrado ES la base íntegra.
    const valorVenta = esGravado ? redondear(totalLinea / (1 + TASA_IGV)) : totalLinea;
    const igv = esGravado ? redondear(totalLinea - valorVenta) : 0;

    return {
      codProducto: String(detalle.id_producto ?? ""),
      unidad: detalle.undm || "NIU",
      descripcion: detalle.nombre || detalle.descripcion || "PRODUCTO",
      cantidad,
      mtoValorUnitario: redondear(valorVenta / cantidad, 10),
      mtoValorVenta: valorVenta,
      mtoBaseIgv: valorVenta,
      porcentajeIgv: esGravado ? TASA_IGV * 100 : 0,
      igv,
      tipAfeIgv,
      totalImpuestos: igv,
      mtoPrecioUnitario: redondear(totalLinea / cantidad, 10),
      _totalLinea: totalLinea,
    };
  });
}

/** Normaliza `fecha_iso`/`f_venta` al formato con offset de Perú que espera el UBL. */
function resolverFechaEmision(venta) {
  const iso = String(venta.fecha_iso || "").trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(iso)) return iso;

  const fecha =
    (venta.f_venta instanceof Date
      ? venta.f_venta.toISOString().slice(0, 10)
      : String(venta.f_venta || "").slice(0, 10)) || iso.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new ErrorCpe("CPE_VALIDACION", "La venta no tiene una fecha de emisión válida.", {
      categoria: CATEGORIAS.VALIDACION,
    });
  }

  const hora = String(venta.hora_creacion || "00:00:00").slice(0, 8);
  return `${fecha}T${hora}-05:00`;
}

/**
 * Construye el payload UBL completo desde datos de BD.
 *
 * @param {{venta:object, detalles:object[], cliente:object, empresa:object}} datos
 * @returns {{payload:object, tipoDoc:string, serie:string, correlativo:string}}
 */
export function construirPayloadDesdeVenta({ venta, detalles, cliente, empresa }) {
  if (!venta) {
    throw new ErrorCpe("CPE_VENTA_NO_ENCONTRADA", "No se encontró la venta.", {
      categoria: CATEGORIAS.VALIDACION,
    });
  }
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new ErrorCpe("CPE_VALIDACION", "La venta no tiene líneas de detalle.", {
      categoria: CATEGORIAS.VALIDACION,
    });
  }

  const tipoDoc = mapearTipoComprobante(venta.nom_tipocomp);
  if (!tipoDoc) {
    throw new ErrorCpe(
      "CPE_TIPO_NO_ELECTRONICO",
      `"${venta.nom_tipocomp}" no es un comprobante electrónico (solo Factura y Boleta).`,
      { categoria: CATEGORIAS.VALIDACION }
    );
  }

  const { serie, correlativo } = partirNumComprobante(venta.num_comprobante);
  const lineas = construirLineas(detalles);

  // Cuadre de cabecera: la suma de líneas debe coincidir con lo cobrado.
  const totalLineas = redondear(lineas.reduce((acc, l) => acc + l._totalLinea, 0));
  const sumaPorAfectacion = (codigo) =>
    redondear(lineas.filter((l) => l.tipAfeIgv === codigo).reduce((acc, l) => acc + l.mtoValorVenta, 0));
  const mtoOperGravadas = sumaPorAfectacion(AFECTACION_GRAVADO);
  const mtoOperExoneradas = sumaPorAfectacion("20");
  const mtoOperInafectas = sumaPorAfectacion("30");
  // Exonerado/inafecto no aportan IGV (su mtoValorVenta ya es el total sin
  // extracción), así que restarlos junto con gravadas sigue dando el IGV real
  // — y con cero líneas no gravadas da exactamente lo mismo que antes.
  const mtoIGV = redondear(totalLineas - mtoOperGravadas - mtoOperExoneradas - mtoOperInafectas);

  // `venta.igv` es un MONTO en esta BD: sirve de contraste contra lo calculado.
  const igvVenta = Number(venta.igv);
  if (Number.isFinite(igvVenta) && igvVenta > 0 && Math.abs(igvVenta - mtoIGV) > TOLERANCIA_DESCUADRE) {
    throw new ErrorCpe(
      "CPE_DESCUADRE_TOTALES",
      `El IGV calculado (${mtoIGV}) no coincide con el de la venta (${igvVenta}). No se emite para no declarar importes incorrectos.`,
      { categoria: CATEGORIAS.VALIDACION, detalle: { mtoIGV, igvVenta } }
    );
  }

  const payload = {
    tipoOperacion: "0101",
    tipoDoc,
    serie,
    correlativo,
    fechaEmision: resolverFechaEmision(venta),
    tipoMoneda: venta.moneda || "PEN",
    company: resolverEmpresa(empresa),
    client: resolverCliente(cliente, tipoDoc),
    mtoOperGravadas,
    mtoOperExoneradas,
    mtoOperInafectas,
    mtoIGV,
    valorVenta: mtoOperGravadas,
    totalImpuestos: mtoIGV,
    subTotal: totalLineas,
    mtoImpVenta: totalLineas,
    legends: [{ code: "1000", value: numeroALetras(totalLineas, venta.moneda || "PEN") }],
    details: lineas.map(({ _totalLinea, ...linea }) => linea),
  };

  return {
    payload, tipoDoc, serie, correlativo,
    totales: { mtoOperGravadas, mtoOperExoneradas, mtoOperInafectas, mtoIGV, mtoImpVenta: totalLineas },
  };
}

export default { construirPayloadDesdeVenta, mapearTipoComprobante, partirNumComprobante, TASA_IGV };
