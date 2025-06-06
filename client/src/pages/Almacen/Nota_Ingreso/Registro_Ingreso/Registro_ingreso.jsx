import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from '../ComponentsNotaIngreso/Modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd, MdCancelPresentation } from "react-icons/md";
import useDestinatarioData from '../data/data_destinatario_ingreso';
import useDocumentoData from '../data/data_documento_ingreso';
import useDocumentoData_S from '../../Nota_Salida/data/data_documento_salida';
import useAlmacenData from '../data/data_almacen_ingreso';
import RegistroTablaIngreso from './ComponentsRegistroNotaIngreso/RegistroNotaIngresoTable';
import AgregarProovedor from '../../Nota_Salida/ComponentsNotaSalida/Modals/AgregarProovedor';
import useProductosData from './data/data_buscar_producto';
import useSinStockProductosData from './data/data_buscar_producto_s';
import insertNotaAndDetalleIngreso from '../data/add_nota';
import insertNotaAndDetalleSalida from '../../Nota_Salida/data/insert_nota_salida';
import { Toaster, toast } from "react-hot-toast";
import ConfirmationModal from '../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Button, Input, Select, SelectItem, Textarea, Tabs, Tab } from "@heroui/react";
import { useUserStore } from "@/store/useStore";

const glosaOptions = [
  "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "RESERVADO",
  "TRANSFERENCIA ENTRE ESTABLECIMIENTO<->CIA", "DEVOLUCION", "CLIENTE",
  "MERCAD DEVOLUCIÓN (PRUEBA)", "PROD.DESVOLUCIÓN (M.P.)", 
  "ING. PRODUCCIÓN(P.T.)", "AJUSTE INVENTARIO", "OTROS INGRESOS",
  "DESARROLLO CONSUMO INTERNO", "INGRESO DIFERIDO"
];

const tipoNotaOptions = [
  { value: 'ingreso', label: 'Nota de Ingreso' },
  { value: 'salida', label: 'Nota de Salida' },
  { value: 'conjunto', label: 'Conjunto (Ingreso y Salida)' }
];

function Registro_Ingresos() {
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
  const [almacenDestino, setAlmacenDestino] = useState('');
  const [almacenOrigen, setAlmacenOrigen] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [glosa, setGlosa] = useState('');
  const [nota, setNota] = useState('');
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
  const { documentos: documentosIngreso } = useDocumentoData();
  const { documentos: documentosSalida } = useDocumentoData_S();
  const currentDocumentoIngreso = documentosIngreso.length > 0 ? documentosIngreso[0].nota : '';
  const currentDocumentoSalida = documentosSalida.length > 0 ? documentosSalida[0].nota : '';
  const [fecha, setFecha] = useState(formattedDate);
  const [observacion, setObservacion] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]); // Solo en memoria

  const { almacenes } = useAlmacenData();
  const { destinatarios } = useDestinatarioData();

  // Zustand: datos globales de usuario
  const sucursalSeleccionada = useUserStore((state) => state.sur);
  const rolUsuario = useUserStore((state) => state.rol);
  const usuario = useUserStore((state) => state.nombre);

    // Nuevo: tipo de nota (ingreso, salida, conjunto)
  const [tipoNota, setTipoNota] = useState('ingreso');

const almacenesOrigenFiltrados = 
  rolUsuario !== 1
    ? almacenes.filter((almacen) => 
        tipoNota === 'salida' ? almacen.sucursal === sucursalSeleccionada : true
      )
    : almacenes;

