import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRangePicker, Select, SelectItem, Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@heroui/react';
import { parseDate } from "@internationalized/date";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaFilePdf } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { CgOptions } from "react-icons/cg";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { usePermisos } from '@/routes';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { toast } from "react-hot-toast";

const FiltrosIngresos = ({ almacenes = [], onAlmacenChange, onFiltersChange, ingresos, almacenSseleccionado }) => {
  const navigate = useNavigate();
  const { hasCreatePermission } = usePermisos();
  const nombre = useUserStore((state) => state.nombre);
  const rolUsuario = useUserStore((state) => state.rol);
  const sucursalSeleccionada = useUserStore((state) => state.sur);
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

  const isAdmin = String(rolUsuario) === "1";

  // Empresa (para PDF)
  const [empresaData, setEmpresaData] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        if (mounted) setEmpresaData(data);
      } catch {
        if (mounted) setEmpresaData(null);
      }
    })();
    return () => { mounted = false; };
  }, [nombre]);

  // Almacén seleccionado (con “Todos” = %)
  const initialAlmacen = useMemo(() => {
    if (almacenGlobal && almacenes.length > 0) {
      return almacenes.find(a => a.id === parseInt(almacenGlobal)) || { id: '%', sucursal: '' };
    }
    return { id: '%', sucursal: '' };
  }, [almacenes, almacenGlobal]);

  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(initialAlmacen);

  useEffect(() => {
    if (almacenGlobal && almacenes.length > 0) {
      const match = almacenes.find(a => a.id === parseInt(almacenGlobal));
      if (match) setAlmacenSeleccionado(match);
    }
  }, [almacenGlobal, almacenes]);

  // Estado (“Todos” = %)
  const [estado, setEstado] = useState('%');

  // Fechas
  const [value, setValue] = useState({
    start: parseDate("2024-04-01"),
    end: parseDate("2028-04-08"),
  });

  // Inputs con debounce
  const [searchRazon, setSearchRazon] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');
  const [searchDocumento, setSearchDocumento] = useState('');
  const [razon, setRazon] = useState('');
  const [usuario, setUsuario] = useState('');
  const [documento, setDocumento] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setRazon(searchRazon.trim());
      setUsuario(searchUsuario.trim());
      setDocumento(searchDocumento.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchRazon, searchUsuario, searchDocumento]);

  // Filtrar almacenes por sucursal si no es admin
  const almacenesFiltrados = useMemo(() => {
    return String(rolUsuario) !== "1"
      ? almacenes.filter(a => a.sucursal === sucursalSeleccionada)
      : almacenes;
  }, [almacenes, rolUsuario, sucursalSeleccionada]);

  // Aplicar filtros (una sola función estable)
  const applyFilters = useCallback(() => {
    const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
    const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

    const filtros = {
      fecha_i: date_i,
      fecha_e: date_e,
      razon_social: razon || undefined,
      almacen: almacenSeleccionado?.id !== '%' ? almacenSeleccionado?.id : undefined,
      usuario: usuario || undefined,
      documento: documento || undefined,
      estado: estado !== '%' ? estado : undefined,
    };

    onFiltersChange(filtros);
  }, [value, razon, usuario, documento, almacenSeleccionado, estado, onFiltersChange]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  // Cambios de controles
  const handleAlmacenChange = (event) => {
    const val = event.target.value;
    const almacen = val === '%'
      ? { id: '%', sucursal: '' }
      : almacenes.find((a) => a.id === parseInt(val));
    setAlmacenSeleccionado(almacen);
    setAlmacenGlobal(almacen.id === '%' ? '' : almacen.id);
    onAlmacenChange(almacen);
  };

  const handleReset = () => {
    setAlmacenSeleccionado({ id: '%', sucursal: '' });
    setAlmacenGlobal('');
    setEstado('%');
    setSearchRazon('');
    setSearchUsuario('');
    setSearchDocumento('');
    setValue({ start: parseDate("2024-04-01"), end: parseDate("2028-04-08") });
    onAlmacenChange({ id: '%', sucursal: '' });
  };

  // PDF: menú
  const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);
  const openModalPDF = () => setIsModalOpenPDF(true);
  const closeModalPDF = () => setIsModalOpenPDF(false);
  const handleConfirmPDF = () => { setIsModalOpenPDF(false); };

  const handleSelectChange = (value) => {
    if (value === "pdf") {
      generatePDFIngreso(ingresos, almacenSseleccionado);
    }
  };

  // PDF: generación (optimizada)
  const generatePDFIngreso = async (ingresos) => {
    try {
      const [{ jsPDF }, autoTable] = await Promise.all([
        import(/* @vite-ignore */ 'jspdf').then(m => ({ jsPDF: m.jsPDF || m.default?.jsPDF || m.default || m })),
        import(/* @vite-ignore */ 'jspdf-autotable').then(m => m.default || m)
      ]);

      let logoBase64 = empresaData?.logotipo;
      if (empresaData?.logotipo && !empresaData.logotipo.startsWith('data:image')) {
        try {
          const r = await fetch(empresaData.logotipo);
          const blob = await r.blob();
          logoBase64 = await new Promise(res => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch {
          logoBase64 = null;
        }
      }

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 12;
      const right = 12;
      let cursorY = 12;

      const logoW = 36, logoH = 36;
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', left, cursorY, logoW, logoH); } catch {}
      }

      const boxW = 70, boxH = 38;
      const boxX = pageWidth - boxW - right;
      doc.setDrawColor(80); doc.setLineWidth(0.25);
      doc.rect(boxX, cursorY - 4, boxW, boxH);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(`RUC ${empresaData?.ruc || '20610588981'}`, boxX + boxW / 2, cursorY + 2, { align: 'center' });
      doc.setFillColor(191, 219, 254);
      doc.rect(boxX, cursorY + 6, boxW, 10, 'F');
      doc.setFontSize(10); doc.setTextColor(20);
      doc.text('NOTAS DE INGRESO', boxX + boxW / 2, cursorY + 13, { align: 'center' });
      doc.setTextColor(0);

      const xText = logoBase64 ? left + logoW + 8 : left;
      const gapToBox = 22;
      const infoMaxWidth = Math.max(80, boxX - xText - gapToBox);
      const headerCenterY = cursorY + Math.max(logoH, boxH) / 2;
      let textY = Math.round(headerCenterY - 10);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text(empresaData?.nombreComercial || 'TORMENTA JEANS', xText, textY, { maxWidth: infoMaxWidth });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      textY += 6;
      doc.text(empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.', xText, textY, { maxWidth: infoMaxWidth });

      textY += 5;
      const rawDir = `Central: ${empresaData?.direccion || ''}`;
      let dirLines = doc.splitTextToSize(rawDir, infoMaxWidth);
      if (dirLines.length > 2) { doc.setFontSize(8); dirLines = doc.splitTextToSize(rawDir, infoMaxWidth); }
      dirLines.forEach(l => { textY += 4; doc.text(l, xText, textY); });

      if (doc.getFontSize() < 9) doc.setFontSize(9);
      textY += 4;
      const ubicLines = doc.splitTextToSize(`${empresaData?.distrito || ''} - ${empresaData?.provincia || ''} - ${empresaData?.departamento || ''}`, infoMaxWidth);
      ubicLines.forEach(l => { doc.text(l, xText, textY); textY += 4; });

      textY += 2;
      doc.text(`TELF: ${empresaData?.telefono || ''}`, xText, textY);
      textY += 4;
      doc.text(`EMAIL: ${empresaData?.email || ''}`, xText, textY);

      cursorY = Math.max(cursorY + boxH + 4, textY + 8);

      doc.setDrawColor(210); doc.setLineWidth(0.2);
      doc.line(left, cursorY - 6, pageWidth - right, cursorY - 6);

      const headerBgH = 10;
      doc.setFillColor(222, 238, 255);
      doc.rect(left, cursorY - 2, pageWidth - left - right, headerBgH, 'F');

      const rows = (ingresos || []).map(i => [
        i.fecha || '',
        i.documento || '',
        i.proveedor || '',
        i.concepto || '',
        i.almacen_D || '',
        i.estado === 1 ? 'Inactivo' : 'Activo',
        i.usuario || ''
      ]);

      doc.autoTable({
        head: [['Fecha','Documento','Proveedor','Concepto','Almacén','Estado','Usuario']],
        body: rows,
        startY: cursorY + 5,
        margin: { left, right },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle', lineWidth: 0 },
        headStyles: { fillColor: [222,238,255], textColor: [20,30,40], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 42 },
          2: { cellWidth: 56 },
          3: { cellWidth: pageWidth * 0.34 },
          4: { cellWidth: 44 },
          5: { cellWidth: 22 },
          6: { cellWidth: 38 }
        },
        tableWidth: pageWidth - left - right,
        tableLineWidth: 0,
        tableLineColor: [255,255,255]
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : cursorY + 8;
      const now = new Date();
      doc.setFontSize(9);
      doc.text(`Generado: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE')}`, left, finalY);

      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(120);
        doc.text(`Página ${p} de ${totalPages}`, pageWidth - right - 3, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      doc.save(`ingresos_general.pdf`);
      toast.success('PDF generado');
    } catch (err) {
      console.error('Error generando PDF con jsPDF:', err);
      toast.error('Error al generar el PDF');
    }
  };

  const handleNavigation = () => {
    navigate("/almacen/nota_ingreso/registro_ingreso");
  };

  return (
    <div className="rounded-2xl border-blue-100/70 dark:border-zinc-700/60 bg-white/85 dark:bg-[#18192b]/85 backdrop-blur-sm px-3 py-3">
      {/* Grid responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Almacén */}
        <div className="flex items-center gap-2">
          <h6 className="font-bold text-blue-900 dark:text-slate-100">Almacén:</h6>
          <Select
            id="almacen"
            selectedKeys={[almacenSeleccionado?.id?.toString() || '%']}
            onChange={handleAlmacenChange}
            className="w-full"
            classNames={{
              trigger: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              value: "text-sm text-blue-900 dark:text-slate-100",
              listbox: "bg-white dark:bg-[#222a36]"
            }}
          >
            {isAdmin && <SelectItem key="%" value="%">Todos</SelectItem>}
            {almacenesFiltrados.map((almacen) => (
              <SelectItem key={almacen.id} value={almacen.id}>
                {almacen.almacen}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Razón social */}
        <div>
          <Input
            size="sm"
            startContent={<IoIosSearch className="w-4 h-4 text-gray-500" />}
            placeholder="Nombre o razón social"
            value={searchRazon}
            onChange={(e) => setSearchRazon(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            className="w-full"
            classNames={{
              inputWrapper: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              input: "text-sm text-blue-900 dark:text-slate-100"
            }}
          />
        </div>

        {/* Documento */}
        <div>
          <Input
            size="sm"
            startContent={<IoIosSearch className="w-4 h-4 text-gray-500" />}
            placeholder="Documento"
            value={searchDocumento}
            onChange={(e) => setSearchDocumento(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            className="w-full"
            classNames={{
              inputWrapper: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              input: "text-sm text-blue-900 dark:text-slate-100"
            }}
          />
        </div>

        {/* Fechas */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-900 dark:text-slate-100">Fecha:</span>
          <DateRangePicker
            className="w-full"
            classNames={{
              inputWrapper: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              content: "text-sm text-blue-900 dark:text-slate-100",
              calendar: "dark:bg-[#1e2734]"
            }}
            value={value}
            onChange={setValue}
          />
        </div>

        {/* Estado */}
        <div>
          <Select
            placeholder="Estado"
            selectedKeys={[estado]}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full"
            classNames={{
              trigger: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              value: "text-sm text-blue-900 dark:text-slate-100",
              listbox: "bg-white dark:bg-[#222a36]"
            }}
          >
            <SelectItem key="%" value="%">Todos</SelectItem>
            <SelectItem key="0" value="0">Activo</SelectItem>
            <SelectItem key="1" value="1">Inactivo</SelectItem>
          </Select>
        </div>

        {/* Usuario */}
        <div>
          <Input
            size="sm"
            startContent={<IoIosSearch className="w-4 h-4 text-gray-500" />}
            placeholder="Usuario"
            value={searchUsuario}
            onChange={(e) => setSearchUsuario(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            className="w-full"
            classNames={{
              inputWrapper: "h-10 bg-white/80 dark:bg-zinc-800/70 border border-blue-100/70 dark:border-zinc-700/60 rounded-lg",
              input: "text-sm text-blue-900 dark:text-slate-100"
            }}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          variant="flat"
          size="sm"
          onPress={handleReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800/70 dark:hover:bg-zinc-700/70 dark:text-slate-200 border border-gray-200/60 dark:border-zinc-700/60"
        >
          Limpiar
        </Button>

        <Dropdown>
          <DropdownTrigger className="rounded-lg h-10 w-10 flex items-center justify-center border border-blue-200/60 dark:border-zinc-700/60 bg-blue-50/70 dark:bg-zinc-800/60 hover:bg-blue-100 dark:hover:bg-zinc-700 transition">
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              icon={<CgOptions className="text-xl text-blue-600 dark:text-zinc-300" />}
            />
          </DropdownTrigger>
          <DropdownMenu variant="faded" aria-label="Opciones" className="dark:bg-[#222a36]">
            <DropdownItem
              key="pdf"
              onClick={() => handleSelectChange("pdf")}
              startContent={<FaFilePdf className="text-red-600" />}
            >
              Guardar PDF
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {hasCreatePermission ? (
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '22px' }} />}
            onClick={handleNavigation}
            className="h-10"
          >
            Nota de almacen
          </Button>
        ) : (
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '22px' }} />}
            disabled
            className="h-10 opacity-50 cursor-not-allowed"
          >
            Nota de almacen
          </Button>
        )}
      </div>

      {isModalOpenPDF && (
        <ConfirmationModal
          message="¿Desea exportar a PDF?"
          onClose={closeModalPDF}
          isOpen={isModalOpenPDF}
          onConfirm={handleConfirmPDF}
        />
      )}
    </div>
  );
};

export default FiltrosIngresos;