import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Divider,
} from "@tremor/react";
import useVentasPDF from "./pdf"; 

export const TableHero = () => {
  const { data, loading, error } = useVentasPDF(); 

  if (loading) return <p>Cargando datos...</p>; 
  if (error) return <p>Error al cargar los datos: {error.message}</p>; 

  return (
    <div className="flex-grow">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        TORMENTA JEANS - 20610588981 / HISTORIAL DE VENTAS
      </h1>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        FACTURAS, BOLETAS, NOTAS DE CREDITO Y VENTA
      </h2>
      <p
        className="text-small text-default-400"
        style={{
          fontSize: "14px",
          pointerEvents: "none",
          userSelect: "none",
          marginTop: "10px",
        }}
      >
        Visualiza el Listado general de ventas en soles.
      </p>

      <div className="max-w-md">
        <Divider className="my-3" />
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>TD</TableHeaderCell>
              <TableHeaderCell>Documento</TableHeaderCell>
              <TableHeaderCell>Ruc/Dni</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>IGV</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Cajero</TableHeaderCell>
              <TableHeaderCell>Sucursal</TableHeaderCell>
              <TableHeaderCell>Método de Pago</TableHeaderCell>
              <TableHeaderCell>Observaciones</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((venta) => (
              <TableRow key={venta.id} className="odd:bg-gray-50 even:bg-gray-100">
                <TableCell>{venta.fecha}</TableCell>
                <TableCell>{venta.tipoComprobante}</TableCell>
                <TableCell>{venta.serieNum}-{venta.num}</TableCell>
                <TableCell>{venta.ruc}</TableCell>
                <TableCell>{venta.cliente_n || venta.cliente_r}</TableCell>
                <TableCell>{venta.igv}</TableCell>
                <TableCell>{venta.total}</TableCell>
                <TableCell>{venta.cajero}</TableCell>
                <TableCell>{venta.nombre_sucursal}</TableCell>
                <TableCell>{venta.metodo_pago}</TableCell>
                <TableCell>{venta.observacion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableHero;
