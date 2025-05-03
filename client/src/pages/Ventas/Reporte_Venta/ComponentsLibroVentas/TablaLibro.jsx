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
  SelectItem
} from "@heroui/react";
import useLibroVentasSunatData from "../Data/getLibroVenta";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatDate = (date) => {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
};

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
        return venta.nombre_cliente;
      case "num_comprobante":
        return venta.num_comprobante;
      case "importe":
        return venta.importe.toFixed(2);
      case "igv":
        return venta.igv.toFixed(2);
      case "total":
        return venta.total.toFixed(2);
      default:
        return null;
    }
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

  return (
    <div className="space-y-4">
      <Table
        isStriped
        aria-label="Tabla de Libro de Ventas"
        bottomContent={
          <div className="flex w-full justify-between items-center">
            <Select
              size="sm"
              label="Filas por página"
              selectedKeys={[`${limit}`]}
              className="w-[150px]"
              defaultSelectedKeys={["5"]}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                changeLimit(newLimit);
              }}
              isDisabled={!ventas || ventas.length === 0}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
              <SelectItem key="100000000" value="100000">Todos</SelectItem>
            </Select>
            <Pagination
              showControls
              color="primary"
              page={page}
              total={metadata.total_pages}
              onChange={(newPage) => changePage(newPage)}
              initialPage={1}
              isDisabled={loading || !ventas || ventas.length === 0 || metadata.total_records === 0}
            />
          </div>
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={centeredColumns.includes(column.uid) ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={ventas}
          loadingContent={<p>Cargando registros...</p>}
          loadingState={loading ? "loading" : "idle"}
          emptyContent={
            <div className="flex justify-center items-center h-24 text-gray-500">
              No se encontraron registros con los filtros aplicados.
            </div>
          }
        >
          {(item) => (
            <TableRow key={item.numero_correlativo}>
              {(columnKey) => (
                <TableCell
                  className={centeredColumns.includes(columnKey) ? "text-center" : ""}
                >
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="p-4 text-right rounded-lg">
        <span className="font-bold mr-4">TOTAL GENERAL: S/</span>
        <span className="font-bold">{totales.total_general.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default TablaLibro;
