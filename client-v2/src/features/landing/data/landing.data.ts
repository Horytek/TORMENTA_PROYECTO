// Datos de la landing.
// Una sola fuente de verdad para que la página sea composición pura.

import type { ComponentType } from "react";
import {
  Tags,
  ShoppingCart,
  Package,
  Truck,
  ClipboardList,
  ShieldCheck,
  Wallet,
  BarChart3,
  Boxes,
  ScanLine,
  ShieldAlert,
  CreditCard,
  Ban,
  Scale,
  Globe,
  Database,
  Eye,
  Lock,
  Share2,
  Cookie,
  Layers,
  Cloud,
  Wrench,
  Sparkles,
  Rocket,
  Users,
  Building2,
  ShoppingBag,
  Pill,
  Import,
  HeartHandshake,
  Zap,
  Target,
  TrendingUp,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  type LucideProps,
} from "lucide-react";

export type Icon = ComponentType<LucideProps>;

// Tonalidades de la paleta de marca (mismo vocabulario en LoginPage y hang-tag).
export const TAG_COLORS = ["#243645", "#3E6B89", "#0E7C7B", "#C9A227", "#B23A48", "#D6D3CD"];

// ────────────────────────────────────────────────────────────────────────────
// Modo (Standard / Pocket)
// ────────────────────────────────────────────────────────────────────────────

export type Mode = "standard" | "pocket";

export const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Funciones", href: "#funciones" },
  { label: "Flujo", href: "#flujo" },
  { label: "Planes", href: "#planes" },
  { label: "Preguntas", href: "#preguntas" },
] as const;

// Hero: una sola pieza, sin sector toggle (v2 es un solo producto).
export const HERO_BADGES = ["Inventario", "POS", "SUNAT", "Kárdex"] as const;

export const HERO_STATS = [
  { label: "Tickets por turno", value: "+200" },
  { label: "Latencia de búsqueda", value: "<60ms" },
  { label: "Almacenes por empresa", value: "ilimitados" },
] as const;

// Evidencia inmediata — solo datos verificables del producto.
// No inventamos clientes ni métricas de marketing.
export const EVIDENCE_MODULES = [
  { icon: Boxes, label: "Catálogo" },
  { icon: ShoppingCart, label: "POS" },
  { icon: Package, label: "Kárdex" },
  { icon: Truck, label: "Guías SUNAT" },
  { icon: ClipboardList, label: "Notas de almacén" },
  { icon: Wallet, label: "Contabilidad" },
] as const;

// Funcionalidades (8) — agrupadas en 3 categorías para progressive disclosure.
export const FEATURE_GROUPS = [
  {
    title: "Vender",
    blurb: "Todo lo que tu tienda necesita para atender al cliente sin fricciones.",
    items: [
      {
        icon: Tags,
        name: "Catálogo con tonalidades y tallas",
        body: "Variantes por color, talla y SKU. Búsqueda instantánea del inventario.",
      },
      {
        icon: ShoppingCart,
        name: "Punto de Venta con pago mixto",
        body: "Efectivo, tarjeta, Yape/Plin. Descuentos y tickets en espera.",
      },
      {
        icon: ScanLine,
        name: "Lector de códigos integrado",
        body: "Escaneo por cámara o lector USB. Sin hardware adicional.",
      },
    ],
  },
  {
    title: "Operar",
    blurb: "El inventario bajo control, de almacén a guía de remisión.",
    items: [
      {
        icon: Package,
        name: "Kárdex en tiempo real",
        body: "Stock por almacén, histórico de movimientos y solicitudes entre sucursales.",
      },
      {
        icon: Truck,
        name: "Guías de Remisión SUNAT",
        body: "Emisión integrada con transportistas y destinatarios desde el flujo de venta.",
      },
      {
        icon: ClipboardList,
        name: "Notas de Almacén",
        body: "Ingresos, salidas y transferencias con trazabilidad de extremo a extremo.",
      },
    ],
  },
  {
    title: "Decidir",
    blurb: "Visibilidad real del negocio — sin hojas de cálculo a las 11pm.",
    items: [
      {
        icon: BarChart3,
        name: "Dashboard en vivo",
        body: "Ventas, stock crítico, rotación por sucursal y rendimiento por vendedor.",
      },
      {
        icon: Wallet,
        name: "Gastos y Estado de Resultados",
        body: "Contabilidad básica para conocer la utilidad real, no solo la facturación.",
      },
      {
        icon: ShieldCheck,
        name: "Roles y permisos granulares",
        body: "Cada usuario solo ve y hace lo que su rol le autoriza. Auditoría completa.",
      },
    ],
  },
] as const;

