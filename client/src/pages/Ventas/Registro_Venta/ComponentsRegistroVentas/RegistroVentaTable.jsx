import PropTypes from 'prop-types';
import { FaTrashAlt } from 'react-icons/fa';

const TablaDetallesVenta = ({ detalles, handleProductRemove, handleQuantityChange }) => {
  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th className="w-1/3 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">NOMBRE</th>
          <th className="w-1/8 py-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCUENTO</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">IGV</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">SUBTOTAL</th>
          <th className="w-1/8 py-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider"></th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((item, index) => (
          <tr key={index}>
            <td className="py-2 font-bold">{item.nombre}</td>
            <td className="py-2">
              <div className="spinner flex justify-center">
                <button className="decrement" onClick={() => handleQuantityChange(index, item.cantidad - 1)}>-</button>
                <span>{item.cantidad}</span>
                <button className="increment" onClick={() => handleQuantityChange(index, item.cantidad + 1)}>+</button>
              </div>
            </td>
            <td className="py-2 text-start">S/ {item.precio}</td>
            <td className="py-2 text-start">S/ {item.descuento}</td>
            <td className="py-2 text-start">{item.igv}</td>
            <td className="py-2 text-start">{item.subtotal}</td>
            <td className="py-2 text-center">
              <button className="text-red-500" onClick={() => handleProductRemove(item.codigo, item.cantidad)} style={{ fontSize: '20px' }}>
                <FaTrashAlt />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

TablaDetallesVenta.propTypes = {
  detalles: PropTypes.array.isRequired,
  handleProductRemove: PropTypes.func.isRequired,
  handleQuantityChange: PropTypes.func.isRequired,
};

export default TablaDetallesVenta;
