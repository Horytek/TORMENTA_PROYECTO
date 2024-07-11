import PropTypes from 'prop-types';
import { FaTrashAlt } from 'react-icons/fa';

const TablaDetallesVenta = ({ detalles, handleProductRemove, handleQuantityChange }) => {
  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-left">NOMBRE</th>
          <th className="py-2 px-4 border-b text-center">CANTIDAD</th>
          <th className="py-2 px-4 border-b text-center">PRECIO</th>
          <th className="py-2 px-4 border-b text-center">DESCUENTO</th>
          <th className="py-2 px-4 border-b text-center">IGV</th>
          <th className="py-2 px-4 border-b text-center">SUBTOTAL</th>
          <th className="py-2 px-4 border-b text-center"></th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((item, index) => (
          <tr key={index}>
            <td className="py-2 px-4 border-b font-bold">{item.nombre}</td>
            <td className="py-2 px-4 border-b text-center">
              <div className="spinner">
                <button className="decrement" onClick={() => handleQuantityChange(index, item.cantidad - 1)}>-</button>
                <span>{item.cantidad}</span>
                <button className="increment" onClick={() => handleQuantityChange(index, item.cantidad + 1)}>+</button>
              </div>
            </td>
            <td className="py-2 px-4 border-b text-center">{item.precio}</td>
            <td className="py-2 px-4 border-b text-center">{item.descuento}</td>
            <td className="py-2 px-4 border-b text-center">{item.igv}</td>
            <td className="py-2 px-4 border-b text-center">{item.subtotal}</td>
            <td className="py-2 px-4 border-b text-center">
              <button className="text-red-500" onClick={() => handleProductRemove(item.codigo, item.cantidad)}>
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