// Flujo de uso — 5 pasos numerados. Cada paso es un momento real del día.
export const FLOW_STEPS = [
  {
    n: "01",
    title: "Cargas tu catálogo",
    body: "Importas productos, marcas, categorías y variantes desde Excel o los creas desde el POS.",
  },
  {
    n: "02",
    title: "Tu vendedor abre caja",
    body: "Elige almacén, escanea o busca productos, cobra con pago mixto y emite boleta o factura.",
  },
  {
    n: "03",
    title: "El stock se mueve solo",
    body: "Cada venta descuenta kárdex. Las transferencias entre almacenes quedan registradas.",
  },
  {
    n: "04",
    title: "Despachas con guía SUNAT",
    body: "Cuando el cliente se lleva el pedido, la guía de remisión se emite desde la misma venta.",
  },
  {
    n: "05",
    title: "Cierras el día con números",
    body: "El dashboard te dice qué vendió cada tienda, qué se acabó y cuál fue la utilidad.",
  },
] as const;

// Planes — precios reales del backend (`src/config/plans.config.js`).
// Mantener sincronizado: si cambia el backend, cambiar acá.
export interface Plan {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    monthly: 85,
    yearly: 850,
    description: "Para tiendas que están empezando a digitalizarse.",
    features: [
      "Catálogo de productos",
      "Punto de Venta (POS)",
      "Inventario / Kárdex",
      "1 almacén",
      "Hasta 5 usuarios",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 135,
    yearly: 1350,
    description: "Para tiendas con varias sucursales o que ya facturan.",
    features: [
      "Todo lo del plan Básico",
      "Guías de Remisión SUNAT",
      "Notas de Almacén",
      "Multi-almacén",
      "Roles y permisos dinámicos",
      "Hasta 10 usuarios",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 240,
    yearly: 2400,
    description: "Para cadenas y operaciones con contabilidad propia.",
    features: [
      "Todo lo del plan Pro",
      "Contabilidad (gastos + Estado de Resultados)",
      "Sucursales y usuarios ilimitados",
      "Soporte preferencial",
    ],
  },
];

// FAQ — solo preguntas que un店主 real se haría.
export const FAQS = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. Horytek funciona en el navegador desde cualquier computador con conexión. También tienes Pocket POS, una app ligera para celulares sin internet estable.",
  },
  {
    q: "¿Emiten boletas y facturas electrónicas?",
    a: "Sí. La facturación electrónica ante SUNAT está integrada en el flujo de venta. Soportamos boletas, facturas y notas, con comunicación de baja automática.",
  },
  {
    q: "¿Puedo migrar mis productos y clientes?",
    a: "Sí. Al activar tu cuenta, el equipo de soporte te ayuda a importar tu catálogo y base de clientes desde Excel o desde el sistema que uses hoy.",
  },
  {
    q: "¿Puedo cambiar de plan más adelante?",
    a: "Sí, desde tu cuenta en cualquier momento. No pierdes información ni historial al subir o bajar de plan.",
  },
  {
    q: "¿Los precios incluyen IGV?",
    a: "Los precios mostrados son referenciales antes de impuestos. Se factura conforme a la normativa peruana vigente.",
  },
] as const;

