import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { FaFilePdf, FaEye } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import anularNota from '../data/anular_nota_ingreso';
import { toast } from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { usePermisos } from '@/routes';
import { getEmpresaDataByUser } from "@/services/empresa.services";


const TablaIngresos = ({ ingresos }) => {
  const [empresaData, setEmpresaData] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir2, setIsModalOpenImprimir2] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [notaIdToAnular, setNotaIdToAnular] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchEmpresaData = async () => {
      try {
        const data = await getEmpresaDataByUser();
        setEmpresaData(data);
      } catch (error) {
        console.error("Error al obtener los datos de la empresa:", error);
      }
    };
    fetchEmpresaData();
  }, []);



  const generatePDFIngreso = async (ingreso) => {
    // 1. Convertir el logo a base64 si no lo está ya
    let logoBase64 = empresaData?.logotipo;
    
    // Si el logo es una URL y no base64, convertirlo
    if (empresaData?.logotipo && !empresaData.logotipo.startsWith('data:image')) {
      try {
        const response = await fetch(empresaData.logotipo);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error al convertir el logo:", error);
        logoBase64 = null;
      }
    }
  
    // 2. Datos de la empresa
    const empresaNombre = empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
    const empresaDireccion = empresaData?.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
    const empresaUbicacion = `${empresaData?.distrito || 'Chiclayo'} - ${empresaData?.provincia || 'Chiclayo'} - ${empresaData?.departamento || 'Lambayeque'}`;
    const empresaTelefono = empresaData?.telefono || '918378590';
    const empresaEmail = empresaData?.email || 'textiles.creando.moda.sac@gmail.com';
    const empresaRuc = empresaData?.ruc || '20610588981';
    const empresaNombreComercial = empresaData?.nombreComercial || 'TORMENTA JEANS';
  
    // 3. HTML Content con el logo
    const htmlContent = `
      <style>
        .logo-empresa {
          width: 180px;
          height: 180px;
          object-fit: contain;
        }
        .observacion-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 1rem;
          margin-top: 1.5rem;
        }
      </style>
  
      <div class="p-5 text-sm leading-6 font-sans w-full">
          <div class="flex justify-between items-start mb-3">
              <div class='flex'>
                  ${logoBase64 ? `
                  <div class="Logo-compro mr-4">
                      <img src="${logoBase64}" alt="Logo-comprobante" class="logo-empresa" />
                  </div>
                  ` : ''}
                  <div class="text-start">
                      <h1 class="text-xl font-extrabold leading-snug text-blue-800">${empresaNombreComercial}</h1>
                      <p class="font-semibold leading-snug text-gray-700">${empresaNombre}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">Central:</span> ${empresaDireccion}</p>
                      <p class="leading-snug text-gray-600">${empresaUbicacion}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">TELF:</span> ${empresaTelefono}</p>
                      <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">EMAIL:</span> ${empresaEmail}</p>
                  </div>
              </div>
      
              <div class="text-center border border-gray-400 rounded-md ml-8 overflow-hidden w-80">
                  <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">RUC ${empresaRuc}</h2>
                  <div class="bg-blue-200">
                      <h2 class="text-lg font-bold text-gray-900 py-2">NOTA DE INGRESO</h2>
                  </div>
                  <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">${ingreso.documento || 'N/A'}</h2>
              </div>
          </div>
      
          <div class="container-datos-compro bg-white rounded-lg mb-6">
              <div class="grid grid-cols-2 gap-6 mb-6">
                  <div class="space-y-2">
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">NRO. DOCU.:</span> <span class="font-semibold text-gray-600">${ingreso.documento || 'N/A'}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">PROVEEDOR:</span> <span class="font-semibold text-gray-600">${ingreso.proveedor || 'N/A'}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">ALMACÉN:</span> <span class="font-semibold text-gray-600">${ingreso.almacen_D || 'N/A'}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">CONCEPTO:</span> <span class="font-semibold text-gray-600">${ingreso.concepto || 'N/A'}</span>
                      </p>
                  </div>
                  <div class="space-y-2 ml-auto text-left">
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">FECHA:</span> <span class="font-semibold text-gray-600">${ingreso.fecha || 'N/A'}</span>
                      </p>
                      <p class="text-sm font-semibold text-gray-800">
                          <span class="font-bold text-gray-900">USUARIO:</span> <span class="font-semibold text-gray-600">${ingreso.usuario || 'N/A'}</span>
                      </p>
                  </div>
              </div>
          </div>
      
          <table class="w-full border-collapse mb-6 bg-white shadow-md rounded-lg overflow-hidden">
            <thead class="bg-blue-200 text-blue-800">
              <tr>
                <th class="border-b p-3 text-center">Código</th>
                <th class="border-b p-3 text-center">Marca</th>
                <th class="border-b p-3 text-center">Descripción</th>
                <th class="border-b p-3 text-center">Cant.</th>
                <th class="border-b p-3 text-center">Unidad</th>
              </tr>
            </thead>
            <tbody>
              ${(ingreso.detalles || []).map(detalle => `
                <tr class="bg-gray-50 hover:bg-gray-100">
                  <td class="border-b p-2 text-center">${detalle.codigo || 'N/A'}</td>
                  <td class="border-b p-2 text-center">${detalle.marca || 'N/A'}</td>
                  <td class="border-b p-2 text-center">${detalle.descripcion || 'N/A'}</td>
                  <td class="border-b p-2 text-center">${detalle.cantidad || 'N/A'}</td>
                  <td class="border-b p-2 text-center">${detalle.unidad || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
  
          <div class="observacion-box">
            <h3 class="font-bold text-gray-800 mb-2">OBSERVACIÓN:</h3>
            <p class="text-gray-700">${ingreso.observacion || 'Ninguna'}</p>
          </div>
      </div>
    `;
  
    // 4. Configuración de html2pdf optimizada para imágenes
    const options = {
      margin: [10, 10],
      filename: `${ingreso.documento || 'nota-ingreso'}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        async: true,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        hotfixes: ["px_scaling"]
      }
    };
  
    // 5. Generar el PDF
    try {
      const pdfExport = html2pdf()
        .set(options)
        .from(htmlContent);
      
      // Agregar números de página
      const pdf = await pdfExport.toPdf().get('pdf');
      const totalPages = pdf.internal.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pdf.internal.pageSize.getWidth() - 20,
          pdf.internal.pageSize.getHeight() - 10
        );
      }
      
      pdfExport.save();
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      // Fallback: Generar sin logo si hay error
      if (logoBase64) {
        generatePDFIngreso({...ingreso, _retryWithoutLogo: true});
      } else {
        alert("Error al generar el PDF. Por favor intente nuevamente.");
      }
    }
  };
  
  const permissions = usePermisos();

  useEffect(() => {
    //console.log("Permissions in TablaIngresos:", permissions);
  }, [permissions]);

  const { 
    hasGeneratePermission = false, 
    hasDeactivatePermission = false 
  } = permissions || {};

 /* console.log("Specific permissions:",  {
    generate: permissions.hasGeneratePermission,
    deactivate: permissions.hasDeactivatePermission
  });*/
  

  const handleSelectChange2 = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir2':
        setNotaIdToAnular(id);
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
    const ingresoSeleccionada = ingresos.find((ingreso) => ingreso.id === notaIdToAnular);
    if (ingresoSeleccionada) {
      generatePDFIngreso(ingresoSeleccionada);
    }
    setIsModalOpenImprimir2(false);
  };

  const handleConfirmAnular = async () => {
    if (notaIdToAnular) {
      const result = await anularNota(notaIdToAnular);
      if (result.success) {
        toast.success('Nota anulada')
        window.location.reload();
      } else {
        toast.error('La nota ya está anulada.')
      }
    }
    setIsModalOpenAnular(false);
  };

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDetailClick = (id) => {
    window.open(`/almacen/kardex/historico/${id}`, '_blank');
  };

  const handleObservationClick = (observacion) => {
    setSelectedObservation(observacion);
    setIsObservationModalOpen(true);
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return ingresos.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(ingresos.length / itemsPerPage);

  return (
    <div className="flex flex-col bg-white rounded-lg p-4">
      {/* Contenedor con tabla principal y tabla de detalles a lado */}
      <div className="flex">
        {/* Tabla Principal */}
        <div className={`transition-all ${expandedRow ? 'w-2/3' : 'w-full'}`}>
          <Table aria-label="Tabla de ingresos">
            <TableHeader>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>PROVEEDOR</TableColumn>
              <TableColumn>CONCEPTO</TableColumn>
              <TableColumn>ALMACÉN DESTINO</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {getCurrentPageItems().map((ingreso) => (
                <TableRow key={ingreso.id} onClick={() => handleRowClick(ingreso.id)} className="cursor-pointer hover:bg-gray-100" >
                  <TableCell>{ingreso.fecha}</TableCell>
                  <TableCell>{ingreso.documento}</TableCell>
                  <TableCell>{ingreso.proveedor}</TableCell>
                  <TableCell>{ingreso.concepto}</TableCell>
                  <TableCell>{ingreso.almacen_D}</TableCell>
                  <TableCell>
                    <Chip
                      color={ingreso.estado === 0 ? "success" : "danger"}
                      size="lg"
                      variant="flat"
                    >
                      {ingreso.estado === 0 ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </TableCell>
                  <TableCell>{ingreso.usuario}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                    <FaEye
                    className="text-blue-600 cursor-pointer"
                    onClick={() => handleObservationClick(ingreso.observacion)}
                    title="Ver Observación"
                  />
                      <FaFilePdf
                        className={`${hasGeneratePermission ? "text-red-600 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                        onClick={() => hasGeneratePermission ? handleSelectChange2({ target: { value: 'imprimir2' } }, ingreso.id) : null}
                        title={hasGeneratePermission ? "Generar PDF" : "No tiene permisos para generar PDFs"}
                      />
                      <TiDeleteOutline
                        className={`${hasDeactivatePermission ? "text-red-600 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                        onClick={() => hasDeactivatePermission ? handleSelectChange2({ target: { value: 'anular' } }, ingreso.id) : null}
                        title={hasDeactivatePermission ? "Anular nota" : "No tiene permisos para anular notas"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                {/* Modal para mostrar la observación */}
      <Modal isOpen={isObservationModalOpen} onClose={() => setIsObservationModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Observación</ModalHeader>
          <ModalBody>
            <p>{selectedObservation || "Sin observación"}</p>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setIsObservationModalOpen(false)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
        </div>

        {/* Tabla de Detalles (al lado) */}
        {expandedRow && (
          <div className="flex-1 ml-4 p-4 border-l border-gray-300">
            <h3 className="font-bold text-lg">Detalles de Ingreso</h3>
            <Table aria-label="Detalles de ingreso" shadow={"md"} className="rounded-lg overflow-hidden">
              <TableHeader>
                <TableColumn>CÓDIGO</TableColumn>
                <TableColumn>MARCA</TableColumn>
                <TableColumn>DESCRIPCIÓN</TableColumn>
                <TableColumn>CANTIDAD</TableColumn>
                <TableColumn>UNIDAD</TableColumn>
              </TableHeader>
              <TableBody>
                {ingresos.find(ingreso => ingreso.id === expandedRow)?.detalles.map((detalle, index) => (
                  <TableRow key={index} onClick={() => handleDetailClick(detalle.codigo)} className="cursor-pointer hover:bg-gray-100">
                    <TableCell className="text-xs">{detalle.codigo}</TableCell>
                    <TableCell className="text-xs">{detalle.marca}</TableCell>
                    <TableCell className="text-xs truncate">{detalle.descripcion}</TableCell>
                    <TableCell className="text-xs">{detalle.cantidad}</TableCell>
                    <TableCell className="text-xs">{detalle.unidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
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
      {/* Barra de Paginación */}
      <div className="mt-4 flex justify-between">
        <Pagination
          showControls
          color="primary"
          page={currentPage}
          total={totalPages}
          onChange={setCurrentPage}
        />

        <select
          id="itemsPerPage"
          className="border border-gray-300 bg-gray-50 rounded-lg w-20 text-center"
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
