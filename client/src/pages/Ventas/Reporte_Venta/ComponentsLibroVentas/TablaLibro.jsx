import React, { useMemo } from "react";
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
  Card,
  CardBody
} from "@heroui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import PropTypes from "prop-types";

// Formateadores
const nf = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
  if (!d) return "";
  try { return format(new Date(d), "dd/MM/yyyy", { locale: es }); } catch { return ""; }
};

const BASE_COLUMNS = [
  { name: "N° CORRELATIVO", uid: "numero_correlativo", align: "center" },
  { name: "F. EMISIÓN", uid: "fecha", align: "center" },
  { name: "DOCUMENTO", uid: "documento_cliente", align: "center" },
  { name: "CLIENTE", uid: "nombre_cliente" },
  { name: "COMPROBANTE", uid: "num_comprobante", align: "center" },
  { name: "MONTO", uid: "importe", align: "end" },
  { name: "IGV", uid: "igv", align: "end" },
  { name: "TOTAL", uid: "total", align: "end" }
];

const TablaLibro = ({
  ventas = [],
  totales = {},
  loading = false,
  error = null,
  metadata = {},
  page = 1,
  limit = 10,
  changePage = () => {},
  changeLimit = () => {},
  onEdit,
  onDelete,
  onDeactivate,
  hasEditPermission = false,
  hasDeletePermission = false,
  hasDeactivatePermission = false
}) => {
  const showActions = hasEditPermission || hasDeletePermission || hasDeactivatePermission;

  // Columnas completas (memo)
  const columns = useMemo(
    () => showActions
      ? [...BASE_COLUMNS, { name: "ACCIONES", uid: "acciones", align: "center" }]
      : BASE_COLUMNS,
    [showActions]
  );

  // Normalizar items (garantizar key)
  const items = useMemo(
    () => (ventas || []).map((v, i) => ({
      key: v.id || v.numero_correlativo || `row-${i}`,
      ...v
    })),
    [ventas]
  );

  const renderDataCell = (venta, columnKey) => {
    switch (columnKey) {
      case "numero_correlativo":
        return venta.numero_correlativo || "-";
      case "fecha":
        return formatDate(venta.fecha);
      case "documento_cliente":
        return venta.documento_cliente || "-";
      case "nombre_cliente":
        return (
          <span className="inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-medium bg-slate-100/70 border border-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-100 dark:border-slate-600/60 backdrop-blur-sm">
            {venta.nombre_cliente || "-"}
          </span>
        );
      case "num_comprobante":
        return venta.num_comprobante || "-";
      case "importe":
        return venta.importe != null ? nf.format(venta.importe) : "0.00";
      case "igv":
        return venta.igv != null ? nf.format(venta.igv) : "0.00";
      case "total":
        return (
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {venta.total != null ? nf.format(venta.total) : "0.00"}
          </span>
        );
      default:
        return null;
    }
  };

  const renderActions = (venta) => (
    <div className="flex justify-center items-center gap-2">
      {hasEditPermission && (
        <Tooltip content="Editar" delay={200}>
          <button
            onClick={() => onEdit?.(venta)}
            className="p-1.5 rounded-md bg-amber-100/70 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 transition"
          >
            <MdEdit size={16} />
          </button>
        </Tooltip>
      )}
      {hasDeletePermission && (
        <Tooltip content="Eliminar" delay={200}>
          <button
            onClick={() => onDelete?.(venta)}
            className="p-1.5 rounded-md bg-rose-100/70 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 transition"
          >
            <FaTrash size={15} />
          </button>
        </Tooltip>
      )}
      {hasDeactivatePermission && (
        <Tooltip content="Desactivar" delay={200}>
          <button
            onClick={() => onDeactivate?.(venta)}
            className="p-1.5 rounded-md bg-slate-200/70 dark:bg-slate-600/30 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-700 dark:text-slate-200 transition"
          >
            <MdDoNotDisturbAlt size={16} />
          </button>
        </Tooltip>
      )}
    </div>
  );

  // Estados de carga / error
  if (loading) {
    return (
      <Card radius="lg" className="border border-blue-100/60 dark:border-blue-900/40 bg-white/70 dark:bg-[#18212b]/70 backdrop-blur-md">
        <CardBody className="text-center text-sm text-blue-700 dark:text-blue-200 py-6">
          Cargando datos...
        </CardBody>
      </Card>
    );
  }
  if (error) {
    return (
      <Card radius="lg" className="border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-900/20 backdrop-blur-md">
        <CardBody className="text-center text-sm text-rose-600 dark:text-rose-300 py-6">
          Error al cargar los datos: {error}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        radius="lg"
        className="relative overflow-hidden border border-blue-100/70 dark:border-blue-900/40 bg-white/85 dark:bg-[#18212b]/80 backdrop-blur-md"
      >
        <div className="pointer-events-none absolute inset-0 hidden dark:block">
          <div className="absolute -top-10 -right-6 w-40 h-40 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.16),transparent_70%)] blur-2xl" />
          <div className="absolute bottom-[-30px] left-[-20px] w-48 h-48 bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.18),transparent_75%)] blur-2xl" />
          <div className="absolute inset-0 ring-1 ring-white/5 rounded-2xl" />
        </div>

        <CardBody className="p-0">
          <Table
            aria-label="Libro de Ventas"
            removeWrapper
            className="min-w-full"
            shadow="none"
            classNames={{
              base: "rounded-2xl",
              table: "min-w-full",
              thead: "sticky top-0 z-10",
              th: "bg-gradient-to-r from-blue-50/90 to-blue-100/70 dark:from-[#202c38]/90 dark:to-[#202c38]/90 border-b border-blue-100 dark:border-blue-800/60 text-blue-900 dark:text-blue-100 text-[11px] font-semibold uppercase tracking-wide",
              tr: "transition-colors",
              tbody: "divide-y divide-blue-50/60 dark:divide-blue-800/40",
              td: "text-[12px] md:text-[13px] py-2 px-2 text-slate-700 dark:text-slate-100",
              wrapper: "max-h-[520px] overflow-y-auto scrollbar-thin"
            }}
          >
            <TableHeader columns={columns}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  className={col.align === "end" ? "text-right" : col.align === "center" ? "text-center" : ""}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>

            <TableBody
              items={items}
              emptyContent="No se encontraron registros con los filtros aplicados."
            >
              {(item) => (
                <TableRow
                  key={item.key}
                  className={`
                    ${(items.indexOf(item) % 2 === 0)
                      ? "bg-white/90 dark:bg-[#1d2732]/60"
                      : "bg-blue-50/60 dark:bg-[#223142]/55"}
                    hover:bg-blue-100/70 dark:hover:bg-blue-900/30
                  `}
                >
                  {(columnKey) => (
                    <TableCell
                      className={
                        columns.find(c => c.uid === columnKey)?.align === "end"
                          ? "text-right"
                          : columns.find(c => c.uid === columnKey)?.align === "center"
                            ? "text-center"
                            : ""
                      }
                    >
                      {columnKey === "acciones"
                        ? renderActions(item)
                        : renderDataCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Paginación + selector */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Pagination
          page={page}
          total={metadata?.total_pages || 1}
          onChange={changePage}
          showControls
          color="primary"
          className="dark:text-blue-200"
        />
        <Select
          aria-label="Registros por página"
          selectedKeys={[String(limit)]}
          onSelectionChange={(keys) => changeLimit(Number([...keys][0]))}
          className="w-40"
          size="sm"
          variant="flat"
          classNames={{
            trigger: "h-10 bg-white/80 dark:bg-[#1e2a36]/70 border border-blue-100/70 dark:border-blue-800/50 rounded-lg text-blue-900 dark:text-blue-100 text-xs font-medium backdrop-blur-sm",
            popover: "bg-white/95 dark:bg-[#18212b]/90 border border-blue-100 dark:border-blue-800/60 backdrop-blur-md",
            listbox: "text-blue-900 dark:text-blue-100 text-xs",
            item: "data-[hover=true]:bg-blue-50 dark:data-[hover=true]:bg-blue-900/30"
          }}
        >
          <SelectItem key="5" value={5}>5 / pág.</SelectItem>
            <SelectItem key="10" value={10}>10 / pág.</SelectItem>
            <SelectItem key="20" value={20}>20 / pág.</SelectItem>
            <SelectItem key="100000" value={100000}>Todos</SelectItem>
        </Select>
      </div>

      {/* Total General */}
<div className="flex justify-end">
        <div className="relative flex flex-col items-end overflow-hidden rounded-2xl border
                        border-blue-200/70 dark:border-blue-900/50
                        bg-gradient-to-br from-blue-50/85 via-white/90 to-blue-100/70
                        dark:from-[#1c2532]/90 dark:via-[#1b2430]/85 dark:to-[#202e3d]/90
                        backdrop-blur-md px-8 py-6 shadow-md min-w-[300px]">
          <div className="pointer-events-none absolute inset-0 hidden dark:block">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.20),transparent_65%)] blur-2xl" />
            <div className="absolute bottom-[-20px] left-[-10px] w-36 h-36 bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.22),transparent_70%)] blur-2xl" />
            <div className="absolute inset-0 ring-1 ring-white/5 rounded-2xl" />
          </div>
          <span className="relative z-10 text-[11px] font-semibold tracking-widest text-blue-700 dark:text-blue-300 mb-1 uppercase">
            Total General
          </span>
          <div className="relative z-10 flex items-end gap-2">
            <span className="text-blue-700 dark:text-blue-300 text-lg font-bold">S/</span>
            <span className="text-3xl md:text-4xl font-extrabold text-blue-900 dark:text-blue-100 tabular-nums tracking-tight">
              {totales?.total_general?.toFixed(2)}
            </span>
          </div>
          <span className="relative z-10 mt-2 text-[11px] text-blue-500/80 dark:text-blue-300/70 font-medium">
            Registros filtrados
          </span>
        </div>
      </div>
    </div>
  );
};

TablaLibro.propTypes = {
  ventas: PropTypes.array,
  totales: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.any,
  metadata: PropTypes.object,
  page: PropTypes.number,
  limit: PropTypes.number,
  changePage: PropTypes.func,
  changeLimit: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onDeactivate: PropTypes.func,
  hasEditPermission: PropTypes.bool,
  hasDeletePermission: PropTypes.bool,
  hasDeactivatePermission: PropTypes.bool
};

export default TablaLibro;