export function buildWaConsultaMessage(opts: {
  negocio: string;
  producto?: string;
  sku?: string;
  attrs?: Record<string, string>;
  sucursal?: string;
  url?: string;
  tipo?: "disponibilidad" | "variante" | "otra_sucursal" | "confirmar" | "carrito" | "general";
}) {
  const { negocio, producto, sku, attrs, sucursal, url, tipo = "disponibilidad" } = opts;
  const lines: string[] = [`Hola ${negocio},`];

  switch (tipo) {
    case "variante":
      lines.push("Quiero consultar por esta variante:");
      break;
    case "otra_sucursal":
      lines.push("¿Tienen este producto en otra sucursal?");
      break;
    case "confirmar":
      lines.push("Quiero confirmar este producto antes de comprar:");
      break;
    case "carrito":
      lines.push("Quiero confirmar mi pedido antes de pagar:");
      break;
    case "general":
      lines.push("Tengo una consulta:");
      break;
    default:
      lines.push("Consultar disponibilidad:");
  }

  if (producto) lines.push(`• Producto: ${producto}`);
  if (sku) lines.push(`• SKU: ${sku}`);
  if (attrs && Object.keys(attrs).length) {
    lines.push(`• Variante: ${Object.values(attrs).join(" / ")}`);
  }
  if (sucursal) lines.push(`• Sucursal: ${sucursal}`);
  if (url) lines.push(`• Link: ${url}`);

  return lines.join("\n");
}

export function waLink(telefono: string | null | undefined, text: string) {
  if (!telefono) return null;
  const digits = String(telefono).replace(/\D/g, "");
  const phone = digits.length === 9 ? `51${digits}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
