import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import './NotaIngresoTable.css';
import anularNota from '../data/anular_nota_ingreso';
import Pagination from '@/components/Pagination/Pagination';
import ReactToPrint from 'react-to-print';

const TablaIngresos = ({ ingresos }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir2, setIsModalOpenImprimir2] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [isModalOpenClonar, setIsModalOpenClonar] = useState(false);
  const [notaIdToAnular, setNotaIdToAnular] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

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

  const closeModalClonar = () => {
    setIsModalOpenClonar(false);
  };

  const handleConfirmImprimir2 = () => {
    setIsModalOpenImprimir2(false);
  };

  const handleConfirmAnular = async () => {
    if (notaIdToAnular) {
      const result = await anularNota(notaIdToAnular);
      if (result.success) {
        console.log(result.message);
        window.location.reload();
      } else {
        console.error(result.message);
      }
    }
    setIsModalOpenAnular(false);
  };

  const handleConfirmClonar = () => {
    console.log('Nota clonada:', notaIdToAnular);
    setIsModalOpenClonar(false);
  };

  const handleSelectClick = (event) => {
    event.stopPropagation();
  };

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
    window.open(`/almacen/kardex/historico/${id}`, '_blank');
  };

  const renderIngresoRow = (ingreso) => (
    <React.Fragment key={ingreso.id}>
      <tr onClick={() => handleRowClick(ingreso.id)} className='tr-tabla-ingreso'>
        <td className="text-center">{ingreso.fecha}</td>
        <td className="text-center">{ingreso.documento}</td>
        <td className="text-center">{ingreso.proveedor}</td>
        <td className="text-center">{ingreso.concepto}</td>
        <td className="text-center">{ingreso.almacen_D}</td>
        <td className="text-center">{ingreso.usuario}</td>
        <td className="text-center">
          <p className={getEstadoClassName(ingreso.estado)}>
            {ingreso.estado === 1 ? 'Inactivo' : 'Activo'}
          </p>
        </td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm' name="select" onClick={handleSelectClick} onChange={(e) => handleSelectChange2(e, ingreso.id)}>
            <option value="">...</option>
            <ReactToPrint
              trigger={() => {
                return <option value="imprimir2">Imprimir</option>
              }}
                                          content={()=>this.componentRef}
                            documentTitle='TORMENTA JEANS - 20610588981'
                            pageSytle="print"
            />
            <option value="anular">Anular</option>
          </select>
        </td>
      </tr>
      {expandedRow === ingreso.id && renderIngresoDetails(ingreso.id, ingreso.detalles)}
    </React.Fragment>
  );

  const renderIngresoDetails = (id, detalles) => (
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
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index} onClick={() => handleDetailClick(id)} className='tr-tabla-detalle-ingreso'>
                  <td className="text-center py-2 px-4">{detalle.codigo}</td>
                  <td className="text-center py-2 px-4">{detalle.marca}</td>
                  <td className="text-center py-2 px-4">{detalle.descripcion}</td>
                  <td className="text-center py-2 px-4">{detalle.cantidad}</td>
                  <td className="text-center py-2 px-4">{detalle.unidad}</td>
                  <td className="text-center py-2 px-4">{detalle.precio}</td>
                  <td className="text-center py-2 px-4">{detalle.total}</td>
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
    return ingresos.slice(startIndex, endIndex);
  };

  // Número total de páginas
  const totalPages = Math.ceil(ingresos.length / itemsPerPage);

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOCUMENTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PROVEEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ALMACÉN DESTINO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">USUARIO</th>
            <th className="w-1/12text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageItems().map(renderIngresoRow)}
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

      {isModalOpenClonar && (
        <ConfirmationModal
          message="¿Desea clonar esta nota de ingreso?"
          onClose={closeModalClonar}
          isOpen={isModalOpenClonar}
          onConfirm={handleConfirmClonar}
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

TablaIngresos.propTypes = {
  ingresos: PropTypes.array.isRequired,
};

export default TablaIngresos;
