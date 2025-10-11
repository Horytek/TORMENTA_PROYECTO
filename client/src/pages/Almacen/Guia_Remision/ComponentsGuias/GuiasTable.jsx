import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip, ScrollShadow, Pagination, Button } from '@heroui/react';
import { FaFilePdf } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Toaster, toast } from "react-hot-toast";
import { anularGuia } from '@/services/guiaRemision.services';
import { useUserStore } from "@/store/useStore";
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
  const nombre = useUserStore(state => state.nombre);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
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
  }, [nombre]);

  // Paginación
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentGuias = guias.slice(indexOfFirst, indexOfLast);


  // Function to generate PDF
    const generatePDF = async (guia) => {
    try {
      // import dinámico para evitar problemas de bundling en Azure
      const jspdfModule = await import(/* @vite-ignore */ 'jspdf');
      await import(/* @vite-ignore */ 'jspdf-autotable');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      const peso = isNaN(parseFloat(guia.peso)) ? "0.00" : parseFloat(guia.peso).toFixed(2);
      const observacion = guia.observacion || 'No hay ninguna observacion';
      const cantPaquetes = guia.canti || '0';

      // Datos empresa
      const empresaNombre = empresaData?.nombreComercial || 'TORMENTA JEANS';
     const empresaRazon = empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
     const empresaDireccion = empresaData?.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
      const empresaUbicacion = `${empresaData?.distrito || 'Chi'} - ${empresaData?.provincia || 'Chiclayo'} - ${empresaData?.departamento || 'Lambayeque'}`;
      const empresaTelefono = empresaData?.telefono || '918';
      const empresaEmail = empresaData?.email || 'textiles';
      const empresaRuc = empresaData?.ruc || '20';

      const fechaGeneracion = guia.fecha || '';
      const horaGeneracion = guia.h_generacion || '';

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 18;

      // Logo
      try { if (logoBase64) doc.addImage(logoBase64, 'PNG', 16, cursorY - 4, 28, 28); } catch {}

      // Recuadro derecho (RUC / título)
     const boxW = 80;
      const boxX = pageWidth - boxW - 16;
      doc.setDrawColor(80); doc.setLineWidth(0.25);
      doc.rect(boxX, cursorY - 6, boxW, 40);
      doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
      doc.text(`RUC ${empresaRuc}`, boxX + boxW / 2, cursorY + 2, { align: 'center' });
      doc.setFillColor(191, 219, 254);
      doc.rect(boxX, cursorY + 8, boxW, 12, 'F');
      doc.setFontSize(10.5);
      doc.text('GUIA DE REMISION', boxX + boxW / 2, cursorY + 15, { align: 'center' });
      doc.setFontSize(9.5);
      doc.text(guia.numGuia || '', boxX + boxW / 2, cursorY + 26, { align: 'center' });

      // Encabezado empresa (izquierda)
      const xText = logoBase64 ? 52 : 16;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(empresaNombre, xText, cursorY);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      let y = cursorY + 6;
      doc.text(empresaRazon, xText, y);
     y += 4;
      const infoMaxWidth = Math.max(60, boxX - xText - 8);
      const direccionLines = doc.splitTextToSize(`Central: ${empresaDireccion}`, infoMaxWidth);
      direccionLines.forEach(line => { doc.text(line, xText, y); y += 4; });
     const ubicLines = doc.splitTextToSize(empresaUbicacion, infoMaxWidth);
      ubicLines.forEach(line => { doc.text(line, xText, y); y += 4; });
      doc.text(`TELF: ${empresaTelefono}`, xText, y); y += 4;
      doc.text(`EMAIL: ${empresaEmail}`, xText, y);

      // Separador
      cursorY = Math.max(cursorY + 36, y + 8);
      doc.setDrawColor(230); doc.line(15, cursorY - 4, pageWidth - 15, cursorY - 4);

      // Tabla detalles usando autotable
      const rows = (guia.detalles || []).map(d => [
        d.codigo || '',
        d.descripcion || '',
        d.cantidad != null ? String(d.cantidad) : '',
        d.um || ''
      ]);

     doc.autoTable({
       head: [['Código', 'Descripción', 'Cant.', 'U.M.']],
       body: rows,
        startY: cursorY,
        styles: { fontSize: 9, cellPadding: 3 },
       headStyles: { fillColor: [191,219,254], textColor: [15,23,42], fontStyle: 'bold' },
        columnStyles: { 0:{cellWidth:30}, 1:{cellWidth:'auto'}, 2:{cellWidth:22, halign:'right'}, 3:{cellWidth:20} },
       tableWidth: 'auto'
      });

      const afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 8;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('OBSERVACIÓN:', 15, afterTableY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const obsLines = doc.splitTextToSize(observacion, pageWidth - 30);
      doc.text(obsLines, 15, afterTableY + 6);

     // Transporte / motivo / fecha
      const baseY = afterTableY + Math.max(20, obsLines.length * 4 + 8);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`TRANSPORTE: ${guia.transpub ? guia.transpub : guia.transpriv || ''}`, 15, baseY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(`DOC. TRANSPORTISTA: ${guia.docpub ? guia.docpub : guia.docpriv || ''}`, 15, baseY + 6);
      doc.text(`MOTIVO TRANSPORTE: ${guia.concepto || ''}`, 15, baseY + 12);
     doc.text(`Generado: ${fechaGeneracion} ${horaGeneracion}`, 15, baseY + 18);

      // Paginación
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
       doc.setFontSize(8); doc.setTextColor(120);
       doc.text(`Página ${i} de ${totalPages}`, pageWidth - 18, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
     }

     doc.save(`${guia.numGuia || 'guia'}.pdf`);
      toast.success('PDF generado');
    } catch (err) {
      console.error('Error generando PDF con jsPDF:', err);
      toast.error('Error al generar el PDF');
    }
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