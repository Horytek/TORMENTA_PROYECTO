import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Chip, Button, Tooltip, Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import { FaFilePdf, FaEye, FaArrowRight, FaTimes } from "react-icons/fa";
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const navigate = useNavigate();
  const nombreUsuario = useUserStore(s => s.nombre);
  const { hasGeneratePermission = false, hasDeactivatePermission = false } = usePermisos() || {};

  const [empresaData, setEmpresaData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState(null);

  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [notaIdAccion, setNotaIdAccion] = useState(null);

  // Default to 20 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  useEffect(() => {
    if (!externalPagination) setCurrentPage(1);
  }, [registros, externalPagination]);

  const columns = useMemo(() => ([
    { key: 'fecha', label: 'FECHA' },
    { key: 'documento', label: 'DOCUMENTO' },
    { key: 'proveedor', label: tipo === 'ingreso' ? 'PROVEEDOR' : 'DESTINATARIO' },
    { key: 'concepto', label: 'CONCEPTO' },
    { key: 'almacen_O', label: 'ORIGEN' },
    { key: 'almacen_D', label: 'DESTINO' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'usuario', label: 'USUARIO' },
    { key: 'acciones', label: 'ACCIONES' }
  ]), [tipo]);

  const registrosOrdenados = useMemo(() => {
    return [...registros].sort((a, b) => {
      const dateA = new Date(a.fecha);
      const dateB = new Date(b.fecha);
      if (dateA.getTime() !== dateB.getTime()) return dateB - dateA;
      if (a.hora_creacion && b.hora_creacion) {
        if (a.hora_creacion !== b.hora_creacion) return b.hora_creacion.localeCompare(a.hora_creacion);
      }
      if (a.documento && b.documento) return b.documento.localeCompare(a.documento, undefined, { numeric: true });
      return 0;
    });
  }, [registros]);

  const totalPages = useMemo(() => {
    if (externalPagination) return 1;
    if (itemsPerPage === Infinity) return 1;
    return Math.max(1, Math.ceil(registrosOrdenados.length / itemsPerPage));
  }, [externalPagination, registrosOrdenados.length, itemsPerPage]);

  const currentItems = useMemo(() => {
    if (externalPagination) return registros;
    if (itemsPerPage === Infinity) return registrosOrdenados;
    const start = (currentPage - 1) * itemsPerPage;
    return registrosOrdenados.slice(start, start + itemsPerPage);
  }, [externalPagination, registros, registrosOrdenados, currentPage, itemsPerPage]);

  const toggleExpand = useCallback((id) => {
    setExpandedRow(prev => (String(prev) === String(id) ? null : id));
  }, []);

  const handleObservationClick = useCallback((nota) => {
    setSelectedNota(nota);
    setIsObservationModalOpen(true);
  }, []);

  const queueAccion = useCallback((accion, id) => {
    setNotaIdAccion(id);
    if (accion === 'pdf') setIsModalOpenImprimir(true);
    else if (accion === 'anular') setIsModalOpenAnular(true);
  }, []);

  const closeModalImprimir = () => setIsModalOpenImprimir(false);
  const closeModalAnular = () => setIsModalOpenAnular(false);

  const generatePDF = useCallback(async (nota) => {
    // ... preserved PDF logic ...
    if (!nota) return;
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
        try { doc.addImage(logoBase64, 'PNG', 16, cursorY - 4, 28, 28); } catch { }
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
    <div className="flex flex-col w-full relative">
      <Table
        aria-label={`Tabla de notas de ${tipo}`}
        removeWrapper
        classNames={{
          base: "max-h-[600px] overflow-auto",
          th: "bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 h-10",
          td: "text-sm text-slate-700 dark:text-slate-300 py-3 border-b border-slate-100 dark:border-slate-800",
          tr: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-900/20"
        }}
      >
        <TableHeader columns={columns}>
          {col => <TableColumn key={col.key} className={col.key === 'acciones' ? 'text-right' : ''}>{col.label}</TableColumn>}
        </TableHeader>
        <TableBody items={currentItems} emptyContent="No hay registros para mostrar.">
          {nota => (
            <TableRow key={nota.id} onClick={() => toggleExpand(nota.id)}>
              {columnKey => {
                if (columnKey === 'acciones') {
                  return (
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Tooltip content="Ver Observación">
                          <Button isIconOnly size="sm" variant="light" className="text-slate-400 hover:text-indigo-600" onClick={e => { e.stopPropagation(); handleObservationClick(nota); }}>
                            <FaEye size={16} />
                          </Button>
                        </Tooltip>
                        {hasGeneratePermission && (
                          <Tooltip content="Descargar PDF">
                            <Button isIconOnly size="sm" variant="light" className="text-slate-400 hover:text-red-600" onClick={e => { e.stopPropagation(); queueAccion('pdf', nota.id); }}>
                              <FaFilePdf size={16} />
                            </Button>
                          </Tooltip>
                        )}
                        {hasDeactivatePermission && (
                          <Tooltip content="Anular Nota">
                            <Button isIconOnly size="sm" variant="light" className="text-slate-400 hover:text-amber-600" onClick={e => { e.stopPropagation(); queueAccion('anular', nota.id); }}>
                              <TiDeleteOutline size={18} />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  );
                }
                if (columnKey === 'estado') {
                  const anulado = nota.estado === 1;
                  return (
                    <TableCell>
                      {anulado ? (
                        <Tooltip
                          content={
                            <div className="px-1 py-2">
                              <div className="text-small font-bold text-slate-800 dark:text-slate-100">Anulado por:</div>
                              <div className="text-tiny text-slate-700 dark:text-slate-300">{nota.u_modifica || 'Desconocido'}</div>
                              <div className="text-small font-bold text-slate-800 dark:text-slate-100 mt-1">Fecha:</div>
                              <div className="text-tiny text-slate-700 dark:text-slate-300">{nota.fecha_anulacion || 'N/A'}</div>
                            </div>
                          }
                        >
                          <Chip
                            className="gap-1 border-none capitalize cursor-help"
                            color="danger"
                            size="sm"
                            variant="flat"
                            startContent={
                              <span className="w-1 h-1 rounded-full bg-danger-600 ml-1"></span>
                            }
                          >
                            Anulado
                          </Chip>
                        </Tooltip>
                      ) : (
                        <Chip
                          className="gap-1 border-none capitalize"
                          color="success"
                          size="sm"
                          variant="flat"
                          startContent={
                            <span className="w-1 h-1 rounded-full bg-success-600 ml-1"></span>
                          }
                        >
                          Activo
                        </Chip>
                      )}
                    </TableCell>
                  );
                }
                if (columnKey === 'fecha') {
                  return (
                    <TableCell>
                      <Tooltip content={`Hora: ${nota.hora_creacion || 'N/A'}`}>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 cursor-default">
                          {getKeyValue(nota, columnKey)}
                        </span>
                      </Tooltip>
                    </TableCell>
                  );
                }
                return <TableCell>{['documento'].includes(columnKey) ? <span className="font-semibold text-slate-800 dark:text-slate-100">{getKeyValue(nota, columnKey)}</span> : <span className="text-slate-500 dark:text-slate-400">{getKeyValue(nota, columnKey)}</span>}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Bar */}
      {!externalPagination && (
        <div className="mt-4 flex flex-wrap justify-between items-center gap-4 py-3 border-t border-slate-100 dark:border-slate-800 px-4">
          <Pagination
            showControls
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            size="sm"
            classNames={{
              wrapper: "gap-1",
              item: "bg-transparent text-slate-500 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg",
              cursor: "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 rounded-lg"
            }}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Filas:</span>
            <Select
              size="sm"
              aria-label="Filas por página"
              selectedKeys={[itemsPerPage === Infinity ? INTERNAL_ALL_KEY : String(itemsPerPage)]}
              onChange={e => {
                const v = e.target.value;
                setItemsPerPage(v === INTERNAL_ALL_KEY ? Infinity : Number(v) || 20);
                setCurrentPage(1);
              }}
              className="w-20"
              classNames={{
                trigger: "h-8 min-h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg",
                value: "text-xs font-medium"
              }}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
              <SelectItem key="50" value="50">50</SelectItem>
              <SelectItem key={INTERNAL_ALL_KEY} value={INTERNAL_ALL_KEY}>Todos</SelectItem>
            </Select>
          </div>
        </div>
      )}

      {/* Detailed Drawer (Overlay) */}
      <AnimatePresence>
        {expandedRow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
              onClick={() => setExpandedRow(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-[400px] max-w-[90vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-0 flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Detalles</h3>
                  <span className="text-xs font-mono text-slate-500">{registros.find(r => r.id === expandedRow)?.documento}</span>
                </div>
                <Button isIconOnly variant="light" color="danger" radius="full" onClick={() => setExpandedRow(null)}>
                  <FaTimes />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {detallesNotaActiva.map((d, i) => (
                  <div key={i} className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex gap-4 items-center hover:shadow-sm">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                      {d.unidad || 'UND'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{d.codigo}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{d.cantidad}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{d.descripcion}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2 block">{d.marca}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
                <Button
                  size="sm"
                  className="w-full font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                  endContent={<FaArrowRight className="text-slate-400" />}
                  onPress={() => navigate('/almacen')}
                >
                  Ir al Kardex
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      {isModalOpenImprimir && (
        <ConfirmationModal
          message={`¿Generar PDF para esta nota?`}
          onClose={closeModalImprimir}
          isOpen={isModalOpenImprimir}
          onConfirm={handleConfirmImprimir}
        />
      )}
      {isModalOpenAnular && (
        <ConfirmationModal
          message={`¿Confirmar anulación de nota?`}
          onClose={closeModalAnular}
          isOpen={isModalOpenAnular}
          onConfirm={handleConfirmAnular}
        />
      )}

      {/* Modal de Observación */}
      <Modal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-800 dark:text-slate-100">
                Observación
              </ModalHeader>
              <ModalBody>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedNota?.observacion || "No hay observaciones registradas para esta nota."}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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