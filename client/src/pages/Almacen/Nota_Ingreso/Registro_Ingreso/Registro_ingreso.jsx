import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from '../ComponentsNotaIngreso/Modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd } from "react-icons/md";
import { MdCancelPresentation } from "react-icons/md";
import useDestinatarioData from '../data/data_destinatario_ingreso';
import useDocumentoData from '../data/data_documento_ingreso';
import useAlmacenData from '../data/data_almacen_ingreso';
import RegistroTablaIngreso from './ComponentsRegistroNotaIngreso/RegistroNotaIngresoTable';
import AgregarProovedor from '../../Nota_Salida/ComponentsNotaSalida/Modals/AgregarProovedor';
import useProductosData from './data/data_buscar_producto';
import useSinStockProductosData from './data/data_buscar_producto_s';
import insertNotaAndDetalle from '../data/add_nota';
import { Toaster, toast } from "react-hot-toast";
import ConfirmationModal from '../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";


const glosaOptions = [
  "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "RESERVADO",
  "TRANSFERENCIA ENTRE ESTABLECIMIENTO<->CIA", "DEVOLUCION", "CLIENTE",
  "MERCAD DEVOLUCIÓN (PRUEBA)", "PROD.DESVOLUCIÓN (M.P.)", 
  "ING. PRODUCCIÓN(P.T.)", "AJUSTE INVENTARIO", "OTROS INGRESOS",
  "DESARROLLO CONSUMO INTERNO", "INGRESO DIFERIDO"
];

