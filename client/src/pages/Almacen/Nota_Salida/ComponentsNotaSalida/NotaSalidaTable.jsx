import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from './Modals/ConfirmationModal';
import Pagination from '@/components/Pagination/Pagination'; // Asegúrate de ajustar la ruta
import anularNota from '../data/anular_nota_salida'; // Asegúrate de ajustar la ruta
import ReactToPrint from 'react-to-print';
import { Toaster, toast } from "react-hot-toast";
const TablaSalida = ({ salidas }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir2, setIsModalOpenImprimir2] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [notaIdToAnular, setNotaIdToAnular] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Estado para cantidad de elementos por página
  const [almacen, setAlmacen] = useState(() => {
    const savedAlmacen = localStorage.getItem('almacen');
    return savedAlmacen ? parseInt(savedAlmacen) : '';
  });
  const handleSelectChange2 = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir2':
        setIsModalOpenImprimir2(true);
        break;
      case 'anular':
        setNotaIdToAnular(id);
        setIsModalOpenAnular(true);
        break;
      default:
        break;
    }
    event.target.value = '';
  };

  const closeModalImprimir2 = () => {
    setIsModalOpenImprimir2(false);
  };

  const closeModalAnular = () => {
    setIsModalOpenAnular(false);
  };

  const handleConfirmImprimir2 = () => {
    setIsModalOpenImprimir2(false);
  };

  const handleConfirmAnular = async () => {
    if (notaIdToAnular) {
      const result = await anularNota(notaIdToAnular);
      if (result.success) {
        console.log(result.message);
        toast.success('Nota anulada')
        window.location.reload();
      } else {
        toast.error('La nota ya está anulada.')
        console.error(result.message);
      }
    }
    setIsModalOpenAnular(false);
  };

  const handleSelectClick = (event) => {
    event.stopPropagation();
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const savedAlmacen = localStorage.getItem('almacen');
      setAlmacen(savedAlmacen ? parseInt(savedAlmacen, 10) : '');
    };

    window.addEventListener('storage', handleStorageChange);

    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  });

  const getEstadoClassName = (estado) => {
    switch (estado) {
      case 1:
        return 'estado-inactivo';
      case 0:
        return 'estado-activo';
      default:
        return '';
    }
  };

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDetailClick = (id) => {
    console.log(almacen, 'sdsdsds')
    if (almacen){
      navigate(`/almacen/kardex/historico/${id}`);
    } else {
    toast.error('Por favor seleccione un almacén primero para visualizar el kardex');
    }
  };

  const renderSalidaRow = (salida) => (
    <React.Fragment key={salida.id}>
      <tr onClick={() => handleRowClick(salida.id)} className='tr-tabla-ingreso'>
        <td className="text-center">{salida.fecha}</td>
        <td className="text-center">{salida.documento}</td>
        <td className="text-center">{salida.proveedor}</td>
        {/* <td className="text-center">{salida.total_nota}</td> */}
        <td className="text-center">{salida.concepto}</td>
        <td className="text-center">
          <p className={getEstadoClassName(salida.estado)}>
            {salida.estado === 1 ? 'Inactivo' : 'Activo'}
          </p>
        </td>
        <td className="text-center">{salida.usuario}</td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg text-gray-900 text-sm w-20' name="select" onClick={handleSelectClick} onChange={(e) => handleSelectChange2(e, salida.id)}>
            <option value="">...</option>
            <option value="imprimir2">Imprimir</option>
            <option value="anular">Anular</option>
          </select>
        </td>
      </tr>
      {expandedRow === salida.id && renderIngresoDetails(salida.detalles, salida.almacen_O)}
    </React.Fragment>
  );

  const renderIngresoDetails = (detalles, almacen) => (
    <tr className="bg-gray-100">
      <td colSpan="9">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="w-3/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Um</th>
                {/* <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</th> */}
                <th className="w-2/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Almacén</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index} onClick={() => handleDetailClick(detalle.id_producto)} className='tr-tabla-detalle-ingreso'>
                  <td className="text-center py-2 px-4">{detalle.codigo}</td>
                  <td className="text-center py-2 px-4">{detalle.marca}</td>
                  <td className="text-center py-2 px-4">{detalle.descripcion}</td>
                  <td className="text-center py-2 px-4">{detalle.cantidad}</td>
                  <td className="text-center py-2 px-4">{detalle.unidad}</td>
                  {/* <td className="text-center py-2 px-4">{detalle.precio}</td>
                  <td className="text-center py-2 px-4">{detalle.total}</td> */}
                  <td className="text-center py-2 px-4">{almacen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  // Función para obtener las notas que se deben mostrar en la página actual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return salidas.slice(startIndex, endIndex);
  };

  // Número total de páginas
  const totalPages = Math.ceil(salidas.length / itemsPerPage);

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <Toaster />
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOCUMENTO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PROVEEDOR</th>
            {/* <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Total S/.</th> */}
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">USUARIO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageItems().map(renderSalidaRow)}
        </tbody>
      </table>
      {isModalOpenImprimir2 && (
        <ConfirmationModal
          message="¿Desea imprimir esta nota de ingreso?"
          onClose={closeModalImprimir2}
          isOpen={isModalOpenImprimir2}
          onConfirm={handleConfirmImprimir2}
        />
      )}

      {isModalOpenAnular && (
        <ConfirmationModal
          message="¿Desea anular esta nota de ingreso?"
          onClose={closeModalAnular}
          isOpen={isModalOpenAnular}
          onConfirm={handleConfirmAnular}
        />
      )}
      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />

        </div>
        <select
          id="itemsPerPage"
          className="input-c cant-pag-c pr-8 border-gray-300 bg-gray-50 rounded-lg"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>05</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

      </div>
    </div>
  );
};

TablaSalida.propTypes = {
  salidas: PropTypes.array.isRequired,
};

export default TablaSalida;
