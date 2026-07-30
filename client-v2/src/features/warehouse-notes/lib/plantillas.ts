import type { NoteFormItem, NoteKind } from "../types";

/**
 * Plantillas de notas recurrentes (ej. "Reposición semanal tienda X"): guardan
 * el destinatario/glosa/productos+cantidades para no rearmar el carrito cada
 * vez. Viven en localStorage — es una comodidad del usuario en su navegador,
 * no un dato de negocio que necesite sincronizarse entre dispositivos, así
 * que no amerita tabla ni endpoint nuevos.
 */
export interface PlantillaNota {
  id: string;
  nombre: string;
  tipo: NoteKind | "conjunto";
  destinatario: string;
  glosa: string;
  items: NoteFormItem[];
}

const STORAGE_KEY = "notas_almacen_plantillas";

function leer(): PlantillaNota[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function escribir(plantillas: PlantillaNota[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantillas));
}

export function listarPlantillas(): PlantillaNota[] {
  return leer();
}

export function guardarPlantilla(p: Omit<PlantillaNota, "id">): PlantillaNota {
  const nueva: PlantillaNota = { ...p, id: crypto.randomUUID() };
  escribir([...leer(), nueva]);
  return nueva;
}

export function eliminarPlantilla(id: string) {
  escribir(leer().filter((p) => p.id !== id));
}
