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

export type Mode = "standard" | "pocket" | "ecommerce";

export const NAV_LINKS = [
  { label: "Beneficios", href: "#beneficios" },
  { label: "Producto", href: "#producto" },
  { label: "Planes", href: "#planes" },
  { label: "Preguntas", href: "#preguntas" },
] as const;

/** Claims post-hero — cualitativos / producto, sin inventar volumen de clientes. */
export const TRUST_CLAIMS = [
  {
    label: "Facturación SUNAT",
    body: "Boletas y facturas electrónicas integradas al flujo de venta.",
  },
  {
    label: "Inventario unificado",
    body: "El mismo stock para tu local, internet y canales conectados.",
  },
  {
    label: "Multi-sucursal",
    body: "Opera varios locales con el mismo catálogo y permisos por usuario.",
  },
  {
    label: "Soporte en Perú",
    body: "Acompañamiento local para activar, migrar catálogo y resolver el día a día.",
  },
] as const;

export const BENEFIT_PILLARS = [
  {
    icon: Package,
    title: "Control de inventario en tiempo real",
    body: "Cada venta y cada ingreso actualizan el stock. Menos quiebres, menos Excel al cierre.",
  },
  {
    icon: ShoppingCart,
    title: "Punto de venta y ventas por internet",
    body: "Cobra en caja o desde tu tienda online con el mismo catálogo y precios.",
  },
  {
    icon: BarChart3,
    title: "Reportes al instante",
    body: "Ventas, márgenes e inventario listos para decidir sin armar reportes a mano.",
  },
  {
    icon: Truck,
    title: "Boleta y factura electrónica",
    body: "Emite comprobantes ante SUNAT desde la misma venta — sin sistema aparte.",
  },
] as const;

export const HERO_BADGES = ["Vende en tu local", "Vende online", "Recibe pagos", "Emite comprobantes"] as const;

export const HERO_VALUE_POINTS = [
  {
    icon: ShoppingCart,
    title: "Vende en tu local",
    body: "Cobra rápido y entrega boletas o facturas.",
  },
  {
    icon: Globe,
    title: "Vende por internet",
    body: "Tu propia tienda online lista para compartir.",
  },
  {
    icon: Package,
    title: "Controla todo",
    body: "Un solo inventario para cada canal de venta.",
  },
] as const;

// Evidencia inmediata — solo datos verificables del producto.
// No inventamos clientes ni métricas de marketing.
export const EVIDENCE_MODULES = [
  { icon: ShoppingCart, label: "Caja y ventas" },
  { icon: Globe, label: "Tienda online" },
  { icon: CreditCard, label: "Cobros por internet" },
  { icon: Package, label: "Control de stock" },
  { icon: Truck, label: "Boletas y facturas" },
  { icon: BarChart3, label: "Resultados del negocio" },
] as const;

export const ECOMMERCE_BENEFITS = [
  {
    icon: Globe,
    title: "Tu tienda abierta 24/7",
    body: "Tus clientes ven fotos, precios y productos disponibles sin escribirte por cada consulta.",
  },
  {
    icon: CreditCard,
    title: "El dinero llega a tu cuenta",
    body: "Configuramos Mercado Pago para que tus clientes paguen en el carrito y tú recibas el dinero directamente.",
  },
  {
    icon: Package,
    title: "No vendas lo que ya se agotó",
    body: "La venta online se descuenta del mismo stock que usas en tu tienda física.",
  },
  {
    icon: Rocket,
    title: "Te la entregamos lista",
    body: "Ordenamos tu catálogo, optimizamos tus fotos y dejamos el enlace preparado para compartir.",
  },
] as const;

