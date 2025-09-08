import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { ScrollShadow, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Tooltip, Select, SelectItem } from "@heroui/react";
import { FaFilePdf, FaEye } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import anularNotaIngreso from '../data/anular_nota_ingreso';
import anularNotaSalida from '../../Nota_Salida/data/anular_nota_salida';
import { toast } from "react-hot-toast";
import { exportHtmlToPdf } from '@/utils/pdf/exportHtmlToPdf';
import { usePermisos } from '@/routes';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getKeyValue } from "@heroui/react";
import { useUserStore } from "@/store/useStore";

const TablaNotasAlmacen = forwardRef(({ registros = [], tipo, onNotaAnulada }, ref) => {
  const [empresaData, setEmpresaData] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState("");
  const [selectedNota, setSelectedNota] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir2, setIsModalOpenImprimir2] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [notaIdToAccion, setNotaIdToAccion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
   const nombre = useUserStore((state) => state.nombre); // Obtiene el nombre del usuario actual

  useEffect(() => {
    const fetchEmpresaData = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        setEmpresaData(data);
      } catch (error) {
        setEmpresaData(null);
      }
    };
    fetchEmpresaData();
  }, []);

  const { hasGeneratePermission = false, hasDeactivatePermission = false } = usePermisos() || {};

  // PDF GENERATION
  const generatePDF = async (nota) => {
    let logoBase64 = empresaData?.logotipo;
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
        logoBase64 = null;
      }
    }
    const empresaNombre = empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
    const empresaDireccion = empresaData?.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
    const empresaUbicacion = `${empresaData?.distrito || 'Chiclayo'} - ${empresaData?.provincia || 'Chiclayo'} - ${empresaData?.departamento || 'Lambayeque'}`;
    const empresaTelefono = empresaData?.telefono || '918378590';
    const empresaEmail = empresaData?.email || 'textiles.creando.moda.sac@gmail.com';
    const empresaRuc = empresaData?.ruc || '20610588981';
    const empresaNombreComercial = empresaData?.nombreComercial || 'TORMENTA JEANS';

    const isIngreso = tipo === 'ingreso';
    const htmlContent = `
      <style>
        .logo-empresa { width: 180px; height: 180px; object-fit: contain; }
        .observacion-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 1rem; margin-top: 1.5rem; }
      </style>
      <div class="p-5 text-sm leading-6 font-sans w-full">
        <div class="flex justify-between items-start mb-3">
          <div class='flex'>
            ${logoBase64 ? `<div class="Logo-compro mr-4"><img src="${logoBase64}" alt="Logo-comprobante" class="logo-empresa" /></div>` : ''}
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
              <h2 class="text-lg font-bold text-gray-900 py-2">${isIngreso ? 'NOTA DE INGRESO' : 'NOTA DE SALIDA'}</h2>
            </div>
            <h2 class="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">${nota.documento || 'N/A'}</h2>
          </div>
        </div>
        <div class="container-datos-compro bg-white rounded-lg mb-6">
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="space-y-2">
              <p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">NRO. DOCU.:</span> <span class="font-semibold text-gray-600">${nota.documento || 'N/A'}</span></p>
              <p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">${isIngreso ? 'PROVEEDOR' : 'DESTINATARIO'}:</span> <span class="font-semibold text-gray-600">${nota.proveedor || 'N/A'}</span></p>
              ${isIngreso ? `<p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">ALMACÉN:</span> <span class="font-semibold text-gray-600">${nota.almacen_D || 'N/A'}</span></p>` : ''}
              <p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">CONCEPTO:</span> <span class="font-semibold text-gray-600">${nota.concepto || 'N/A'}</span></p>
            </div>
            <div class="space-y-2 ml-auto text-left">
              <p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">FECHA:</span> <span class="font-semibold text-gray-600">${nota.fecha || 'N/A'}</span></p>
              <p class="text-sm font-semibold text-gray-800"><span class="font-bold text-gray-900">USUARIO:</span> <span class="font-semibold text-gray-600">${nota.usuario || 'N/A'}</span></p>
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
            ${(nota.detalles || []).map(detalle => `
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
          <p class="text-gray-700">${nota.observacion || 'Ninguna'}</p>
        </div>
      </div>
    `;
    const options = {
      filename: `${nota.documento || (isIngreso ? 'nota-ingreso' : 'nota-salida')}.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        async: true,
        letterRendering: true,
      },
      onInstance: (inst) => {
        inst.toPdf().get('pdf').then(pdf => {
          const total = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= total; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(
              `Página ${i} de ${total}`,
              pdf.internal.pageSize.getWidth() - 20,
              pdf.internal.pageSize.getHeight() - 10
            );
          }
        });
      }
    };
    try {
      await exportHtmlToPdf(htmlContent, options.filename, options);
    } catch {
      toast.error("Error al generar el PDF");
    }
  };

  // Acciones
  const handleSelectChange2 = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir2':
        setNotaIdToAccion(id);
        setIsModalOpenImprimir2(true);
        break;
      case 'anular':
        setNotaIdToAccion(id);
        setIsModalOpenAnular(true);
        break;
      default:
        break;
    }
    event.target.value = '';
  };

  const closeModalImprimir2 = () => setIsModalOpenImprimir2(false);
  const closeModalAnular = () => setIsModalOpenAnular(false);

  const handleConfirmImprimir2 = () => {
    const notaSeleccionada = registros.find((nota) => nota.id === notaIdToAccion);
    if (notaSeleccionada) generatePDF(notaSeleccionada);
    setIsModalOpenImprimir2(false);
  };

  const handleConfirmAnular = async () => {
    if (notaIdToAccion) {
      let result;
      if (tipo === "ingreso") {
        result = await anularNotaIngreso(notaIdToAccion,nombre);
      } else {
        result = await anularNotaSalida(notaIdToAccion,nombre);
      }
      if (result.success) {
        toast.success('Nota anulada');
        // Actualizar el array local en lugar de recargar la página
        if (onNotaAnulada) {
          onNotaAnulada(notaIdToAccion);
        }
      } else {
        toast.error('La nota ya está anulada.');
      }
    }
    setIsModalOpenAnular(false);
  };

const handleRowClick = (id) => {
  setExpandedRow(String(expandedRow) === String(id) ? null : id);
};

  const handleDetailClick = (id) => {
    window.open(`/almacen/kardex/historico/${id}`, '_blank');
  };

const handleObservationClick = (nota) => {
  setSelectedNota(nota);
  setIsObservationModalOpen(true);
};

const getCurrentPageItems = () => {
  // Ordenar por fecha (desc), hora_creacion (desc), y documento (desc)
  const registrosOrdenados = [...registros].sort((a, b) => {
    // Fecha descendente
    if (a.fecha !== b.fecha) {
      return new Date(b.fecha) - new Date(a.fecha);
    }
    // Hora descendente
    if (a.hora_creacion !== b.hora_creacion) {
      if (!a.hora_creacion) return 1;
      if (!b.hora_creacion) return -1;
      return b.hora_creacion.localeCompare(a.hora_creacion);
    }
    // Número de comprobante descendente (asumiendo formato tipo "I400-00000001")
    if (a.documento && b.documento) {
      return b.documento.localeCompare(a.documento, undefined, { numeric: true });
    }
    return 0;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return registrosOrdenados.slice(startIndex, endIndex);
};

  const totalPages = Math.ceil(registros.length / itemsPerPage);

  // Columnas dinámicas según tipo
  const columns = [
    { key: 'fecha', label: 'FECHA' },
    { key: 'documento', label: 'DOCUMENTO' },
    { key: 'proveedor', label: tipo === 'ingreso' ? 'PROVEEDOR' : 'DESTINATARIO' },
    { key: 'concepto', label: 'CONCEPTO' },
    ...(tipo === 'ingreso'
      ? [
          { key: 'almacen_O', label: 'ALMACÉN ORIGEN' },
          { key: 'almacen_D', label: 'ALMACÉN DESTINO' }
        ]
      : [
          { key: 'almacen_O', label: 'ALMACÉN ORIGEN' },
          { key: 'almacen_D', label: 'ALMACÉN DESTINO' }
        ]),
    { key: 'estado', label: 'ESTADO' },
    { key: 'usuario', label: 'USUARIO' },
    { key: 'acciones', label: 'ACCIONES' }
  ];

  return (
<div className="flex flex-col p-4">
  <div className="flex flex-col lg:flex-row">
    <div className={`transition-all duration-500 ${expandedRow !== null ? 'lg:w-2/3' : 'w-full'} animate-[shrinkExpand_0.5s_ease-in-out]`}>
<Table aria-label={`Tabla de notas de ${tipo}`}>
  <TableHeader columns={columns}>
    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
  </TableHeader>
  <TableBody
    items={getCurrentPageItems()}
    emptyContent={
      <div className="text-center text-gray-500 py-8">
        No hay registros para mostrar.
      </div>
    }
  >
    {(nota) => (
          <TableRow
      key={nota.id}
      onClick={() => setExpandedRow(String(expandedRow) === String(nota.id) ? null : nota.id)}
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${String(expandedRow) === String(nota.id) ? "bg-blue-50" : ""}`}
    >
        {(columnKey) => {
          // ACCIONES
          if (columnKey === "acciones") {
            return (
              <TableCell>
                <div className="flex gap-2">
                <FaEye
                  className="text-blue-600 cursor-pointer"
                  onClick={() => handleObservationClick(nota)}
                  title="Ver Observación"
                />
                  <FaFilePdf
                    className={`${hasGeneratePermission ? "text-red-600 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasGeneratePermission) handleSelectChange2({ target: { value: 'imprimir2' } }, nota.id);
                    }}
                    title={hasGeneratePermission ? "Generar PDF" : "No tiene permisos para generar PDFs"}
                  />
                  <TiDeleteOutline
                    className={`${hasDeactivatePermission ? "text-red-600 cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasDeactivatePermission) handleSelectChange2({ target: { value: 'anular' } }, nota.id);
                    }}
                    title={hasDeactivatePermission ? "Anular nota" : "No tiene permisos para anular notas"}
                  />
                </div>
              </TableCell>
            );
          }
          // ESTADO
          if (columnKey === "estado") {
            return (
              <TableCell>
                <Tooltip
                  content={
                    nota.estado === 1
                      ? (
                        <span>
                          <strong>Anulado por:</strong>{" "}
                          {nota.u_modifica ? nota.u_modifica : "N/A"}
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
                    <Chip color={nota.estado === 0 ? "success" : "danger"} size="lg" variant="flat">
                      {nota.estado === 0 ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </span>
                </Tooltip>
              </TableCell>
            );
          }
          // FECHA (con tooltip)
          if (columnKey === "fecha") {
            return (
              <TableCell>
                <Tooltip
                  content={
                    <div className="text-sm text-gray-800">
                      <p>
                        <strong>Hora de creación:</strong>{" "}
                        {nota.hora_creacion
                          ? new Date(`1970-01-01T${nota.hora_creacion}`).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Fecha y hora de anulación:</strong>{" "}
                        {nota.fecha_anulacion
                          ? new Date(nota.fecha_anulacion).toLocaleString("es-ES", {
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
                  <span>{nota.fecha}</span>
                </Tooltip>
              </TableCell>
            );
          }
            // Almacenes
                    if (columnKey === "almacen_O") {
                      return <TableCell>{nota.almacen_O || "-"}</TableCell>;
                    }
                    if (columnKey === "almacen_D") {
                      return <TableCell>{nota.almacen_D || "-"}</TableCell>;
                    }
          // Para columnas normales
          return <TableCell>{getKeyValue(nota, columnKey)}</TableCell>;
        }}
      </TableRow>
    )}
  </TableBody>
</Table>
<Modal isOpen={isObservationModalOpen} onClose={() => setIsObservationModalOpen(false)}>
  <ModalContent>
    <ModalHeader>Observación</ModalHeader>
    <ModalBody>
      <div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Nombre de nota: </span>
          <span className="text-blue-700 font-semibold">{selectedNota?.nom_nota || "Sin nombre"}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Observación: </span>
          <span>{selectedNota?.observacion || "Sin observación"}</span>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button onPress={() => setIsObservationModalOpen(false)}>Cerrar</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
        </div>
{expandedRow && (
  <div
    className="flex-1 ml-4 p-4 border-l border-gray-300 transition-all duration-300 ease-in-out animate-fade-in"
    style={{
      maxHeight: "500px",
      minWidth: "420px",
      overflow: "hidden",
      background: "#fff",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      marginBottom: "1rem"
    }}
  >
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-bold text-lg">
        {tipo === "ingreso" ? "Detalles de Ingreso" : "Detalles de Salida"}
      </h3>
      <Button size="sm" color="danger" onClick={() => setExpandedRow(null)}>
        Cerrar
      </Button>
    </div>
    <ScrollShadow hideScrollBar className="max-h-[400px]">
      <Table
        aria-label="Detalles"
        shadow="md"
        className="rounded-lg overflow-hidden"
        style={{ minWidth: 420 }}
      >
        <TableHeader>
          <TableColumn>CÓDIGO</TableColumn>
          <TableColumn>MARCA</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>CANTIDAD</TableColumn>
          <TableColumn>UNIDAD</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Sin detalles">
          {(registros.find(nota => String(nota.id) === String(expandedRow))?.detalles || []).map((detalle, index) => (
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
    </ScrollShadow>
  </div>
)}
      </div>
      {isModalOpenImprimir2 && (
        <ConfirmationModal
          message={`¿Desea imprimir esta nota de ${tipo}?`}
          onClose={closeModalImprimir2}
          isOpen={isModalOpenImprimir2}
          onConfirm={handleConfirmImprimir2}
        />
      )}
      {isModalOpenAnular && (
        <ConfirmationModal
          message={`¿Desea anular esta nota de ${tipo}?`}
          onClose={closeModalAnular}
          isOpen={isModalOpenAnular}
          onConfirm={handleConfirmAnular}
        />
      )}
<div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-lg bottom-0 z-10" style={{ minHeight: 56 }}>
  <Pagination
    showControls
    color="primary"
    page={currentPage}
    total={totalPages}
    onChange={setCurrentPage}
  />
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-500">Filas por página:</span>
    <Select
      size="sm"
      className="w-28"
      selectedKeys={[`${itemsPerPage}`]}
      onChange={e => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      aria-label="Filas por página"
      classNames={{
        trigger: "bg-slate-50 border-slate-200 text-blue-900 shadow-sm",
        popoverContent: "bg-white"
      }}
    >
      <SelectItem key="5" value="5">05</SelectItem>
      <SelectItem key="10" value="10">10</SelectItem>
      <SelectItem key="20" value="20">20</SelectItem>
      <SelectItem key="100000" value="100000">Todo</SelectItem>
    </Select>
  </div>
</div>
    </div>
  );
});

TablaNotasAlmacen.propTypes = {
  registros: PropTypes.array.isRequired,
  tipo: PropTypes.oneOf(['ingreso', 'salida']).isRequired,
};

export default TablaNotasAlmacen;