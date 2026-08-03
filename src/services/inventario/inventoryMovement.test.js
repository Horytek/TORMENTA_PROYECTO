import { describe, it, expect } from "vitest";
import {
  crearTransferenciaGuiada,
  crearInventarioFisico,
} from "./inventoryMovement.service.js";

describe("inventoryMovement.service — Transferencias y Conteo Ciego", () => {
  it("valida parámetros obligatorios al crear transferencia guiada", async () => {
    await expect(
      crearTransferenciaGuiada({
        id_tenant: 1,
        id_almacen_origen: 1,
        id_almacen_destino: 1, // Mismo almacén
        id_usuario_solicita: 1,
        items: [{ id_sku: 10, cantidad_solicitada: 5 }],
      })
    ).rejects.toThrow("El almacén de origen y destino deben ser diferentes.");
  });

  it("rechaza solicitudes con lista de ítems vacía", async () => {
    await expect(
      crearTransferenciaGuiada({
        id_tenant: 1,
        id_almacen_origen: 1,
        id_almacen_destino: 2,
        id_usuario_solicita: 1,
        items: [],
      })
    ).rejects.toThrow("Datos incompletos para crear la solicitud de transferencia.");
  });

  it("valida parámetros al crear inventario físico ciego", async () => {
    await expect(
      crearInventarioFisico({
        id_tenant: 1,
        id_almacen: null,
        titulo: "",
        id_usuario_crea: 1,
      })
    ).rejects.toThrow("Faltan parámetros requeridos para crear el conteo ciego.");
  });
});
