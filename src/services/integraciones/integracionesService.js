import { getConnection } from "../../database/database.js";
import { decrypt } from "../../utils/cryptoUtil.js";
import {
  diagnosticarCredencial,
  resumirIntegracion,
  ESTADO_CREDENCIAL,
} from "./diagnosticoCredenciales.js";
import { diagnosticarCertificado, ESTADO_CERTIFICADO } from "./diagnosticoCertificado.js";

/**
 * Estado de las integraciones del tenant, para la pantalla de Ajustes.
 *
 * Dos reglas que gobiernan todo este archivo:
 *
 * 1. NUNCA sale un secreto. Ni la credencial, ni la clave del certificado, ni
 *    las API keys de la plataforma. Solo estado, mensaje y — como mucho — la
 *    longitud del valor, que ayuda a distinguir "puse algo" de "quedó residuo".
 * 2. Todo lo del tenant se lee con `id_tenant` en el WHERE (Regla de Oro Nº1).
 *    Las integraciones de plataforma (correo, imágenes, IA) no son del tenant:
 *    de esas se informa solo si el servicio está disponible, sin detalles.
 */

/** Claves SUNAT sin las cuales no se puede emitir. */
const SUNAT_REQUERIDAS = ["sunat_sol_user", "sunat_sol_pass", "sunat_cert_p12", "sunat_cert_pass"];
const SUNAT_OPCIONALES = ["sunat_env", "sunat_client_id", "sunat_client_secret"];

const ETIQUETAS_SUNAT = {
  sunat_sol_user: "Usuario SOL",
  sunat_sol_pass: "Clave SOL",
  sunat_cert_p12: "Certificado digital",
  sunat_cert_pass: "Contraseña del certificado",
  sunat_env: "Entorno (beta / producción)",
  sunat_client_id: "Client ID (guías de remisión)",
  sunat_client_secret: "Client Secret (guías de remisión)",
};

/** true si la variable de entorno tiene un valor real (no vacío ni placeholder). */
const configurada = (...nombres) =>
  nombres.every((n) => {
    const v = process.env[n];
    return typeof v === "string" && v.trim() !== "" && !/^(tu_|your_|xxx|changeme)/i.test(v.trim());
  });

/** Descifra sin propagar el valor: solo se usa dentro del diagnóstico. */
const descifrar = (valor) => decrypt(valor);

async function diagnosticarSunat(cx, { id_tenant, id_empresa }) {
  const [[empresa]] = await cx.query(
    "SELECT id_empresa, ruc, razonSocial, ubigueo FROM empresa WHERE id_empresa = ? AND id_tenant = ? LIMIT 1",
    [id_empresa, id_tenant]
  );

  if (!empresa) {
    return {
      id: "sunat",
      nombre: "Facturación electrónica (SUNAT)",
      estado: "NO_CONFIGURADO",
      mensaje: "No hay una empresa emisora asociada a esta cuenta.",
      detalles: [],
      accion: { texto: "Configurar empresa", ruta: "/settings/system" },
    };
  }

  const [filas] = await cx.query(
    "SELECT tipo, valor FROM clave WHERE id_empresa = ? AND id_tenant = ? AND tipo LIKE 'sunat_%'",
    [id_empresa, id_tenant]
  );
  const porTipo = Object.fromEntries(filas.map((f) => [f.tipo, f.valor]));

  const diagnosticos = {};
  for (const tipo of [...SUNAT_REQUERIDAS, ...SUNAT_OPCIONALES]) {
    diagnosticos[tipo] = diagnosticarCredencial(porTipo[tipo] ?? null, descifrar);
  }

  const detalles = [...SUNAT_REQUERIDAS, ...SUNAT_OPCIONALES].map((tipo) => ({
    clave: tipo,
    etiqueta: ETIQUETAS_SUNAT[tipo] ?? tipo,
    requerido: SUNAT_REQUERIDAS.includes(tipo),
    estado: diagnosticos[tipo].estado,
    mensaje: diagnosticos[tipo].mensaje,
  }));

  // El certificado solo se puede inspeccionar si sus dos piezas son legibles.
  const certLegible =
    diagnosticos.sunat_cert_p12.estado === ESTADO_CREDENCIAL.OK &&
    diagnosticos.sunat_cert_pass.estado === ESTADO_CREDENCIAL.OK;

  let certificado = {
    estado: ESTADO_CERTIFICADO.FALTA,
    mensaje: "No se puede revisar hasta que el certificado y su contraseña estén bien cargados.",
    titular: null,
    vigenteHasta: null,
    diasRestantes: null,
  };
  if (certLegible) {
    try {
      certificado = diagnosticarCertificado(
        descifrar(porTipo.sunat_cert_p12),
        descifrar(porTipo.sunat_cert_pass)
      );
    } catch {
      certificado = { ...certificado, estado: ESTADO_CERTIFICADO.ILEGIBLE, mensaje: "El certificado no se pudo leer." };
    }
  }

  const resumen = resumirIntegracion(diagnosticos, SUNAT_REQUERIDAS);

  // Un certificado vencido bloquea aunque las credenciales estén perfectas.
  const certificadoBloquea = certificado.estado === ESTADO_CERTIFICADO.VENCIDO;
  const estado = certificadoBloquea ? "NO_CONFIGURADO" : resumen.estado;

  // El entorno se muestra siempre: emitir en producción por error no se deshace.
  let entorno = null;
  if (diagnosticos.sunat_env.estado === ESTADO_CREDENCIAL.OK) {
    try {
      entorno = String(descifrar(porTipo.sunat_env)).trim().toLowerCase();
    } catch { /* ya quedó reflejado en el detalle */ }
  }

  return {
    id: "sunat",
    nombre: "Facturación electrónica (SUNAT)",
    descripcion: `Emisión de boletas y facturas de ${empresa.razonSocial ?? "la empresa"} (RUC ${empresa.ruc ?? "—"}).`,
    estado,
    mensaje: certificadoBloquea ? certificado.mensaje : resumen.mensaje,
    entorno: entorno === "produccion" || entorno === "beta" ? entorno : null,
    ubigeoConfigurado: Boolean(empresa.ubigueo),
    certificado,
    detalles,
    accion: { texto: "Configurar credenciales", ruta: "/settings/system" },
  };
}

