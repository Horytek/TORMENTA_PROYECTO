import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Pagination,
  Divider,
  Tooltip,
  Chip
} from '@heroui/react';
import TablaKardex from './components/KardexTable';
import { getProductosKardex, downloadExcelReporteMes, downloadExcelReporteFechas } from '@/services/kardex.services';
import { getProductAttributes } from "@/services/productos.services";
import { useAlmacenesKardex, useMarcasKardex, useCategoriasKardex, useSubcategoriasKardex } from '@/hooks/useKardex';
import { toast } from 'react-hot-toast';
import { FaRegFilePdf, FaFileExcel } from "react-icons/fa";
import { RefreshCw, Calendar, Download } from 'lucide-react';
import { IoIosSearch } from "react-icons/io";
import { useUserStore } from "@/store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { ActionButton } from '@/components/Buttons/Buttons';

// Estilos Glass Clean
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 border-none shadow-none rounded-2xl h-10 data-[hover=true]:bg-slate-50 dark:data-[hover=true]:bg-zinc-800/50 group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-zinc-800 ring-1 ring-slate-200 dark:ring-zinc-700 focus-within:!ring-2 focus-within:!ring-blue-500/20",
  input: "text-slate-600 dark:text-slate-300 text-sm group-data-[has-value=true]:text-slate-900 dark:group-data-[has-value=true]:text-white",
};

