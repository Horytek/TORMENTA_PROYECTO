import React, { useState, useEffect, useCallback } from 'react';
import { parseDate } from "@internationalized/date";
import { DateRangePicker } from '@heroui/react';
import TablaKardex from './Kardex/ComponentsKardex/KardexTable';
import getSalidaData from './Kardex/data/data_kardex';
import useAlmacenData from './Kardex/data/data_almacen_kardex';
import useMarcaData from './Kardex/data/data_marca_kardex';
import useCategoriaData from './Kardex/data/data_categoria_kardex';
import useSubCategoriaData from './Kardex/data/data_subcategoria_kardex';
import downloadExcelReport from './Kardex/data/generateExcel';
import downloadExcelReportByPeriod from './Kardex/data/generateExcelDates';
import { Select, SelectItem } from "@heroui/react";
import { Input } from '@heroui/react';
import { Toaster, toast } from 'react-hot-toast';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Button } from "@heroui/react";
import { CgOptions } from "react-icons/cg";
import { FaRegFilePdf } from "react-icons/fa";
import { FaFileExcel } from "react-icons/fa";
import { RefreshCw } from 'lucide-react';
import { IoIosSearch } from "react-icons/io";
import { useUserStore } from "@/store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";

const Kardex = () => {

    const { almacenes } = useAlmacenData();
    const [kardex, setKarddex] = useState([]);
    const { marcas } = useMarcaData();
    const { categorias } = useCategoriaData();
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const { subcategorias } = useSubCategoriaData(categoriaSeleccionada);

    // Obtener estado global de Zustand
    const rolUsuario = useUserStore(state => state.rol);
    const sucursalSeleccionada = useUserStore(state => state.sur);
    const almacenGlobal = useUserStore(state => state.almacen);
    const setAlmacenGlobal = useUserStore(state => state.setAlmacen);
    const nombre = useUserStore(state => state.nombre);
    const [empresaData, setEmpresaData] = useState(null);

    // Inicializar almacenSeleccionado con estado global
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        if (almacenGlobal && almacenes.length > 0) {
            return almacenes.find(a => a.id === parseInt(almacenGlobal)) || { id: '', sucursal: '' };
        }
        return { id: '', sucursal: '' };
    });

    const [stockFilter, setStockFilter] = useState(''); // filtro stock

    // Filtrar almacenes según rol y sucursal
    const almacenesFiltrados =
      rolUsuario !== 1
        ? almacenes.filter(almacen => almacen.sucursal === sucursalSeleccionada)
        : almacenes;

useEffect(() => {
  // Lógica de almacenes
  if (almacenes.length > 0) {
    if (almacenGlobal) {
      const almacen = almacenes.find(a => a.id === Number(almacenGlobal));
      if (almacen) {
        setAlmacenSeleccionado(almacen);
      }
    } else {
      const primero = almacenes[0];
      setAlmacenSeleccionado(primero);
      setAlmacenGlobal(String(primero.id));
    }
  }
}, [almacenGlobal, almacenes, setAlmacenGlobal]);

useEffect(() => {
  // Lógica de empresa
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

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // total páginas
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ mes: "", almacen: "", year: "" });
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const [value, setValue] = React.useState({
        start: parseDate(hoyStr),
        end: parseDate(hoyStr),
    });

    const [tempValue, setTempValue] = useState(value);

    const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
    const [weeklyModalContent, setWeeklyModalContent] = useState({
        start: null,
        end: null,
        almacen: "",
    });

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

    // Actualiza filters cuando cambia almacenSeleccionado local
    useEffect(() => {
        setFilters(f => ({
            ...f,
            almacen: almacenSeleccionado.id || '',
        }));
    }, [almacenSeleccionado]);

    const fetchKardex = useCallback(async () => {
        const data = await getSalidaData(filters);
        setKarddex(data.salida);
    }, [filters]);

    useEffect(() => {
        fetchKardex();
    }, [fetchKardex]);

    const onPageChange = (page) => {
        setCurrentPage(page);
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilters,
        }));
    };

    const handleStockFilterChange = (event) => {
        const value = event.target.value;
        setStockFilter(value);
        handleFiltersChange({ stock: value });
    };

    // Cuando se cambia almacen en UI
    const handleAlmacenChange = (event) => {
        const nuevoAlmacen = almacenes.find(a => a.id === parseInt(event.target.value)) || { id: '', sucursal: '' };
        setAlmacenSeleccionado(nuevoAlmacen);
        setAlmacenGlobal(nuevoAlmacen.id.toString());
    };

