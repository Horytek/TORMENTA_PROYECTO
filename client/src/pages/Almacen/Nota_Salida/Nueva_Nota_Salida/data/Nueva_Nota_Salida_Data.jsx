// Ya no usamos este jsx nIngresoData.jsx
import { useState } from 'react';

const useNuevaNotaSalidaData = () => {
  const [salidas, setSalidas] = useState([
    {
      id: 1,
      codigo: '400-00000375',
      descripcion: 'Producto 1',
      marca: 'Tormenta',
      stockActual: 35,
      cantidad: 5,
      estado: 'Activo',
      detalles: []
    },
    {
      id: 2,
      codigo: '400-00000367',
      descripcion: 'Producto 2',
      marca: 'Tormenta',
      stockActual: 24,
      cantidad: 6,
      estado: 'Inactivo',
      detalles: []
    }
  ]);

  const [detalles, setDetalles] = useState([]);

  const addIngreso = (nuevoIngreso) => {
    setSalidas([...ingresos, nuevoIngreso]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const removeIngreso = (id) => {
    const updatedNIngresos = ingresos.filter((ingreso) => ingreso.id !== id);
    setSalidas(updatedNIngresos);
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  return { salidas, detalles, addIngreso, addDetalle, removeIngreso, removeDetalle };
};

export default useNuevaNotaSalidaData;