export const BUSINESS_VALUE_POINTS = [
  {
    icon: Layers,
    title: "Un catálogo, todos tus canales",
    body: "Actualizas producto, precio y stock una vez. Tu equipo vende con la misma información en el local y en internet.",
  },
  {
    icon: ShieldCheck,
    title: "Menos errores al crecer",
    body: "Ventas y movimientos quedan registrados para que mantengas el control aunque sumes personas o locales.",
  },
  {
    icon: TrendingUp,
    title: "Decisiones con el negocio completo",
    body: "Revisa ventas, inventario y rentabilidad sin juntar reportes de sistemas separados al final del día.",
  },
] as const;

// Funcionalidades (8) — agrupadas en 3 categorías para progressive disclosure.
export const FEATURE_GROUPS = [
  {
    title: "Vender",
    blurb: "Todo lo que tu tienda necesita para atender al cliente sin fricciones.",
    items: [
      {
        icon: Globe,
        name: "Tu propia tienda online",
        body: "Un enlace con tu marca, carrito y cobro por internet para vender incluso cuando tu local está cerrado.",
      },
      {
        icon: ShoppingCart,
        name: "Caja rápida para tu local",
        body: "Efectivo, tarjeta, Yape/Plin. Descuentos y tickets en espera.",
      },
      {
        icon: Tags,
        name: "Catálogo listo para vender",
        body: "Productos, precios, fotos y variantes organizados para el mostrador y para internet.",
      },
    ],
  },
  {
    title: "Operar",
    blurb: "El inventario bajo control, de almacén a guía de remisión.",
    items: [
      {
        icon: Package,
        name: "El stock se actualiza con cada venta",
        body: "Controla desde un solo lugar lo que vendes en el local y lo que vendes por internet.",
      },
      {
        icon: Truck,
        name: "Despacha con la documentación correcta",
        body: "Prepara guías de remisión electrónicas desde la misma venta cuando necesites trasladar un pedido.",
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
        name: "Margen por prenda",
        body: "Cuánto te queda por cada polo vendido, no solo cuánto facturaste.",
      },
      {
        icon: Wallet,
        name: "Gastos y Estado de Resultados",
        body: "Contabilidad básica para conocer la utilidad real, no solo la facturación.",
      },
      {
        icon: ShieldCheck,
        name: "Tu información protegida",
        body: "Cada negocio trabaja con sus propios productos, ventas y clientes, separados de cualquier otra tienda.",
      },
    ],
  },
] as const;

