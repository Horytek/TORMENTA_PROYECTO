import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from './ComponentsNuevaNotaSalida/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd, MdCancelPresentation } from "react-icons/md";
import AgregarProovedor from '../ComponentsNotaSalida/Modals/AgregarProovedor';
import NuevaTablaSalida from './ComponentsNuevaNotaSalida/NuevaNotaSalidaTable';
import useProductosData from './data/data_buscar_producto';
import useDestinatarioData from '../data/data_destinatario_salida';
import useDocumentoData from '../data/data_documento_salida';
import useAlmacenData from '../data/data_almacen_salida';
import ConfirmationModal from './../ComponentsNotaSalida/Modals/ConfirmationModal';
import insertNotaAndDetalle from '../data/insert_nota_salida';
import { Toaster, toast } from "react-hot-toast";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";

const glosaOptions = [
  "VENTA DE PRODUCTOS", "VENTA AL EXTERIOR", "CONSIGNACION CLIENTE",
  "TRASLADO ENTRE ALMACENES", "ITINERANTE", "CAMBIO MERCAD. PROV.",
  "MATERIA PRIMAR PRODUCCION", "DEVOLUCION PROOVEDOR",
  "AJUSTE INVENTARIO", "OTRAS SALIDAS", "RESERVADO",
  "CONSUMO INTERNO", "EXTORNO DIFERIDO", "TRANSFORMACION"
];

function NuevaSalidas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
    const [selectedRuc, setSelectedRuc] = useState('');
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
  const currentDocumento = documentos.length > 0 ? documentos[0].nota : '';
  const currentDate = new Date().toISOString().split('T')[0];

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

  const handleGuardarAction = async () => {
    try {
      const almacenO = document.getElementById('almacen_origen').value || "";
      const almacenD = document.getElementById('almacen_destino').value;
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

    const handleProveedorChange = (e) => {
      const selected = destinatarios.find(
        (d) => d.id === parseInt(e.target.value)
      );
      setSelectedRuc(selected?.documento || '');
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

    setConfirmationMessage('¿Desea guardar esta nueva nota de salida?');
    setisModalOpenGuardar(true);
  };

  const handleCancel = () => {
    localStorage.removeItem('productosSeleccionados');
    setProductosSeleccionados([]);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        paths={[
          { name: 'Inicio', href: '/inicio' },
          { name: 'Almacén', href: '/almacen' },
          { name: 'Nota de salida', href: '/almacen/nota_salida' },
          { name: 'Nueva nota de salida', href: '/almacen/nota_salida/nueva_nota_salida' },
        ]}
      />
      <hr className="mb-4" />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Nota de salida</h1>
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
                {almacenes.map((almacen) => (
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
        onChange={handleProveedorChange}
      >
        {destinatarios.map((destinatario) => (
          <SelectItem key={destinatario.id} value={destinatario.id}>
            {destinatario.destinatario}
          </SelectItem>
        ))}
      </Select>

      <Input label="RUC" value={selectedRuc} isReadOnly />
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
                defaultValue={currentDate}
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
            onPress={() => setIsModalOpenProovedor(true)}
            startContent={<MdPersonAdd />}
          >
            Nuevo destinatario
          </Button>
          <Button
            color="warning"
            onPress={() => setIsModalOpen(true)}
            startContent={<FaBarcode />}
          >
            Buscar producto
          </Button>
          <Link to="/almacen/nota_salida">
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
        <NuevaTablaSalida
          salidas={productosSeleccionados}
          setProductosSeleccionados={setProductosSeleccionados}
        />
      </div>

      {/* Modales */}
      <ModalBuscarProducto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBuscar={handleBuscarProducto}
        setSearchInput={setSearchInput}
        productos={productos}
        agregarProducto={(producto, cantidad) => {
          setProductosSeleccionados((prevProductos) => {
            const productoExistente = prevProductos.find(p => p.codigo === producto.codigo);
            if (productoExistente) {
              return prevProductos.map(p =>
                p.codigo === producto.codigo ? { ...p, cantidad: p.cantidad + cantidad } : p
              );
            } else {
              return [...prevProductos, { ...producto, cantidad }];
            }
          });
        }}
        setCodigoBarras={setCodigoBarras}
      />
      {isModalOpenProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={() => setIsModalOpenProducto(false)} />
      )}
      <AgregarProovedor
        isOpen={isModalOpenProovedor}
        onClose={() => setIsModalOpenProovedor(false)}
        titulo="destinatario"
      />
      {isModalOpenGuardar && (
        <ConfirmationModal
          message={confirmationMessage}
          onClose={() => setisModalOpenGuardar(false)}
          isOpen={isModalOpenGuardar}
          onConfirm={handleGuardarAction}
        />
      )}
    </div>
  );
}

export default NuevaSalidas;