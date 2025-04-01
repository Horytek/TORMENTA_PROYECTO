import React, { useState, useEffect, useCallback } from 'react';
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { Link } from 'react-router-dom';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Select, SelectItem } from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { CgOptions } from "react-icons/cg";
import { FaFilePdf } from "react-icons/fa";

const FiltrosSalida = ({ almacenes = [], onAlmacenChange, onFiltersChange, onPDFOptionClick }) => {
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        return almacenIdGuardado ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) || { id: '%', sucursal: '' } : { id: '%', sucursal: '' };
    });
    const [estado, setEstado] = useState('');
    useEffect(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        if (almacenIdGuardado && almacenes.length > 0) {
            const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
            if (almacen) {
                setAlmacenSeleccionado(almacen);
            }
        }
    }, [almacenes]);

    const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
    const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);

    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });

    const [razon, setRazon] = useState('');
    const [usuario, setUsuario] = useState('');
    const [documento, setDocumento] = useState('');

    const sucursalSeleccionada = localStorage.getItem('sur');
    const rolUsuario = localStorage.getItem('rol');
  
    // Filtrar almacenes según la sucursal seleccionada si el rol es diferente de 1
    const almacenesFiltrados =
      rolUsuario !== '1'
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
        localStorage.setItem('almacen', almacen.id === '%' ? '' : almacen.id); // Guarda vacío si es '%'
        onAlmacenChange(almacen);
    };

    const openModalImprimir = () => {
        setIsModalOpenImprimir(true);
    };

    const closeModalImprimir = () => {
        setIsModalOpenImprimir(false);
    };

    const openModalPDF = () => {
        setIsModalOpenPDF(true);
    };

    const closeModalPDF = () => {
        setIsModalOpenPDF(false);
    };


    const handleConfirmImprimir = () => {
        //console.log('Nota de salida impresa.');
        setIsModalOpenImprimir(false);
    };

    const handleConfirmPDF = () => {
        //console.log('Exportar a PDF.');
        setIsModalOpenPDF(false);
    };

    const handleSelectChange = (value) => {
        if (value === "pdf") {
            onPDFOptionClick();
        }
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
                    {rolUsuario === '1' && <SelectItem key="%" value="%">Seleccione...</SelectItem>}
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
                    className="w-60"
                    style={{
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                    }}
                />
                </div>

                <div className="flex items-center gap-2">
                <Input
                    placeholder='Documento'
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    startContent={<IoIosSearch className='w-4 h-4 text-gray-500' />}
                    className="w-44"
                    style={{
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                    }}
                />
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Fecha:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h6>
                    <DateRangePicker
                        className="w-xs"
                        classNames={{ inputWrapper: "bg-white" }}
                        value={value}
                        onChange={setValue}
                    />
                </div>

                <div className="flex items-center gap-2">
                <Select
                    selectedKeys={[estado]}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-28 text-center"
                    placeholder='Estado'
                    classNames={{
                        trigger: "bg-white ",
                        value: "text-black",
                    }}
                >
                    <SelectItem key="0">Activo</SelectItem>
                    <SelectItem key="1">Inactivo</SelectItem>
                </Select>
                </div>

                <div className="flex items-center gap-2">
                <Input
                    placeholder='Usuario'
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    startContent={<IoIosSearch className='w-4 h-4 text-gray-500' />}
                    className="w-44"
                    style={{
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                    }}
                />
                </div>
                <div className='flex items-center gap-2 ml-auto'>
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

                <Link to="/almacen/nota_salida/nueva_nota_salida">
                        <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '20px' }} />}>
                            Nota de salida
                        </ButtonIcon>
                    </Link>
                </div>

  
            {isModalOpenImprimir && (
                <ConfirmationModal
                    message='¿Desea imprimir la nota de salida?'
                    onClose={closeModalImprimir}
                    isOpen={isModalOpenImprimir}
                    onConfirm={handleConfirmImprimir}
                />
            )}
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

export default FiltrosSalida;
