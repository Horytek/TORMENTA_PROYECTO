import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";

const formatDate = (date) => {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
};

const columns = [
  { name: "N° CORRELATIVO", uid: "numero_correlativo" },
  { name: "F. EMISIÓN", uid: "fecha" },
  { name: "DOCUMENTO", uid: "documento_cliente" },
  { name: "CLIENTE", uid: "nombre_cliente" },
  { name: "COMPROBANTE", uid: "num_comprobante" },
  { name: "MONTO", uid: "importe" },
  { name: "IGV", uid: "igv" },
  { name: "TOTAL", uid: "total" },
];

const centeredColumns = ["numero_correlativo", "fecha"];

const TablaLibro = ({
  ventas,
  totales,
  loading,
  error,
  metadata,
  page,
  limit,
  changePage,
  changeLimit,
  onEdit, // Si tienes edición
  onDelete, // Si tienes eliminación
  onDeactivate, // Si tienes desactivación
  hasEditPermission = false,
  hasDeletePermission = false,
  hasDeactivatePermission = false,
}) => {
  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error}</p>;

  const renderCell = (venta, columnKey) => {
    switch (columnKey) {
      case "numero_correlativo":
        return venta.numero_correlativo;
      case "fecha":
        return formatDate(venta.fecha);
      case "documento_cliente":
        return venta.documento_cliente;
      case "nombre_cliente":
        return (
          <span className="inline-block px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[14px] font-semibold shadow-sm">
            {venta.nombre_cliente}
          </span>
        );
      case "num_comprobante":
        return venta.num_comprobante;
      case "importe":
        return venta.importe?.toFixed(2);
      case "igv":
        return venta.igv?.toFixed(2);
      case "total":
        return venta.total?.toFixed(2);
      default:
        return null;
    }
  };

 return (
  <div>
    <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
      <table className="w-full text-[15px] table-auto rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-blue-50 text-blue-900 font-bold">
            {columns.map((col, idx) => (
              <th
                key={col.uid}
                className={`py-3 px-3 text-center ${idx === 0 ? "rounded-tl-xl" : ""} ${idx === columns.length - 1 ? "rounded-tr-xl" : ""}`}
              >
                {col.name}
              </th>
            ))}
            {(hasEditPermission || hasDeletePermission || hasDeactivatePermission) && (
              <th className="py-3 px-3 text-center rounded-tr-xl">ACCIONES</th>
            )}
          </tr>
        </thead>
        <tbody>
          {ventas && ventas.length > 0 ? (
            ventas.map((venta, idx) => (
              <tr
                className={`transition-colors duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                } hover:bg-blue-100/60`}
                key={venta.numero_correlativo}
              >
                {columns.map((col) => (
                  <td
                    key={col.uid}
                    className={`py-2 text-center ${centeredColumns.includes(col.uid) ? "text-center" : ""}`}
                  >
                    {renderCell(venta, col.uid)}
                  </td>
                ))}
                {(hasEditPermission || hasDeletePermission || hasDeactivatePermission) && (
                  <td className="py-2 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {hasEditPermission && (
                        <Tooltip content="Editar">
                          <button
                            className="cursor-pointer"
                            onClick={() => onEdit && onEdit(venta)}
                          >
                            <MdEdit className="text-yellow-600" />
                          </button>
                        </Tooltip>
                      )}
                      {hasDeletePermission && (
                        <Tooltip content="Eliminar">
                          <button
                            className="cursor-pointer"
                            onClick={() => onDelete && onDelete(venta)}
                          >
                            <FaTrash className="text-rose-600" />
                          </button>
                        </Tooltip>
                      )}
                      {hasDeactivatePermission && (
                        <Tooltip content="Desactivar">
                          <button
                            className="cursor-pointer"
                            onClick={() => onDeactivate && onDeactivate(venta)}
                          >
                            <MdDoNotDisturbAlt className="text-rose-600" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-center text-slate-400">
                No se encontraron registros con los filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4 pb-2 gap-3">
  <Pagination
    currentPage={page}
    totalPages={metadata?.total_pages || 1}
    onPageChange={changePage}
  />
  <Select
    aria-label="Registros por página"
    selectedKeys={[String(limit)]}
    onSelectionChange={(keys) => changeLimit(Number(Array.from(keys)[0]))}
    className="w-42 bg-white border border-blue-100 rounded-xl shadow-sm text-blue-900 font-semibold text-base transition focus:ring-2 focus:ring-blue-300"
    classNames={{
      trigger: "bg-white border border-blue-100 rounded-xl shadow-sm text-blue-900 font-semibold text-base px-4 py-2 focus:ring-2 focus:ring-blue-300",
      popover: "rounded-xl shadow-lg border border-blue-100 bg-white",
      listbox: "rounded-xl",
      item: "text-blue-900 font-semibold text-base px-4 py-2 hover:bg-blue-50 rounded-xl transition",
    }}
    size="sm"
    variant="bordered"
    placement="bottom-end"
  >
    <SelectItem key="5" value={5}>5 por página</SelectItem>
    <SelectItem key="10" value={10}>10 por página</SelectItem>
    <SelectItem key="20" value={20}>20 por página</SelectItem>
    <SelectItem key="100000" value={100000}>Todos</SelectItem>
  </Select>
</div>
<div className="flex justify-end mt-6 px-4">
  <div className="relative flex flex-col items-end bg-gradient-to-br from-blue-100/80 via-white to-white border border-blue-200/70 rounded-2xl px-10 py-6 shadow-xl min-w-[320px] overflow-hidden">
    {/* Fondo decorativo sutil */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-blue-100/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-100/40 to-blue-100/30 rounded-full blur-xl"></div>
    </div>
    <span className="relative z-10 text-[14px] font-semibold tracking-widest text-blue-700/90 mb-1 uppercase letter-spacing-[0.1em]">Total General</span>
    <div className="relative z-10 flex items-end gap-2">
      <span className="text-blue-800 text-xl font-bold drop-shadow-sm">S/</span>
      <span className="text-4xl font-extrabold text-blue-900 tabular-nums drop-shadow-sm tracking-tight">
        {totales?.total_general?.toFixed(2)}
      </span>
    </div>
    <span className="relative z-10 mt-2 text-xs text-blue-500/80 font-medium">Incluye todos los registros filtrados</span>
  </div>
</div>
  </div>
);
};

export default TablaLibro;