export const LEGAL_CONTACT = {
  email: "javierrojasq.0612@gmail.com",
  phone: "+51 961 797 720",
  whatsapp: "51961797720",
  location: "Chiclayo, Perú",
};

// Footer — todos los enlaces van a algo real: las páginas satélite migradas,
// anclas de la landing, y las 2 páginas legales.
export const FOOTER_LINKS = [
  {
    title: "Productos",
    links: [
      { label: "Horytek ERP", href: "/" },
      { label: "Pocket POS", href: "/?mode=pocket" },
      { label: "Servicios", href: "/servicios" },
      { label: "Sobre nosotros", href: "/sobre-nosotros" },
    ],
  },
  {
    title: "Enlaces importantes",
    links: [
      { label: "Equipo", href: "/equipo" },
      { label: "Actualizaciones", href: "/actualizaciones" },
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Política de privacidad", href: "/privacidad" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Contáctanos", href: "/contactanos" },
      { label: "WhatsApp", href: `https://wa.me/${LEGAL_CONTACT.whatsapp}` },
    ],
  },
] as const;

export const FOOTER_BRAND = {
  name: "Horytek",
  description:
    "Tecnología ERP que transforma la gestión empresarial. Diseñada para tiendas que buscan control, velocidad y crecimiento sin límites.",
};

