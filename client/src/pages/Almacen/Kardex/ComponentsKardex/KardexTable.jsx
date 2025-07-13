import PropTypes from 'prop-types';
import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Select, SelectItem } from "@heroui/react";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";

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
        icon: <AlertTriangle className="w-4 h-4 mr-1" />
      };
    case "low":
      return {
        color: "warning",
        text: "Bajo",
        icon: <AlertTriangle className="w-4 h-4 mr-1" />
      };
    case "normal":
      return {
        color: "success",
        text: "Normal",
        icon: <CheckCircle className="w-4 h-4 mr-1" />
      };
    case "high":
      return {
        color: "primary",
        text: "Alto",
        icon: <Package className="w-4 h-4 mr-1" />
      };
    default:
      return {
        color: "default",
        text: "Desconocido",
        icon: null
      };
  }
}

const TablaKardex = ({ kardex }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = kardex.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(kardex.length / itemsPerPage);

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-6 transition-all">
      <h2 className="text-2xl font-extrabold mb-6 text-blue-900 tracking-tight">Inventario de Productos</h2>
      <div className="overflow-x-auto rounded-xl">
        <table className="min-w-full bg-white rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 via-blue-100 to-emerald-50 text-blue-900 shadow-sm">
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
                <td colSpan={6} className="py-8 text-center text-gray-400">Sin productos para mostrar</td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const status = getStockStatus(item.stock);
                const { color, text, icon } = getStatusProps(status);
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-slate-50" : "bg-white"
                    } hover:bg-blue-50`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.codigo}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <div className="truncate" title={item.descripcion}>
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm">
                        {item.marca}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-blue-900">{item.stock}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                          ${color === "danger" && "bg-rose-100 text-rose-700 border border-rose-200"}
                          ${color === "warning" && "bg-orange-100 text-orange-700 border border-orange-200"}
                          ${color === "success" && "bg-emerald-100 text-emerald-700 border border-emerald-200"}
                          ${color === "primary" && "bg-blue-100 text-blue-700 border border-blue-200"}
                          transition-all
                        `}
                      >
                        {icon}
                        {text}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">{item.um}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 border-t border-slate-100 pt-4">
        <Pagination
          showControls
          total={totalPages}
          page={currentPage}
          onChange={setCurrentPage}
          shadow
          color="primary"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filas por página:</span>
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
              trigger: "bg-slate-50 border-slate-200 text-blue-900",
              popoverContent: "bg-white"
            }}
          >
            <SelectItem key="5" value="5">05</SelectItem>
            <SelectItem key="10" value="10">10</SelectItem>
            <SelectItem key="20" value="20">20</SelectItem>
            <SelectItem key="100000" value="100000">Todo</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  );
};

TablaKardex.propTypes = {
  kardex: PropTypes.array.isRequired,
};

export default TablaKardex;