const generatePDFKardex = async (kardexItems, almacenSeleccionado) => {
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

    // Logo (si existe)
    try { if (base64Image) doc.addImage(base64Image, 'PNG', 16, cursorY - 4, 28, 28); } catch {}

    // Encabezado empresa (espacio para recuadro derecho)
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
    doc.setFillColor(191,219,254); doc.rect(boxX, 24, boxW, 11, 'F');
    doc.setFontSize(10.5);
    doc.text('KARDEX MOVIMIENTOS', boxX + boxW / 2, 30, { align: 'center' });

    // Separador
    doc.setDrawColor(230); doc.line(15, cursorY - 4, pageWidth - 15, cursorY - 4);

    // Tabla con jsPDF-AutoTable
    const rows = (kardexItems || []).map(item => [
      item.codigo || '',
      item.descripcion || '',
      item.marca || '',
      item.stock != null ? String(item.stock) : '',
      item.um || ''
    ]);

    doc.autoTable({
      head: [['Código','Descripción','Marca','Stock','UM']],
      body: rows,
      startY: cursorY,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [191,219,254], textColor: [15,23,42], fontStyle: 'bold' },
      columnStyles: { 0:{cellWidth:28},1:{cellWidth:'auto'},2:{cellWidth:36},3:{cellWidth:20, halign:'right'},4:{cellWidth:18} },
      tableWidth: 'auto'
    });

    // Footer / paginación y metadata
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 8;
    const now = new Date();
    doc.setFontSize(9);
    doc.text(`Generado: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`, 15, finalY);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 18, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`kardex_movimientos.pdf`);
    toast.success('PDF generado');
  } catch (err) {
    console.error('Error generando PDF con jsPDF:', err);
    toast.error('Error al generar el PDF (ver consola)');
  }
};
    
    const handleGeneratePDF = () => {
        generatePDFKardex(kardex, almacenSeleccionado);
    };

    const handleCategoriaChange = (event) => {
        setCategoriaSeleccionada(event.target.value);
        handleFiltersChange({ cat: event.target.value });
    };

    const handleSubCategoriaChange = (event) => {
        handleFiltersChange({ subcat: event.target.value });
    };

    const handleMarcaChange = (event) => {
        handleFiltersChange({ marca: event.target.value });
    };

    const handleDescripcionChange = (event) => {
        handleFiltersChange({ descripcion: event.target.value });
    };

    const handleCodigoChange = (event) => {
        handleFiltersChange({ idProducto: event.target.value });
    };



    const resetModalContent = () => {
        setModalContent({ mes: "", almacen: "", year: "" });
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        resetModalContent();
        setIsModalOpen(false);
    };

    const handleModalChange = (field, value) => {
        setModalContent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleModalSubmit = () => {
        if (modalContent.mes && modalContent.almacen && modalContent.year) {
            downloadExcelReport(modalContent.mes, modalContent.year, modalContent.almacen);
            resetModalContent();
            setIsModalOpen(false);
        } else {
            toast.error('Por favor completa todos los campos.');
            return;
        }

    };


    const handleOpenWeeklyModal = () => {
        setIsWeeklyModalOpen(true);
    };

    const handleCloseWeeklyModal = () => {
        setIsWeeklyModalOpen(false);
        resetWeeklyModalContent();
    };

    const resetWeeklyModalContent = () => {
        setWeeklyModalContent({
            startDate: null,
            endDate: null,
            almacen: "",
        });
    };

    const handleDateChange = (newValue) => {
        if (newValue.start && newValue.end) {
            setValue(newValue);
            setTempValue(newValue);
        } else {
            setTempValue(newValue);
        }
    };

    const handleAlmacenModalChange = (e) => {
        setWeeklyModalContent((prev) => ({
            ...prev,
            almacen: e.target.value,
        }));
    };

    const handleWeeklyModalSubmit = async () => {
        const { start, end } = tempValue;
        const { almacen } = weeklyModalContent;

        // Verificar si los campos están completos
        if (!start || !end || !almacen) {
            toast.error("Por favor selecciona un rango de fechas y un almacén.");
            return;
        } else {
            const startDate = new Date(start).toISOString().split('T')[0];
            const endDate = new Date(end).toISOString().split('T')[0];

            downloadExcelReportByPeriod(startDate, endDate, almacen);
            handleCloseWeeklyModal();
        }

    };


return (
  <div className="min-h-screen from-slate-50 p-6">
    <Toaster />
    <div className="max-w-[98vw] xl:max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Kardex de Movimientos</h1>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium">Tienda: {almacenSeleccionado?.almacen || "Almacén"}</span>
            </div>
          </div>
          <div className="flex gap-3">
                <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 transition-colors"
                onClick={fetchKardex}
                >
                <RefreshCw className="w-4 h-4 text-blue-500" />
                Actualizar
                </Button>
                <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 transition-colors"
                onClick={handleGeneratePDF}
                >
                <FaRegFilePdf className="w-4 h-4 text-rose-500" />
                Exportar PDF
                </Button>
                <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 transition-colors"
                onClick={handleOpenModal}
                >
                <FaFileExcel className="w-4 h-4 text-emerald-500" />
                Rep. Mensual
                </Button>
                <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700 transition-colors"
                onClick={handleOpenWeeklyModal}
                >
                <FaFileExcel className="w-4 h-4 text-yellow-500" />
                Rep. Semanal
                </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Select
            id="almacen"
            className="w-full"
            onChange={handleAlmacenChange}
            selectedKeys={[almacenSeleccionado.id?.toString()]}
            classNames={{
              trigger: "bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500",
              value: "text-blue-900",
            }}
          >
            {rolUsuario === '1' && <SelectItem key="%" value="%">Seleccione...</SelectItem>}
            {almacenesFiltrados.map((almacen) => (
              <SelectItem key={almacen.id} value={almacen.id}>
                {almacen.almacen}
              </SelectItem>
            ))}
          </Select>
          <Input
            startContent={<IoIosSearch className='w-4 h-4 text-blue-400' />}
            type="text"
            placeholder="Código"
            className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            onChange={handleCodigoChange}
          />
          <Input
            startContent={<IoIosSearch className='w-4 h-4 text-blue-400' />}
            type="text"
            placeholder="Descripción"
            className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            onChange={handleDescripcionChange}
          />
          <Select
            className="w-full"
            onChange={handleCategoriaChange}
            selectedKeys={[categoriaSeleccionada]}
            placeholder="Línea"
            classNames={{
              trigger: "bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500",
              value: "text-blue-900",
            }}
          >
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.categoria}
              </SelectItem>
            ))}
          </Select>
          <Select
            className="w-full"
            onChange={handleSubCategoriaChange}
            placeholder="Sub-línea"
            classNames={{
              trigger: "bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500",
              value: "text-blue-900",
            }}
          >
            {subcategorias.map((subcategoria) => (
              <SelectItem key={subcategoria.id} value={subcategoria.id}>
                {subcategoria.sub_categoria}
              </SelectItem>
            ))}
          </Select>
          <Select
            className="w-full"
            onChange={handleMarcaChange}
            placeholder="Marca"
            classNames={{
              trigger: "bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500",
              value: "text-blue-900",
            }}
          >
            {marcas.map((marca) => (
              <SelectItem key={marca.id} value={marca.id}>
                {marca.marca}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Tabla de Kardex */}
      <div>
        <TablaKardex kardex={kardex} />
      </div>

      {/* Modales */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-xl font-bold mb-4">Seleccionar Opciones</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Mes:</label>
              <select
                className="w-full border border-gray-300 p-2 rounded-lg"
                value={modalContent.mes}
                onChange={(e) => handleModalChange("mes", e.target.value)}
              >
                <option value="">Seleccione un mes</option>
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(
                  (mes, index) => (
                    <option key={index} value={index + 1}>
                      {mes}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Año:</label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded-lg"
                value={modalContent.year}
                onChange={(e) => handleModalChange("year", e.target.value)}
                placeholder="Ingrese el año"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Almacén:</label>
              <select
                className="w-full border border-gray-300 p-2 rounded-lg"
                value={modalContent.almacen}
                onChange={(e) => handleModalChange("almacen", e.target.value)}
              >
                <option value="">Seleccione un almacén</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleModalSubmit}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isWeeklyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-xl font-bold mb-4">Seleccionar Rango Semanal</h2>
            <div className="mb-4">
              <DateRangePicker
                classNames={{ inputWrapper: "bg-white" }}
                value={tempValue}
                onChange={handleDateChange}
                renderInput={(props) => (
                  <input {...props} className="p-2 bg-white border border-gray-300 rounded-lg" />
                )}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Almacén:</label>
              <select
                className="w-full border border-gray-300 p-2 rounded-lg"
                value={weeklyModalContent.almacen}
                onChange={handleAlmacenModalChange}
              >
                <option value="">Seleccione un almacén</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={handleCloseWeeklyModal}
              >
                Cancelar
              </Button>
              <Button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleWeeklyModalSubmit}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Kardex;
