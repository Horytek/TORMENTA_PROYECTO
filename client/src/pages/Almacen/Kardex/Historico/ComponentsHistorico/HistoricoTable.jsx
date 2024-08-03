import PropTypes from 'prop-types';
import './HistoricoTable.css';

function HistoricoTabla() {
  const transactions = [
    { date: '09/06/2024', document: '68 / 400-0006245', name: 'CLIENTE VARIOS', entry: 1, sale: 1, stock: 108, price: 30, note: 'VENTA DE PRODUCTOS' },
    { date: '09/06/2024', document: '68 / 400-0006246', name: 'CLIENTE VARIOS', entry: 1, sale: 1, stock: 107, price: 30, note: 'VENTA DE PRODUCTOS' },
    { date: '09/06/2024', document: '68 / 400-0006247', name: 'CLIENTE VARIOS', entry: 1, sale: 1, stock: 106, price: 30, note: 'VENTA DE PRODUCTOS' },
  ];

  const totalEntry = transactions.reduce((total, trans) => total + trans.entry, 0);
  const totalSale = transactions.reduce((total, trans) => total + trans.sale, 0);
  const totalStock = transactions.reduce((total, trans) => total + trans.stock, 0);

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Entra</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Glosa</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <HistoricoFilas key={index} transaction={transaction} />
          ))}
          <tr className="tr-total">
            <td colSpan="3" className="text-center py-2 px-4 font-semibold">TOTAL</td>
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

function HistoricoFilas({ transaction }) {
  return (
    <tr>
      <td className="text-center py-2 px-4">{transaction.date}</td>
      <td className="text-center py-2 px-4">{transaction.document}</td>
      <td className="text-center py-2 px-4">{transaction.name}</td>
      <td className="text-center py-2 px-4">{transaction.entry}</td>
      <td className="text-center py-2 px-4">{transaction.sale}</td>
      <td className="text-center py-2 px-4">{transaction.stock}</td>
      <td className="text-center py-2 px-4">{transaction.price}</td>
      <td className="text-center py-2 px-4">{transaction.note}</td>
    </tr>
  );
}

HistoricoTabla.propTypes = {
  transactions: PropTypes.array.isRequired,
};

export default HistoricoTabla;
