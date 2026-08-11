/**
 * Datos demo por modo de /login — rellena formularios y enlaces portal/ops.
 * Credenciales reales solo en `fill` (no se muestran en claro en la UI).
 */

import {
  DEMO_PASSWORD,
  DEMO_SLUG,
  getDemoPortalCreds,
  type DemoPortalCreds,
} from "./demoPortalCreds";

export type LoginDemoSurface = "admin" | "portal";

export type LoginDemoBundle = {
  mode: string;
  surface: LoginDemoSurface;
  hint: string;
  lines: { label: string; value: string }[];
  /** Campos a volcar en el form de LoginPage */
  fill: {
    slug?: string;
    email?: string;
    password?: string;
    usuario?: string;
    telefono?: string;
    nombre?: string;
    pin?: string;
    /** Código tracking / tenant catálogo */
    codigo?: string;
  };
  /** Navegar directo (portal/ops) sin login */
  openHref?: string;
  enterLabel?: string;
};

/** Oculta secretos en líneas visibles de la tarjeta. */
function publicLines(lines: { label: string; value: string }[]) {
  return lines.map((l) => {
    const key = l.label.toLowerCase();
    if (key.includes("contraseña") || key.includes("password") || key === "pin") {
      return { ...l, value: "••••••••" };
    }
    return l;
  });
}

/** Convierte creds de portal/ops al bundle de la tarjeta unificada. */
export function bundleFromPortalCreds(
  creds: DemoPortalCreds,
  mode: string,
  enterLabel = "Entrar con demo"
): LoginDemoBundle {
  return {
    mode,
    surface: "admin",
    hint: creds.hint,
    lines: publicLines(creds.lines),
    fill: {
      slug: creds.slug,
      email: creds.email,
      password: creds.password,
      telefono: creds.telefono,
      nombre: creds.nombre,
      pin: creds.pin,
    },
    enterLabel,
  };
}

const ERP_USER =
  (import.meta.env.VITE_DEMO_ERP_USER as string | undefined)?.trim() || "platform.demo";
const ERP_PASS =
  (import.meta.env.VITE_DEMO_ERP_PASSWORD as string | undefined)?.trim() || DEMO_PASSWORD;

function erpAdmin(mode: string, hint: string, openHref?: string): LoginDemoBundle {
  return {
    mode,
    surface: "admin",
    hint,
    lines: publicLines([
      { label: "Usuario", value: ERP_USER },
      { label: "Contraseña", value: ERP_PASS },
    ]),
    fill: { usuario: ERP_USER, password: ERP_PASS },
    openHref,
    enterLabel: "Entrar con demo",
  };
}

function productAdmin(mode: string, productId: string): LoginDemoBundle {
  const c = getDemoPortalCreds(productId, "admin")!;
  return bundleFromPortalCreds(c, mode, "Entrar con demo");
}

function portalSlug(mode: string, href: string, hint: string): LoginDemoBundle {
  return {
    mode,
    surface: "portal",
    hint,
    lines: [{ label: "Código operador", value: DEMO_SLUG }],
    fill: { slug: DEMO_SLUG },
    openHref: href,
    enterLabel: "Abrir portal demo",
  };
}

/** Modos que autentican con JWT ERP (handleLogin) y van a adminPath. */
export const ERP_SESSION_LOGIN_MODES = new Set([
  "erp",
  "mayorista",
  "recluta",
  "sync",
  "taller",
  "preventa",
  "crm",
  "envios",
  "wms",
  "despacho",
  "campo",
  "mantenimiento",
  "catalogo-wa",
]);

const PRODUCT_LABEL: Record<string, string> = {
  mayorista: "Mayorista",
  recluta: "Recluta",
  sync: "Sync Stock",
  taller: "Taller",
  preventa: "Preventa",
  crm: "CRM",
  envios: "Envíos",
  wms: "WMS",
  despacho: "Despacho",
  campo: "Campo",
  mantenimiento: "Mantenimiento",
  "catalogo-wa": "Catálogo WA",
};

