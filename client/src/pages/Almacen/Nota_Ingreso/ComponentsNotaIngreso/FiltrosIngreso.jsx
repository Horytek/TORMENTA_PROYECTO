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

        const htmlContent = `
        <style>
            .logo-empresa { width: 180px; height: 180px; object-fit: contain; }
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
                        <h2 class="text-lg font-bold text-gray-900 py-2">NOTA DE INGRESO</h2>
                    </div>
                </div>
            </div>
            <div class="container-datos-compro bg-white rounded-lg mb-6 ">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div class="space-y-2">
                        <p class="text-sm font-semibold text-gray-800">
                            <span class="font-bold text-gray-900">Almacén:</span> <span class="font-semibold text-gray-600">${almacenSseleccionado?.almacen || 'N/A'}</span>
                        </p>
                    </div>
                </div>
            </div>
            <table class="w-full border-collapse mb-6 bg-white shadow-md rounded-lg overflow-hidden">
                <thead class="bg-blue-200 text-blue-800">
                    <tr>
                        <th class="border-b p-3 text-center">Fecha</th>
                        <th class="border-b p-3 text-center">Documento</th>
                        <th class="border-b p-3 text-center">Proveedor</th>
                        <th class="border-b p-3 text-center">Concepto</th>
                        <th class="border-b p-3 text-center">Almacén Destino</th>
                        <th class="border-b p-3 text-center">Estado</th>
                        <th class="border-b p-3 text-center">Usuario</th>
                    </tr>
                </thead>
                <tbody>
                    ${ingresos.map(ingreso => `
                        <tr class="bg-gray-50 hover:bg-gray-100">
                            <td class="border-b p-2 text-center">${ingreso.fecha}</td>
                            <td class="border-b p-2 text-center">${ingreso.documento}</td>
                            <td class="border-b p-2 text-center">${ingreso.proveedor}</td>
                            <td class="border-b p-2 text-center">${ingreso.concepto}</td>
                            <td class="border-b p-2 text-center">${ingreso.almacen_D}</td>
                            <td class="border-b p-2 text-center">${ingreso.estado === 1 ? 'Inactivo' : 'Activo'}</td>
                            <td class="border-b p-2 text-center">${ingreso.usuario}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
        const options = {
            filename: `ingresos_general.pdf`,
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
            await exportHtmlToPdf(htmlContent, 'ingresos_general.pdf', options);
        } catch (error) {
            toast.error("Error al generar el PDF");
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
