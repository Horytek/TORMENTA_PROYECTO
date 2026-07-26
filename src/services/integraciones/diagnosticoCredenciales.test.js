import { describe, it, expect } from "vitest";
import {
  diagnosticarCredencial,
  resumirIntegracion,
  ESTADO_CREDENCIAL,
} from "./diagnosticoCredenciales.js";

/**
 * Los dos casos que motivaron este módulo salieron de una investigación manual
 * de horas sobre la emisión SUNAT. Quedan fijados acá para que la próxima vez
 * los diga la pantalla y no haya que descifrar filas a mano.
 */

// Descifrador de mentira: `v1:iv:<texto>` devuelve <texto>; "boom" revienta.
const descifrarFalso = (cifrado) => {
  const partes = String(cifrado).split(":");
  if (partes[2] === "boom") throw new Error("bad decrypt");
  return partes.slice(2).join(":");
};

const cifrar = (texto) => `v1:0011223344556677:${texto}`;

describe("diagnosticarCredencial", () => {
  it("una credencial normal está OK", () => {
    const r = diagnosticarCredencial(cifrar("MiClaveSol2026"), descifrarFalso);
    expect(r.estado).toBe(ESTADO_CREDENCIAL.OK);
    expect(r.longitud).toBe(14);
  });

  it("detecta la máscara de la interfaz guardada como valor", () => {
    // El caso real: alguien guardó el texto oculto del formulario, y el sistema
    // creía tener credenciales mientras SUNAT devolvía 401.
    const r = diagnosticarCredencial(cifrar("••••••••••••••••"), descifrarFalso);
    expect(r.estado).toBe(ESTADO_CREDENCIAL.ENMASCARADA);
    expect(r.mensaje).toMatch(/vuelve a ingresarla/i);
  });

  it("detecta también máscaras con asteriscos o mezcladas", () => {
    for (const mascara of ["********", "••••", "· · ·", "●●●●●●"]) {
      expect(diagnosticarCredencial(cifrar(mascara), descifrarFalso).estado, mascara).toBe(
        ESTADO_CREDENCIAL.ENMASCARADA
      );
    }
  });

  it("no confunde una contraseña que contiene asteriscos con una máscara", () => {
    const r = diagnosticarCredencial(cifrar("Cla*ve2026"), descifrarFalso);
    expect(r.estado).toBe(ESTADO_CREDENCIAL.OK);
  });

  it("detecta el cifrado del esquema anterior a v1", () => {
    // Estas filas ya no se pueden recuperar: solo cabe reingresarlas.
    const r = diagnosticarCredencial("a1b2c3d4e5f6:textoviejo", descifrarFalso);
    expect(r.estado).toBe(ESTADO_CREDENCIAL.FORMATO_ANTIGUO);
  });

  it("marca ILEGIBLE cuando no descifra, sin filtrar el error interno", () => {
    const r = diagnosticarCredencial("v1:0011:boom", descifrarFalso);
    expect(r.estado).toBe(ESTADO_CREDENCIAL.ILEGIBLE);
    expect(r.mensaje).not.toMatch(/bad decrypt/);
  });

  it("distingue ausente de vacía", () => {
    expect(diagnosticarCredencial(null, descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.FALTA);
    expect(diagnosticarCredencial(undefined, descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.FALTA);
    expect(diagnosticarCredencial("", descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.VACIA);
    expect(diagnosticarCredencial("   ", descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.VACIA);
  });

  it("una credencial que descifra a vacío es VACIA, no OK", () => {
    expect(diagnosticarCredencial(cifrar(""), descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.VACIA);
    expect(diagnosticarCredencial(cifrar("   "), descifrarFalso).estado).toBe(ESTADO_CREDENCIAL.VACIA);
  });

  it("nunca devuelve el valor descifrado", () => {
    // La longitud sí (ayuda a diagnosticar), el contenido jamás.
    const r = diagnosticarCredencial(cifrar("SUPERSECRETO"), descifrarFalso);
    expect(JSON.stringify(r)).not.toMatch(/SUPERSECRETO/);
  });
});

describe("resumirIntegracion", () => {
  const ok = { estado: ESTADO_CREDENCIAL.OK };
  const roto = { estado: ESTADO_CREDENCIAL.FORMATO_ANTIGUO };

  it("todo bien es OPERATIVO", () => {
    const r = resumirIntegracion({ user: ok, pass: ok }, ["user", "pass"]);
    expect(r.estado).toBe("OPERATIVO");
    expect(r.faltantes).toEqual([]);
  });

  it("una requerida rota bloquea la integración", () => {
    const r = resumirIntegracion({ user: ok, pass: roto }, ["user", "pass"]);
    expect(r.estado).toBe("NO_CONFIGURADO");
    expect(r.faltantes).toContain("pass");
  });

  it("solo opcionales rotas degrada pero no bloquea", () => {
    const r = resumirIntegracion({ user: ok, pass: ok, extra: roto }, ["user", "pass"]);
    expect(r.estado).toBe("DEGRADADO");
    expect(r.faltantes).toEqual(["extra"]);
  });

  it("informa todas las requeridas que faltan, no solo la primera", () => {
    const r = resumirIntegracion({ user: roto, pass: roto }, ["user", "pass"]);
    expect(r.faltantes).toHaveLength(2);
  });
});
