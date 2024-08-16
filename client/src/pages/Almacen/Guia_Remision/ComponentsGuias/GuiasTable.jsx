import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import ReactToPrint from 'react-to-print';
import anularGuia from '../../data/anular_guia'; // Asegúrate de ajustar la ruta
import { Toaster, toast } from "react-hot-toast";

import img from '@/assets/icono.ico'; // Asegúrate de ajustar la ruta
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TablaGuias = ({ guias }) => {
  // Logo de tormenta pasado a Base64
  const base64Image = 'data:image/png;base64,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';


  // Function to generate PDF
  const generatePDF = (guia) => {
    const now = new Date();
    const fechaGeneracion = now.toLocaleDateString('es-PE'); // Ajusta el formato según tu necesidad
    const horaGeneracion = now.toLocaleTimeString('es-PE'); // Ajusta el formato según tu necesidad

    const peso = isNaN(parseFloat(guia.peso)) ? "0.00" : parseFloat(guia.peso).toFixed(2);

    const observacion = guia.observacion || 'No hay ninguna observacion';
    const cantPaquetes = guia.canti || '0';

    // Define the HTML content with test data
    const htmlContent = `
      <div class="p-5 text-sm leading-6 font-sans w-full">
          <div class="flex justify-between items-center mb-3">
              <div class='flex'>
                  <div class="Logo-compro">
                      <img src="${base64Image}" alt="Logo-comprobante" />
                  </div>
                  <div class="text-start ml-8">
                      <h1 class="text-xl font-extrabold leading-snug text-blue-800">TORMENTA JEANS</h1>
                      <p class="font-semibold leading-snug text-gray-700">TEXTILES CREANDO MODA S.A.C.</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">Central:</span> Cal San Martin 1573 Urb Urrunaga SC Tres</p>
                      <p class="leading-snug text-gray-600">Chiclayo - Chiclayo - Lambayeque</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">TELF:</span> 918378590</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">EMAIL:</span> textiles.creando.moda.sac@gmail.com</p>
                  </div>
              </div>
  
              <div class="text-center border border-gray-400 rounded-md ml-8 overflow-hidden w-80">
                  <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">RUC 20610588981</h2>
                  <div class="bg-blue-200">
                      <h2 class="text-lg font-bold text-gray-900 py-2">GUIA DE REMISION</h2>
                  </div>
                  <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">${guia.numGuia}</h2>
              </div>
          </div>
  
          <div class="container-datos-compro bg-white rounded-lg mb-6 ">
              <div class="grid grid-cols-2 gap-6 mb-6">
                  <div class="space-y-2">
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">NRO. DOCU.:</span> <span class="font-semibold text-gray-600">${guia.documento}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">DESTINATARIO:</span> <span class="font-semibold text-gray-600">${guia.cliente}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">REMITENTE:</span> <span class="font-semibold text-gray-600">TEXTILES CREANDO MODA S.A.C.</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">DIR. PARTIDA:</span><span class="font-semibold text-gray-600"> ${guia.dirpartida}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">DIR. ENTREGA:</span><span class="font-semibold text-gray-600"> ${guia.dirdestino}</span>
                      </p>
                  </div>
                  <div class="space-y-2 ml-auto text-left">
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">FECHA EMISIÓN:</span> <span class="font-semibold text-gray-600">${guia.fecha}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">DOC.REFER:</span> <span class="font-semibold text-gray-600">${guia.numGuia}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">VENDEDOR:</span> <span class="font-semibold text-gray-600">${guia.vendedor}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">CANT. PAQUETES:</span> <span class="font-semibold text-gray-600">${cantPaquetes}</span>
                          <span class="font-bold text-gray-900">PESO: </span> <span class="font-semibold text-gray-600">${peso}</span>
                      </p>
                  </div>
              </div>
          </div>
  
          <table class="w-full border-collapse mb-6 bg-white shadow-md rounded-lg overflow-hidden">
  <thead class="bg-blue-200 text-blue-800">
    <tr>
      <th class="border-b p-3 text-center">Código</th>
      <th class="border-b p-3 text-center">Descripción</th>
      <th class="border-b p-3 text-center">Cant.</th>
      <th class="border-b p-3 text-center">U.M.</th>
    </tr>
  </thead>
  <tbody>
    ${guia.detalles.map(detalle => `
      <tr class="bg-gray-50 hover:bg-gray-100">
        <td class="border-b p-2 text-center">${detalle.codigo}</td>
        <td class="border-b p-2 text-center">${detalle.descripcion}</td>
        <td class="border-b p-2 text-center">${detalle.cantidad}</td>
        <td class="border-b p-2 text-center">${detalle.um}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

  
          <div class="bg-white rounded-lg shadow-lg">
              <div class="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                  <p class="text-md font-semibold text-gray-800 mb-1">OBSERVACION:</p>
                  <div>
                      <p class="text-md font-semibold text-gray-800 items-center">
                      ${observacion}
                      </p>
                  </div>
              </div>
          <br><br/>
          </div>
          <div class="bg-white rounded-lg shadow-lg">
          <div class="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                  <div className="flex-1 mr-6 py-6 pl-6 pr-0">
                      <p className="text-md font-bold text-gray-900 mb-2"> TRANSPORTE: ${guia.transpub ? guia.transpub : guia.transpriv}</p>
                      <div className="space-y-1">
                          <p className="text-sm text-gray-700">DOC. TRANSPORTISTA: ${guia.docpub ? guia.docpub : guia.docpriv}</p>
                      </div>

                      
                  </div>
              </div>
              <div class="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                  <div>
                      <p className="text-md font-bold text-gray-900 mb-2">MOTIVO TRANSPORTE: ${guia.concepto}</p>
                  </div>
              </div>
              <div class="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                  <div>
                      <p className="text-sm text-gray-700">Fecha de Generación:${fechaGeneracion}</p>
                      <p className="text-sm text-gray-700">Hora de Generación: ${horaGeneracion}</p>
                      <p className="text-sm text-gray-700">Generado desde el Sistema de Tormenta S.A.C</p>
                  </div>
              </div>
          </div>
      </div>
    `;
  
    // Convert HTML to PDF
    const options =  {
      margin: [10, 10],
      filename: `${guia.numGuia}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
  
    html2pdf().from(htmlContent).set(options).save();
  };


  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [guiaIdToAnular, setGuiaIdToAnular] = useState(null);

  const handleSelectChange = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir':
        setGuiaIdToAnular(id); // Guarda el ID de la guía seleccionada para imprimir
        setIsModalOpenImprimir(true);
        break;
      case 'anular':
        setGuiaIdToAnular(id);
        setIsModalOpenAnular(true);
        break;
      default:
        break;
    }
    event.target.value = '';
  };


  const closeModalImprimir = () => {
    setIsModalOpenImprimir(false);
  };

  const closeModalAnular = () => {
    setIsModalOpenAnular(false);
  };

  //FALTA LÓGICA PARA IMPRIMIR



  const handleConfirmImprimir = () => {
    const guiaSeleccionada = guias.find((guia) => guia.id === guiaIdToAnular); // Encuentra la guía seleccionada por ID
    if (guiaSeleccionada) {
      generatePDF(guiaSeleccionada); // Genera el PDF solo para la guía seleccionada
    }
    setIsModalOpenImprimir(false); // Cierra el modal
  };


  const handleConfirmAnular = async () => {
    if (guiaIdToAnular) {
      const result = await anularGuia(guiaIdToAnular); // Llamada a la función para anular la guía
      if (result.success) {
        toast.success('Guía de remisión anulada');
        window.location.reload();
      } else {
        toast.error(result.message);
        console.error(result.message);
      }
    }
    setIsModalOpenAnular(false);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderGuiaRow = (guia) => (
    <React.Fragment key={guia.id}>
      <tr onClick={() => toggleRow(guia.id)} className="tr-tabla-guia">
        <td className="text-center">{guia.fecha}</td>
        <td className="text-center">{guia.numGuia}</td>
        <td className="font-bold text-center">
          <div className="whitespace-normal">{guia.cliente}</div>
          <div className="text-gray-500 whitespace-normal">{guia.documento}</div>
        </td>
        <td className="font-bold text-center">
          <div className="whitespace-normal">{guia.vendedor}</div>
          <div className="text-gray-500 whitespace-normal">{guia.dni}</div>
        </td>
        <td className="font-bold text-center">
          <div>{guia.serieNum}</div>
          <div className="text-gray-500">{guia.num}</div>
        </td>
        <td className="text-center">{guia.concepto}</td>
        <td className="text-center" style={{ color: guia.estado === 'Activo' ? '#117B34FF' : '#E05858FF', fontWeight: "400" }}>
          <div className="ml-2 px-2.5 py-1.5 rounded-full" style={{ background: guia.estado === 'Activo' ? 'rgb(191, 237, 206)' : '#F5CBCBFF' }}>
            <span>{guia.estado}</span>
          </div>
        </td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm' name="select" onChange={(e) => handleSelectChange(e, guia.id)}>
            <option value="">...</option>
            <option value="imprimir">Guardar PDF</option>
            <option value="anular">Anular</option>
          </select>
        </td>
      </tr>
      {expandedRow === guia.id && renderGuiaDetails(guia.detalles)}
    </React.Fragment>
  );

  const renderGuiaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="10">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>

              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="font-bold text-center">{detalle.codigo}</td>
                  <td className="font-bold text-center">{detalle.marca}</td>
                  <td className="text-center">{detalle.descripcion}</td>
                  <td className="text-center">{detalle.cantidad}</td>
                  <td className="text-center">{detalle.um}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="container-table-guia px-4 bg-white rounded-lg">
      <Toaster />
      <table className="tabla-guia table-auto w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NUM GUIA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/5 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOC VENTA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/7 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {guias.length > 0 ? (
            guias.map((guia) => renderGuiaRow(guia))
          ) : (
            <tr>
              <td colSpan="10" className="text-center py-4">No se encontraron resultados</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpenImprimir && (
        <ConfirmationModal
          message="¿Desea imprimir esta guía?"
          onClose={closeModalImprimir}
          isOpen={isModalOpenImprimir}
          onConfirm={handleConfirmImprimir}
        />
      )}

      {isModalOpenAnular && (
        <ConfirmationModal
          message="¿Desea anular esta guía?"
          onClose={closeModalAnular}
          isOpen={isModalOpenAnular}
          onConfirm={handleConfirmAnular}
        />
      )}
    </div>
  );
};

TablaGuias.propTypes = {
  guias: PropTypes.array.isRequired,
};

export default TablaGuias;