const Kardex = () => {
  const { almacenes } = useAlmacenesKardex();
  const [kardex, setKardex] = useState([]);
  const [attrMetadataMap, setAttrMetadataMap] = useState({});
  const { marcas } = useMarcasKardex();
  const { categorias } = useCategoriasKardex();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const { subcategorias } = useSubcategoriasKardex(categoriaSeleccionada);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Obtener estado global de Zustand
  const rolUsuario = useUserStore(state => state.rol);
  const sucursalSeleccionada = useUserStore(state => state.sur);
  const almacenGlobal = useUserStore(state => state.almacen);
  const setAlmacenGlobal = useUserStore(state => state.setAlmacen);
  const nombre = useUserStore(state => state.nombre);
  const [empresaData, setEmpresaData] = useState(null);

  // Inicializar almacenSeleccionado con "Todos los almacenes" por defecto
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState({ id: "%", almacen: "Todos los almacenes" });

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

  // Forzar que al entrar a Kardex siempre se seleccione "Todos los almacenes"
  useEffect(() => {
    setAlmacenSeleccionado({ id: "%", almacen: "Todos los almacenes" });
    setAlmacenGlobal("%");
  }, [setAlmacenGlobal]);

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
    almacen: '', // Empty initially implies all or handled by backend
    idProducto: '',
    marca: '',
    cat: '',
    subcat: '',
    stock: '',
  });

  // Update filters when almacenSeleccionado changes
  useEffect(() => {
    setFilters(f => ({
      ...f,
      almacen: almacenSeleccionado.id === '%' ? '' : (almacenSeleccionado.id || ''),
    }));
  }, [almacenSeleccionado]);

  const fetchKardex = useCallback(async () => {
    // Si no hay filtro de almacén específico (vacío o %), no cargar datos para evitar duplicados
    if (!filters.almacen || filters.almacen === '%') {
      setKardex([]);
      return;
    }

    try {
      const result = await getProductosKardex(filters);
      if (result && result.data) {
        setKardex(result.data);
      } else {
        setKardex([]);
      }
      setPage(1); // Reset page on filter/fetch
    } catch (error) {
      console.error("Error fetching kardex:", error);
      setKardex([]);
      toast.error("Error al cargar datos del kardex");
    }
  }, [filters]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex]);

  // Fetch metadata for variants
  useEffect(() => {
    if (!kardex.length) return;
    const uniqueIds = [...new Set(kardex.filter(k => k.attributes).map(k => k.codigo))];

    uniqueIds.forEach(async (id) => {
      if (attrMetadataMap[id]) return;
      try {
        const data = await getProductAttributes(id);
        if (data) {
          const names = {};
          const colors = {};
          if (data.attributes) {
            data.attributes.forEach(a => {
              names[a.id_atributo] = a.nombre;
              if (a.hex) colors[a.nombre] = a.hex;
            });
          }
          setAttrMetadataMap(prev => ({ ...prev, [id]: { names, colors } }));
        }
      } catch (e) { console.error(e); }
    });
  }, [kardex]);

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
      // Tabla
      const rows = (kardexItems || []).map(item => {
        let desc = item.descripcion || '';

        let attributes = item.attributes;
        if (typeof attributes === 'string') {
          try { attributes = JSON.parse(attributes); } catch { }
        }

        if (attributes && Object.keys(attributes).length > 0) {
          const meta = attrMetadataMap[item.codigo] || { names: {} };
          const keys = Object.keys(attributes).sort((a, b) => {
            const la = meta.names[a] || a;
            const lb = meta.names[b] || b;
            if (la === 'Color') return -1;
            if (lb === 'Color') return 1;
            return la.localeCompare(lb);
          });
          const parts = keys.map(k => {
            const label = meta.names[k] || k;
            const val = attributes[k];
            return `${label}: ${val}`;
          });
          if (parts.length > 0) desc += ` [${parts.join(', ')}]`;
        } else {
          // Fallback Legacy
          const extras = [];
          if (item.sku_label && item.sku_label !== 'Standard') extras.push(item.sku_label);
          else {
            if (item.talla && item.talla !== '-') extras.push(`T: ${item.talla}`);
            if (item.tonalidad && item.tonalidad !== '-') extras.push(`C: ${item.tonalidad}`);
          }
          if (extras.length) desc += ` [${extras.join(', ')}]`;
        }

        return [
          item.codigo || '',
          desc,
          item.marca || '',
          item.stock != null ? String(item.stock) : '',
          item.um || ''
        ];
      });

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
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kardex de Movimientos
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            Tienda actual: <span className="font-semibold text-slate-700 dark:text-slate-200">{almacenSeleccionado?.almacen || "Seleccione un almacén"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            color="blue"
            icon={<RefreshCw className="w-5 h-5" />}
            onClick={fetchKardex}
          >
            Actualizar
          </ActionButton>

          <Divider orientation="vertical" className="h-auto mx-1" />

          <Tooltip content="Exportar vista actual a PDF">
            <div>
              <ActionButton
                color="red"
                icon={<FaRegFilePdf className="w-5 h-5" />}
                onClick={handleGeneratePDF}
              >
                PDF
              </ActionButton>
            </div>
          </Tooltip>

          <Tooltip content="Reporte Mensual Excel">
            <div>
              <ActionButton
                color="green"
                icon={<FaFileExcel className="w-5 h-5" />}
                onClick={onMonthlyOpen}
              >
                Mensual
              </ActionButton>
            </div>
          </Tooltip>

          <Tooltip content="Reporte por Fechas Excel">
            <div>
              <ActionButton
                color="yellow"
                icon={<Calendar className="w-5 h-5" />}
                onClick={onWeeklyOpen}
              >
                Rango
              </ActionButton>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Filters Section - Clean & Glass */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Select
                placeholder="Almacén"
                selectedKeys={almacenSeleccionado.id && almacenSeleccionado.id !== "%" ? [almacenSeleccionado.id.toString()] : []}
                onChange={handleAlmacenChange}
                size="sm"
                className="w-full"
                classNames={{
                  trigger: "h-10 min-h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus:border-blue-600 rounded-xl shadow-sm transition-all",
                  value: "text-sm text-slate-700 dark:text-slate-200",
                  popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg rounded-xl"
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
                placeholder="Buscar por código..."
                value={filters.idProducto}
                onValueChange={(val) => handleFiltersChange({ idProducto: val })}
                isClearable
                onClear={() => handleFiltersChange({ idProducto: '' })}
                size="sm"
                classNames={{
                  inputWrapper: "h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/20 rounded-xl shadow-sm transition-all",
                  input: "text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                }}
              />

              <Input
                placeholder="Buscar producto..."
                value={filters.descripcion}
                onValueChange={(val) => handleFiltersChange({ descripcion: val })}
                isClearable
                onClear={() => handleFiltersChange({ descripcion: '' })}
                size="sm"
                classNames={{
                  inputWrapper: "h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/20 rounded-xl shadow-sm transition-all",
                  input: "text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                }}
              />

              <Select
                placeholder="Línea"
                selectedKeys={categoriaSeleccionada ? [categoriaSeleccionada.toString()] : []}
                onChange={(e) => {
                  setCategoriaSeleccionada(e.target.value);
                  handleFiltersChange({ cat: e.target.value });
                }}
                size="sm"
                classNames={{
                  trigger: "h-10 min-h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus:border-blue-600 rounded-xl shadow-sm transition-all",
                  value: "text-sm text-slate-700 dark:text-slate-200",
                  popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg rounded-xl"
                }}
              >
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.categoria}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Sub-línea"
                selectedKeys={filters.subcat ? [filters.subcat.toString()] : []}
                onChange={(e) => handleFiltersChange({ subcat: e.target.value })}
                size="sm"
                classNames={{
                  trigger: "h-10 min-h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus:border-blue-600 rounded-xl shadow-sm transition-all",
                  value: "text-sm text-slate-700 dark:text-slate-200",
                  popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg rounded-xl"
                }}
                isDisabled={!categoriaSeleccionada}
              >
                {subcategorias.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.sub_categoria}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Marca"
                selectedKeys={filters.marca ? [filters.marca.toString()] : []}
                onChange={(e) => handleFiltersChange({ marca: e.target.value })}
                size="sm"
                classNames={{
                  trigger: "h-10 min-h-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus:border-blue-600 rounded-xl shadow-sm transition-all",
                  value: "text-sm text-slate-700 dark:text-slate-200",
                  popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg rounded-xl"
                }}
              >
                {marcas.map((marca) => (
                  <SelectItem key={marca.id} value={marca.id}>{marca.marca}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <TablaKardex
          kardex={kardex}
          page={page}
          limit={limit}
          emptyText={!filters.almacen || filters.almacen === '%' ? "Seleccione un almacén para ver el inventario" : "No hay productos en el inventario"}
          attrMetadataMap={attrMetadataMap}
          almacenSeleccionado={filters.almacen}
        />

        {/* Pagination Footer */}
        <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4">
          <div className="flex gap-2 items-center">
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {kardex.length} items
            </span>
            <Select
              size="sm"
              className="w-20"
              selectedKeys={[`${limit}`]}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Filas por página"
              classNames={{
                trigger: "min-h-8 h-8 bg-slate-50 dark:bg-zinc-800 rounded-lg",
                value: "text-[12px]"
              }}
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="15">15</SelectItem>
              <SelectItem key="20">20</SelectItem>
              <SelectItem key="50">50</SelectItem>
            </Select>
          </div>

          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={Math.ceil(kardex.length / limit) || 1}
            onChange={setPage}
            classNames={{
              cursor: "bg-blue-600 text-white font-bold"
            }}
          />
        </div>
      </div>

      {/* Modal Reporte Mensual */}
      <Modal isOpen={isMonthlyOpen} onOpenChange={onMonthlyOpenChange} placement="center" backdrop="blur">
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
      <Modal isOpen={isWeeklyOpen} onOpenChange={onWeeklyOpenChange} placement="center" backdrop="blur">
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
  );
};

export default Kardex;
