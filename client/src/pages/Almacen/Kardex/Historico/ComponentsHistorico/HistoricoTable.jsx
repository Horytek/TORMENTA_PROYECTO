import React, { useState } from "react";
import PropTypes from "prop-types";
import "./HistoricoTable.css";

function HistoricoTable({ transactions, previousTransactions }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const handleRowClick = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const totalEntry = transactions.reduce(
    (total, trans) => total + (trans.entra ? parseFloat(trans.entra) : 0),
    0
  );
  const totalSale = transactions.reduce(
    (total, trans) => total + (trans.sale ? parseFloat(trans.sale) : 0),
    0
  );
  const totalStock = totalEntry - totalSale;

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Documento
            </th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Entra
            </th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Sale
            </th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Precio
            </th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Glosa
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Yellow Bar for previous transactions */}
          {previousTransactions && previousTransactions.length > 0 && (
            <tr style={{ backgroundColor: "#FFFF00" }}>
              <td colSpan="3" className="text-center font-bold">
                TRANSACCIONES ANTERIORES ({previousTransactions[0].numero} documentos)
              </td>
              <td className="text-center py-2 px-4 font-semibold">
                {previousTransactions[0].entra}
              </td>
              <td className="text-center py-2 px-4 font-semibold">
                {previousTransactions[0].sale}
              </td>
              <td className="text-center py-2 px-4 font-semibold">
                {parseFloat(previousTransactions[0].entra) -
                  parseFloat(previousTransactions[0].sale)}
              </td>
              <td colSpan="2"></td>
            </tr>
          )}

          {transactions.map((transaction, index) => (
            <React.Fragment key={index}>
              <HistoricoFilas
                transaction={transaction}
                isExpanded={expandedRow === index}
                onClick={() => handleRowClick(index)}
              />
              {expandedRow === index && transaction.productos && (
                <tr className="bg-gray-100">
                  <td colSpan="8" className="p-4">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th className="text-center">Código</th>
                          <th className="text-center">Descripción</th>
                          <th className="text-center">Marca</th>
                          <th className="text-center">Cantidad</th>
                        </tr>
                      </thead>

                      <tbody>
                        {transaction.productos.map((producto, pIndex) => (
                          <tr key={pIndex}>
                            <td>{producto.codigo}</td>
                            <td>{producto.descripcion}</td>
                            <td>{producto.marca}</td>
                            <td>{producto.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          <tr className="tr-total">
            <td colSpan="3" className="text-center py-2 px-4 font-semibold">
              TOTAL
            </td>
            <td className="text-center py-2 px-4 font-semibold">{totalEntry}</td>
            <td className="text-center py-2 px-4 font-semibold">{totalSale}</td>
            <td className="text-center py-2 px-4 font-semibold">{totalStock}</td>
            <td colSpan="2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

HistoricoTable.propTypes = {
  transactions: PropTypes.array.isRequired,
  previousTransactions: PropTypes.array, // Optional prop for previous transactions data
};

function HistoricoFilas({ transaction, isExpanded, onClick }) {
  return (
    <tr onClick={onClick} className={`cursor-pointer ${isExpanded ? "bg-gray-200" : ""}`}>
      <td className="text-center py-2 px-4">{transaction.fecha}</td>
      <td className="text-center py-2 px-4">{transaction.documento}</td>
      <td className="text-center py-2 px-4">{transaction.nombre}</td>
      <td className="text-center py-2 px-4">{transaction.entra}</td>
      <td className="text-center py-2 px-4">{transaction.sale}</td>
      <td className="text-center py-2 px-4">{transaction.stock}</td>
      <td className="text-center py-2 px-4">{transaction.precio}</td>
      <td className="text-center py-2 px-4">
        {transaction.glosa || "VENTA POR PRODUCTOS"}
      </td>
    </tr>
  );
}

HistoricoFilas.propTypes = {
  transaction: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default HistoricoTable;
