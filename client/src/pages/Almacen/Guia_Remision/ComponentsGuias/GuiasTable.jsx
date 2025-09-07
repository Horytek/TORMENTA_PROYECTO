import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip, ScrollShadow, Pagination, Button } from '@heroui/react';
import { FaFilePdf } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Toaster, toast } from "react-hot-toast";
import anularGuia from '../../data/anular_guia';
//import html2pdf from 'html2pdf.js';
import { getEmpresaDataByUser } from "@/services/empresa.services";
const itemsPerPageDefault = 10;

const TablaGuias = ({ guias, onGuiaAnulada }) => {
  const [empresaData, setEmpresaData] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageDefault);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [guiaIdToAnular, setGuiaIdToAnular] = useState(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const data = await getEmpresaDataByUser();
        setEmpresaData(data);
        if (data?.logotipo && !data.logotipo.startsWith('data:image')) {
          const response = await fetch(data.logotipo);
          const blob = await response.blob();
          const reader = new window.FileReader();
          reader.onloadend = () => setLogoBase64(reader.result);
          reader.readAsDataURL(blob);
        } else {
          setLogoBase64(data?.logotipo || null);
        }
      } catch (error) {
        setEmpresaData(null);
        setLogoBase64(null);
      }
    };
    fetchEmpresa();
  }, []);

  // Paginación
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentGuias = guias.slice(indexOfFirst, indexOfLast);


  // Function to generate PDF
  const generatePDF = (guia) => {
  const peso = isNaN(parseFloat(guia.peso)) ? "0.00" : parseFloat(guia.peso).toFixed(2);
  const observacion = guia.observacion || 'No hay ninguna observacion';
  const cantPaquetes = guia.canti || '0';

  // Usa los datos de empresa obtenidos dinámicamente
  const empresaNombre = empresaData?.nombreComercial || 'TORMENTA JEANS';
  const empresaRazon = empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
  const empresaDireccion = empresaData?.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
  const empresaUbicacion = `${empresaData?.distrito || 'Chi'} - ${empresaData?.provincia || 'Chiclayo'} - ${empresaData?.departamento || 'Lambayeque'}`;
  const empresaTelefono = empresaData?.telefono || '918';
  const empresaEmail = empresaData?.email || 'textiles';
  const empresaRuc = empresaData?.ruc || '20';

  // Usa la fecha y hora del registro
  const fechaGeneracion = guia.fecha || '';
  const horaGeneracion = guia.h_generacion || '';

    // Define the HTML content with test data
    const htmlContent = `
     <div class="p-5 text-sm leading-6 font-sans w-full">
          <div class="flex justify-between items-center mb-3">
              <div class='flex'>
                  <div class="Logo-compro">
                      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo-comprobante" />` : ''}
                  </div>
                  <div class="text-start ml-8">
                      <h1 class="text-xl font-extrabold leading-snug text-blue-800">${empresaNombre}</h1>
                      <p class="font-semibold leading-snug text-gray-700">${empresaRazon}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">Central:</span> ${empresaDireccion}</p>
                      <p class="leading-snug text-gray-600">${empresaUbicacion}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">TELF:</span> ${empresaTelefono}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">EMAIL:</span> ${empresaEmail}</p>
                  </div>
              </div>
              <div class="text-center border border-gray-400 rounded-md ml-8 overflow-hidden w-80">
                  <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">RUC ${empresaRuc}</h2>
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
                      <p className="text-sm text-gray-700">Generado desde el Sistema de Hyrotek</p>
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

  const handleRowClick = (guia) => {
    setSelectedGuia(selectedGuia?.id === guia.id ? null : guia);
  };

  const handleSelectChange = (event, id) => {
    const value = event.target.value;
    if (value === 'imprimir') {
      setGuiaIdToAnular(id);
      setIsModalOpenImprimir(true);
    } else if (value === 'anular') {
      setGuiaIdToAnular(id);
      setIsModalOpenAnular(true);
    }
    event.target.value = '';
  };

  const closeModalImprimir = () => setIsModalOpenImprimir(false);
  const closeModalAnular = () => setIsModalOpenAnular(false);

  const handleConfirmAnular = async () => {
    if (guiaIdToAnular) {
      const result = await anularGuia(guiaIdToAnular);
      if (result.success) {
        toast.success('Guía de remisión anulada');
        // Actualizar el array local en lugar de recargar la página
        if (onGuiaAnulada) {
          onGuiaAnulada(guiaIdToAnular);
        }
      } else {
        toast.error(result.message);
      }
    }
    setIsModalOpenAnular(false);
  };
  
  const handleConfirmImprimir = () => {
    const guiaSeleccionada = guias.find((guia) => guia.id === guiaIdToAnular); // Encuentra la guía seleccionada por ID
    if (guiaSeleccionada) {
      generatePDF(guiaSeleccionada); // Genera el PDF solo para la guía seleccionada
    }
    setIsModalOpenImprimir(false); // Cierra el modal
  };


  return (
    <>
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-0">
        <ScrollShadow hideScrollBar className="rounded-2xl">
          <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
            <thead>
              <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
                <th className="py-2 px-2 text-left">FECHA</th>
                <th className="py-2 px-2 text-left">N° GUÍA</th>
                <th className="py-2 px-2 text-left">CLIENTE</th>
                <th className="py-2 px-2 text-left">VENDEDOR</th>
                <th className="py-2 px-2 text-left">DOC VENTA</th>
                <th className="py-2 px-2 text-left">CONCEPTO</th>
                <th className="py-2 px-2 text-center">ESTADO</th>
                <th className="py-2 px-2 text-center w-32">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentGuias.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">Sin guías para mostrar</td>
                </tr>
              ) : (
                currentGuias.map((guia, idx) => (
                  <tr
                    key={guia.id}
                    className={`transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                    } hover:bg-blue-100/60`}
                    onClick={() => handleRowClick(guia)}
                  >
                    <td className="py-1.5 px-2">
                      <Tooltip
                        content={
                          <div className="text-sm text-gray-800">
                            <p>
                              <strong>Hora de generación:</strong>{" "}
                              {guia.h_generacion
                                ? new Date(`1970-01-01T${guia.h_generacion}`).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  })
                                : "N/A"}
                            </p>
                            <p>
                              <strong>Fecha y hora de anulación:</strong>{" "}
                              {guia.f_anulacion
                                ? new Date(guia.f_anulacion).toLocaleString("es-ES", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  })
                                : "N/A"}
                            </p>
                          </div>
                        }
                        placement="top"
                        className="bg-white shadow-lg rounded-lg p-2 border border-gray-300"
                      >
                        <span>{guia.fecha}</span>
                      </Tooltip>
                    </td>
                    <td className="py-1.5 px-2">{guia.numGuia}</td>
                    <td className="py-1.5 px-2">{guia.cliente} <div className='text-gray-500 whitespace-normal'>{guia.documento}</div></td>
                    <td className="py-1.5 px-2">{guia.vendedor} <div className='text-gray-500 whitespace-normal'>{guia.dni}</div></td>
                    <td className="py-1.5 px-2">{guia.serieNum}-{guia.num}</td>
                    <td className="py-1.5 px-2">{guia.concepto}</td>
                    <td className="py-1.5 px-2 text-center">
                      <Tooltip
                        content={
                          guia.estado === 'Inactivo'
                            ? (
                              <span>
                                <strong>Anulado por:</strong>{" "}
                                {guia.u_modifica ? guia.u_modifica : "N/A"}
                              </span>
                            )
                            : (
                              <span>
                                <strong>Estado:</strong> Activo
                              </span>
                            )
                        }
                        placement="top"
                        className="bg-white shadow-lg rounded-lg p-2 border border-gray-300"
                      >
                        <span>
                          <Chip color={guia.estado === 'Activo' ? 'success' : 'danger'} size="lg" variant="flat">
                            {guia.estado}
                          </Chip>
                        </span>
                      </Tooltip>
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip content="Imprimir PDF">
                          <Button
                            isIconOnly
                            variant="light"
                            color="primary"
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectChange({ target: { value: 'imprimir' } }, guia.id);
                            }}
                          >
                            <FaFilePdf />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Anular guía">
                          <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectChange({ target: { value: 'anular' } }, guia.id);
                            }}
                          >
                            <TiDeleteOutline />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollShadow>
      </div>
      {/* Detalles de la guía seleccionada */}
      {selectedGuia && (
        <div className="flex-1 ml-4 p-4 border-l border-gray-300 bg-white rounded-2xl mt-4">
          <h3 className="font-bold text-lg mb-2">Detalles de Guía</h3>
          <Table shadow={"md"} className="rounded-lg overflow-hidden">
            <TableHeader>
              <TableColumn>Código</TableColumn>
              <TableColumn>Marca</TableColumn>
              <TableColumn>Descripción</TableColumn>
              <TableColumn>Cantidad</TableColumn>
              <TableColumn>UM</TableColumn>
            </TableHeader>
            <TableBody>
              {selectedGuia.detalles.map((detalle, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">{detalle.codigo}</TableCell>
                  <TableCell className="text-xs">{detalle.marca}</TableCell>
                  <TableCell className="text-xs">{detalle.descripcion}</TableCell>
                  <TableCell className="text-xs">{detalle.cantidad}</TableCell>
                  <TableCell className="text-xs">{detalle.um}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Modales de confirmación */}
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
    </>
  );
};

TablaGuias.propTypes = {
  guias: PropTypes.array.isRequired,
};

export default TablaGuias;