import PropTypes from 'prop-types';
import { FaTrashAlt } from 'react-icons/fa';

const TablaDetallesVenta = ({ detalles, handleProductRemove, handleQuantityChange, handleDiscountChange, handlePrecieChange }) => {

  const handleDescuentoChange = (index, newDescuento) => {
    const updatedDetalles = [...detalles];
    updatedDetalles[index].descuento = newDescuento;

    const detalleToUpdate = updatedDetalles[index];
    const precio = parseFloat(detalleToUpdate.precio) || 0;
    const cantidad = parseFloat(detalleToUpdate.cantidad) || 1;
    const descuento = (((parseFloat(newDescuento) / 100) * precio) * cantidad) || 0;
    const subtotal = (precio * cantidad - descuento).toFixed(2);

    detalleToUpdate.subtotal = `S/ ${subtotal}`;
    handleDiscountChange(index, detalleToUpdate);
  };

  const handlePrecioChange = (index, newPrecio) => {
    const updatedDetalles = [...detalles];
    updatedDetalles[index].precio = newPrecio;

    const detalleToUpdate = updatedDetalles[index];
    const precio = parseFloat(newPrecio) || 0;
    const cantidad = parseFloat(detalleToUpdate.cantidad) || 1;
    const descuento = (((parseFloat(detalleToUpdate.descuento) / 100) * precio) * cantidad) || 0;
    const subtotal = (precio * cantidad - descuento).toFixed(2);

    detalleToUpdate.subtotal = `S/ ${subtotal}`;
    handlePrecieChange(index, detalleToUpdate);
  };

  const handleDescuentoBlur = (index) => {
    const updatedDetalles = [...detalles];
    const detalleToUpdate = updatedDetalles[index];
    if (detalleToUpdate.descuento === '' || isNaN(parseFloat(detalleToUpdate.descuento))) {
      detalleToUpdate.descuento = '0';
      handleDescuentoChange(index, '0');
    } else if (parseFloat(detalleToUpdate.descuento) > 100) {
      detalleToUpdate.descuento = '100';
      handleDescuentoChange(index, '100');
    }
  };


  const handlePrecioBlur = (index) => {
    const updatedDetalles = [...detalles];
    const detalleToUpdate = updatedDetalles[index];
    if (detalleToUpdate.precio === '' || isNaN(parseFloat(detalleToUpdate.precio))) {
      detalleToUpdate.precio = '0';
      handlePrecioChange(index, '0');
    }
  };

  const handleCantidadBlur = (index) => {
    const updatedDetalles = [...detalles];
    const detalleToUpdate = updatedDetalles[index];
    if (detalleToUpdate.cantidad === '' || detalleToUpdate.cantidad <= 0) {
      detalleToUpdate.cantidad = '1';
      handleQuantityChange(index, 1);
    }
  };

  const handleIncrement = (index) => {
    const updatedDetalles = [...detalles];
    updatedDetalles[index].cantidad = (parseFloat(updatedDetalles[index].cantidad) || 1) + 1;
    handleQuantityChange(index, updatedDetalles[index].cantidad);
  };

  const handleDecrement = (index) => {
    const updatedDetalles = [...detalles];
    const currentCantidad = parseFloat(updatedDetalles[index].cantidad) || 1;
    if (currentCantidad > 1) {
      updatedDetalles[index].cantidad = currentCantidad - 1;
      handleQuantityChange(index, updatedDetalles[index].cantidad);
    }
  };

  const validateDecimalInput = (e) => {
    const { value } = e.target;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', '.', ...Array.from(Array(10).keys()).map(String)];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length >= 2 && e.key !== 'Backspace') {
        e.preventDefault();
      }
    }
  };
  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th className="w-1/3 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">NOMBRE</th>
          <th className="w-1/8 py-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCUENTO</th>
          <th className="w-1/8 py-2 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">SUBTOTAL</th>
          <th className="w-1/8 py-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider"></th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((detalle, index) => (
          <tr key={detalle.codigo} className="border-b border-gray-200 hover:bg-gray-100">
            <td className="py-3 text-start font-bold">{detalle.nombre}</td>
            <td className="py-3 text-center">
              <div className="spinner flex items-center justify-center">
                <button className="decrement" onClick={() => handleDecrement(index)}>-</button>
                <input
                  type="text"
                  className="w-12 text-center rounded-md border-none"
                  style={{ background: "transparent", outline: "none !important" }}
                  value={detalle.cantidad}
                  onChange={(e) => {
                    const newValue = e.target.value.trim(); // Elimina espacios en blanco al inicio y al final
                    if (newValue === '' || !isNaN(parseInt(newValue))) {
                      // Actualiza el estado solo si el nuevo valor es una cadena vacía o un número válido
                      handleQuantityChange(index, newValue === '' ? '' : Math.max(1, parseFloat(newValue)));
                    }
                  }}
                  onBlur={() => handleCantidadBlur(index)}

                />
              <button className="increment" onClick={() => handleIncrement(index)}>+</button>
              </div>
            </td>
            <td className="py-2 text-start">
              <span className='mr-2'>
                S/
              </span>
              <input
                type="text"
                className="w-12 text-start rounded-md border-none"
                style={{ background: "transparent", outline: "none !important" }}
                value={detalle.precio}
                onChange={(e) => {
                  const newPrecio = e.target.value.trim(); // Elimina espacios en blanco al inicio y al final
                  handlePrecioChange(index, newPrecio);
                }}
                onKeyDown={validateDecimalInput}
                onBlur={() => handlePrecioBlur(index)}
              />
            </td>
            <td className="py-2 text-start">
              <span className='mr-2'>
                %
              </span>
              <input
                type="text"
                className="w-12 text-start rounded-md border-none"
                style={{ background: "transparent", outline: "none !important" }}
                value={detalle.descuento}
                inputMode="numeric"
                onChange={(e) => {
                  const newValue = e.target.value.trim();
                  if (newValue === "") {
                    handleDescuentoChange(index, newValue);
                  } else {
                    const newDescuento = parseFloat(newValue);
                    if (!isNaN(newDescuento) && newDescuento <= 100) {
                      handleDescuentoChange(index, newDescuento);
                    }
                  }
                }}
                onBlur={() => handleDescuentoBlur(index)}
              />
            </td>
            <td className="py-2 text-start">{detalle.subtotal}</td>
            <td className="py-3 text-center">
              <button className="text-red-600 hover:text-red-900" onClick={() => handleProductRemove(detalle.codigo, detalle.cantidad)}>
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
  handleDiscountChange: PropTypes.func.isRequired,
  handlePrecieChange: PropTypes.func.isRequired,
};

export default TablaDetallesVenta;