function Registro_Ingresos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [isModalOpenGuardar, setisModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });

  const { almacenes } = useAlmacenData();
  const { destinatarios } = useDestinatarioData();
  const { documentos } = useDocumentoData();

  const [almacenOrigen, setAlmacenOrigen] = useState('');

  const sucursalSeleccionada = localStorage.getItem('sur');
  const rolUsuario = localStorage.getItem('rol');

  const almacenesFiltrados =
    rolUsuario !== '1'
      ? almacenes.filter((almacen) => almacen.sucursal === sucursalSeleccionada)
      : almacenes;

  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  useEffect(() => {
    if (isModalOpen && almacenOrigen) {
      handleBuscarProducto();
    }
  }, [isModalOpen, almacenOrigen]);

  const openModalBuscarProducto = async () => {
    await handleBuscarProducto();
    setIsModalOpen(true); 
  };

  const closeModalBuscarProducto = () => setIsModalOpen(false);

  const openModalOpenGuardar = () => {
    const almacenDestino = document.getElementById('almacen_destino').value;
    if (almacenDestino) {
      setConfirmationMessage('¿Desea guardar esta nueva nota de ingreso?');
    } 
    setisModalOpenGuardar(true);
  };

  const closeModalOpenGuardar = () => {
    setisModalOpenGuardar(false);
  };

  const closeModalProducto = () => setIsModalOpenProducto(false);

  const handleConfirmGuardar = async () => {
    closeModalOpenGuardar();
    await handleGuardarAction();
  };

  const handleGuardarAction = async () => {
    try {
      const almacenO = document.getElementById('almacen_origen').value || "";
      const almacenD = document.getElementById('almacen_destino').value ;
      const destinatario = document.getElementById('destinatario').value;
      const glosa = document.getElementById('glosa').value;
      const fecha = document.getElementById('fechaDocu').value;
      const nota = document.getElementById('nomnota').value;
      const numComprobante = document.getElementById('numero').value;
      const observacion = document.getElementById('observacion').value;
      const usuario = localStorage.getItem('usuario');
  
      if (!usuario) {
        toast.error('Usuario no encontrado. Por favor, inicie sesión nuevamente.');
        return;
      }
  
      const productos = productosSeleccionados.map(producto => ({
        id: producto.codigo,
        cantidad: producto.cantidad
      }));
  
      const data = {
        almacenO,
        almacenD,
        destinatario,
        glosa,
        nota,
        fecha,
        producto: productos.map(p => p.id),
        numComprobante,
        cantidad: productos.map(p => p.cantidad),
        observacion,
        usuario
      };
  
      const result = await insertNotaAndDetalle(data);
  
      if (result.success) {
        toast.success('Nota y detalle insertados correctamente.');
        handleCancel();
        window.location.reload();
      } else {
        throw new Error('Error inesperado en la inserción de la nota.');
      }
    } catch (error) {
      console.error('Error en handleGuardarAction:', error);
      toast.error(`Error inesperado: ${error.message}`);
    }
  };

  const openModalProovedor = () => setIsModalOpenProovedor(true);
  const closeModalProovedor = () => setIsModalOpenProovedor(false);

  const handleBuscarProducto = async () => {
    const almacenId = almacenOrigen || '';
    const filters = {
      descripcion: searchInput,
      almacen: almacenId,
      cod_barras: codigoBarras
    };
  
    const result = await useProductosData(filters);
    setProductos(result.productos);
  };

  const handleCancel = () => {
    localStorage.removeItem('productosSeleccionados');
    setProductosSeleccionados([]);
  };

  const agregarProducto = (producto, cantidad) => {
    setProductosSeleccionados((prevProductos) => {
      const cantidadExistente = prevProductos
        .filter(p => p.codigo === producto.codigo)
        .reduce((total, p) => total + p.cantidad, 0);
      const cantidadTotal = cantidadExistente + cantidad;

      if (cantidadTotal > producto.stock) {
        const maxCantidad = producto.stock - cantidadExistente;
        if (maxCantidad > 0) {
          toast.error(`No se puede agregar más de ${producto.stock} unidades de ${producto.descripcion}. Solo puedes agregar ${maxCantidad}`);
        }
        toast.error(`No se puede agregar más de ${producto.stock} unidades de ${producto.descripcion}.`);
        return prevProductos;
      }

      const productoExistente = prevProductos.find(p => p.codigo === producto.codigo);
      if (productoExistente) {
        return prevProductos.map(p =>
          p.codigo === producto.codigo ? { ...p, cantidad: p.cantidad + cantidad } : p
        );
      } else {
        return [...prevProductos, { ...producto, cantidad }];
      }
    });

    closeModalBuscarProducto();
  };

  const handleGuardar = async () => {
    const almacenD = document.getElementById('almacen_destino').value;
    const destinatario = document.getElementById('destinatario').value;
    const glosa = document.getElementById('glosa').value;
    const fecha = document.getElementById('fechaDocu').value;
    const nota = document.getElementById('nomnota').value;
    const numComprobante = document.getElementById('numero').value;

    if (!almacenD || !destinatario || !glosa || !fecha || !nota || !numComprobante) {
      toast.error('Por favor complete todos los campos.');
      return;
    }

    if (productosSeleccionados.length === 0) {
      toast.error('Debe agregar al menos un producto.');
      return;
    }

    let stockExcedido = false;
    productosSeleccionados.forEach(producto => {
      if (producto.cantidad > producto.stock) {
        stockExcedido = true;
      }
    });

    if (stockExcedido) {
      toast.error('La cantidad de algunos productos excede el stock disponible.');
      return;
    }

    openModalOpenGuardar();
  };

  const currentDocumento = documentos.length > 0 ? documentos[0].nota : '';
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
  
  return (
    <div className="space-y-6">
      <Breadcrumb
        paths={[
          { name: 'Inicio', href: '/inicio' },
          { name: 'Almacén', href: '/almacen' },
          { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' },
          { name: 'Nueva nota de ingreso', href: '/almacen/nota_ingreso/registro_ingreso' },
        ]}
      />
      <hr className="mb-4" />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Nota de ingreso</h1>
      </div>
      <div className="bg-gray-200 p-6 rounded-lg shadow-md">
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Toaster />
          {/* Columna izquierda */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Almacén origen"
                placeholder="Seleccionar"
                id="almacen_origen"
                isDisabled={productosSeleccionados.length > 0}
                onChange={(e) => setAlmacenOrigen(e.target.value)}
              >
                {almacenes.map((almacen) => (
                  <SelectItem key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Almacén destino"
                placeholder="Seleccionar"
                id="almacen_destino"
              >
                {almacenesFiltrados.map((almacen) => (
                  <SelectItem key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Proveedor"
                placeholder="Seleccionar"
                id="destinatario"
                onChange={(e) => {
                  const selected = destinatarios.find(
                    (d) => d.id === parseInt(e.target.value)
                  );
                  document.getElementById('ruc').value = selected
                    ? selected.documento
                    : '';
                }}
              >
                {destinatarios.map((destinatario) => (
                  <SelectItem key={destinatario.id} value={destinatario.id}>
                    {destinatario.destinatario}
                  </SelectItem>
                ))}
              </Select>
              <Input label="RUC" id="ruc" isReadOnly />
            </div>
            <Input label="Nombre de nota" id="nomnota" />
          </div>
  
          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Fecha Documento"
                id="fechaDocu"
                type="date"
                defaultValue={formattedDate}
                style={{
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                }}
              />
              <Input
                label="Número"
                id="numero"
                value={currentDocumento}
                isReadOnly
              />
              <Select label="Glosa" id="glosa">
                {glosaOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <Textarea
              label="Observación"
              id="observacion"
              style={{
                border: "none",
                boxShadow: "none",
                outline: "none",
                padding: "0.8rem",
              }}
            />
          </div>
        </form>
  
        {/* Botones de acción */}
        <div className="flex justify-start mt-6 space-x-4">
          <Button
            color="primary"
            onPress={openModalProovedor}
            startContent={<MdPersonAdd />}
          >
            Nuevo destinatario
          </Button>
          <Button
            color="warning"
            onPress={openModalBuscarProducto}
            startContent={<FaBarcode />}
          >
            Buscar producto
          </Button>
          <Link to="/almacen/nota_ingreso">
            <Button
              color="danger"
              onPress={handleCancel}
              startContent={<MdCancelPresentation />}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            color="success"
            onPress={handleGuardar}
            startContent={<FiSave />}
          >
            Guardar
          </Button>
        </div>
      </div>
  
      {/* Tabla de productos seleccionados */}
      <div className="mt-6">
        <RegistroTablaIngreso
          ingresos={productosSeleccionados}
          setProductosSeleccionados={setProductosSeleccionados}
        />
      </div>
  
      {/* Modales */}
      <ModalBuscarProducto
        isOpen={isModalOpen}
        onClose={closeModalBuscarProducto}
        onBuscar={handleBuscarProducto}
        setSearchInput={setSearchInput}
        productos={productos}
        agregarProducto={agregarProducto}
        setCodigoBarras={setCodigoBarras}
        hideStock={!almacenOrigen}
      />
      {isModalOpenProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={closeModalProducto} />
      )}
      <AgregarProovedor
        isOpen={isModalOpenProovedor}
        onClose={closeModalProovedor}
        titulo={'proovedor'}
      />
      {isModalOpenGuardar && (
        <ConfirmationModal
          message={confirmationMessage}
          onClose={closeModalOpenGuardar}
          isOpen={isModalOpenGuardar}
          onConfirm={handleConfirmGuardar}
        />
      )}
    </div>
  );
}

export default Registro_Ingresos;