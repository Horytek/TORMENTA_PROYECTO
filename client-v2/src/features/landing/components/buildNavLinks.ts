import type { LandingProductModule } from "../modules/landingModule.types";

export type NavLinkItem = { label: string; href: string };

/** Links de ancla según producto activo (legacy vs experience). */
export function buildNavLinks(
  productId: string,
  productName: string,
  module: LandingProductModule
): NavLinkItem[] {
  const isLegacy =
    productId === "erp" || productId === "pocket" || productId === "ecommerce";

  if (isLegacy) {
    if (productId === "erp") {
      return [
        { label: productName, href: "#beneficios" },
        { label: "Beneficios", href: "#beneficios" },
        { label: "Producto", href: "#producto" },
        { label: "Planes", href: "#planes" },
        { label: "Preguntas", href: "#preguntas" },
      ];
    }
    const first =
      productId === "ecommerce"
        ? { label: productName, href: "#ecommerce" }
        : { label: productName, href: "#producto" };
    return [
      first,
      { label: "Producto", href: "#producto" },
      { label: "Planes", href: "#planes" },
      { label: "Preguntas", href: "#preguntas" },
    ];
  }

  // Experience — ids reales del body compuesto
  void module;
  return [
    { label: productName, href: "#producto" },
    { label: "Qué incluye", href: "#incluye" },
    { label: "Cómo funciona", href: "#flujo" },
    { label: "Planes", href: "#planes" },
    { label: "Preguntas", href: "#preguntas" },
  ];
}