async function diagnosticarBaseDatos(cx) {
  const inicio = Date.now();
  await cx.query("SELECT 1");
  const latencia = Date.now() - inicio;
  return {
    id: "base-datos",
    nombre: "Base de datos",
    descripcion: "Almacenamiento de tus ventas, inventario y clientes.",
    estado: latencia > 1000 ? "DEGRADADO" : "OPERATIVO",
    mensaje: latencia > 1000 ? `Responde lento (${latencia} ms).` : `Respondiendo en ${latencia} ms.`,
    detalles: [],
  };
}

/** Servicios de la plataforma: el tenant solo ve si están disponibles. */
function diagnosticarPlataforma() {
  const servicios = [
    {
      id: "correo",
      nombre: "Envío de correos",
      descripcion: "Comprobantes y notificaciones que se envían a tus clientes.",
      activo: configurada("RESEND_API_KEY"),
      sinConfigurar: "El envío de correos no está habilitado en tu cuenta.",
    },
    {
      id: "imagenes",
      nombre: "Imágenes de productos",
      descripcion: "Almacenamiento de las fotos de tu catálogo.",
      activo: configurada("IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_URL_ENDPOINT"),
      sinConfigurar: "La carga de imágenes no está habilitada en tu cuenta.",
    },
    {
      id: "asistente-ia",
      nombre: "Asistente inteligente",
      descripcion: "Consultas en lenguaje natural sobre tu negocio.",
      activo: configurada("OPENAI_API_KEY") || configurada("GEMINI_API_KEY") || configurada("DEEPSEEK_API_KEY"),
      sinConfigurar: "El asistente no está habilitado en tu plan.",
    },
  ];

  return servicios.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    estado: s.activo ? "OPERATIVO" : "NO_DISPONIBLE",
    mensaje: s.activo ? "Disponible." : s.sinConfigurar,
    detalles: [],
  }));
}

/**
 * Diagnóstico completo para el tenant que hace la llamada.
 * `id_tenant` e `id_empresa` vienen del JWT, nunca del cliente.
 */
export async function obtenerEstadoIntegraciones({ id_tenant, id_empresa }) {
  const cx = await getConnection();
  try {
    const [sunat, baseDatos] = await Promise.all([
      diagnosticarSunat(cx, { id_tenant, id_empresa }),
      diagnosticarBaseDatos(cx),
    ]);

    const integraciones = [sunat, baseDatos, ...diagnosticarPlataforma()];
    const conProblema = integraciones.filter((i) => i.estado === "NO_CONFIGURADO" || i.estado === "DEGRADADO");

    return {
      generadoEn: new Date().toISOString(),
      resumen: {
        total: integraciones.length,
        operativas: integraciones.filter((i) => i.estado === "OPERATIVO").length,
        conProblema: conProblema.length,
        requierenAccion: conProblema.filter((i) => i.estado === "NO_CONFIGURADO").map((i) => i.nombre),
      },
      integraciones,
    };
  } finally {
    cx.release();
  }
}

export default { obtenerEstadoIntegraciones };