export function getLoginDemoBundle(
  mode: string,
  surface: LoginDemoSurface = "admin"
): LoginDemoBundle | null {
  if (mode === "taxi" || mode === "delivery") {
    // Paneles multi-rol propios
    return null;
  }

  if (mode === "express") {
    return {
      mode,
      surface: "admin",
      hint: "Cuenta demo de Pocket POS. Usa los botones para rellenar e ingresar.",
      lines: publicLines([
        { label: "Correo", value: "demo.pocket@horytek.test" },
        { label: "Contraseña", value: "PocketDemo2026!" },
      ]),
      fill: {
        email: "demo.pocket@horytek.test",
        password: "PocketDemo2026!",
      },
      enterLabel: "Entrar con demo",
    };
  }

  if (mode === "ecommerce") {
    // Canónico del seed: src/scripts/seed_ecommerce_demo.js
    const ecommerceDemoUsuario = "ecom_demo";
    const ecommerceDemoPassword = "DemoEcom2026!";
    return {
      mode,
      surface: "admin",
      hint: "Cuenta demo de tienda. Usa los botones para rellenar e ingresar.",
      lines: publicLines([
        { label: "Usuario", value: ecommerceDemoUsuario },
        { label: "Contraseña", value: ecommerceDemoPassword },
      ]),
      fill: { usuario: ecommerceDemoUsuario, password: ecommerceDemoPassword },
      enterLabel: "Entrar con demo",
    };
  }

  if (surface === "portal") {
    switch (mode) {
      case "mayorista": {
        const c = getDemoPortalCreds("mayorista", "comprador")!;
        return {
          mode,
          surface: "portal",
          hint: "Portal B2B demo: entra como comprador con el slug demo.",
          lines: publicLines([
            { label: "Slug", value: DEMO_SLUG },
            { label: "Email", value: c.email! },
            { label: "Contraseña", value: c.password! },
          ]),
          fill: {
            slug: DEMO_SLUG,
            email: c.email,
            password: c.password,
          },
          openHref: "/b2b/demo",
          enterLabel: "Entrar al portal demo",
        };
      }
      case "recluta":
        return portalSlug(mode, "/recluta/demo", "Vacantes públicas de demostración.");
      case "academia":
        return {
          ...portalSlug(mode, "/academia/demo", "Portal alumno de demostración."),
          lines: publicLines([
            { label: "Código operador", value: DEMO_SLUG },
            { label: "Alumno", value: "alumno1@demo.local" },
            { label: "Contraseña", value: DEMO_PASSWORD },
          ]),
          fill: {
            slug: DEMO_SLUG,
            email: "alumno1@demo.local",
            password: DEMO_PASSWORD,
          },
        };
      case "agenda":
        return portalSlug(mode, "/agenda/demo", "Reserva pública con horarios de ejemplo.");
      case "flotas":
        return {
          mode,
          surface: "portal",
          hint: "Flotas se administra desde el panel del operador. Usa el acceso demo de admin.",
          lines: publicLines(getDemoPortalCreds("flotas", "admin")!.lines),
          fill: {
            slug: DEMO_SLUG,
            email: "admin@demo.local",
            password: DEMO_PASSWORD,
          },
          openHref: "/login?mode=flotas",
          enterLabel: "Ir a admin demo",
        };
      case "preventa":
        return portalSlug(mode, "/preventa/demo", "Campaña pública de demostración.");
      case "envios":
        return {
          mode,
          surface: "portal",
          hint: "Seguimiento público con un envío de ejemplo.",
          lines: [{ label: "Código", value: "DEMO01" }],
          fill: { codigo: "DEMO01", slug: "DEMO01" },
          openHref: "/tracking/DEMO01",
          enterLabel: "Abrir tracking demo",
        };
      case "catalogo-wa":
        return {
          mode,
          surface: "portal",
          hint: "Catálogo WhatsApp de demostración.",
          lines: [{ label: "Código", value: "demo" }],
          fill: { codigo: "1", slug: "1" },
          openHref: "/catalogo/1",
          enterLabel: "Abrir catálogo demo",
        };
      default:
        break;
    }
  }

  // Admin / default
  switch (mode) {
    case "erp":
      return erpAdmin(
        mode,
        "Cuenta de demostración del ERP. Usa los botones para rellenar e ingresar."
      );
    case "mayorista":
      return erpAdmin(
        mode,
        "Panel Mayorista: entra con platform.demo / Demo1234! (seed:platform-demo). Consola en /mayorista-admin."
      );
    case "recluta":
    case "sync":
    case "taller":
    case "preventa":
    case "crm":
    case "envios":
    case "wms":
    case "despacho":
    case "campo":
    case "mantenimiento":
    case "catalogo-wa":
      return erpAdmin(
        mode,
        `Panel ${PRODUCT_LABEL[mode] || mode}: entra con la cuenta demo del ERP y continúa al producto.`,
        mode === "taller"
          ? "/taller/planta"
          : mode === "campo"
            ? "/campo/vendedor"
            : mode === "despacho"
              ? "/despacho/chofer"
              : mode === "mantenimiento"
                ? "/mantenimiento/tecnico"
                : mode === "wms"
                  ? "/wms/operario"
                  : mode === "envios"
                    ? "/tracking/DEMO01"
                    : undefined
      );
    case "flotas":
      return productAdmin(mode, "flotas");
    case "academia":
      return productAdmin(mode, "academia");
    case "agenda":
      return productAdmin(mode, "agenda");
    default:
      return null;
  }
}

/** Atajos ops con PIN (para links en la tarjeta). */
export function demoOpsPinHint(productId: string) {
  const c = getDemoPortalCreds(
    productId,
    productId === "taller"
      ? "operador"
      : productId === "campo"
        ? "vendedor"
        : productId === "despacho"
          ? "chofer"
          : "tecnico"
  );
  if (!c) return "PIN de demostración";
  return `${c.nombre || "Ops"} · PIN listo en «Usar datos demo»`.trim();
}
