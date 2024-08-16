import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";

const useClientesData = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get('/ventas/cliente_venta');
        
        if (response.data.code === 1) {
          const clientes = response.data.data.map(item => ({
            id:item.id,
            nombre: item.cliente_t,
            documento: item.documento_t,
            direccion: item.direccion_t,
          }));
          setClientes(clientes);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchClientes();
  }, []);


  const addCliente = (nuevoDetalle) => {
    setClientes([...clientes, nuevoDetalle]);
  };

  const updateCliente = (updatedCliente) => {
    setClientes(prevClientes =>
      prevClientes.map(cliente =>
        cliente.id === updatedCliente.id ? updatedCliente : cliente
      )
    );
  };

  const removeCliente = (id) => {
    setClientes(clientes.filter(cliente => cliente.id !== id));
  };


  return {clientes, setClientes,updateCliente,removeCliente,addCliente};
};

export default useClientesData;
