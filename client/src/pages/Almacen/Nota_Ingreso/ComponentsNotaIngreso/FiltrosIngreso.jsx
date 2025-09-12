import { useState, useEffect, useCallback } from 'react';
import { DateRangePicker } from '@heroui/react';
import { parseDate } from "@internationalized/date";
import { useNavigate } from "react-router-dom";
import { Button } from '@heroui/react';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { exportHtmlToPdf } from '@/utils/pdf/exportHtmlToPdf';
import { Select, SelectItem } from "@heroui/react";
import { Input } from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { CgOptions } from "react-icons/cg";
import { FaFilePdf } from "react-icons/fa";
import { usePermisos } from '@/routes';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";

const FiltrosIngresos = ({ almacenes = [], onAlmacenChange, onFiltersChange, ingresos, almacenSseleccionado }) => {

    const [empresaData, setEmpresaData] = useState(null);
    const nombre = useUserStore((state) => state.nombre);
    const rolUsuario = useUserStore((state) => state.rol);
    const sucursalSeleccionada = useUserStore((state) => state.sur);
    const almacenGlobal = useUserStore((state) => state.almacen);
    const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

                          localStorage.setItem("usuario", nombre);
        localStorage.setItem("rol", rolUsuario);
        localStorage.setItem("sur", sucursalSeleccionada);

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
    }, [nombre]);

    const navigate = useNavigate();

    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        if (almacenGlobal && almacenes.length > 0) {
            return almacenes.find(a => a.id === parseInt(almacenGlobal)) || { id: '%', sucursal: '' };
        }
        return { id: '%', sucursal: '' };
    });
    const [estado, setEstado] = useState('');

    useEffect(() => {
        if (almacenGlobal && almacenes.length > 0) {
            const almacen = almacenes.find(a => a.id === parseInt(almacenGlobal));
            if (almacen) {
                setAlmacenSeleccionado(almacen);
            }
        }
    }, [almacenGlobal, almacenes]);

    const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);
    // const today = new Date();
    // const todayDate = parseDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);

    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });

    const [razon, setRazon] = useState('');
    const [usuario, setUsuario] = useState('');
    const [documento, setDocumento] = useState('');

    // Filtrar almacenes según la sucursal seleccionada si el rol es diferente de 1
    const almacenesFiltrados =
        rolUsuario !== 1
            ? almacenes.filter((almacen) => almacen.sucursal === sucursalSeleccionada)
            : almacenes;

    const applyFilters = useCallback(() => {
        const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
        const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

        const filtros = {
            fecha_i: date_i,
            fecha_e: date_e,
            razon_social: razon,
            almacen: almacenSeleccionado?.id !== '%' ? almacenSeleccionado?.id : undefined, // No incluir el filtro si es '%'
            usuario: usuario,
            documento: documento,
            estado: estado !== '%' ? estado : undefined, // No incluir el filtro si es '%'
        };

        onFiltersChange(filtros);
    }, [value, razon, almacenSeleccionado, usuario, documento, estado, onFiltersChange]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleAlmacenChange = (event) => {
        const almacen = event.target.value === '%'
            ? { id: '%', sucursal: '' }
            : almacenes.find((a) => a.id === parseInt(event.target.value));
        setAlmacenSeleccionado(almacen);
        setAlmacenGlobal(almacen.id === '%' ? '' : almacen.id); // Zustand global
        onAlmacenChange(almacen);
    };


    const openModalPDF = () => {
        setIsModalOpenPDF(true);
    };

    const closeModalPDF = () => {
        setIsModalOpenPDF(false);
    };


    const handleConfirmPDF = () => {
        //console.log('Exportar a PDF.');
        setIsModalOpenExcel(false);
    };


    const handleSelectChange = (value) => {
        if (value === "pdf") {
            // Genera el PDF para todos los registros visibles en la tabla
            generatePDFIngreso(ingresos, almacenSseleccionado);
        }
    };

    const currentDate = new Date().toLocaleDateString('es-ES');

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

    // Logo (más grande) y recuadro derecho desplazado
    const logoW = 36;
    const logoH = 36;
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', left, cursorY, logoW, logoH); } catch {}
    }

    const boxW = 70;
    const boxH = 38;
    const boxX = pageWidth - boxW - right;
    doc.setDrawColor(80);
    doc.setLineWidth(0.25);
    doc.rect(boxX, cursorY - 4, boxW, boxH);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`RUC ${empresaData?.ruc || '20610588981'}`, boxX + boxW / 2, cursorY + 2, { align: 'center' });
    doc.setFillColor(191, 219, 254);
    doc.rect(boxX, cursorY + 6, boxW, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text('NOTAS DE INGRESO', boxX + boxW / 2, cursorY + 13, { align: 'center' });
    doc.setTextColor(0);

    // Texto empresa: usar más ancho disponible y centrar verticalmente respecto a logo/recuadro
    const xText = logoBase64 ? left + logoW + 8 : left;
    const gapToBox = 22;
    let infoMaxWidth = Math.max(80, boxX - xText - gapToBox);

    const headerCenterY = cursorY + Math.max(logoH, boxH) / 2;
    let textY = Math.round(headerCenterY - 10);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(empresaData?.nombreComercial || 'TORMENTA JEANS', xText, textY, { maxWidth: infoMaxWidth });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    textY += 6;
    doc.text(empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.', xText, textY, { maxWidth: infoMaxWidth });

    // Dirección y ubicación compactas (menos líneas, texto más pequeño si hace falta)
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

    // Mover cursorY justo debajo del bloque de encabezado (sin dejar tanto espacio)
    cursorY = Math.max(cursorY + boxH + 4, textY + 8);

    // Línea divisoria y fondo de cabecera más corto
    doc.setDrawColor(210); doc.setLineWidth(0.2);
    doc.line(left, cursorY - 6, pageWidth - right, cursorY - 6);

    const headerBgH = 10;
    doc.setFillColor(222, 238, 255);
    doc.rect(left, cursorY - 2, pageWidth - left - right, headerBgH, 'F');

    // Preparar filas y columnas usando más ancho utilizable
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

    // Paginación
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

    
    const { hasCreatePermission } = usePermisos();

    const handleNavigation = () => {
        navigate("/almacen/nota_ingreso/registro_ingreso");
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
            <div className="flex items-center gap-2">
                <h6 className='font-bold'>Almacén:</h6>
                <Select
                    id="almacen"
                    selectedKeys={[almacenSeleccionado?.id?.toString() || '%']}
                    onChange={handleAlmacenChange}
                    className="w-60"
                    classNames={{
                        trigger: "bg-white",
                        value: "text-black",
                    }}
                >
                    {/* Mostrar la opción "Seleccione..." solo si el rol es 1 */}
                    {rolUsuario === 1 && <SelectItem key="%" value="%">Seleccione...</SelectItem>}
                    {almacenesFiltrados.map((almacen) => (
                        <SelectItem key={almacen.id} value={almacen.id}>
                            {almacen.almacen}
                        </SelectItem>
                    ))}
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    startContent={<IoIosSearch className='w-4 h-4 text-gray-500' />}
                    placeholder='Nombre o razón social'
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    className='w-60'
                />
            </div>
            <div className="flex items-center gap-2">
                <Input
                    startContent={<IoIosSearch className='w-4 h-4 text-gray-500' />}
                    placeholder='Documento'
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className='w-44'
                />
            </div>
            <div className="flex items-center gap-2">
                <h6 className='font-bold'>Fecha:&nbsp;&nbsp;&nbsp;&nbsp;</h6>
                <DateRangePicker
                    className="w-xs"
                    classNames={{ inputWrapper: "bg-white" }}
                    value={value}
                    onChange={setValue}
                />
            </div>
            <div className="flex items-center gap-2">
                <Select
                    placeholder="Estado"
                    selectedKeys={[estado]}
                    onChange={(e) => setEstado(e.target.value)}
                    className='w-28'
                    classNames={{
                        trigger: "bg-white ",
                        value: "text-black",
                    }}>
                    <SelectItem key="0" value="0">Activo</SelectItem>
                    <SelectItem key="1" value="1">Inactivo</SelectItem>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    startContent={<IoIosSearch className='w-4 h-4 text-gray-500' />}
                    placeholder='Usuario'
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className='w-48'
                />
            </div>
            <div className="flex items-center gap-2 ml-auto">
                <button className="mr-4">
                    <Dropdown>
                        <DropdownTrigger className="bg-gray-100">
                            <Avatar
                                isBordered
                                as="button"
                                className="transition-transform"
                                icon={<CgOptions className="text-xl text-gray-600" />}
                            />
                        </DropdownTrigger>
                        <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                            <DropdownItem
                                key="pdf"
                                onClick={() => handleSelectChange("pdf")}
                                startContent={<FaFilePdf
                                    className="text-red-600 cursor-pointer"

                                />}
                            >
                                Guardar PDF
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </button>

                {hasCreatePermission ? (
                    <Button
                        color="primary"
                        endContent={<FaPlus style={{ fontSize: '25px' }} />}
                        onClick={handleNavigation}
                        disabled={!hasCreatePermission}
                        className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Nota de almacen
                    </Button>
                ) : (
                    <Button
                        color="primary"
                        endContent={<FaPlus style={{ fontSize: '25px' }} />}
                        disabled
                        className="opacity-50 cursor-not-allowed"
                    >
                        Nota de almacen
                    </Button>
                )}
            </div>

            {isModalOpenPDF && (
                <ConfirmationModal
                    message='¿Desea exportar a PDF?'
                    onClose={closeModalPDF}
                    isOpen={isModalOpenPDF}
                    onConfirm={handleConfirmPDF}
                />
            )}
        </div>
    );
};

export default FiltrosIngresos;
