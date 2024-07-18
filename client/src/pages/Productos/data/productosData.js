import axios from 'axios';

const getProductosRequest = async () => {
  try {
    const response = await axios.get('http://localhost:4000/api/productos');
    
    if (response.data.code === 1) {
      const productos = response.data.data.map(item => ({
        descripcion: item.descripcion,
        nom_subcat: item.nom_subcat,
        nom_marca: item.nom_marca,
        undm: item.undm,
        precio: parseFloat(item.precio), // Convertir el precio a número flotante
        cod_barras: item.cod_barras || '-', // Manejar el caso donde cod_barras pueda ser null
        estado: parseInt(item.estado) === 0 ? 'Inactivo' : 'Activo' // Convertir estado a texto según convención de productosData
      }));
      
      return productos; // Devuelve el array de productos transformados
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      throw new Error('Error en la solicitud HTTP');
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    throw error;
  }
};

export default getProductosRequest;

// const productosData = [
//   {
//     descripcion: 'Camisa de Algodón',
//     nom_subcat: 'Producto',
//     nom_marca: 'Camisas',
//     undm: 'Unidad',
//     precio: 25.99,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Pantalón de Mezclilla',
//     nom_subcat: 'Producto',
//     nom_marca: 'Pantalones',
//     undm: 'Unidad',
//     precio: 45.50,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Materia Prima Algodón',
//     nom_subcat: 'Materia Prima',
//     nom_marca: 'Materia Prima',
//     undm: 'Kilogramo',
//     precio: 10.00,
//     cod_barras: '-',
//     estado: 'Inactivo'
//   },
//   {
//     descripcion: 'Polos de Algodón',
//     nom_subcat: 'Producto',
//     nom_marca: 'Polos',
//     undm: 'Unidad',
//     precio: 20.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Fibras Sintéticas',
//     nom_subcat: 'Materia Prima',
//     nom_marca: 'Materia Prima',
//     undm: 'Kilogramo',
//     precio: 12.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Vestido de Noche',
//     nom_subcat: 'Producto',
//     nom_marca: 'Vestidos',
//     undm: 'Unidad',
//     precio: 60.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Hilo de Algodón',
//     nom_subcat: 'Materia Prima',
//     nom_marca: 'Materia Prima',
//     undm: 'Carrete',
//     precio: 15.00,
//     cod_barras: '-',
//     estado: 'Inactivo'
//   },
//   {
//     descripcion: 'Chompa de Lana',
//     nom_subcat: 'Producto',
//     nom_marca: 'Chompas',
//     undm: 'Unidad',
//     precio: 35.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Tela de Poliéster',
//     nom_subcat: 'Materia Prima',
//     nom_marca: 'Materia Prima',
//     undm: 'Metro',
//     precio: 8.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
//   {
//     descripcion: 'Chaqueta de Cuero',
//     nom_subcat: 'Producto',
//     nom_marca: 'Chaquetas',
//     undm: 'Unidad',
//     precio: 120.00,
//     cod_barras: '-',
//     estado: 'Activo'
//   },
// ];

// export default productosData;