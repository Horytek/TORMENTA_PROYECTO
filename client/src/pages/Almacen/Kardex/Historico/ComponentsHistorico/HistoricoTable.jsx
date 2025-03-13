import React, { useState } from "react";
import PropTypes from "prop-types";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardHeader, Divider, CardBody, Pagination } from "@nextui-org/react";
import "./HistoricoTable.css";

function HistoricoTable({ transactions, previousTransactions }) {
  const [collapsedTransaction, setCollapsedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const toggleRow = (transaction) => {
    setCollapsedTransaction(collapsedTransaction === transaction ? null : transaction);
  };

  const calculateTotal = (type) =>
    transactions.reduce((total, trans) => total + (parseFloat(trans[type]) || 0), 0);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Contenedor de Cards en una fila */}
      <div className="flex space-x-4">
        {/* Card de transacciones anteriores */}
        {previousTransactions?.length > 0 && (
          <Card className="max-w-[400px]">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-lg">Transacciones Anteriores</p>
                <p className="text-gray-600 text-md">{previousTransactions[0].numero} documento(s)</p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <p className="font-semibold">Entra:{previousTransactions[0].entra}</p>
              <p className="font-semibold">Sale: {previousTransactions[0].sale}</p>
              <p className="font-semibold">Stock: {parseFloat(previousTransactions[0].entra) - parseFloat(previousTransactions[0].sale)}</p>
            </CardBody>
            <Divider />
          </Card>
        )}

        {/* Card de totales */}
        <Card className="max-w-[400px]">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-lg">Stock actual del producto</p>
              
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <p className="font-semibold">Entra:{calculateTotal("entra")}</p>
            <p className="font-semibold">Sale: {calculateTotal("sale")}</p>
            <p className="font-semibold">Stock: {calculateTotal("entra") - calculateTotal("sale")}</p>
          </CardBody>
          <Divider />
        </Card>
      </div>

      <div className="flex w-full">
        {/* Tabla principal ocupando toda la pantalla */}
        <div className={`container-table-reg px-4 bg-white rounded-lg transition-all ${collapsedTransaction ? 'w-2/3' : 'w-full'}`}>
          <Table aria-label="Historico de Transacciones">
            <TableHeader>
              {["Fecha", "Documento", "Nombre", "Entra", "Sale", "Stock", "Precio", "Glosa"].map((header) => (
                <TableColumn key={header}>{header}</TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent={"No hay transacciones registradas."}>
              {paginatedTransactions.map((transaction, index) => (
                <TableRow key={index} onClick={() => toggleRow(transaction)}>
                  {["fecha", "documento", "nombre", "entra", "sale", "stock", "precio", "glosa"].map((field) => (
                    <TableCell className="text-xs" key={field}>{transaction[field] || "0"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          <div className="mt-4 flex justify-between">
            <Pagination
              showControls
              color="primary"
              page={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />

            <select
              id="itemsPerPage"
              className="border border-gray-300 bg-gray-50 rounded-lg w-20 text-center"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>05</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Tabla de productos a la derecha */}
        {collapsedTransaction && (
          <div className="w-1/3 ml-4 bg-white border-l border-gray-300 p-4 rounded-lg shadow-lg transition-all">
            <h3 className="text-lg font-bold mb-2">Detalles de Productos</h3>
            <Table aria-label="Detalles de Productos">
              <TableHeader>
                {["Código", "Descripción", "Marca", "Cantidad"].map((header) => (
                  <TableColumn key={header}>{header}</TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={"No se encontró detalles de la transacción."}>
                {collapsedTransaction.productos && collapsedTransaction.productos.length > 0 ? (
                  collapsedTransaction.productos.map((producto, idx) => (
                    <TableRow key={idx}>
                      {["codigo", "descripcion", "marca", "cantidad"].map((field) => (
                        <TableCell className="text-xs" key={field}>{producto[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

HistoricoTable.propTypes = {
  transactions: PropTypes.array.isRequired,
  previousTransactions: PropTypes.array,
};

export default HistoricoTable;
