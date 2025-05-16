import { useState, useEffect } from 'react';
import TablaSucursal from './ComponentsSucursal/SucursalTable';
import getSucursalesData from './data/data_sucursal';
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

    // Estilos en línea
    const styles = {
        container: {
            position: 'relative',
            minHeight: '100vh',
            paddingBottom: '1.75rem',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            marginBottom: '1rem',
        },
        title: {
            fontSize: '36px',
            fontWeight: 'bold',
        },
        hr: {
            marginBottom: '1rem',
        },
        button: {
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            backgroundColor: '#00bdd6ff',
            color: 'white',
            fontWeight: 500,
            alignItems: 'center',
        },
        buttonHover: {
            backgroundColor: 'rgb(3, 158, 179)',
        },
    };

    return (
        <div style={styles.container}>
            <hr style={styles.hr} />
            <div style={styles.header}>
                <h1 style={styles.title}>
                    Gestión de sucursales
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