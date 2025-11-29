import React, { useState, useEffect, useCallback } from 'react';
import { parseDate } from "@internationalized/date";
import {
  DateRangePicker,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Divider,
  Tooltip
} from '@heroui/react';
import TablaKardex from './Kardex/ComponentsKardex/KardexTable';
import { getProductosKardex, downloadExcelReporteMes, downloadExcelReporteFechas } from '@/services/kardex.services';
import { useAlmacenesKardex, useMarcasKardex, useCategoriasKardex, useSubcategoriasKardex } from '@/hooks/useKardex';
import { Toaster, toast } from 'react-hot-toast';
import { FaRegFilePdf, FaFileExcel } from "react-icons/fa";
import { RefreshCw, FileText, Calendar, Download } from 'lucide-react';
import { IoIosSearch } from "react-icons/io";
import { useUserStore } from "@/store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";

const Kardex = () => {
  const { almacenes } = useAlmacenesKardex();
  const [kardex, setKardex] = useState([]);
  const { marcas } = useMarcasKardex();
  const { categorias } = useCategoriasKardex();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const { subcategorias } = useSubcategoriasKardex(categoriaSeleccionada);

  // Obtener estado global de Zustand
  const rolUsuario = useUserStore(state => state.rol);
  const sucursalSeleccionada = useUserStore(state => state.sur);
  const almacenGlobal = useUserStore(state => state.almacen);
  const setAlmacenGlobal = useUserStore(state => state.setAlmacen);
  const nombre = useUserStore(state => state.nombre);
  const [empresaData, setEmpresaData] = useState(null);

  // Inicializar almacenSeleccionado con estado global
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState({ id: "%", almacen: "Seleccione..." });
  const [stockFilter, setStockFilter] = useState('');

  // Modals state
  const { isOpen: isMonthlyOpen, onOpen: onMonthlyOpen, onOpenChange: onMonthlyOpenChange } = useDisclosure();
  const { isOpen: isWeeklyOpen, onOpen: onWeeklyOpen, onOpenChange: onWeeklyOpenChange } = useDisclosure();

  const [modalContent, setModalContent] = useState({ mes: "", almacen: "", year: new Date().getFullYear().toString() });
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const [dateRange, setDateRange] = useState({
    start: parseDate(hoyStr),
    end: parseDate(hoyStr),
  });

  const [weeklyAlmacen, setWeeklyAlmacen] = useState("");

  // Filtrar almacenes según rol y sucursal
  const almacenesFiltrados =
    rolUsuario !== 1 && almacenSeleccionado.id !== "%"
      ? almacenes.filter(almacen => almacen.sucursal === sucursalSeleccionada)
      : almacenes;

  useEffect(() => {
    if (almacenGlobal && almacenes.length > 0 && almacenGlobal !== "%") {
      const almacen = almacenes.find(a => a.id === Number(almacenGlobal));
      if (almacen) {
        setAlmacenSeleccionado(almacen);
        // Pre-fill modal selections
        setModalContent(prev => ({ ...prev, almacen: almacen.id }));
        setWeeklyAlmacen(almacen.id);
      }
    } else if (!almacenGlobal && almacenes.length > 0) {
      setAlmacenSeleccionado({ id: "%", almacen: "Seleccione..." });
      setAlmacenGlobal("%");
    }
  }, [almacenGlobal, almacenes, setAlmacenGlobal]);

  useEffect(() => {
    let cancelled = false;
    const fetchEmpresaData = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        if (!cancelled) setEmpresaData(data);
      } catch (error) {
        if (!cancelled) setEmpresaData(null);
      }
    };
    if (nombre) fetchEmpresaData();
    return () => { cancelled = true; };
  }, [nombre]);

  // Filtros combinados
  const [filters, setFilters] = useState({
    descripcion: '',
    almacen: almacenSeleccionado.id !== '' ? almacenSeleccionado.id : '',
    idProducto: '',
    marca: '',
    cat: '',
    subcat: '',
    stock: '',
  });

  useEffect(() => {
    setFilters(f => ({
      ...f,
      almacen: almacenSeleccionado.id || '',
    }));
  }, [almacenSeleccionado]);

  const fetchKardex = useCallback(async () => {
    const result = await getProductosKardex(filters);
    setKardex(result.data || []);
  }, [filters]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex]);

  const handleFiltersChange = (newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  const handleAlmacenChange = (e) => {
    const value = e.target.value;
    if (value === "%") {
      setAlmacenSeleccionado({ id: "%", almacen: "Todos los almacenes" });
      setAlmacenGlobal("%");
    } else {
      const nuevoAlmacen = almacenes.find(a => a.id === parseInt(value)) || { id: '', sucursal: '' };
      setAlmacenSeleccionado(nuevoAlmacen);
      setAlmacenGlobal(nuevoAlmacen.id.toString());
    }
  };

  const generatePDFKardex = async (kardexItems) => {
    try {
      const jspdfModule = await import(/* @vite-ignore */ 'jspdf');
      await import(/* @vite-ignore */ 'jspdf-autotable');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      if (!empresaData) {
        toast.error('Datos de la empresa no disponibles');
        return;
      }

      const base64Image = empresaData.logotipo && empresaData.logotipo.startsWith('data:image')
        ? empresaData.logotipo
        : empresaData.logotipo || null;

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 18;

      // Logo
      try { if (base64Image) doc.addImage(base64Image, 'PNG', 16, cursorY - 4, 28, 28); } catch { }

      // Encabezado
      const xText = base64Image ? 50 : 16;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(empresaData.nombreComercial || 'TORMENTA JEANS', xText, cursorY);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      cursorY += 6;

      const boxW = 68;
      const boxX = pageWidth - boxW - 16;
      const infoMaxWidth = Math.max(80, boxX - xText - 8);

      const direccionLines = doc.splitTextToSize(`Central: ${empresaData.direccion || ''}`, infoMaxWidth);
      direccionLines.forEach(line => { doc.text(line, xText, cursorY); cursorY += 4; });

      const ubicLines = doc.splitTextToSize(`${empresaData.distrito || ''} - ${empresaData.provincia || ''} - ${empresaData.departamento || ''}`, infoMaxWidth);
      ubicLines.forEach(line => { doc.text(line, xText, cursorY); cursorY += 4; });

      doc.text(`TELF: ${empresaData.telefono || ''}`, xText, cursorY); cursorY += 4;
      doc.text(`EMAIL: ${empresaData.email || ''}`, xText, cursorY); cursorY += 8;

      // Recuadro derecho
      doc.setDrawColor(80); doc.setLineWidth(0.25);
      doc.rect(boxX, 12, boxW, 36);
      doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
      doc.text(`RUC ${empresaData.ruc || ''}`, boxX + boxW / 2, 18, { align: 'center' });
      doc.setFillColor(241, 245, 249); doc.rect(boxX, 24, boxW, 11, 'F');
      doc.setFontSize(10.5);
      doc.text('KARDEX MOVIMIENTOS', boxX + boxW / 2, 30, { align: 'center' });

      // Separador
      doc.setDrawColor(230); doc.line(15, cursorY - 4, pageWidth - 15, cursorY - 4);

      // Tabla
      const rows = (kardexItems || []).map(item => [
        item.codigo || '',
        item.descripcion || '',
        item.marca || '',
        item.stock != null ? String(item.stock) : '',
        item.um || ''
      ]);

      doc.autoTable({
        head: [['Código', 'Descripción', 'Marca', 'Stock', 'UM']],
        body: rows,
        startY: cursorY,
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 15 }
        },
        tableWidth: 'auto'
      });

      // Footer
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 8;
      const now = new Date();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Generado: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`, 15, finalY);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }

      doc.save(`kardex_movimientos.pdf`);
      toast.success('PDF generado correctamente');
    } catch (err) {
      console.error('Error generando PDF:', err);
      toast.error('Error al generar el PDF');
    }
  };

  const handleGeneratePDF = () => {
    generatePDFKardex(kardex);
  };

  const handleMonthlySubmit = (onClose) => {
    if (modalContent.mes && modalContent.almacen && modalContent.year) {
      downloadExcelReporteMes(modalContent.mes, modalContent.year, modalContent.almacen);
      onClose();
    } else {
      toast.error('Por favor completa todos los campos.');
    }
  };

  const handleWeeklySubmit = (onClose) => {
    if (!dateRange.start || !dateRange.end || !weeklyAlmacen) {
      toast.error("Por favor selecciona un rango de fechas y un almacén.");
      return;
    }
    const startDate = new Date(dateRange.start).toISOString().split('T')[0];
    const endDate = new Date(dateRange.end).toISOString().split('T')[0];
    downloadExcelReporteFechas(startDate, endDate, weeklyAlmacen);
    onClose();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 transition-colors duration-200">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Kardex de Movimientos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              Tienda actual: <span className="font-semibold text-slate-700 dark:text-slate-200">{almacenSeleccionado?.almacen || "Seleccione un almacén"}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onClick={fetchKardex}
              className="font-medium"
            >
              Actualizar
            </Button>
            <Divider orientation="vertical" className="h-auto mx-1" />
            <Tooltip content="Exportar vista actual a PDF">
              <Button
                className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800"
                variant="bordered"
                startContent={<FaRegFilePdf className="w-4 h-4" />}
                onClick={handleGeneratePDF}
              >
                PDF
              </Button>
            </Tooltip>
            <Tooltip content="Reporte Mensual Excel">
              <Button
                className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                variant="bordered"
                startContent={<FaFileExcel className="w-4 h-4" />}
                onClick={onMonthlyOpen}
              >
                Mensual
              </Button>
            </Tooltip>
            <Tooltip content="Reporte por Fechas Excel">
              <Button
                className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                variant="bordered"
                startContent={<Calendar className="w-4 h-4" />}
                onClick={onWeeklyOpen}
              >
                Rango
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="w-full shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CardBody className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Select
                label="Almacén"
                placeholder="Seleccione..."
                selectedKeys={[almacenSeleccionado.id?.toString()]}
                onChange={handleAlmacenChange}
                variant="bordered"
                size="sm"
                classNames={{
                  trigger: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              >
                <SelectItem key="%" value="%">Todos los almacenes</SelectItem>
                {almacenesFiltrados.map((almacen) => (
                  <SelectItem key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="text"

                placeholder="Buscar por código..."
                startContent={<IoIosSearch className="text-slate-400" />}
                value={filters.idProducto}
                onValueChange={(val) => handleFiltersChange({ idProducto: val })}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              />

              <Input
                type="text"
 
                placeholder="Buscar producto..."
                startContent={<IoIosSearch className="text-slate-400" />}
                value={filters.descripcion}
                onValueChange={(val) => handleFiltersChange({ descripcion: val })}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              />

              <Select
                label="Línea"
                placeholder="Filtrar por línea"
                selectedKeys={categoriaSeleccionada ? [categoriaSeleccionada.toString()] : []}
                onChange={(e) => {
                  setCategoriaSeleccionada(e.target.value);
                  handleFiltersChange({ cat: e.target.value });
                }}
                variant="bordered"
                size="sm"
                classNames={{
                  trigger: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              >
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.categoria}</SelectItem>
                ))}
              </Select>

              <Select
                label="Sub-línea"
                placeholder="Filtrar por sub-línea"
                selectedKeys={filters.subcat ? [filters.subcat.toString()] : []}
                onChange={(e) => handleFiltersChange({ subcat: e.target.value })}
                variant="bordered"
                size="sm"
                classNames={{
                  trigger: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              >
                {subcategorias.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.sub_categoria}</SelectItem>
                ))}
              </Select>

              <Select
                label="Marca"
                placeholder="Filtrar por marca"
                selectedKeys={filters.marca ? [filters.marca.toString()] : []}
                onChange={(e) => handleFiltersChange({ marca: e.target.value })}
                variant="bordered"
                size="sm"
                classNames={{
                  trigger: "bg-slate-50 dark:bg-zinc-800/50",
                }}
              >
                {marcas.map((marca) => (
                  <SelectItem key={marca.id} value={marca.id}>{marca.marca}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Table Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <TablaKardex kardex={kardex} />
        </div>

        {/* Modal Reporte Mensual */}
        <Modal isOpen={isMonthlyOpen} onOpenChange={onMonthlyOpenChange} placement="center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <span className="text-xl font-bold flex items-center gap-2">
                    <FaFileExcel className="text-emerald-500" />
                    Reporte Mensual
                  </span>
                  <span className="text-sm font-normal text-slate-500">Descarga el kardex de un mes específico</span>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <Select
                      label="Mes"
                      placeholder="Seleccione mes"
                      selectedKeys={modalContent.mes ? [modalContent.mes.toString()] : []}
                      onChange={(e) => setModalContent(prev => ({ ...prev, mes: e.target.value }))}
                      variant="bordered"
                    >
                      {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, i) => (
                        <SelectItem key={i + 1} value={i + 1}>{mes}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Año"
                      placeholder="2024"
                      type="number"
                      value={modalContent.year}
                      onValueChange={(val) => setModalContent(prev => ({ ...prev, year: val }))}
                      variant="bordered"
                    />
                    <Select
                      label="Almacén"
                      placeholder="Seleccione almacén"
                      selectedKeys={modalContent.almacen ? [modalContent.almacen.toString()] : []}
                      onChange={(e) => setModalContent(prev => ({ ...prev, almacen: e.target.value }))}
                      variant="bordered"
                    >
                      {almacenes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={() => handleMonthlySubmit(onClose)} startContent={<Download className="w-4 h-4" />}>
                    Descargar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal Reporte por Rango */}
        <Modal isOpen={isWeeklyOpen} onOpenChange={onWeeklyOpenChange} placement="center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <span className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="text-amber-500" />
                    Reporte por Rango
                  </span>
                  <span className="text-sm font-normal text-slate-500">Descarga el kardex de un rango de fechas</span>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <DateRangePicker
                      label="Rango de fechas"
                      value={dateRange}
                      onChange={setDateRange}
                      variant="bordered"
                      className="w-full"
                    />
                    <Select
                      label="Almacén"
                      placeholder="Seleccione almacén"
                      selectedKeys={weeklyAlmacen ? [weeklyAlmacen.toString()] : []}
                      onChange={(e) => setWeeklyAlmacen(e.target.value)}
                      variant="bordered"
                    >
                      {almacenes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={() => handleWeeklySubmit(onClose)} startContent={<Download className="w-4 h-4" />}>
                    Descargar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

      </div>
    </div>
  );
};

export default Kardex;