// Flujo de uso — 5 pasos numerados. Cada paso es un momento real del día.
export const FLOW_STEPS = [
  {
    n: "01",
    title: "Ordenamos tu catálogo",
    body: "Cargamos productos, precios, fotos y variantes para que tu negocio empiece con información clara.",
  },
  {
    n: "02",
    title: "Preparamos tu tienda online",
    body: "Te entregamos un enlace fácil con catálogo, carrito y Mercado Pago configurado para tu negocio.",
  },
  {
    n: "03",
    title: "Vendes en cualquier canal",
    body: "Atiendes desde la caja en tu local y recibes compras online sin administrar dos catálogos distintos.",
  },
  {
    n: "04",
    title: "Horytek mantiene el control",
    body: "Cada operación actualiza inventario y deja trazabilidad para preparar pedidos y emitir comprobantes.",
  },
  {
    n: "05",
    title: "Tú decides con datos",
    body: "Cierras el día viendo ventas, stock y rentabilidad de tu negocio completo en un solo lugar.",
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
      "Caja y ventas",
      "Control de inventario",
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
      "Guías de remisión electrónicas",
      "Notas de Almacén",
      "Multi-almacén",
      "Accesos para tu equipo",
      "Hasta 10 usuarios",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Empresa",
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

// FAQ — objeciones típicas PYME Perú (estilo Bsale, respuestas Horytek).
export const FAQS = [
  {
    q: "¿Qué es Horytek?",
    a: "Horytek es un ERP + POS en la nube para PYMES del Perú: ventas, inventario, multi-sucursal y facturación electrónica ante SUNAT en un solo sistema. También ofrece productos especializados (taxi, delivery, WMS, CRM, etc.) según el job de tu operación.",
  },
  {
    q: "¿Emiten boleta y factura electrónica ante SUNAT?",
    a: "Sí. La facturación electrónica está integrada al flujo de venta: boletas, facturas y notas, con los procesos que tu negocio necesita para operar en regla.",
  },
  {
    q: "¿Sirve como punto de venta e inventario a la vez?",
    a: "Sí. Cobras en caja, controlas stock en tiempo real y, si vendes online, usas el mismo inventario para no ofrecer lo que ya se agotó en el local.",
  },
  {
    q: "¿Cobran comisión por cada venta?",
    a: "Horytek se cobra por plan/suscripción según el producto. El cobro con Mercado Pago en ecommerce sigue las reglas de MP; Horytek no añade una comisión extra por ítem vendido en el ERP.",
  },
  {
    q: "¿Necesito instalar software?",
    a: "No. Funciona en el navegador (PC, tablet o celular). Pocket POS es la versión ligera para cobrar en feria o en la calle.",
  },
  {
    q: "¿Hay soporte en Perú?",
    a: "Sí. Atención local por WhatsApp y canales de soporte para activación, migración de catálogo y acompañamiento operativo.",
  },
  {
    q: "¿Puedo migrar mis productos y clientes?",
    a: "Sí. Al activar tu cuenta te ayudamos a importar catálogo y clientes desde Excel o desde el sistema que uses hoy.",
  },
  {
    q: "¿Horytek también arma mi tienda online?",
    a: "Sí, como servicio adicional: tienda con tu marca, catálogo y cobro por internet. La cotización depende del tamaño del catálogo y de lo que necesite tu negocio.",
  },
] as const;

export const LEGAL_CONTACT = {
  email: "javierrojasq.0612@gmail.com",
  phone: "+51 961 797 720",
  whatsapp: "51961797720",
  location: "Chiclayo, Perú",
};

export const SALES_WHATSAPP_URL = `https://wa.me/${LEGAL_CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hola, quiero una demo de Horytek y conocer la propuesta de ecommerce para mi negocio.",
)}`;

// Footer — todos los enlaces van a algo real: las páginas satélite migradas,
// anclas de la landing, y las 2 páginas legales.
export const FOOTER_LINKS = [
  {
    title: "Productos",
    links: [
      { label: "Horytek ERP", href: "/" },
      { label: "Pocket POS", href: "/?mode=pocket" },
      { label: "Ecommerce", href: "/?mode=ecommerce" },
      { label: "Soluciones", href: "/soluciones" },
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
    "Horytek ayuda a emprendedores peruanos a vender en su local y por internet sin perder el control de sus productos, pagos y ventas.",
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
    title: "Busca y Vende",
    body: "Encuentra la prenda por nombre o marca, eliges talla y color, y cobras. Sin equipo extra.",
  },
  {
    title: "Boleta al toque",
    body: "Emites el comprobante electrónico desde el mismo celular, sin pasar por la computadora.",
  },
  {
    title: "Reportes al Instante",
    body: "Tus ganancias en tiempo real. Decisiones inteligentes basadas en datos, no en corazonadas.",
  },
] as const;

// Sin métricas inventadas: no hay service worker ni cola de sincronización, así
// que no se promete funcionar sin internet; y no existe SLA firmado, así que no
// se anuncia uno. Lo que queda es lo que el producto sí hace.
export const POCKET_CASE_STUDY = {
  eyebrow: "Rendimiento Instantáneo",
  title: "Velocidad para tu día a día.",
  body:
    "Tus clientes no esperan. Horytek Pocket carga al instante y te deja cobrar desde el celular, con el mismo inventario que ve la tienda.",
  stats: [
    { label: "Tiempo de carga", value: "<1s", chip: "En el navegador" },
    { label: "Inventario", value: "en vivo", chip: "Compartido con la tienda" },
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

export interface EcommercePlan {
  id: "starter" | "pro";
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  highlight?: boolean;
  ctaLabel: string;
}

/** Planes SaaS Ecommerce — sincronizados con src/config/ecommercePlans.config.js */
export const ECOMMERCE_PLANS: EcommercePlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 79,
    currency: "S/",
    description: "Tu tienda online lista para mostrar productos y recibir ventas.",
    features: [
      "Enlace público con el nombre de tu tienda",
      "Fotos optimizadas para cargar rápido",
      "Carrito con pagos directos a tu Mercado Pago",
      "Productos, clientes y ventas protegidos",
    ],
    ctaLabel: "Activar Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: 129,
    currency: "S/",
    description: "Para marcas que venden online todos los días y necesitan más margen de operación.",
    features: [
      "Todo lo de Starter",
      "Más espacio para tu catálogo",
      "Soporte prioritario",
      "Acceso enviado por correo al activar el plan",
    ],
    highlight: true,
    ctaLabel: "Activar Pro",
  },
];

export const ECOMMERCE_FAQS = [
  {
    q: "¿El dinero de las ventas llega a Horytek?",
    a: "No. Conectas tu propia cuenta de Mercado Pago y cada compra del carrito se deposita directamente allí.",
  },
  {
    q: "¿Mis productos se mezclan con otras tiendas?",
    a: "No. Los productos, clientes y ventas de tu negocio están separados de la información de cualquier otra tienda.",
  },
  {
    q: "¿Cómo recibo el acceso?",
    a: "Después de activar el plan recibes por correo tu usuario, contraseña y el enlace público de tu tienda.",
  },
];

export const ECOMMERCE_HERO = {
  badge: "Tienda online propia",
  title: "Tu tienda online, lista para compartir y cobrar.",
  body: "Publica tus productos, recibe compras desde el celular y cobra directamente en tu cuenta de Mercado Pago.",
  cta: "Ver planes de tienda online",
};

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
    a: "Sí. Nos pasas tu planilla como la tengas —por curva de tallas o una fila por prenda— y el equipo te deja el catálogo cargado antes de que empieces a vender.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Standard hero — formas de negocio de ropa
//
// Antes acá había sectores genéricos (Retail / Servicios / Distribución). El
// producto es un ERP de ropa: el modelo de datos son tallas, colores, curvas y
// origen de la prenda. Vender "gestión empresarial" nos ponía a competir de
// igual a igual contra cualquier ERP, escondiendo lo único difícil de copiar.
// Cada opción de acá es una tienda de ropa distinta, no un rubro distinto.
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
    id: "tienda",
    label: "Tienda de ropa",
    textClass: "text-emerald-600",
    chip: "bg-emerald-500",
    description:
      "Cada prenda con su talla y su color, no un bulto llamado «polo». Vendes desde el mostrador, el stock baja de la variante exacta y sabes cuánto ganaste por prenda al cerrar el día.",
  },
  {
    id: "mayorista",
    label: "Mayorista",
    textClass: "text-blue-600",
    chip: "bg-blue-500",
    description:
      "Compras y despachas por curva. Control de varios almacenes, notas de ingreso y salida, y guías de remisión SUNAT emitidas desde la misma venta.",
  },
  {
    id: "marca",
    label: "Marca propia",
    textClass: "text-amber-600",
    chip: "bg-amber-500",
    description:
      "Produces lo que vendes. El costo de una prenda propia se arma distinto que el de una comprada, y el sistema distingue las dos para que el margen sea el de verdad.",
  },
];

export const STANDARD_TRUST_INDICATORS = [
  { label: "Implementación rápida", dot: "bg-emerald-500" },
  { label: "Soporte humano", dot: "bg-blue-500" },
  { label: "Datos protegidos", dot: "bg-purple-500" },
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
    items: ["Pago mixto (efectivo, tarjeta, Yape/Plin)", "Tickets en espera y descuentos", "Búsqueda por nombre, marca o código"],
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
