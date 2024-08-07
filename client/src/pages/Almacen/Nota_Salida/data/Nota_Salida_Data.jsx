// Ya no usamos este jsx nIngresoData.jsx
import { useState } from 'react';

const useNotaSalidaData = () => {
  const [salidas, setSalidas] = useState([
    {
      id: 1,
      fecha: '11/07/2024',
      documento: '400-00000375',
      proveedor: 'SALIDA - TALLER',
      total: 740,
      concepto: 'COMPRA EN EL PAIS',
      estado: 'Activo',
      detalles: [
        { codigo: '0101060003', linea: 'TORMENTA JEANS',descripcion: 'DASHIR 1 BOTONES NEGRO' ,cantidad: 10,  um:'UND', precio: 50 , total: 500, almacen:'04', bar: 'NOT'  },
        { codigo: '0101010041', linea: 'TORMENTA JEANS',descripcion: 'PANTALÓN RIZOZ TORMENTA' ,cantidad: 12,  um:'UND', precio: 20 , total: 240, almacen:'04', bar: 'NOT' } 
      ]
    },
    {
      id: 2,
      fecha: '12/07/2024',
      documento: '400-00000367',
      proveedor: 'SALIDA - CENTRAL 52-53',
      total: 50,
      concepto: 'COMPRA EN EL PAIS',
      estado: 'Inactivo',
      detalles: [
        { codigo: '0101010016', linea: 'TORMENTA JEANS',descripcion: '3 BOTONES PLOMO - TORMENTA' ,cantidad: 1,  um:'UND', precio: 50 , total: 50, almacen:'04', bar: 'NOT'  }
      ]
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

export default useNotaSalidaData;
