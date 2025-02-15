import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaSucursal from './ComponentsSucursal/SucursalTable';
import getSucursalesData from './data/data_sucursal';
import './Sucursal.css';
import FiltrosSucursal from './ComponentsSucursal/FiltroSucursal';

import 'jspdf-autotable';

const Sucursales = () => {
    const [filters, setFilters] = useState({
        nombre: '',    
        estado: '%',   
    });

    const [sucursales, setSucursales] = useState([]);

    const fetchSucursales = async (filters) => {
        const data = await getSucursalesData(filters);
        setSucursales(data.sucursales);
    };

    useEffect(() => {
        fetchSucursales(filters); 
    }, []); 

    useEffect(() => {
        fetchSucursales(filters); 
    }, [filters]); 

    const handleFiltersChange = (newFilters) => {
      setFilters(prevFilters => {
        if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
          return newFilters;
        }
        return prevFilters;
      });
    };

    return (
        <div className="relative min-h-screen pb-7">
            <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Sucursal', href: '/sucursal' }]} />
            <hr className="mb-4" />
            <div className="flex justify-between mt-5 mb-4">
                <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
                    Sucursal
                </h1>
            </div>
            <FiltrosSucursal onFiltersChange={handleFiltersChange} />

            <div>
                <TablaSucursal sucursales={sucursales} />
            </div>
        </div>
    );
};

export default Sucursales;