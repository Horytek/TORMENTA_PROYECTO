import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from "@heroui/react";
import StockDetailModal from './StockDetailModal';

function getStockStatus(stock) {
  if (stock <= 5) return "critical";
  if (stock <= 15) return "low";
  if (stock <= 50) return "normal";
  return "high";
}

const KardexTable = ({ kardex, page = 1, limit = 10, emptyText = "No hay productos en el inventario", attrMetadataMap = {}, almacenSeleccionado }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  const handleRowClick = (producto) => {
    if (producto.codigo) {
      navigate(`/almacen/kardex/historico/${producto.codigo}`);
    }
  };

  // Asegurar que kardex sea un array válido
  const safeKardex = kardex || [];

  const items = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return safeKardex.slice(start, end);
  }, [page, limit, safeKardex]);

  const renderCell = (item, columnKey) => {
    switch (columnKey) {
      case "codigo":
        return (
          <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
            {item.codigo}
          </span>
        );
      case "descripcion":
        return (
          <div className="flex flex-col max-w-md">
            <p className="font-medium text-small text-slate-700 dark:text-zinc-200 truncate" title={item.descripcion}>
              {item.descripcion}
            </p>
          </div>
        );
      case "marca":
        return (
          <span className="inline-block px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-sm">
            {item.marca}
          </span>
        );
      case "actions":
        return (
          <div className="flex justify-center">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => {
                setSelectedProduct(item);
                setModalOpen(true);
              }}
              className="text-slate-400 hover:text-blue-600"
            >
              <Eye size={18} />
            </Button>
          </div>
        );
      case "stock":
        return (
          <div className="font-bold text-blue-900 dark:text-blue-200 text-center">
            {item.stock}
          </div>
        );
      case "estado":
        const status = getStockStatus(item.stock);
        let color = "default";
        let icon = null;
        let text = "Desconocido";

        switch (status) {
          case "critical":
            color = "danger";
            text = "Crítico";
            icon = <AlertTriangle className="w-3 h-3" />;
            break;
          case "low":
            color = "warning";
            text = "Bajo";
            icon = <AlertTriangle className="w-3 h-3" />;
            break;
          case "normal":
            color = "success";
            text = "Normal";
            icon = <CheckCircle className="w-3 h-3" />;
            break;
          case "high":
            color = "primary";
            text = "Alto";
            icon = <Package className="w-3 h-3" />;
            break;
        }

        return (
          <Chip
            startContent={icon}
            variant="flat"
            color={color}
            size="sm"
            classNames={{
              base: "gap-1 border-none capitalize",
              content: "font-semibold"
            }}
          >
            {text}
          </Chip>
        );
      case "um":
        return (
          <span className="text-slate-600 dark:text-zinc-300 font-medium">
            {item.um}
          </span>
        );
      default:
        return item[columnKey];
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table
        aria-label="Tabla de inventario kardex"
        isHeaderSticky
        removeWrapper
        classNames={{
          base: "max-h-[calc(100vh-350px)] overflow-y-auto",
          table: "min-w-full text-[13px]",
          th: "bg-slate-50 text-slate-500 font-bold uppercase text-xs h-10 dark:bg-zinc-900 dark:text-slate-400 border-b border-slate-100 dark:border-zinc-800 first:rounded-l-lg last:rounded-r-lg",
          td: "py-3 border-b border-slate-100 dark:border-zinc-800 dark:text-gray-300 group-hover:bg-slate-50/50",
          tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer",
          thead: "[&>tr]:first:shadow-none",
        }}
        selectionMode="single"
        onRowAction={(key) => {
          // key might be composite "code-sku"
          const parts = String(key).split('-');
          const code = parts[0];
          // Navigate using code (Historical view expects Product Code)
          if (code) navigate(`/almacen/kardex/historico/${code}`);
        }}
      >
        <TableHeader>
          <TableColumn key="codigo">Código</TableColumn>
          <TableColumn key="descripcion">Descripción</TableColumn>
          <TableColumn key="marca">Marca</TableColumn>
          <TableColumn key="stock" align="center">Stock</TableColumn>
          <TableColumn key="estado" align="center">Estado</TableColumn>
          <TableColumn key="um" align="center">UM</TableColumn>
          <TableColumn key="actions" align="center">Detalle</TableColumn>
        </TableHeader>
        <TableBody emptyContent={emptyText} items={items}>
          {(item) => (
            <TableRow key={item.codigo} className="cursor-pointer">
              {(columnKey) => <TableCell>
                {/* Stop propagation for action buttons if easier, but Heroui Table usually handles it if button is interactive. 
                     Actually, Heroui Table onRowAction fires on row click. 
                     We need to ensure button click doesn't trigger row action? 
                     Typically Button onPress stops propagation. */}
                {renderCell(item, columnKey)}
              </TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {items.map((item) => {
          const status = getStockStatus(item.stock);
          let color = "default";
          let icon = null;
          let text = "Desconocido";

          switch (status) {
            case "critical": color = "danger"; text = "Crítico"; icon = <AlertTriangle className="w-3 h-3" />; break;
            case "low": color = "warning"; text = "Bajo"; icon = <AlertTriangle className="w-3 h-3" />; break;
            case "normal": color = "success"; text = "Normal"; icon = <CheckCircle className="w-3 h-3" />; break;
            case "high": color = "primary"; text = "Alto"; icon = <Package className="w-3 h-3" />; break;
          }

          return (
            <div key={item.codigo} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 space-y-3 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => handleRowClick(item)}>
               <div className="flex justify-between items-start gap-2">
                 <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-slate-500 mb-0.5">{item.codigo}</span>
                    <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-sm line-clamp-2">
                      {item.descripcion}
                    </h3>
                 </div>
                 <Chip startContent={icon} variant="flat" color={color} size="sm" classNames={{base: "gap-1 border-none h-6 min-w-min px-2", content: "font-semibold text-[10px] items-center capitalize"}}>
                   {text}
                 </Chip>
               </div>
               
               <div className="grid grid-cols-3 gap-2 text-xs border-y border-slate-100 dark:border-zinc-800 py-2.5 mt-1">
                  <div className="flex flex-col gap-1">
                     <span className="text-slate-400 font-medium">Marca</span>
                     <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.marca}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                     <span className="text-slate-400 font-medium">UM</span>
                     <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.um}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                     <span className="text-slate-400 font-medium">Stock</span>
                     <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{item.stock}</span>
                  </div>
               </div>

               <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                 <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="font-medium"
                    startContent={<Eye size={16} />}
                    onPress={() => {
                      setSelectedProduct(item);
                      setModalOpen(true);
                    }}
                 >
                   Ver Detalle de Variantes
                 </Button>
               </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 shadow-sm">
            {emptyText}
          </div>
        )}
      </div>

      <StockDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        almacenId={almacenSeleccionado}
        attrMetadataMap={attrMetadataMap}
      />
    </div>
  );
};

KardexTable.propTypes = {
  kardex: PropTypes.array,
  page: PropTypes.number,
  limit: PropTypes.number,
  emptyText: PropTypes.string,
  attrMetadataMap: PropTypes.object,
  almacenSeleccionado: PropTypes.any,
};

export default KardexTable;