import { describe, expect, it } from "vitest";
import { disponibilidadEstado } from "./CatalogoService.js";

describe("disponibilidadEstado", () => {
  it("clasifica stock disponible / últimas / otra sucursal / agotado", () => {
    expect(disponibilidadEstado(20, 5).estado).toBe("disponible");
    expect(disponibilidadEstado(3, 5).estado).toBe("ultimas_unidades");
    expect(disponibilidadEstado(0, 5, true).estado).toBe("otra_sucursal");
    expect(disponibilidadEstado(0, 5, false).estado).toBe("agotado");
    expect(disponibilidadEstado(3, 5).label).toBe("Últimas unidades");
  });
});
