import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
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
  Chip,
} from "@heroui/react";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getStockStatus(stock) {
  if (stock <= 5) return "critical";
  if (stock <= 15) return "low";
  if (stock <= 50) return "normal";
  return "high";
}

const KardexTable = ({ kardex }) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const handleRowClick = (producto) => {
    if (producto.codigo) {
      navigate(`/almacen/kardex/historico/${producto.codigo}`);
    }
  };

  // Asegurar que kardex sea un array válido
  const safeKardex = kardex || [];

  const pages = Math.ceil(safeKardex.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return safeKardex.slice(start, end);
  }, [page, rowsPerPage, safeKardex]);

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

  const onRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const bottomContent = useMemo(() => {
    return (
      <div className="flex justify-between items-center px-2 py-2">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-blue-600 text-white",
          }}
          color="primary"
          isDisabled={false}
          page={page}
          total={pages || 1}
          variant="light"
          onChange={setPage}
        />
        <div className="flex gap-3 items-center">
          <span className="text-small text-default-400">
            {items.length} de {safeKardex.length} items
          </span>
          <Select
            label="Filas"
            className="w-24"
            size="sm"
            selectedKeys={[String(rowsPerPage)]}
            onChange={onRowsPerPageChange}
          >
            <SelectItem key="5" value="5">5</SelectItem>
            <SelectItem key="10" value="10">10</SelectItem>
            <SelectItem key="20" value="20">20</SelectItem>
            <SelectItem key="50" value="50">50</SelectItem>
          </Select>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, items.length, safeKardex.length]);

  return (
    <div className="w-full">
      <div className="mb-4 px-2">
        <h2 className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
          Inventario de Productos
        </h2>
      </div>
      <Table
        aria-label="Tabla de inventario kardex"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[600px] shadow-none border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18192b] rounded-xl",
          th: "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold",
          td: "group-data-[first=true]:first:before:rounded-none group-data-[last=true]:last:before:rounded-none",
        }}
        selectionMode="single"
        onRowAction={(key) => {
          const item = items.find(i => i.codigo === key);
          if (item) handleRowClick(item);
        }}
      >
        <TableHeader>
          <TableColumn key="codigo">Código</TableColumn>
          <TableColumn key="descripcion">Descripción</TableColumn>
          <TableColumn key="marca">Marca</TableColumn>
          <TableColumn key="stock" align="center">Stock</TableColumn>
          <TableColumn key="estado" align="center">Estado</TableColumn>
          <TableColumn key="um" align="center">UM</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay productos en el inventario"} items={items}>
          {(item) => (
            <TableRow key={item.codigo} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

KardexTable.propTypes = {
  kardex: PropTypes.array,
};

export default KardexTable;