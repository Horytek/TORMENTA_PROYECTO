import './Historico.css';
import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import getAllKardexData from '../data/data_detalle_kardex';  // Import the unified function

function Historico() {
  const { id } = useParams();
  const [kardexData, setKardexData] = useState([]);
  const [previousTransactions, setPreviousTransactions] = useState(null);
  const [productoData, setProductoData] = useState([]);

  useEffect(() => {
    const fetchKardexData = async () => {
      const fechaInicio = '2024-08-01'; // Obtener estos valores del DateRangePicker
      const fechaFin = '2024-08-14'; // Obtener estos valores del DateRangePicker
      const idAlmacen = localStorage.getItem('almacen');

      const filters = { 
        fechaInicio, 
        fechaFin, 
        idProducto: id, 
        idAlmacen 
      };
      
      const data = await getAllKardexData(filters);
      setKardexData(data.kardex);
      setPreviousTransactions(data.previousTransactions);
      setProductoData(data.productos);
    };

    fetchKardexData();
  }, [id]);

  return (
    <div className="Historico">
      <HeaderHistorico productId={id} productoData={productoData} />
      <br />
      <HistoricoTable transactions={kardexData} previousTransactions={previousTransactions} />
    </div>
  );
}

export default Historico;
