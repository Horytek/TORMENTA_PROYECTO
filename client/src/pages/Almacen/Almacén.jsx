import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { useState, useEffect, useCallback } from 'react';
import TablaKardex from './Kardex/ComponentsKardex/KardexTable';
import useKardexData from './Kardex/data/data_kardex';
import useKardexAlmacen from './Kardex/data/data_almacen_kardex';
import Pagination from '@/components/Pagination/Pagination';
const Kardex = () => {
    const [filters, setFilters] = useState({

    });
    const [kardex, setKarddex] = useState([]);
    const { almacenes } = useKardexAlmacen();
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        return almacenIdGuardado ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) || { id: '%', sucursal: '' } : { id: '%', sucursal: '' };
    });
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // Número total de páginas
    const fetchKardex = useCallback(async () => {
        const data = await useKardexData(filters);
        setKarddex(data.salida);
    }, [filters]);

    useEffect(() => {
        fetchKardex();
    }, [fetchKardex]);

    useEffect(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        if (almacenIdGuardado && almacenes.length > 0) {
            const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
            if (almacen) {
                setAlmacenSeleccionado(almacen);
            }
        }
    }, [almacenes]);
    // Función para cambiar de página en la paginación
    const onPageChange = (page) => {
        setCurrentPage(page);
    };
    const handleFiltersChange = (newFilters) => {
        setFilters(prevFilters => {
            if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
                return newFilters;
            }
            return prevFilters;
        });
    };

    const handleAlmacenChange = (event) => {
        const almacen = event.target.value === '%' ? { id: '%', sucursal: '' } : almacenes.find(a => a.id === parseInt(event.target.value));
        setAlmacenSeleccionado(almacen);
        localStorage.setItem('almacen', almacen.id);
        onAlmacenChange(almacen);
      };

    return (
        <div>
            {/* Componente de migas de pan */}
            <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Kardex Movimientos', href: '/almacen/kardex' }]} />
            <hr className="mb-4" />
            <div className="flex justify-between mt-5 mb-4">
                <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
                    Kardex Movimientos
                </h1>
            </div>
            <div className="mt-5 mb-4">
                <label htmlFor="" className='mr-2 font-bold'>Kardex de Movimientos / Tienda: Almacén:</label>
                <select
                    id="almacen"
                    style={{ width: '250px' }}
                    className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                    onChange={handleAlmacenChange} value={almacenSeleccionado.id}
                >
                    <option value="">Seleccione...</option>
                    {almacenes.map((almacen, index) => (
                        <option key={index} value={almacen.id}>{almacen.almacen}</option>
                    ))}
                    {/* Add other options here */}
                </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='CÓDIGO'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='DESCRIPCIÓN'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '120px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'>
                        <option value="">LÍNEA</option>
                        {/* Add other options here */}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '120px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'>
                        <option value="">SUB-LÍNEA</option>
                        {/* Add other options here */}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '180px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'>
                        <option value="">CUALQUIER MARCA</option>
                        {/* Add other options here */}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '120px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'>
                        <option value="">@Todos</option>
                        {/* Add other options here */}
                    </select>
                </div>
                <div className='flex items-center gap-2'>
                    <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm' name="select" defaultValue="">
                        <option value="">...</option>
                        <option value="value1">Imprimir</option>
                        <option value="value2">Excel</option>
                        <option value="value3">Excel Detalle</option>
                    </select>
                </div>
            </div>
            {/* Componente de tabla de ingresos */}
            <TablaKardex kardex={kardex} />

        </div>
    );
}

export default Kardex;
