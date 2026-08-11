/**
 * Credenciales canónicas del seed platform (npm run seed:platform-demo).
 * Solo aplicar cuando slug === "demo".
 */

export const DEMO_SLUG = "demo";
export const DEMO_PASSWORD = "Demo1234!";
export const DEMO_PIN = "1234";

export type DemoPortalCreds = {
  productId: string;
  role: string;
  slug: string;
  email?: string;
  telefono?: string;
  password?: string;
  pin?: string;
  nombre?: string;
  /** Texto corto para la tarjeta de acceso demo */
  hint: string;
  /** Líneas visibles en la tarjeta (sin password en claro si se prefiere) */
  lines: { label: string; value: string }[];
};

const ADMIN: Omit<DemoPortalCreds, "productId" | "role" | "hint" | "lines"> = {
  slug: DEMO_SLUG,
  email: "admin@demo.local",
  password: DEMO_PASSWORD,
};

function adminCreds(productId: string, role = "admin"): DemoPortalCreds {
  return {
    productId,
    role,
    ...ADMIN,
    hint: "Operador de demostración listo para explorar.",
    lines: [
      { label: "Código", value: DEMO_SLUG },
      { label: "Email", value: "admin@demo.local" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  };
}

const CATALOG: Record<string, DemoPortalCreds> = {
  "taxi/admin": adminCreds("taxi", "admin"),
  "taxi/pasajero": {
    productId: "taxi",
    role: "pasajero",
    slug: DEMO_SLUG,
    telefono: "999111222",
    password: DEMO_PASSWORD,
    nombre: "Pasajero Demo",
    hint: "Pasajero con viajes de ejemplo.",
    lines: [
      { label: "Teléfono", value: "999111222" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "taxi/conductor": {
    productId: "taxi",
    role: "conductor",
    slug: DEMO_SLUG,
    telefono: "999333444",
    password: DEMO_PASSWORD,
    hint: "Conductor con viajes asignados.",
    lines: [
      { label: "Teléfono", value: "999333444" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "delivery/admin": adminCreds("delivery", "admin"),
  "delivery/cliente": {
    productId: "delivery",
    role: "cliente",
    slug: DEMO_SLUG,
    telefono: "999111222",
    password: DEMO_PASSWORD,
    nombre: "Cliente Demo",
    hint: "Cliente con pedidos de ejemplo.",
    lines: [
      { label: "Teléfono", value: "999111222" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "delivery/repartidor": {
    productId: "delivery",
    role: "repartidor",
    slug: DEMO_SLUG,
    telefono: "999333444",
    password: DEMO_PASSWORD,
    hint: "Repartidor con pedidos asignados.",
    lines: [
      { label: "Teléfono", value: "999333444" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "atelier/cliente": {
    productId: "atelier", role: "cliente", slug: DEMO_SLUG, email: "cliente.demo@demo.local", password: DEMO_PASSWORD,
    nombre: "Cliente Demo", hint: "Cliente con encargos de demostración.",
    lines: [{ label: "Email", value: "cliente.demo@demo.local" }, { label: "Contraseña", value: DEMO_PASSWORD }],
  },
  "atelier/creador": {
    productId: "atelier", role: "creador", slug: DEMO_SLUG, email: "luna.ink@demo.local", password: DEMO_PASSWORD,
    nombre: "Luna Ink", hint: "Creadora con portafolio y pedidos de demostración.",
    lines: [{ label: "Email", value: "luna.ink@demo.local" }, { label: "Contraseña", value: DEMO_PASSWORD }],
  },
  "atelier/admin": {
    productId: "atelier", role: "admin", slug: DEMO_SLUG, email: "atelier.admin@demo.local", password: DEMO_PASSWORD,
    nombre: "Admin Atelier", hint: "Administración del marketplace de demostración.",
    lines: [{ label: "Email", value: "atelier.admin@demo.local" }, { label: "Contraseña", value: DEMO_PASSWORD }],
  },
  "flotas/admin": adminCreds("flotas"),
  "academia/admin": adminCreds("academia"),
  "academia/alumno": {
    productId: "academia",
    role: "alumno",
    slug: DEMO_SLUG,
    email: "alumno1@demo.local",
    password: DEMO_PASSWORD,
    nombre: "Alumno Uno",
    hint: "Alumno inscrito en cursos demo.",
    lines: [
      { label: "Email", value: "alumno1@demo.local" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "agenda/admin": adminCreds("agenda"),
  "mayorista/comprador": {
    productId: "mayorista",
    role: "comprador",
    slug: DEMO_SLUG,
    email: "comprador@demo.local",
    password: DEMO_PASSWORD,
    hint: "Comprador B2B con catálogo y pedidos.",
    lines: [
      { label: "Email", value: "comprador@demo.local" },
      { label: "Contraseña", value: DEMO_PASSWORD },
    ],
  },
  "campo/vendedor": {
    productId: "campo",
    role: "vendedor",
    slug: DEMO_SLUG,
    pin: DEMO_PIN,
    nombre: "Vendedor Norte",
    hint: "PIN de vendedor de demostración.",
    lines: [
      { label: "Nombre", value: "Vendedor Norte" },
      { label: "PIN", value: DEMO_PIN },
    ],
  },
  "despacho/chofer": {
    productId: "despacho",
    role: "chofer",
    slug: DEMO_SLUG,
    pin: DEMO_PIN,
    nombre: "Chofer Demo 1",
    hint: "PIN de chofer de demostración.",
    lines: [
      { label: "Nombre", value: "Chofer Demo 1" },
      { label: "PIN", value: DEMO_PIN },
    ],
  },
  "mantenimiento/tecnico": {
    productId: "mantenimiento",
    role: "tecnico",
    slug: DEMO_SLUG,
    pin: DEMO_PIN,
    nombre: "Técnico Demo 1",
    hint: "PIN de técnico de demostración.",
    lines: [
      { label: "Nombre", value: "Técnico Demo 1" },
      { label: "PIN", value: DEMO_PIN },
    ],
  },
  "taller/operador": {
    productId: "taller",
    role: "operador",
    slug: DEMO_SLUG,
    pin: DEMO_PIN,
    nombre: "Operador Planta 1",
    hint: "PIN del operador de planta.",
    lines: [
      { label: "Nombre", value: "Operador Planta 1" },
      { label: "PIN", value: DEMO_PIN },
    ],
  },
};

export function demoCredsKey(productId: string, role: string) {
  return `${productId}/${role}`;
}

export function getDemoPortalCreds(productId: string, role: string): DemoPortalCreds | null {
  return CATALOG[demoCredsKey(productId, role)] ?? null;
}

/** Solo mostrar/aplicar demo cuando el operador es el seed. */
export function isDemoSlug(slug: string | undefined | null) {
  return (slug || "").trim().toLowerCase() === DEMO_SLUG;
}
