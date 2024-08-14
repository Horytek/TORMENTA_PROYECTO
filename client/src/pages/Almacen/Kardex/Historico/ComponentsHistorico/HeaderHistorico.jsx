import './HeaderHistorico.css';
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { FaRegFileExcel } from "react-icons/fa";
import { ButtonNormal } from '@/components/Buttons/Buttons';
import { DateRangePicker } from "@nextui-org/date-picker";
import useAlmacenData from '../../data/data_almacen_kardex';
import getProductoData from '../../data/data_producto_kardex';
import useDetalleKardexData from '../../data/data_detalle_kardex';
import useDetalleKardexAData from '../../data/data_detallea_kardex';
import { useState, useEffect } from 'react';

function HeaderHistorico({ productId }) {
  const { almacenes } = useAlmacenData();
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [productoData, setProductoData] = useState(null);

  useEffect(() => {
    const storedAlmacenId = localStorage.getItem('almacen');
    if (storedAlmacenId) {
      setSelectedAlmacen(storedAlmacenId);
    }
  }, []);

  useEffect(() => {
    const fetchProductoData = async () => {
      if (productId && selectedAlmacen) {
        const data = await getProductoData({ idProducto: productId, idAlmacen: selectedAlmacen });
        if (data.productos.length > 0) {
          setProductoData(data.productos[0]);
        }
      }
    };
    fetchProductoData();
  }, [productId, selectedAlmacen]);

  const handleChange = (event) => {
    const selectedId = event.target.value;
    setSelectedAlmacen(selectedId);
    localStorage.setItem('almacen', selectedId);
  };

  return (
    <div className="headerHistorico">
      <div className="info">
        <p>TORMENTA JEANS - 20610968801</p>
        <p>
          Producto: 
          {productoData ? ` ${productoData.descripcion} - ${productoData.marca}` : 'Cargando...'}
        </p>
        <p>
          COD: {productoData?.codigo || 'Cargando...'} / 
          Stock Actual: {productoData?.stock || 'Cargando...'} UND / 
          Marca: {productoData?.marca || 'Cargando...'}
        </p>
        <br />
        <div className="fecha-container">
          <h6 className='font-bold'>Fecha:&nbsp;</h6>
          <DateRangePicker className= "w-100" classNames={{ inputWrapper: "bg-white date-range-picker" }} />
        </div>
      </div>
      <div className="actions">
        <ButtonNormal color={'#01BDD6'}>
          <MdOutlineLocalPrintshop className="inline-block text-lg" /> IMPRIMIR
        </ButtonNormal>
        <ButtonNormal color={'#01BDD6'}>
          <FaRegFileExcel className="inline-block text-lg" /> EXCEL
        </ButtonNormal>
        <select 
          value={selectedAlmacen} 
          onChange={handleChange} 
          disabled={almacenes.length === 0}>
          {almacenes.map((almacen) => (
            <option key={almacen.id} value={almacen.id}>
              {almacen.almacen}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default HeaderHistorico;
