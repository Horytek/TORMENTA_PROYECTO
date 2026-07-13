import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { Talla, Tonalidad } from "../types";

// Tallas
export const getTallas = async (): Promise<Talla[]> =>
  unwrapList<Talla>(await api.get("/talla"));

export const createTalla = async (nombre: string): Promise<boolean> =>
  isOk(await api.post("/talla", { nombre: nombre.trim() }));

export const updateTalla = async (id: number, nombre: string): Promise<boolean> =>
  isOk(await api.put(`/talla/${id}`, { nombre: nombre.trim() }));

export const deleteTalla = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/talla/${id}`));

// Tonalidades
export const getTonalidades = async (): Promise<Tonalidad[]> =>
  unwrapList<Tonalidad>(await api.get("/tonalidad"));

export const createTonalidad = async (t: { nombre: string; hex?: string }): Promise<boolean> =>
  isOk(await api.post("/tonalidad", { nombre: t.nombre.trim(), hex: t.hex || null }));

export const updateTonalidad = async (id: number, t: { nombre: string; hex?: string }): Promise<boolean> =>
  isOk(await api.put(`/tonalidad/${id}`, { nombre: t.nombre.trim(), hex: t.hex || null }));

export const deleteTonalidad = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/tonalidad/${id}`));
