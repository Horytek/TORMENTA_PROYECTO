// GuiasData.jsx
import { useState } from 'react';

const useGuiasData = () => {
  const [guias, setGuias] = useState([
    {
        id:1,
        fecha: '2023-01-01',
        num_guia: "T400-00000035",
        cliente: "Jorge Saldarriaga",
        vendedor: "OFICINA",
        docventa: "20601944368",
        moneda:"SOLES",
        total:'S/ 500',
        concepto:"concepto1",
        estadosun:"Activo",
        detalles: [
        { codigo: '001', marca: 'Soda', descripcion: 'Pantalon Jean Resgasdo Talla 32 - Azul', cantidad: 2, um: 'Unidad', precio: 'S/ 50', total: 'S/ 100', almacen: 'almacen1' },
        { codigo: '002', marca: 'Platanitos', descripcion: 'Vestido jean Talla 28 - Celeste', cantidad: 1, um: 'Unidad', precio: 'S/ 100', total: 'S/ 100', almacen: 'almacen2'},
        { codigo: '003', marca: 'All Basics', descripcion: 'Vestido jean Talla 28 - Rojo', cantidad: 3, um: 'Unidad', precio: 'S/ 20', total: 'S/ 60', almacen: 'almacen2' }
      ]
    },
    {
        id:2,
        fecha: '2023-06-12',
        num_guia: "T400-00000036",
        cliente: "Luciano Yalta",
        vendedor: "OFICINA",
        docventa: "20601944366",
        moneda:"SOLES",
        total:'S/ 1200',
        concepto:"concepto2",
        estadosun:"Activo",
        detalles: [
        { codigo: '004', marca: 'Soda', descripcion: 'Pantalon Jean Resgasdo Talla 30 - Beige', cantidad: 5, um: 'Unidad', precio: 'S/ 50', total: 'S/ 250', almacen: 'almacen1' }
      ]
    },
    {
        id:3,
        fecha: '2024-04-21',
        num_guia: "T400-00000037",
        cliente: "Jeanpipi Castaneda",
        vendedor: "OFICINA",
        docventa: "20601674368",
        moneda:"SOLES",
        total:'S/ 2500',
        concepto:"concepto3",
        estadosun:"Activo",
      detalles: [
        { codigo: '004', marca: 'Prada', descripcion: 'Polo basico Azul', cantidad: 5, um: 'Unidad', precio: 'S/ 50', total: 'S/ 250', almacen: 'almacen3' }
      ]
    },
    {
        id:4,
        fecha: '2023-12-12',
        num_guia: "T400-00000038",
        cliente: "Marlon Vilchez",
        vendedor: "OFICINA",
        docventa: "20541944368",
        moneda:"SOLES",
        total:'S/ 5000',
        concepto:"concepto4",
        estadosun:"Activo",
      detalles: [
        {  codigo: '005', marca: 'Carolina Herrera', descripcion: 'Polo basico rojo', cantidad: 6, um: 'Unidad', precio: 'S/ 60', total: 'S/ 360', almacen: 'almacen3' }
      ]
    },
    {
        id:5,
        fecha: '2023-10-12',
        num_guia: "T400-00000039",
        cliente: "Javiercito Rojas",
        vendedor: "OFICINA",
        docventa: "27561944368",
        moneda:"SOLES",
        total:'S/ 5400',
        concepto:"concepto5",
        estadosun:"Activo",
      detalles: [
        {  codigo: '006', marca: 'Prada', descripcion: 'Pantalon Jean Cargo Beige', cantidad: 3, um: 'Unidad', precio: 'S/ 100', total: 'S/ 300', almacen: 'almacen3'  }
      ]
    }
  ]);

  const [detalles, setDetalles] = useState([]);

  const addGuia = (nuevaGuia) => {
    setGuias([...guias, nuevaGuia]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const removeGuia = (id) => {
    const updateGuias = guias.filter((guia) => guia.id !== id);
    setGuias(updateGuias);
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  return { guias, detalles, addGuia, addDetalle, removeGuia, removeDetalle };
};

export default useGuiasData;
