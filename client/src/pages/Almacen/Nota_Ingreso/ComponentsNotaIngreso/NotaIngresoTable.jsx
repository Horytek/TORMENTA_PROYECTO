import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import {
  ScrollShadow,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Tooltip, Select, SelectItem
} from "@heroui/react";
import { FaFilePdf, FaEye } from "react-icons/fa";
import { TiDeleteOutline } from "react-icons/ti";
import { anularNotaIngreso } from '@/services/notaIngreso.services';
import { anularNotaSalida } from '@/services/notaSalida.services';
import { toast } from "react-hot-toast";
import { usePermisos } from '@/routes';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getKeyValue } from "@heroui/react";
import { useUserStore } from "@/store/useStore";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const INTERNAL_ALL_KEY = '100000';

const TablaNotasAlmacen = forwardRef(function TablaNotasAlmacen(
  {
    registros = [],
    tipo = "ingreso",
    onNotaAnulada,
    externalPagination = false
  },
  ref
) {
  const nombreUsuario = useUserStore(s => s.nombre);
  const { hasGeneratePermission = false, hasDeactivatePermission = false } = usePermisos() || {};

  const [empresaData, setEmpresaData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState(null);

  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [notaIdAccion, setNotaIdAccion] = useState(null);

  // Paginación interna (si no viene desde el padre)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Carga datos empresa (una vez)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getEmpresaDataByUser(nombreUsuario);
        if (mounted) setEmpresaData(data || null);
      } catch {
        if (mounted) setEmpresaData(null);
      }
    })();
    return () => { mounted = false; };
  }, [nombreUsuario]);

  // Reset de página si se altera cantidad de registros
  useEffect(() => {
    if (!externalPagination) setCurrentPage(1);
    if (expandedRow && !registros.some(r => String(r.id) === String(expandedRow))) {
      setExpandedRow(null);
    }
  }, [registros, externalPagination, expandedRow]);

  // Columnas (label dinámico proveedor/destinatario)
  const columns = useMemo(() => ([
    { key: 'fecha', label: 'FECHA' },
    { key: 'documento', label: 'DOCUMENTO' },
    { key: 'proveedor', label: tipo === 'ingreso' ? 'PROVEEDOR' : 'DESTINATARIO' },
    { key: 'concepto', label: 'CONCEPTO' },
    { key: 'almacen_O', label: 'ALMACÉN ORIGEN' },
    { key: 'almacen_D', label: 'ALMACÉN DESTINO' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'usuario', label: 'USUARIO' },
    { key: 'acciones', label: 'ACCIONES' }
  ]), [tipo]);

  // Ordenamiento consistente (fecha desc, hora desc, documento desc)
  const registrosOrdenados = useMemo(() => {
    return [...registros].sort((a, b) => {
      if (a.fecha !== b.fecha) return new Date(b.fecha) - new Date(a.fecha);
      if (a.hora_creacion !== b.hora_creacion) {
        if (!a.hora_creacion) return 1;
        if (!b.hora_creacion) return -1;
        return b.hora_creacion.localeCompare(a.hora_creacion);
      }
      if (a.documento && b.documento) {
        return b.documento.localeCompare(a.documento, undefined, { numeric: true });
      }
      return 0;
    });
  }, [registros]);

  // Slicing interno
  const totalPages = useMemo(() => {
    if (externalPagination) return 1;
    if (itemsPerPage === Infinity) return 1;
    return Math.max(1, Math.ceil(registrosOrdenados.length / itemsPerPage));
  }, [externalPagination, registrosOrdenados.length, itemsPerPage]);

  const currentItems = useMemo(() => {
    if (externalPagination) return registros; // padre ya envía la página
    if (itemsPerPage === Infinity) return registrosOrdenados;
    const start = (currentPage - 1) * itemsPerPage;
    return registrosOrdenados.slice(start, start + itemsPerPage);
  }, [externalPagination, registros, registrosOrdenados, currentPage, itemsPerPage]);

  // Expand / colapsar fila
  const toggleExpand = useCallback((id) => {
    setExpandedRow(prev => (String(prev) === String(id) ? null : id));
  }, []);

  // Memo: acción ver observación
  const handleObservationClick = useCallback((nota) => {
    setSelectedNota(nota);
    setIsObservationModalOpen(true);
  }, []);

  // Memo: cerrar observación
  const closeObservation = useCallback(() => {
    setSelectedNota(null);
    setIsObservationModalOpen(false);
  }, []);

  // Memo: cola de acciones (evita recreaciones)
  const queueAccion = useCallback((accion, id) => {
    setNotaIdAccion(id);
    if (accion === 'pdf') setIsModalOpenImprimir(true);
    else if (accion === 'anular') setIsModalOpenAnular(true);
  }, []);

  const closeModalImprimir = () => setIsModalOpenImprimir(false);
  const closeModalAnular = () => setIsModalOpenAnular(false);

  // PDF (memoizado)
  const generatePDF = useCallback(async (nota) => {
    if (!nota) return;
    // Si aún no cargó empresaData evita fallos
    const ed = empresaData || {};
    let logoBase64 = ed.logotipo;

    if (logoBase64 && !logoBase64.startsWith('data:image')) {
      try {
        const resp = await fetch(logoBase64);
        const blob = await resp.blob();
        logoBase64 = await new Promise(res => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(blob);
        });
      } catch {
        logoBase64 = null;
      }
    }

    const isIngreso = tipo === 'ingreso';
    const empresaNombre = ed.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
    const empresaDireccion = ed.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
    const empresaUbicacion = `${ed.distrito || 'Chiclayo'} - ${ed.provincia || 'Chiclayo'} - ${ed.departamento || 'Lambayeque'}`;
    const empresaTelefono = ed.telefono || '918378590';
    const empresaEmail = ed.email || 'textiles.creando.moda.sac@gmail.com';
    const empresaRuc = ed.ruc || '20610588981';
    const empresaNombreComercial = ed.nombreComercial || 'TORMENTA JEANS';

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      doc.setLineHeightFactor(1.15);
      const pageWidth = doc.internal.pageSize.getWidth();

      const drawLabelValue = (label, value, xL, xV, y) => {
        doc.setFont('helvetica', 'bold'); doc.text(label, xL, y);
        doc.setFont('helvetica', 'normal'); doc.text(value || 'N/A', xV, y);
      };

      let cursorY = 18;
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', 16, cursorY - 4, 28, 28); } catch {}
      }

      const boxW = 68;
      const boxH = 36;
      const boxX = pageWidth - boxW - 16;
      doc.setDrawColor(80).setLineWidth(0.25);
      doc.rect(boxX, cursorY - 6, boxW, boxH);

      doc.setFont('helvetica', 'bold').setFontSize(10.5);
      doc.text(`RUC ${empresaRuc}`, boxX + boxW / 2, cursorY + 2, { align: 'center' });

      doc.setFillColor(191, 219, 254);
      doc.rect(boxX, cursorY + 5, boxW, 11, 'F');
      doc.setTextColor(20);
      doc.text(isIngreso ? 'NOTA DE INGRESO' : 'NOTA DE SALIDA', boxX + boxW / 2, cursorY + 12, { align: 'center' });

      doc.setFontSize(9.5).text(nota.documento || 'SIN DOC', boxX + boxW / 2, cursorY + 22, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      const xText = logoBase64 ? 50 : 16;
      const gapToBox = 8;
      let infoMaxWidth = boxX - xText - gapToBox;
      if (infoMaxWidth < 60) infoMaxWidth = pageWidth - xText - 20;

      doc.setFont('helvetica', 'bold').setFontSize(13);
      let textY = cursorY + 6;
      doc.text(empresaNombreComercial, xText, textY);

      doc.setFontSize(9).setFont('helvetica', 'normal');
      textY += 5;
      doc.text(empresaNombre, xText, textY);

      const dirRaw = `Central: ${empresaDireccion}`;
      let dirLines = doc.splitTextToSize(dirRaw, infoMaxWidth);
      if (dirLines.length > 3) {
        doc.setFontSize(8);
        dirLines = doc.splitTextToSize(dirRaw, infoMaxWidth);
      }
      dirLines.forEach(l => { textY += 4; doc.text(l, xText, textY); });
      if (doc.getFontSize() !== 9) doc.setFontSize(9);

      textY += 4;
      const ubLines = doc.splitTextToSize(empresaUbicacion, infoMaxWidth);
      ubLines.forEach(l => { doc.text(l, xText, textY); textY += 4; });
      textY -= 4;

      textY += 4; doc.text(`TELF: ${empresaTelefono}`, xText, textY);
      textY += 4; doc.text(`EMAIL: ${empresaEmail}`, xText, textY);

      cursorY = Math.max(cursorY + 14, textY + 12);
      doc.setDrawColor(210).setLineWidth(0.2);
      doc.line(15, cursorY - 6, pageWidth - 15, cursorY - 6);

      const col1L = 15, col1V = 46, col2L = 115, col2V = 145;
      drawLabelValue('NRO. DOCU.:', nota.documento, col1L, col1V, cursorY);
      drawLabelValue(isIngreso ? 'PROVEEDOR:' : 'DESTINATARIO:', nota.proveedor, col1L, col1V, cursorY + 5);
      if (isIngreso) drawLabelValue('ALMACÉN:', nota.almacen_D, col1L, col1V, cursorY + 10);
      drawLabelValue('CONCEPTO:', nota.concepto, col1L, col1V, cursorY + (isIngreso ? 15 : 10));
      drawLabelValue('FECHA:', nota.fecha, col2L, col2V, cursorY);
      drawLabelValue('USUARIO:', nota.usuario, col2L, col2V, cursorY + 5);

      cursorY += isIngreso ? 23 : 18;
      doc.setDrawColor(230).line(15, cursorY - 4, pageWidth - 15, cursorY - 4);

      const rows = (nota.detalles || []).map(d => [
        d.codigo || '',
        d.marca || '',
        (d.descripcion || '').trim(),
        d.cantidad != null ? String(d.cantidad) : '',
        d.unidad || ''
      ]);

      doc.autoTable({
        head: [['Código', 'Marca', 'Descripción', 'Cant.', 'Und.']],
        body: rows,
        startY: cursorY,
        styles: { fontSize: 8, cellPadding: 2.2, valign: 'middle' },
        headStyles: { fillColor: [191, 219, 254], textColor: [15, 23, 42], fontStyle: 'bold' },
        bodyStyles: { textColor: [31, 41, 55] },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 24 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 16, halign: 'right' }, 4: { cellWidth: 14 } },
        tableWidth: 'auto'
      });

      cursorY = doc.lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold').setFontSize(9).text('OBSERVACIÓN:', 15, cursorY);
      doc.setFont('helvetica', 'normal');
      const obs = nota.observacion || 'Ninguna';
      const wrapped = doc.splitTextToSize(obs, pageWidth - 30);
      doc.text(wrapped, 15, cursorY + 5);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8).setTextColor(130);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 18, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      doc.save(`${nota.documento || (isIngreso ? 'nota-ingreso' : 'nota-salida')}.pdf`);
      toast.success('PDF generado');
    } catch {
      toast.error('Error al generar el PDF');
    }
  }, [empresaData, tipo]);

  // Exponer método (estable)
  useImperativeHandle(ref, () => ({
    generatePDFGeneral: () => {
      if (!registros.length) {
        toast.error('No hay notas para exportar');
        return;
      }
      registros.slice(0, 5).forEach(n => generatePDF(n));
      toast.success('Proceso de exportación iniciado');
    }
  }), [registros, generatePDF]);

  const handleConfirmImprimir = () => {
    const notaSel = registros.find(n => n.id === notaIdAccion);
    if (notaSel) generatePDF(notaSel);
    setIsModalOpenImprimir(false);
  };

  const handleConfirmAnular = async () => {
    if (!notaIdAccion) return;
    let result;
    if (tipo === "ingreso") result = await anularNotaIngreso(notaIdAccion, nombreUsuario);
    else result = await anularNotaSalida(notaIdAccion, nombreUsuario);

    if (result?.success) {
      toast.success('Nota anulada');
      onNotaAnulada?.(notaIdAccion);
    } else {
      toast.error('No se pudo anular (ya estaba anulada o error).');
    }
    setIsModalOpenAnular(false);
  };

  const detallesNotaActiva = useMemo(
    () => (registros.find(n => String(n.id) === String(expandedRow))?.detalles || []),
    [expandedRow, registros]
  );

  return (
    <div className="flex flex-col p-4">
      <div className="flex flex-col lg:flex-row">
        <div className={`transition-all duration-500 ${expandedRow !== null ? 'lg:w-2/3' : 'w-full'} animate-[shrinkExpand_0.5s_ease-in-out]`}>
          <Table
            aria-label={`Tabla de notas de ${tipo}`}
            removeWrapper
            classNames={{
              th: "bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600",
              td: "text-[12px]",
              tr: "hover:bg-slate-50 data-[selected=true]:bg-blue-50"
            }}
          >
            <TableHeader columns={columns}>
              {col => <TableColumn key={col.key}>{col.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={currentItems}
              emptyContent={<div className="text-center text-slate-500 py-8">No hay registros para mostrar.</div>}
            >
              {nota => (
                <TableRow
                  key={nota.id}
                  onClick={() => toggleExpand(nota.id)}
                  className={`cursor-pointer transition-colors ${String(expandedRow) === String(nota.id) ? 'bg-blue-50' : ''}`}
                >
                  {columnKey => {
                    if (columnKey === 'acciones') {
                      return (
                        <TableCell>
                          <div className="flex gap-2">
                            <FaEye
                              className="text-blue-600 cursor-pointer"
                              onClick={e => { e.stopPropagation(); handleObservationClick(nota); }}
                              title="Ver Observación"
                            />
                            <FaFilePdf
                              className={`${hasGeneratePermission ? 'text-red-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                              onClick={e => {
                                e.stopPropagation();
                                if (hasGeneratePermission) queueAccion('pdf', nota.id);
                              }}
                              title={hasGeneratePermission ? 'Generar PDF' : 'Sin permiso'}
                            />
                            <TiDeleteOutline
                              className={`${hasDeactivatePermission ? 'text-red-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                              onClick={e => {
                                e.stopPropagation();
                                if (hasDeactivatePermission) queueAccion('anular', nota.id);
                              }}
                              title={hasDeactivatePermission ? 'Anular nota' : 'Sin permiso'}
                            />
                          </div>
                        </TableCell>
                      );
                    }
                    if (columnKey === 'estado') {
                      const anulado = nota.estado === 1;
                      return (
                        <TableCell>
                          <Tooltip
                            content={
                              anulado
                                ? <span><strong>Anulado por:</strong> {nota.u_modifica || 'N/A'}</span>
                                : <span><strong>Estado:</strong> Activo</span>
                            }
                            placement="top"
                            className="bg-white shadow-lg rounded-lg p-2 border border-gray-200"
                          >
                            <span>
                              <Chip
                                color={!anulado ? 'success' : 'danger'}
                                size="sm"
                                variant="flat"
                              >
                                {!anulado ? 'Activo' : 'Inactivo'}
                              </Chip>
                            </span>
                          </Tooltip>
                        </TableCell>
                      );
                    }
                    if (columnKey === 'fecha') {
                      return (
                        <TableCell>
                          <Tooltip
                            content={
                              <div className="text-xs text-slate-700">
                                <p>
                                  <strong>Hora de creación:</strong>{" "}
                                  {nota.hora_creacion
                                    ? new Date(`1970-01-01T${nota.hora_creacion}`).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: true
                                    })
                                    : "N/A"}
                                </p>
                                <p>
                                  <strong>Anulación:</strong>{" "}
                                  {nota.fecha_anulacion
                                    ? new Date(nota.fecha_anulacion).toLocaleString("es-ES", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: true
                                    })
                                    : "N/A"}
                                </p>
                              </div>
                            }
                            placement="top"
                            className="bg-white shadow-lg rounded-lg p-2 border border-gray-200"
                          >
                            <span>{nota.fecha}</span>
                          </Tooltip>
                        </TableCell>
                      );
                    }
                    if (columnKey === 'almacen_O') {
                      return <TableCell>{nota.almacen_O || '-'}</TableCell>;
                    }
                    if (columnKey === 'almacen_D') {
                      return <TableCell>{nota.almacen_D || '-'}</TableCell>;
                    }
                    return <TableCell>{getKeyValue(nota, columnKey)}</TableCell>;
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Modal
            isOpen={isObservationModalOpen}
            onClose={closeObservation}
          >
            <ModalContent>
              <ModalHeader>Observación</ModalHeader>
              <ModalBody>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-slate-600">Nombre de nota: </span>
                    <span className="text-blue-700 font-semibold">{selectedNota?.nom_nota || 'Sin nombre'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Observación: </span>
                    <span>{selectedNota?.observacion || 'Sin observación'}</span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" onPress={closeObservation}>Cerrar</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>

        {expandedRow && (
          <div
            className="flex-1 ml-4 p-4 border-l border-gray-200 transition-all duration-300 ease-in-out animate-fade-in"
            style={{
              maxHeight: 500,
              minWidth: 420,
              background: '#fff',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              marginBottom: '1rem'
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">
                {tipo === 'ingreso' ? 'Detalles de Ingreso' : 'Detalles de Salida'}
              </h3>
              <Button size="sm" color="danger" variant="flat" onClick={() => setExpandedRow(null)}>
                Cerrar
              </Button>
            </div>
            <ScrollShadow hideScrollBar className="max-h-[400px]">
              <Table
                aria-label="Detalles"
                removeWrapper
                classNames={{
                  th: "bg-slate-50 text-[11px] font-semibold",
                  td: "text-[11px]"
                }}
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
                  {detallesNotaActiva.map((d, i) => (
                    <TableRow
                      key={`${d.codigo || i}-${i}`}
                      onClick={() => window.open(`/almacen/kardex/historico/${d.codigo}`, '_blank')}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell>{d.codigo}</TableCell>
                      <TableCell>{d.marca}</TableCell>
                      <TableCell className="max-w-[220px] truncate" title={d.descripcion}>{d.descripcion}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>{d.unidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollShadow>
          </div>
        )}
      </div>

      {/* Modales acción */}
      {isModalOpenImprimir && (
        <ConfirmationModal
          message={`¿Desea imprimir esta nota de ${tipo}?`}
          onClose={closeModalImprimir}
          isOpen={isModalOpenImprimir}
            onConfirm={handleConfirmImprimir}
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

      {/* Paginación interna solo si NO es externa */}
      {!externalPagination && (
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-lg" style={{ minHeight: 56 }}>
          <Pagination
            showControls
            color="primary"
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            size="sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filas por página:</span>
            <Select
              size="sm"
              className="w-28"
              selectedKeys={[itemsPerPage === Infinity ? INTERNAL_ALL_KEY : String(itemsPerPage)]}
              onChange={e => {
                const v = e.target.value;
                if (v === INTERNAL_ALL_KEY) {
                  setItemsPerPage(Infinity);
                } else {
                  const n = Number(v) || 5;
                  setItemsPerPage(n);
                }
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
              <SelectItem key={INTERNAL_ALL_KEY} value={INTERNAL_ALL_KEY}>Todo</SelectItem>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
});

TablaNotasAlmacen.propTypes = {
  registros: PropTypes.array.isRequired,
  tipo: PropTypes.oneOf(['ingreso', 'salida']).isRequired,
  onNotaAnulada: PropTypes.func,
  externalPagination: PropTypes.bool
};

export default TablaNotasAlmacen;