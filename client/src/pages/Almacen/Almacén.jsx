import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { useState, useEffect, useCallback } from 'react';
import TablaKardex from './Kardex/ComponentsKardex/KardexTable';
import getSalidaData from './Kardex/data/data_kardex';
import useAlmacenData from './Kardex/data/data_almacen_kardex';
import useMarcaData from './Kardex/data/data_marca_kardex';
import useCategoriaData from './Kardex/data/data_categoria_kardex';
import useSubCategoriaData from './Kardex/data/data_subcategoria_kardex';
import Pagination from '@/components/Pagination/Pagination';

const Kardex = () => {
    const [filters, setFilters] = useState({
        descripcion: '',
        almacen: '',
        idProducto: '',
        marca: '',
        cat: '',
        subcat: '',
    });
    const [kardex, setKarddex] = useState([]);
    const { almacenes } = useAlmacenData();
    const { marcas } = useMarcaData();
    const { categorias } = useCategoriaData();
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const { subcategorias } = useSubCategoriaData(categoriaSeleccionada);
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        return almacenIdGuardado ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) || { id: '%', sucursal: '' } : { id: '%', sucursal: '' };
    });
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // Número total de páginas

    const fetchKardex = useCallback(async () => {
        const data = await getSalidaData(filters);
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

    const onPageChange = (page) => {
        setCurrentPage(page);
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilters,
        }));
    };

    const handleAlmacenChange = (event) => {
        const almacen = event.target.value === '%' ? { id: '%', sucursal: '' } : almacenes.find(a => a.id === parseInt(event.target.value));
        setAlmacenSeleccionado(almacen);
        localStorage.setItem('almacen', almacen.id);
        handleFiltersChange({ almacen: event.target.value });
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

    return (
        <div>
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
                    
                    {almacenes.map((almacen, index) => (
                        <option key={index} value={almacen.id}>{almacen.almacen}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='CÓDIGO'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                        onChange={handleCodigoChange}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='DESCRIPCIÓN'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                        onChange={handleDescripcionChange}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '120px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                        onChange={handleCategoriaChange}
                        value={categoriaSeleccionada}
                    >
                        <option value="">LÍNEA</option>
                        {categorias.map((categoria, index) => (
                            <option key={index} value={categoria.id}>{categoria.categoria}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '120px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                        onChange={handleSubCategoriaChange}
                    >
                        <option value="">SUB-LÍNEA</option>
                        {subcategorias.map((subcategoria, index) => (
                            <option key={index} value={subcategoria.id}>{subcategoria.sub_categoria}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        style={{ width: '180px' }}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
                        onChange={handleMarcaChange}
                    >
                        <option value="">CUALQUIER MARCA</option>
                        {marcas.map((marca, index) => (
                            <option key={index} value={marca.id}>{marca.marca}</option>
                        ))}
                    </select>
                </div>
                <div className='flex items-center gap-2'>
                    <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm' name="select" defaultValue="">
                        <option value="">...</option>
                        <option value="pdf">Guardar PDF</option>
                    </select>
                </div>
            </div>
            <TablaKardex kardex={kardex} />
        </div>
    );
};

export default Kardex;
