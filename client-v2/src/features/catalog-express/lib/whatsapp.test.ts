import { describe, it, expect } from "vitest";
import { normalizarTelefono, formatearMensajePedido, construirEnlaceWhatsApp } from "./whatsapp";
import type { CarritoItem } from "../types";

describe("normalizarTelefono", () => {
  it("antepone 51 a un celular peruano de 9 dígitos", () => {
    expect(normalizarTelefono("987654321")).toBe("51987654321");
  });
  it("limpia espacios y guiones antes de normalizar", () => {
    expect(normalizarTelefono("987-654-321")).toBe("51987654321");
  });
  it("deja igual un número que ya trae código de país", () => {
    expect(normalizarTelefono("51987654321")).toBe("51987654321");
  });
  it("null si no hay teléfono", () => {
    expect(normalizarTelefono(null)).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
  });
});

const items: CarritoItem[] = [
  { producto: { codigo: 1, descripcion: "Polo", precio: 25, imagen_url: null, images: [], undm: "NIU", nom_marca: null, categoria: null, stock: 5 }, cantidad: 2 },
];

describe("formatearMensajePedido / construirEnlaceWhatsApp", () => {
  it("incluye cantidades, subtotales y el total", () => {
    const msg = formatearMensajePedido(items, "Tienda X");
    expect(msg).toContain("2x Polo");
    expect(msg).toContain("S/ 50.00");
    expect(msg).toContain("Total: S/ 50.00");
  });

  it("arma un enlace wa.me válido con el mensaje codificado", () => {
    const link = construirEnlaceWhatsApp("987654321", "hola");
    expect(link).toBe("https://wa.me/51987654321?text=hola");
  });

  it("null si no hay teléfono configurado", () => {
    expect(construirEnlaceWhatsApp(null, "hola")).toBeNull();
  });
});
