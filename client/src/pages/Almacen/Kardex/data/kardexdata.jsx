import { useState } from 'react';

const useKardexData = () => {
  const [ingresos, setIngresos] = useState([
    {
        id: 1,
        codigo: '400-00000375',
        descripcion: 'Producto 1',
        marca: 'Tormenta',
        stockActual: 35,
        cantidad: 5,
        um: 'UND',
        smin: 'null',
        transito : 1,
        detalles: []
      },
      {
        id: 2,
        codigo: '400-00000367',
        descripcion: 'Producto 2',
        marca: 'Tormenta',
        stockActual: 24,
        cantidad: 6,
        um: 'UND',
        smin: 0,
        transito : 43,
        detalles: []
      }
  ]);

  const [detalles, setDetalles] = useState([]);

  const addIngreso = (nuevoIngreso) => {
    setIngresos([...ingresos, nuevoIngreso]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const removeIngreso = (id) => {
    const updatedNIngresos = ingresos.filter((ingreso) => ingreso.id !== id);
    setIngresos(updatedNIngresos);
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  return { ingresos, detalles, addIngreso, addDetalle, removeIngreso, removeDetalle };
};

export default useKardexData;