const almacenesDestinoFiltrados = 
  rolUsuario !== 1
    ? almacenes.filter((almacen) => 
        tipoNota === 'ingreso' ? almacen.sucursal === sucursalSeleccionada : true
      )
    : almacenes;


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
    if (almacenDestino) {
      setConfirmationMessage('¿Desea guardar esta nueva nota?');
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

  const handleProveedorChange = (e) => {
    const selected = destinatarios.find(
      (d) => d.id === parseInt(e.target.value)
    );
    setSelectedRuc(selected?.documento || '');
  };

  // Unificación de guardado
  const handleGuardarAction = async () => {
    try {
      if (!usuario) {
        toast.error('Usuario no encontrado. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Validaciones generales
      if (
        !almacenDestino ||
        !destinatario ||
        !glosa ||
        !fecha ||
        !nota ||
        ((tipoNota === 'ingreso' || tipoNota === 'conjunto') && !currentDocumentoIngreso) ||
        ((tipoNota === 'salida' || tipoNota === 'conjunto') && !currentDocumentoSalida)
      ) {
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

      // Prepara los datos para ambas APIs
      const productos = productosSeleccionados.map(producto => ({
        id: producto.codigo,
        cantidad: producto.cantidad
      }));

      // Ajustar la fecha con la zona horaria local
      function getFechaLocal() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      const fechaISO = getFechaLocal();

      // Datos para ingreso
      const dataIngreso = {
        almacenO: almacenOrigen,
        almacenD: almacenDestino,
        destinatario,
        glosa,
        nota,
        fecha: fechaISO,
        producto: productos.map(p => p.id),
        numComprobante: currentDocumentoIngreso,
        cantidad: productos.map(p => p.cantidad),
        observacion,
        usuario
      };

      // Datos para salida
      const dataSalida = {
        almacenO: almacenOrigen,
        almacenD: almacenDestino,
        destinatario,
        glosa,
        nota,
        fecha: fechaISO,
        producto: productos.map(p => p.id),
        numComprobante: currentDocumentoSalida,
        cantidad: productos.map(p => p.cantidad),
        observacion,
        nom_usuario: usuario
      };

      let resultIngreso = { success: false };
      let resultSalida = { success: false };

      if (tipoNota === 'conjunto') {
        [resultIngreso, resultSalida] = await Promise.all([
          insertNotaAndDetalleIngreso(dataIngreso),
          insertNotaAndDetalleSalida(dataSalida)
        ]);
      } else if (tipoNota === 'ingreso') {
        resultIngreso = await insertNotaAndDetalleIngreso(dataIngreso);
      } else if (tipoNota === 'salida') {
        resultSalida = await insertNotaAndDetalleSalida(dataSalida);
      }

      // Mensajes y control de éxito
      if (
        (tipoNota === 'conjunto' && resultIngreso.success && resultSalida.success) ||
        (tipoNota === 'ingreso' && resultIngreso.success) ||
        (tipoNota === 'salida' && resultSalida.success)
      ) {
        toast.success('Nota(s) y detalle(s) insertados correctamente.');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Nota de almacén</h1>
      </div>
      <div className="mb-4">
        <Tabs
          aria-label="Tipo de nota"
          selectedKey={tipoNota}
          onSelectionChange={setTipoNota}
          color="primary"
          variant="bordered"
          className="w-full"
        >
          {tipoNotaOptions.map(option => (
            <Tab
              key={option.value}
              title={option.label}
              isDisabled={option.value === "conjunto" && rolUsuario !== 1}
            />
          ))}
        </Tabs>
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
                value={almacenOrigen}
                onChange={(e) => setAlmacenOrigen(e.target.value)}
              >
                {almacenesOrigenFiltrados.map((almacen) => (
                  <SelectItem key={almacen.id} value={almacen.id}>
                    {almacen.almacen}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Almacén destino"
                placeholder="Seleccionar"
                id="almacen_destino"
                value={almacenDestino}
                onChange={e => setAlmacenDestino(e.target.value)}
              >
                {almacenesDestinoFiltrados.map((almacen) => (
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
                value={destinatario}
                onChange={e => {
                  setDestinatario(e.target.value);
                  handleProveedorChange(e);
                }}
              >
                {destinatarios.map((destinatario) => (
                  <SelectItem key={destinatario.id} value={destinatario.id}>
                    {destinatario.destinatario}
                  </SelectItem>
                ))}
              </Select>
              <Input label="RUC" value={selectedRuc} isReadOnly />
            </div>
            <Input
              label="Nombre de nota"
              id="nomnota"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Fecha Documento"
                id="fechaDocu"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
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
                value={
                  tipoNota === 'ingreso'
                    ? currentDocumentoIngreso
                    : tipoNota === 'salida'
                      ? currentDocumentoSalida
                      : `I: ${currentDocumentoIngreso} / S: ${currentDocumentoSalida}`
                }
                isReadOnly
              />
              <Select
                label="Glosa"
                id="glosa"
                value={glosa}
                onChange={e => setGlosa(e.target.value)}
              >
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
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
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
            onPress={openModalOpenGuardar}
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