export const FOOTER_SOCIALS = [
  { label: "Facebook", href: "https://facebook.com/horytek", icon: "facebook" },
  { label: "Twitter", href: "https://twitter.com/horytek", icon: "twitter" },
  { label: "Instagram", href: "https://instagram.com/horytek", icon: "instagram" },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// Páginas legales (Términos y Política de privacidad) — contenido real
// migrado de client/src/components/landing/{TerminosResponsabilidad,PrivacyContent}.jsx.
// ────────────────────────────────────────────────────────────────────────────

export interface LegalSection {
  icon: Icon;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    icon: ShieldAlert,
    title: "Limitación de responsabilidad",
    paragraphs: [
      "En la máxima medida permitida por la ley, Horytek no será responsable por daños indirectos, incidentales, especiales o consecuentes que puedan surgir del uso de nuestros servicios.",
      "Nuestra responsabilidad total estará limitada al monto pagado por el cliente por los servicios en los últimos 12 meses.",
    ],
  },
  {
    icon: CreditCard,
    title: "Facturación y pagos",
    paragraphs: [
      "Los términos de pago se establecen en el contrato específico de suscripción. Los pagos deben realizarse según los plazos acordados.",
      "El incumplimiento puede resultar en la suspensión temporal de los servicios.",
    ],
  },
  {
    icon: Ban,
    title: "Política de reembolso",
    paragraphs: [
      "Para suscripciones mensuales, puedes cancelar en cualquier momento y el acceso continuará hasta el final del ciclo de facturación. No ofrecemos reembolsos por meses parciales o servicios ya prestados, salvo errores técnicos atribuibles a nuestra plataforma.",
    ],
  },
  {
    icon: Scale,
    title: "Terminación del servicio",
    paragraphs: [
      "Cualquiera de las partes puede terminar el contrato de acuerdo con los términos específicos del acuerdo comercial.",
      "Horytek proporcionará un período razonable para la migración de datos en caso de terminación.",
    ],
  },
  {
    icon: Globe,
    title: "Ley aplicable y jurisdicción",
    paragraphs: [
      "Estos términos se rigen por las leyes de la República del Perú. Cualquier disputa será resuelta en los tribunales competentes de Lima, Perú.",
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    icon: Database,
    title: "Información que recopilamos",
    bullets: [
      "Registro: nombre, email, teléfono, empresa y cargo.",
      "Empresarial: datos financieros, inventarios y transacciones.",
      "Técnica: dirección IP, navegador y uso del sistema.",
    ],
  },
  {
    icon: Eye,
    title: "Uso de la información",
    paragraphs: [
      "Utilizamos tus datos para proporcionar el servicio ERP, procesar transacciones, cumplir normativas SUNAT, mejorar la seguridad y brindar soporte técnico dedicado.",
    ],
  },
  {
    icon: Lock,
    title: "Protección de datos",
    bullets: [
      "Encriptación en tránsito y en reposo.",
      "Acceso por roles y permisos granulares.",
      "Backups redundantes.",
    ],
  },
  {
    icon: Share2,
    title: "Compartir información",
    paragraphs: [
      "No vendemos datos. Solo compartimos información con proveedores de servicio (hosting) o por requerimiento legal (SUNAT/autoridades).",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies",
    paragraphs: [
      "Usamos cookies esenciales para el funcionamiento del sistema, preferencias de usuario y analítica anonimizada para mejorar la experiencia.",
    ],
  },
  {
    icon: Globe,
    title: "Transferencias internacionales",
    paragraphs: [
      "Tus datos se procesan principalmente en Perú. Cualquier transferencia internacional cumple con los más altos estándares de protección.",
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Pocket mode
// ────────────────────────────────────────────────────────────────────────────

export const POCKET_HERO = {
  badge: "Sistema compacto",
  titleLead: "Tu negocio en",
  titleAccent: "tu bolsillo.",
  description:
    "Sistema compacto para emprendedores. Vende, controla y crece con la agilidad que tu negocio necesita.",
  trustIndicators: ["Implementación rápida", "Soporte humano", "Auditoría total"],
} as const;

export const POCKET_BLUEPRINT_CARDS = [
  {
    title: "Escanea y Vende",
    body: "Convierte tu cámara en un lector de código de barras profesional. Sin hardware extra.",
  },
  {
    title: "Control de Caja",
    body: "Arqueos automáticos y precisos. Cierra tu turno con la seguridad de que cada centavo cuadra.",
  },
  {
    title: "Reportes al Instante",
    body: "Tus ganancias en tiempo real. Decisiones inteligentes basadas en datos, no en corazonadas.",
  },
] as const;

export const POCKET_CASE_STUDY = {
  eyebrow: "Rendimiento Instantáneo",
  title: "Velocidad para tu día a día.",
  body:
    "Tus clientes no esperan. Horytek Pocket carga al instante, funciona aunque falle tu internet y asegura que nunca pierdas una venta.",
  stats: [
    { label: "Tiempo de carga", value: "<1s", chip: "Offline-first" },
    { label: "Pérdida de ventas", value: "0%", chip: "SLA Pocket" },
  ],
};

export interface PocketPlan {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  features: string[];
  highlight?: boolean;
  ctaLabel: string;
}

export const POCKET_PLANS: PocketPlan[] = [
  {
    id: "diario",
    name: "Diario",
    price: 5,
    unit: "día",
    description: "Perfecto para ferias o ventas eventuales.",
    features: ["Acceso total por 24 horas", "Ventas ilimitadas"],
    ctaLabel: "Elegir Diario",
  },
  {
    id: "semanal",
    name: "Semanal",
    price: 10,
    unit: "semana",
    description: "Ideal para campañas cortas o temporadas.",
    features: ["Acceso por 7 días", "Gestión de inventario"],
    ctaLabel: "Elegir Semanal",
  },
  {
    id: "express",
    name: "Express Mensual",
    price: 30,
    unit: "mes",
    description: "Tu negocio operando todo el mes sin preocupaciones.",
    features: [
      "Todo incluido por 30 días",
      "Sin contratos forzosos",
      "Actualizaciones gratuitas",
    ],
    highlight: true,
    ctaLabel: "Obtener Express",
  },
];

export const POCKET_FAQS = [
  {
    q: "¿Necesito computadora?",
    a: "No. Horytek Pocket funciona perfectamente en tu celular o tablet. Tú eliges dónde vender.",
  },
  {
    q: "¿Puedo cancelar cuando sea?",
    a: "Totalmente. El Plan Diario y Semanal no requieren contrato. El Mensual puedes cancelarlo cuando quieras.",
  },
  {
    q: "¿Soporte técnico incluido?",
    a: "Sí. Incluso en los planes Pocket, tienes acceso a nuestro centro de ayuda y soporte vía WhatsApp.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Standard (original) FAQ cards — formato grid de 3 columnas (no accordion)
// ────────────────────────────────────────────────────────────────────────────

export const STANDARD_FAQ_CARDS = [
  {
    q: "¿Incluye implementación?",
    a: "Sí, todos los planes incluyen onboarding guiado y carga inicial de datos para que empieces a vender desde el día 1.",
  },
  {
    q: "¿Puedo cancelar cuando sea?",
    a: "Totalmente. No creemos en los contratos forzosos. Si no te sirve, puedes cancelar tu suscripción mensual en cualquier momento.",
  },
  {
    q: "¿Migración desde Excel?",
    a: "Contamos con plantillas de importación masiva. Sube tu inventario y clientes en segundos.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Standard hero — sectores (Retail / Servicios / Distribución)
// ────────────────────────────────────────────────────────────────────────────

export interface Sector {
  id: string;
  label: string;
  description: string;
  /** Color sólido (clase Tailwind) para teñir la palabra de sector en el heading. */
  textClass: string;
  chip: string; // clase color del dot
}

export const SECTORS: Sector[] = [
  {
    id: "retail",
    label: "Retail",
    textClass: "text-emerald-600",
    chip: "bg-emerald-500",
    description:
      "Gestiona tus puntos de venta, inventario y caja en tiempo real. Todo lo que tu tienda necesita para vender más sin perder el control.",
  },
  {
    id: "services",
    label: "Servicios",
    textClass: "text-blue-600",
    chip: "bg-blue-500",
    description:
      "Administra proyectos, cotizaciones y facturación sin complicaciones. La herramienta ideal para consultoras y agencias que buscan orden.",
  },
  {
    id: "distribution",
    label: "Distribución",
    textClass: "text-amber-600",
    chip: "bg-amber-500",
    description:
      "Optimiza tu logística, controla múltiples almacenes y agiliza tus despachos. Potencia tu cadena de suministro con datos precisos.",
  },
];

export const STANDARD_TRUST_INDICATORS = [
  { label: "Implementación rápida", dot: "bg-emerald-500" },
  { label: "Soporte humano", dot: "bg-blue-500" },
  { label: "Auditoría total", dot: "bg-purple-500" },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// Blueprint — roles y permisos (matriz interactiva)
// ────────────────────────────────────────────────────────────────────────────

export const ROLES = [
  {
    id: "sales",
    label: "Vendedor",
    description: "Acceso limitado a punto de venta y catálogo.",
    icon: "user",
  },
  {
    id: "warehouse",
    label: "Almacenero",
    description: "Control de stock, ingresos y kardex.",
    icon: "shield",
  },
  {
    id: "admin",
    label: "Admin Global",
    description: "Control total del sistema y usuarios.",
    icon: "lock",
  },
] as const;

export const PERMISSIONS = [
  { id: "pos", label: "Punto de Venta" },
  { id: "inventory", label: "Inventario Global" },
  { id: "kardex", label: "Kardex Valorizado" },
  { id: "clients", label: "Gestión de Clientes" },
  { id: "audit", label: "Auditoría" },
] as const;

export type Action = "create" | "read" | "update" | "delete" | "export";

export const ACCESS_MATRIX: Record<string, Record<string, Action[]>> = {
  sales: {
    pos: ["create", "read"],
    inventory: ["read"],
    kardex: [],
    clients: ["create", "read"],
    audit: [],
  },
  warehouse: {
    pos: [],
    inventory: ["create", "read", "update"],
    kardex: ["read", "export"],
    clients: [],
    audit: ["read"],
  },
  admin: {
    pos: ["create", "read", "delete"],
    inventory: ["create", "read", "update", "delete"],
    kardex: ["create", "read", "export"],
    clients: ["create", "read", "update", "delete"],
    audit: ["read"],
  },
};

export const ACTION_STYLES: Record<
  Action,
  { color: string; bg: string; label: string }
> = {
  create: { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Crear" },
  read: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Ver" },
  update: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Editar" },
  delete: { color: "text-rose-500", bg: "bg-rose-500/10", label: "Eliminar" },
  export: { color: "text-purple-500", bg: "bg-purple-500/10", label: "Exportar" },
};

// Live audit log: acciones simuladas para el demo de permisos.
export const AUDIT_ACTIONS = [
  "ACCESS_CHECK",
  "READ_DATA",
  "UPDATE_CACHE",
  "SYNC_NODE",
  "VERIFY_TOKEN",
];

// ────────────────────────────────────────────────────────────────────────────
// Case study — stack técnico (standard)
// ────────────────────────────────────────────────────────────────────────────

export const TECH_STACK = [
  {
    title: "Base de Datos Distribuida",
    subtitle: "Node.js + MySQL Cluster",
    status: "Active",
    tone: "blue",
  },
  {
    title: "Motor de Sincronización",
    subtitle: "WebSockets (Socket.io)",
    status: "Live",
    tone: "neutral",
  },
  {
    title: "Interfaz Reactiva",
    subtitle: "React + Vite + Tailwind",
    status: "Optimized",
    tone: "purple",
  },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// /servicios — contenido real migrado de client/src/pages/Landing/ServiciosPage.jsx,
// reescrito para reflejar los módulos que Horytek realmente tiene hoy (no los del
// ERP genérico original: nada de "gestión de variantes" ni módulos que ya no existen).
// ────────────────────────────────────────────────────────────────────────────

export const SERVICIOS_MODULES = [
  {
    icon: ShoppingCart,
    title: "Punto de Venta",
    items: ["Pago mixto (efectivo, tarjeta, Yape/Plin)", "Tickets en espera y descuentos", "Lector de código por cámara o USB"],
  },
  {
    icon: Package,
    title: "Inventario y Kárdex",
    items: ["Stock en tiempo real por almacén", "Notas de ingreso, salida y traslado", "Trazabilidad completa de movimientos"],
  },
  {
    icon: Truck,
    title: "Guías de Remisión SUNAT",
    items: ["Emisión integrada desde la venta", "Transportistas y destinatarios", "Comunicación de baja automática"],
  },
  {
    icon: Wallet,
    title: "Contabilidad",
    items: ["Registro de gastos por categoría", "Estado de Resultados (P&L)", "Utilidad real, no solo facturación"],
  },
  {
    icon: Boxes,
    title: "Clientes y Proveedores",
    items: ["Directorio centralizado", "Historial de compras y ventas", "Datos para facturación electrónica"],
  },
  {
    icon: ShieldCheck,
    title: "Roles y Reportes",
    items: ["Permisos granulares por módulo", "Dashboard con ventas y stock crítico", "Auditoría de acciones por usuario"],
  },
];

export const SERVICIOS_BENEFITS = [
  { icon: Layers, title: "Todo integrado", body: "Ventas, inventario y contabilidad comparten la misma base de datos — sin exportar/importar entre sistemas." },
  { icon: ShieldCheck, title: "Cumplimiento SUNAT", body: "Boletas, facturas y guías de remisión electrónicas dentro del flujo normal de venta." },
  { icon: Boxes, title: "Multi-almacén", body: "Controla stock y traslados entre tantos almacenes y sucursales como tu operación necesite." },
  { icon: Cloud, title: "100% en la nube", body: "Accede desde cualquier computador con navegador. Sin instalaciones ni servidores propios." },
  { icon: HeartHandshake, title: "Soporte directo", body: "Canal de WhatsApp y correo con el equipo que construye el producto, no un call center." },
  { icon: Wrench, title: "Configurable por rol", body: "Cada usuario ve y hace solo lo que su rol permite — vendedor, almacenero o administrador." },
  { icon: TrendingUp, title: "Crece con tu negocio", body: "De una tienda a varias sucursales sin cambiar de sistema ni perder historial." },
];

export const SERVICIOS_ADICIONALES = [
  { icon: Rocket, title: "Implementación guiada", body: "Onboarding acompañado para cargar tu catálogo y configurar almacenes desde el primer día." },
  { icon: Database, title: "Migración de datos", body: "Plantillas de importación masiva para subir tu inventario y clientes desde Excel." },
  { icon: Cloud, title: "Hosting incluido", body: "El servicio corre en infraestructura administrada — no necesitas contratar servidores." },
  { icon: MessageCircle, title: "Soporte técnico", body: "Canal directo por WhatsApp y correo para resolver incidencias del día a día." },
];

export const SERVICIOS_SECTORES = [
  { icon: ShoppingBag, label: "Retail y moda" },
  { icon: Truck, label: "Distribución" },
  { icon: Boxes, label: "Manufactura ligera" },
  { icon: Building2, label: "Servicios" },
  { icon: Pill, label: "Farmacia" },
  { icon: Import, label: "Importación" },
];

// ────────────────────────────────────────────────────────────────────────────
// /sobre-nosotros — migrado de AboutPage.jsx. Se quitaron métricas inventadas
// ("+50 tiendas activas", "99.9% uptime") que no son verificables para un
// producto en etapa MVP; se mantienen solo datos contables reales (nº de módulos).
// ────────────────────────────────────────────────────────────────────────────

export const ABOUT_MISSION = {
  title: "Nuestra empresa",
  body: [
    "Horytek nace de una idea simple: las tiendas y negocios peruanos necesitan un sistema de gestión que entienda su realidad — desde la facturación SUNAT hasta el control de un almacén con varias sucursales — sin la complejidad de un ERP corporativo genérico.",
    "Construimos cada módulo pensando en el flujo real de un negocio: abrir caja, vender, mover inventario, cerrar el día con números claros.",
  ],
  quote: "Control total, sin fricción — esa es la promesa detrás de cada módulo que construimos.",
};

export const ABOUT_VALUE_TILES = [
  { icon: ShieldCheck, title: "Control total", body: "Visibilidad completa de ventas, stock y utilidad en un solo lugar." },
  { icon: Lock, title: "Seguridad real", body: "Contraseñas cifradas, roles granulares y auditoría de cada acción." },
  { icon: TrendingUp, title: "Evolución constante", body: "El producto se actualiza con cada ciclo de trabajo — ver Actualizaciones." },
];

export const ABOUT_WHAT_IS = [
  { icon: Wallet, title: "Ventas y finanzas", body: "POS con pago mixto y Estado de Resultados en el mismo sistema." },
  { icon: Package, title: "Inventario y Kárdex", body: "Stock por almacén y trazabilidad de cada movimiento." },
  { icon: BarChart3, title: "Analítica", body: "Dashboard en vivo con ventas, stock crítico y rendimiento por sucursal." },
  { icon: Users, title: "Gestión de equipos", body: "Roles y permisos para que cada usuario vea solo lo que le corresponde." },
];

export const ABOUT_VALUES = [
  { icon: Sparkles, title: "Innovación", body: "Iteramos rápido sobre lo que los negocios reales nos piden, no sobre lo que creemos que necesitan." },
  { icon: HeartHandshake, title: "Enfoque al cliente", body: "Soporte directo con el equipo que construye el producto." },
  { icon: ShieldCheck, title: "Seguridad", body: "Los datos de tu negocio se tratan con el mismo cuidado que los nuestros." },
  { icon: TrendingUp, title: "Crecimiento", body: "Diseñamos cada módulo para que escale contigo, no para que lo reemplaces." },
];

export const ABOUT_STATS = [
  { value: "8", label: "Módulos integrados", icon: Layers },
  { value: "100%", label: "En la nube", icon: Cloud },
  { value: "1", label: "Sistema para todo el negocio", icon: Target },
];

// ────────────────────────────────────────────────────────────────────────────
// /equipo — roster real migrado de client/src/pages/Landing/EquipoPage.jsx
// (ya es información pública en el sitio en producción).
// ────────────────────────────────────────────────────────────────────────────

export interface TeamMember {
  name: string;
  role: string;
  body: string;
}

export const TEAM_LEADERS: TeamMember[] = [
  { name: "Davist Bustamante", role: "CEO", body: "Dirección general y visión de producto." },
  { name: "Marco Rioja", role: "CTO", body: "Arquitectura técnica y decisiones de plataforma." },
  { name: "Andree Requejo", role: "Director de TI", body: "Infraestructura, despliegues y seguridad." },
  { name: "Ángel Montenegro", role: "Director de Operaciones", body: "Procesos internos y soporte a clientes." },
  { name: "Fernando Fernandez", role: "Director de Producto", body: "Roadmap y priorización de funcionalidades." },
  { name: "Javier Rojas", role: "Gerente General", body: "Relación comercial y alianzas estratégicas." },
];

export const TEAM_SPECIALISTS: TeamMember[] = [
  { name: "Adrian Portocarrero", role: "Desarrollo", body: "Backend y arquitectura de datos." },
  { name: "Julio Castañeda", role: "Desarrollo", body: "Frontend y experiencia de usuario." },
  { name: "Armando Infante", role: "Desarrollo", body: "Integraciones y facturación electrónica." },
  { name: "Juan Forero", role: "QA", body: "Pruebas y control de calidad." },
  { name: "Johan Torres", role: "Soporte", body: "Atención y resolución de incidencias." },
  { name: "Luis Aguilar", role: "Soporte", body: "Onboarding de nuevos clientes." },
  { name: "Juana Izique", role: "Administración", body: "Operaciones y gestión interna." },
];

// ────────────────────────────────────────────────────────────────────────────
// /actualizaciones — a diferencia del original (que mostraba un roadmap ficticio
// con features inexistentes como "Chatbot IA" o "Facturación Offline"), esta versión
// usa el historial real de PLAN_MEJORAS_CLIENT_V2.md: lo que de verdad se construyó.
// ────────────────────────────────────────────────────────────────────────────

export const CURRENT_VERSION = {
  label: "Versión actual",
  title: "Horytek v2",
  features: [
    "Permisos dinámicos por rol y módulo",
    "Contabilidad (gastos + Estado de Resultados)",
    "POS con tickets en espera y descuentos",
    "Dashboard con KPIs en tiempo real",
  ],
};

export const UPCOMING_UPDATES = [
  { icon: CreditCard, title: "Checkout de planes en línea", body: "Registro y pago de suscripción sin depender de un administrador." },
  { icon: BarChart3, title: "Más reportes de rendimiento", body: "Comparativas por sucursal y por vendedor en el dashboard." },
  { icon: Zap, title: "Mejoras de velocidad", body: "Búsqueda de catálogo e historial de ventas más rápidos en catálogos grandes." },
];

// ────────────────────────────────────────────────────────────────────────────
// /contactanos
// ────────────────────────────────────────────────────────────────────────────

export const CONTACT_INQUIRY_TYPES = [
  "Consulta general",
  "Ventas y precios",
  "Soporte técnico",
  "Facturación",
  "Alianzas comerciales",
  "Prensa",
  "Otro",
] as const;

export const CONTACT_METHODS = [
  { icon: Mail, label: "Email corporativo", value: LEGAL_CONTACT.email, href: `mailto:${LEGAL_CONTACT.email}` },
  { icon: Phone, label: "Línea directa", value: LEGAL_CONTACT.phone, href: `tel:${LEGAL_CONTACT.phone.replace(/\s/g, "")}` },
  { icon: MessageCircle, label: "WhatsApp", value: "Chat directo", href: `https://wa.me/${LEGAL_CONTACT.whatsapp}` },
  { icon: MapPin, label: "Sede", value: LEGAL_CONTACT.location, href: undefined },
];
