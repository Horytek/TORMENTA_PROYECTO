export interface ExpenseCategory {
  id_categoria: number;
  nombre: string;
  estado?: number;
}

export interface Expense {
  id_gasto: number;
  descripcion: string;
  monto: number | string;
  fecha: string;
  id_categoria: number;
  categoria: string;
  usuario?: string;
}

export interface ExpenseInput {
  descripcion: string;
  monto: number;
  fecha: string;
  id_categoria: number;
}

export interface PLCategoryBreakdown {
  categoria: string;
  total: number | string;
}

export interface PLSummary {
  ingresos: number;
  gastos: number;
  utilidad: number;
  gastosPorCategoria: PLCategoryBreakdown[];
}
