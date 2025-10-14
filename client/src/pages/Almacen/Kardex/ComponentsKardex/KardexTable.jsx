import PropTypes from 'prop-types';
import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Select, SelectItem } from "@heroui/react";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getStockStatus(stock) {
  if (stock <= 5) return "critical";
  if (stock <= 15) return "low";
  if (stock <= 50) return "normal";
  return "high";
}

function getStatusProps(status) {
  switch (status) {
    case "critical":
      return {
        color: "danger",
        text: "Crítico",
        icon: (
          <AlertTriangle className="w-4 h-4 mr-1 text-rose-700 dark:text-rose-200" />
        ),
        className:
          "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/60",
      };
    case "low":
      return {
        color: "warning",
        text: "Bajo",
        icon: (
          <AlertTriangle className="w-4 h-4 mr-1 text-orange-700 dark:text-orange-200" />
        ),
        className:
          "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/60",
      };
    case "normal":
      return {
        color: "success",
        text: "Normal",
        icon: (
          <CheckCircle className="w-4 h-4 mr-1 text-emerald-700 dark:text-emerald-200" />
        ),
        className:
          "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60",
      };
    case "high":
      return {
        color: "primary",
        text: "Alto",
        icon: (
          <Package className="w-4 h-4 mr-1 text-blue-700 dark:text-blue-200" />
        ),
        className:
          "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60",
      };
    default:
      return {
        color: "default",
        text: "Desconocido",
        icon: null,
        className:
          "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-700/60",
      };
  }
}

const TablaKardex = ({ kardex }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  const handleRowClick = (producto) => {
    if (producto.codigo) {
      navigate(`/almacen/kardex/historico/${producto.codigo}`);
    }
  };

  // Asegurar que kardex sea un array válido
  const safeKardex = kardex || [];
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeKardex.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(safeKardex.length / itemsPerPage);

  return (
    <>
      <div className="overflow-x-auto rounded-xl bg-white dark:bg-[#18192b] p-4 border border-gray-200 dark:border-zinc-700">
        <table className="min-w-full rounded-xl overflow-hidden text-[13px]">
          <caption className="text-2xl font-extrabold mb-6 text-blue-900 dark:text-blue-100 tracking-tight caption-top text-left">
            Inventario de Productos
          </caption>
          <thead>
            <tr className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm">
              <th className="py-3 px-4 text-left font-semibold text-sm rounded-tl-xl">Código</th>
              <th className="py-3 px-4 text-left font-semibold text-sm">Descripción</th>
              <th className="py-3 px-4 text-left font-semibold text-sm">Marca</th>
              <th className="py-3 px-4 text-center font-semibold text-sm">Stock</th>
              <th className="py-3 px-4 text-center font-semibold text-sm">Estado</th>
              <th className="py-3 px-4 text-center font-semibold text-sm rounded-tr-xl">UM</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">Sin productos para mostrar</td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const status = getStockStatus(item.stock);
                const { text, icon, className } = getStatusProps(status);
                return (
                  <tr
                    key={item.codigo}
                    className={`
                      transition-colors duration-150 cursor-pointer
                      ${idx % 2 === 0
                        ? "bg-slate-50 dark:bg-zinc-900/60"
                        : "bg-white dark:bg-zinc-900/40"}
                      hover:bg-blue-50 dark:hover:bg-blue-900/20
                    `}
                    onClick={() => handleRowClick(item)}
                    title="Ver histórico del producto"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-zinc-100">{item.codigo}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-zinc-200 max-w-md">
                      <div className="truncate" title={item.descripcion}>
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-sm">
                        {item.marca}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-blue-900 dark:text-blue-200">{item.stock}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all
                          ${className}
                        `}
                      >
                        {icon}
                        {text}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-zinc-300 font-medium">{item.um}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mt-2 gap-4 pt-4">
        <Pagination
          showControls
          total={totalPages}
          page={currentPage}
          onChange={setCurrentPage}
          showShadow
          color="primary"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-zinc-400">Filas por página:</span>
          <Select
            size="sm"
            className="w-24"
            selectedKeys={[`${itemsPerPage}`]}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Filas por página"
            classNames={{
              trigger: "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-blue-900 dark:text-blue-100",
              popoverContent: "bg-white dark:bg-zinc-900"
            }}
          >
            <SelectItem key="5" value="5">05</SelectItem>
            <SelectItem key="10" value="10">10</SelectItem>
            <SelectItem key="20" value="20">20</SelectItem>
            <SelectItem key="100000" value="100000">Todo</SelectItem>
          </Select>
        </div>
      </div>
    </>
  );
};

TablaKardex.propTypes = {
  kardex: PropTypes.array.isRequired,
};

export default TablaKardex;