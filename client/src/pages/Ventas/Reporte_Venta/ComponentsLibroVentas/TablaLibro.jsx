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
  CardBody,
  Chip
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
  { name: "MONTO BASE", uid: "importe", align: "end" },
  { name: "IGV", uid: "igv", align: "end" },
  { name: "TOTAL", uid: "total", align: "end" }
];

const TablaLibro = ({
  ventas = [],
  loading = false,
  error = null,
  metadata = {},
  page = 1,
  limit = 10,
  changePage = () => { },
  changeLimit = () => { },
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
        return <span className="text-xs font-mono text-slate-500">{venta.numero_correlativo || "-"}</span>;
      case "fecha":
        return <span className="text-slate-700 dark:text-slate-300">{formatDate(venta.fecha)}</span>;
      case "documento_cliente":
        return <span className="text-xs font-mono">{venta.documento_cliente || "-"}</span>;
      case "nombre_cliente":
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
              {venta.nombre_cliente || "Cliente General"}
            </span>
          </div>
        );
      case "num_comprobante":
        return (
          <Chip size="sm" variant="flat" color="primary" className="h-6 text-xs">
            {venta.num_comprobante || "-"}
          </Chip>
        );
      case "importe":
        return <span className="text-slate-600 dark:text-slate-400">{venta.importe != null ? nf.format(venta.importe) : "0.00"}</span>;
      case "igv":
        return <span className="text-slate-600 dark:text-slate-400">{venta.igv != null ? nf.format(venta.igv) : "0.00"}</span>;
      case "total":
        return (
          <span className="font-bold text-blue-700 dark:text-blue-300">
            {venta.total != null ? nf.format(venta.total) : "0.00"}
          </span>
        );
      default:
        return null;
    }
  };

  const renderActions = (venta) => (
    <div className="flex justify-center items-center gap-1">
      {hasEditPermission && (
        <Tooltip content="Editar" delay={200} closeDelay={0}>
          <button
            onClick={() => onEdit?.(venta)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-amber-400 transition-colors"
          >
            <MdEdit size={18} />
          </button>
        </Tooltip>
      )}
      {hasDeletePermission && (
        <Tooltip content="Eliminar" delay={200} closeDelay={0}>
          <button
            onClick={() => onDelete?.(venta)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-rose-400 transition-colors"
          >
            <FaTrash size={16} />
          </button>
        </Tooltip>
      )}
      {hasDeactivatePermission && (
        <Tooltip content="Anular" delay={200} closeDelay={0}>
          <button
            onClick={() => onDeactivate?.(venta)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-200 transition-colors"
          >
            <MdDoNotDisturbAlt size={18} />
          </button>
        </Tooltip>
      )}
    </div>
  );

  // Estados de carga / error
  if (loading) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 shadow-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando registros...</p>
        </div>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="w-full p-8 flex items-center justify-center bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 shadow-none">
        <p className="text-rose-600 dark:text-rose-400">Error al cargar los datos: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        className="border border-blue-100 dark:border-zinc-800 bg-white dark:bg-[#18192b] shadow-sm"
        shadow="none"
        radius="lg"
      >
        <CardBody className="p-0 overflow-hidden">
          <Table
            aria-label="Libro de Ventas"
            removeWrapper
            className="min-w-full"
            shadow="none"
            classNames={{
              base: "min-w-full",
              table: "min-w-full",
              thead: "sticky top-0 z-10",
              th: "bg-slate-50 dark:bg-[#202c38] border-b border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider h-10",
              tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b border-slate-100 dark:border-zinc-800/50 last:border-0",
              td: "py-3 px-3 text-[13px]",
              wrapper: "max-h-[600px]"
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
              emptyContent={
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <p>No se encontraron registros</p>
                </div>
              }
            >
              {(item) => (
                <TableRow key={item.key}>
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

      {/* Footer: Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando {items.length} registros
        </span>

        <div className="flex items-center gap-4">
          <Select
            aria-label="Registros por página"
            selectedKeys={[String(limit)]}
            onSelectionChange={(keys) => changeLimit(Number([...keys][0]))}
            className="w-32"
            size="sm"
            variant="bordered"
            classNames={{
              trigger: "h-8 min-h-8 border-slate-200 dark:border-zinc-700",
              value: "text-xs"
            }}
          >
            <SelectItem key="10" value={10}>10 filas</SelectItem>
            <SelectItem key="20" value={20}>20 filas</SelectItem>
            <SelectItem key="50" value={50}>50 filas</SelectItem>
            <SelectItem key="100" value={100}>100 filas</SelectItem>
          </Select>

          <Pagination
            page={page}
            total={metadata?.total_pages || 1}
            onChange={changePage}
            showControls
            size="sm"
            color="primary"
            classNames={{
              cursor: "bg-blue-600 text-white font-bold",
            }}
          />
        </div>
      </div>
    </div>
  );
};

TablaLibro.propTypes = {
  ventas: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
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