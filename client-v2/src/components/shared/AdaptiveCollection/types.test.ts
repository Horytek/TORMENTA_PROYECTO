// ─────────────────────────────────────────────────────────────────
// Pruebas de los helpers puros del componente global AdaptiveCollection:
// gating por capability, CSV de exportación e inferencia de estado.
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { buildCsv, filterByCapability, inferState, sortFieldsByPriority, type FieldDef } from "./types";

describe("filterByCapability", () => {
  const can = (perm: string) => perm === "ventas.view";

  it("omite defs cuya capability el usuario no tiene", () => {
    const defs = [
      { id: "a", capability: "ventas.view" },
      { id: "b", capability: "devoluciones.costos" },
      { id: "c" },
    ];
    expect(filterByCapability(defs, can).map((d) => d.id)).toEqual(["a", "c"]);
  });
});

describe("buildCsv", () => {
  interface Row { nombre: string; total: number; interno?: string }
  const fields: FieldDef<Row>[] = [
    { key: "nombre", label: "Nombre" },
    { key: "total", label: "Total", format: (v) => `S/ ${Number(v).toFixed(2)}` },
    { key: "interno", priority: "hidden" },
  ];

  it("usa labels, aplica format y omite campos hidden", () => {
    const csv = buildCsv([{ nombre: "Polo", total: 49.9, interno: "x" }], fields);
    expect(csv).toBe("Nombre,Total\nPolo,S/ 49.90");
  });

  it("escapa comas y comillas", () => {
    const csv = buildCsv([{ nombre: 'Polo "XL", azul', total: 1 }], fields);
    expect(csv.split("\n")[1]).toBe('"Polo ""XL"", azul",S/ 1.00');
  });
});

describe("inferState", () => {
  it("mapea estados de negocio en español", () => {
    expect(inferState("pendiente")).toBe("warning");
    expect(inferState("completado")).toBe("active");
    expect(inferState("rechazado")).toBe("error");
  });
});

describe("sortFieldsByPriority", () => {
  it("ordena primary antes que secondary y meta", () => {
    const fields: FieldDef<{ a: string }>[] = [
      { key: "a", label: "meta", priority: "meta" },
      { key: "a", label: "primary", priority: "primary" },
      { key: "a", label: "secondary", priority: "secondary" },
    ];
    expect(sortFieldsByPriority(fields).map((f) => f.label)).toEqual(["primary", "secondary", "meta"]);
  });
});
