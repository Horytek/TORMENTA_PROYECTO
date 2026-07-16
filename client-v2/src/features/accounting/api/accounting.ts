import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import type { ExpenseCategory, Expense, ExpenseInput, PLSummary } from "../types";

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> =>
  unwrapList<ExpenseCategory>(await api.get("/gastos/categorias"));

export const createExpenseCategory = async (nombre: string): Promise<boolean> =>
  isOk(await api.post("/gastos/categorias", { nombre }));

export const getExpenses = async (params: { fechaInicio: string; fechaFin: string; idCategoria?: number }): Promise<Expense[]> =>
  unwrapList<Expense>(await api.get("/gastos", { params }));

export const createExpense = async (input: ExpenseInput): Promise<boolean> =>
  isOk(await api.post("/gastos", input));

export const deleteExpense = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/gastos/${id}`));

export const getPL = async (fechaInicio: string, fechaFin: string): Promise<PLSummary> => {
  const response = await api.get("/gastos/pl", { params: { fechaInicio, fechaFin } });
  const data = response.data;
  return data?.data ?? { ingresos: 0, gastos: 0, utilidad: 0, gastosPorCategoria: [] };
};
