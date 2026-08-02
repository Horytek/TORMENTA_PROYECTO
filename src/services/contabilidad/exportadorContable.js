/**
 * Exportador de asientos contables a los formatos de importación de CONCAR,
 * SISCONT y FOXCONT.
 *
 * ⚠️ Sin spec oficial a la mano (a diferencia de SUNAT, que sí tiene el XSD/
 * manual UBL en el repo): estos 3 layouts son el formato estándar de
 * columnas que estos sistemas documentan públicamente (fecha, cuenta, debe,
 * haber, glosa, documento) para importación de asientos. A diferencia de un
 * documento SUNAT mal formado (multa/sanción), un TXT de importación
 * contable mal formado simplemente falla la carga y se corrige a mano — por
 * eso se puede construir sin la misma cautela regulatoria. Aun así: **antes
 * de la primera carga real, un contable con acceso al sistema destino debe
 * confirmar el layout exacto** (delimitador, orden de columnas, códigos de
 * tipo de documento) contra su instalación — cada versión/configuración de
 * estos sistemas puede variar el layout esperado.
 *
 * Todas reciben las mismas filas que ya arma `getLibroDiario` (una fila por
 * línea de asiento) — ningún exportador dispara una consulta propia.
 */

const dosDecimales = (v) => (Number(v) || 0).toFixed(2);

// `asiento_contable.fecha` es DATE puro (sin hora) — mysql2 lo entrega como
// Date en medianoche UTC. Leerlo con getters LOCALES corre la fecha un día
// para cualquier tenant en un huso horario detrás de UTC (Perú es UTC-5):
// medianoche UTC del 1 se ve como 19:00 del día 31 en hora local. Se lee
// siempre en UTC, sin importar si `f` llega como Date o como string "AAAA-MM-DD".
const fechaDDMMAAAA = (f) => {
  const d = new Date(f);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

/** CONCAR: diario delimitado por "|", un registro por línea de asiento. */
export function generarConcar(filas) {
  const encabezado = ["TIPO", "NROASIENTO", "FECHA", "CUENTA", "GLOSA", "DEBE", "HABER", "DOCUMENTO"].join("|");
  const lineas = filas.map((f) => [
    f.tipo || "M",
    f.numero,
    fechaDDMMAAAA(f.fecha),
    f.cuenta_codigo,
    (f.descripcion || f.asiento_descripcion || "").replace(/\|/g, " "),
    dosDecimales(f.debe),
    dosDecimales(f.haber),
    f.id_asiento,
  ].join("|"));
  return [encabezado, ...lineas].join("\r\n");
}

/** SISCONT: diario delimitado por ";". */
export function generarSiscont(filas) {
  const encabezado = ["FECHA", "CUENTA", "DEBE", "HABER", "GLOSA", "ASIENTO"].join(";");
  const lineas = filas.map((f) => [
    fechaDDMMAAAA(f.fecha),
    f.cuenta_codigo,
    dosDecimales(f.debe),
    dosDecimales(f.haber),
    (f.descripcion || f.asiento_descripcion || "").replace(/;/g, ","),
    f.numero,
  ].join(";"));
  return [encabezado, ...lineas].join("\r\n");
}

/** FOXCONT: ancho fijo simplificado a CSV con las mismas columnas (FOXCONT acepta CSV en sus versiones recientes). */
export function generarFoxcont(filas) {
  const encabezado = ["Fecha", "Cuenta", "Debe", "Haber", "Glosa", "NroAsiento", "TipoAsiento"].join(",");
  const escapar = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s);
  const lineas = filas.map((f) => [
    fechaDDMMAAAA(f.fecha),
    f.cuenta_codigo,
    dosDecimales(f.debe),
    dosDecimales(f.haber),
    escapar(f.descripcion || f.asiento_descripcion || ""),
    f.numero,
    f.tipo || "M",
  ].join(","));
  return [encabezado, ...lineas].join("\r\n");
}

const GENERADORES = { concar: generarConcar, siscont: generarSiscont, foxcont: generarFoxcont };

export function generarExportacionContable(formato, filas) {
  const generador = GENERADORES[formato];
  if (!generador) throw new Error(`Formato de exportación desconocido: ${formato}`);
  return generador(filas);
}
