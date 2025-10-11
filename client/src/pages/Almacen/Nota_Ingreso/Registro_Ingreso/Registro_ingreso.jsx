import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ModalBuscarProducto from '../ComponentsNotaIngreso/Modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd, MdCancelPresentation } from "react-icons/md";
import { useDestinatariosIngreso, useDocumentosIngreso, useAlmacenesIngreso } from '@/hooks/useNotaIngreso';
import { useDocumentosSalida } from '@/hooks/useNotaSalida';
import RegistroTablaIngreso from './ComponentsRegistroNotaIngreso/RegistroNotaIngresoTable';
import AgregarProovedor from '../../Nota_Salida/ComponentsNotaSalida/Modals/AgregarProovedor';
import useProductosData from './data/data_buscar_producto';
import { insertNotaIngreso } from '@/services/notaIngreso.services';
import { insertNotaSalida } from '@/services/notaSalida.services';
import { Toaster, toast } from "react-hot-toast";
import ConfirmationModal from '../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import { Button, Input, Select, SelectItem, Textarea, Tabs, Tab, Chip, Tooltip, Divider, ScrollShadow } from "@heroui/react";
import { useUserStore } from "@/store/useStore";

const GLOSAS = [
  "COMPRA EN EL PAIS","COMPRA EN EL EXTERIOR","RESERVADO",
  "TRANSFERENCIA ENTRE ESTABLECIMIENTO<->CIA","DEVOLUCION","CLIENTE",
  "MERCAD DEVOLUCIÓN (PRUEBA)","PROD.DESVOLUCIÓN (M.P.)",
  "ING. PRODUCCIÓN(P.T.)","AJUSTE INVENTARIO","OTROS INGRESOS",
  "DESARROLLO CONSUMO INTERNO","INGRESO DIFERIDO"
];

const TIPO_NOTA = [
  { value: 'ingreso', label: 'Nota de Ingreso' },
  { value: 'salida',  label: 'Nota de Salida' },
  { value: 'conjunto', label: 'Conjunto (Ingreso y Salida)' }
];

// Utilidades
const formatDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const nowDate = formatDate();

// Debounce simple
const useDebounce = (fn, delay=350) => {
  const t = useRef();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
};

function Registro_Ingresos() {
  // Modales
  const [isModalBuscar, setIsModalBuscar] = useState(false);
  const [isModalProducto, setIsModalProducto] = useState(false);
  const [isModalProveedor, setIsModalProveedor] = useState(false);
  const [isModalGuardar, setIsModalGuardar] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // Datos externos
  const { almacenes } = useAlmacenesIngreso();
  const { destinatarios } = useDestinatariosIngreso();
  const { documentos: documentosIng } = useDocumentosIngreso();
  const { documentos: documentosSal } = useDocumentosSalida();

  const currentDocumentoIngreso = documentosIng[0]?.nota || '';
  const currentDocumentoSalida = documentosSal[0]?.nota || '';

  // Usuario global
  const sucursalSeleccionada = useUserStore(s => s.sur);
  const rolUsuario = useUserStore(s => s.rol);
  const usuario = useUserStore(s => s.nombre);

  // Form state
  const [tipoNota, setTipoNota] = useState('ingreso');
  const [almacenOrigen, setAlmacenOrigen] = useState('');
  const [almacenDestino, setAlmacenDestino] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [rucDest, setRucDest] = useState('');
  const [glosa, setGlosa] = useState('');
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(nowDate);
  const [observacion, setObservacion] = useState('');

  // Productos
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

    // Validaciones memo
  const isValid = useMemo(() => {
    if (!usuario) return false;
    if (!almacenDestino || !destinatario || !glosa || !fecha || !nota) return false;
    if ((tipoNota === 'ingreso' || tipoNota === 'conjunto') && !currentDocumentoIngreso) return false;
    if ((tipoNota === 'salida' || tipoNota === 'conjunto') && !currentDocumentoSalida) return false;
    if (!productosSeleccionados.length) return false;
    if (productosSeleccionados.some(p => p.cantidad > p.stock)) return false;
    return true;
  }, [
    usuario, almacenDestino, destinatario, glosa, fecha, nota,
    tipoNota, currentDocumentoIngreso, currentDocumentoSalida,
    productosSeleccionados
  ]);

  // UI / control
  const [isSaving, setIsSaving] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Filtros de almacenes memo
  const almacenesOrigenFiltrados = useMemo(() => {
    if (rolUsuario === 1) return almacenes;
    if (tipoNota === 'salida') {
      // salida: origen restringido a sucursal
      return almacenes.filter(a => a.sucursal === sucursalSeleccionada);
    }
    return almacenes;
  }, [almacenes, rolUsuario, sucursalSeleccionada, tipoNota]);

  const almacenesDestinoFiltrados = useMemo(() => {
    if (rolUsuario === 1) return almacenes;
    if (tipoNota === 'ingreso') {
      // ingreso: destino restringido a sucursal
      return almacenes.filter(a => a.sucursal === sucursalSeleccionada);
    }
    return almacenes;
  }, [almacenes, rolUsuario, sucursalSeleccionada, tipoNota]);

  // Destinatario -> RUC
  useEffect(() => {
    const sel = destinatarios.find(d => String(d.id) === String(destinatario));
    setRucDest(sel?.documento || '');
  }, [destinatario, destinatarios]);

  // Debounced búsqueda productos al cambiar criterios
  const debouncedBuscar = useDebounce(async (crit) => {
    // Permitir búsqueda sin almacén sólo en notas de ingreso
    if (!almacenOrigen && tipoNota !== 'ingreso') { 
      setProductos([]); 
      return; 
    }
    try {
      const res = await useProductosData(crit);
      setProductos(res?.productos || []);
    } catch {
      setProductos([]);
    }
  }, 400);

  useEffect(() => {
    if (isModalBuscar && almacenOrigen) {
      debouncedBuscar({ descripcion: searchInput, almacen: almacenOrigen, cod_barras: codigoBarras });
    }
  }, [searchInput, codigoBarras, almacenOrigen, isModalBuscar, debouncedBuscar]);

  // Atajo guardar (Ctrl+S)
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isValid) openModalGuardar();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isValid]);

  // Reset productos si cambian almacenes (para evitar inconsistencias)
  useEffect(() => {
    setProductosSeleccionados(prev =>
      prev.length ? [] : prev
    );
  }, [almacenOrigen]);


  // Métricas productos
  const totalItems = productosSeleccionados.length;
  const totalUnidades = useMemo(
    () => productosSeleccionados.reduce((acc, p) => acc + (p.cantidad || 0), 0),
    [productosSeleccionados]
  );

  // Handlers
  const openModalBuscarProducto = useCallback(() => {
    // Restringir solo si NO es ingreso
    if (!almacenOrigen && tipoNota !== 'ingreso') {
      toast.error('Seleccione un almacén origen primero');
      return;
    }
    setIsModalBuscar(true);
  }, [almacenOrigen, tipoNota]);

  const closeModalBuscarProducto = () => setIsModalBuscar(false);

  const openModalProveedor = () => setIsModalProveedor(true);
  const closeModalProveedor = () => setIsModalProveedor(false);

  const openModalGuardar = () => {
    setConfirmationMessage('¿Desea guardar esta nueva nota?');
    setIsModalGuardar(true);
  };
  const closeModalGuardar = () => setIsModalGuardar(false);

  const agregarProducto = useCallback((producto, cantidad) => {
    setProductosSeleccionados(prev => {
      const agregadoPrev = prev
        .filter(p => p.codigo === producto.codigo)
        .reduce((a, p) => a + p.cantidad, 0);
      const nuevoTotal = agregadoPrev + cantidad;
      if (nuevoTotal > producto.stock) {
        const restante = producto.stock - agregadoPrev;
        if (restante > 0) {
          toast.error(`Stock máximo ${producto.stock}. Solo puedes añadir ${restante} más.`);
        } else {
          toast.error('Stock máximo alcanzado.');
        }
        return prev;
      }
      const existe = prev.find(p => p.codigo === producto.codigo);
      if (existe) {
        return prev.map(p =>
          p.codigo === producto.codigo
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
    closeModalBuscarProducto();
  }, []);

  const handleCancel = () => {
    setProductosSeleccionados([]);
  };

  const buildFechaCompleta = () => {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 19).replace('T',' ');
  };

  const buildPayloadBase = (fechaBase, doc, isSalida = false) => ({
    almacenO: almacenOrigen,
    almacenD: almacenDestino,
    destinatario,
    glosa,
    nota,
    fecha: fechaBase,
    producto: productosSeleccionados.map(p => p.codigo),
    numComprobante: doc,
    cantidad: productosSeleccionados.map(p => p.cantidad),
    observacion,
    ...(isSalida ? { nom_usuario: usuario } : { usuario })
  });

  const handleGuardar = async () => {
    if (!isValid) {
      toast.error('Complete los campos requeridos.');
      return;
    }
    setIsSaving(true);
    const fechaBase = buildFechaCompleta();
    try {
      let resIng = { success: false };
      let resSal = { success: false };
      if (tipoNota === 'conjunto') {
        const [r1, r2] = await Promise.all([
          insertNotaIngreso(buildPayloadBase(fechaBase, currentDocumentoIngreso, false)),
          insertNotaSalida(buildPayloadBase(fechaBase, currentDocumentoSalida, true))
        ]);
        resIng = r1; resSal = r2;
      } else if (tipoNota === 'ingreso') {
        resIng = await insertNotaIngreso(buildPayloadBase(fechaBase, currentDocumentoIngreso, false));
      } else {
        resSal = await insertNotaSalida(buildPayloadBase(fechaBase, currentDocumentoSalida, true));
      }

      const ok =
        (tipoNota === 'ingreso'  && resIng.success) ||
        (tipoNota === 'salida'   && resSal.success) ||
        (tipoNota === 'conjunto' && resIng.success && resSal.success);

      if (ok) {
        toast.success('Nota(s) registrada(s) correctamente.');
        handleCancel();
        window.history.back();
      } else {
        toast.error('Error al registrar la nota.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmGuardar = async () => {
    closeModalGuardar();
    await handleGuardar();
  };

  // UI
  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
          Nota de almacén
        </h1>
        <p className="text-sm text-blue-700/70">
          Registra una nota de ingreso, salida o ambas simultáneamente.
        </p>
      </div>

      <div className="rounded-2xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-sm border border-blue-100/60 dark:border-zinc-700/60 shadow-sm p-5 space-y-4">
        <Tabs
          aria-label="Tipo de nota"
          selectedKey={tipoNota}
            onSelectionChange={(k) => {
              setTipoNota(k);
              setProductosSeleccionados([]);
            }}
          color="primary"
          variant="solid"
          classNames={{
            tabList: "bg-blue-50/70 dark:bg-zinc-800/60 p-1 rounded-xl",
            tab: "rounded-lg px-4 py-2 text-sm font-semibold data-[hover=true]:bg-blue-100/60 dark:data-[hover=true]:bg-zinc-700/50",
            cursor: "bg-blue-600 shadow",
            tabContent: "group-data-[selected=true]:text-white text-blue-700"
          }}
        >
          {TIPO_NOTA.map(t => (
            <Tab
              key={t.value}
              title={t.label}
              isDisabled={t.value === "conjunto" && rolUsuario !== 1}
            />
          ))}
        </Tabs>

        <Divider />

        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" color="primary" className="text-[11px]">Productos: {totalItems}</Chip>
          <Chip size="sm" variant="flat" color="secondary" className="text-[11px]">Unidades: {totalUnidades}</Chip>
          <Chip size="sm" variant="flat" color={isValid ? 'success' : 'danger'} className="text-[11px]">
            {isValid ? 'Listo para guardar' : 'Incompleto'}
          </Chip>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Almacén Origen"
                placeholder="Seleccionar"
                selectedKeys={almacenOrigen ? [String(almacenOrigen)] : []}
                isDisabled={productosSeleccionados.length > 0}
                onChange={(e) => setAlmacenOrigen(e.target.value)}
                classNames={{ trigger: "bg-white/90 dark:bg-zinc-900/70" }}
              >
                {almacenesOrigenFiltrados.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>
                ))}
              </Select>
              <Select
                label="Almacén Destino"
                placeholder="Seleccionar"
                selectedKeys={almacenDestino ? [String(almacenDestino)] : []}
                onChange={(e) => setAlmacenDestino(e.target.value)}
                classNames={{ trigger: "bg-white/90 dark:bg-zinc-900/70" }}
              >
                {almacenesDestinoFiltrados.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Proveedor / Destinatario"
                placeholder="Seleccionar"
                selectedKeys={destinatario ? [String(destinatario)] : []}
                onChange={(e) => setDestinatario(e.target.value)}
                classNames={{ trigger: "bg-white/90 dark:bg-zinc-900/70" }}
              >
                {destinatarios.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.destinatario}</SelectItem>
                ))}
              </Select>
              <Input label="RUC / Documento" value={rucDest} isReadOnly className="bg-white/90 dark:bg-zinc-900/70" />
            </div>
            <Input
              label="Nombre de nota"
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="bg-white/90 dark:bg-zinc-900/70"
              maxLength={60}
            />
          </div>

          {/* Columna derecha */}
            <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Fecha Documento"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="bg-white/90 dark:bg-zinc-900/70"
              />
              <Input
                label="Número"
                value={
                  tipoNota === 'ingreso'
                    ? currentDocumentoIngreso
                    : tipoNota === 'salida'
                      ? currentDocumentoSalida
                      : `I:${currentDocumentoIngreso} / S:${currentDocumentoSalida}`
                }
                isReadOnly
                className="bg-white/90 dark:bg-zinc-900/70"
              />
              <Select
                label="Glosa"
                selectedKeys={glosa ? [glosa] : []}
                onChange={e => setGlosa(e.target.value)}
                classNames={{ trigger: "bg-white/90 dark:bg-zinc-900/70" }}
              >
                {GLOSAS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </Select>
            </div>
            <Textarea
              label="Observación"
              minRows={3}
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              className="bg-white/90 dark:bg-zinc-900/70"
            />
          </div>
        </form>

        <Divider className="my-4" />

        <div className="flex flex-wrap gap-3">
          <Tooltip content="Registrar nuevo destinatario" placement="top" delay={400}>
            <Button
              color="primary"
              variant="flat"
              startContent={<MdPersonAdd />}
              onPress={openModalProveedor}
            >
              Destinatario
            </Button>
          </Tooltip>
          <Tooltip content="Buscar y añadir productos" placement="top" delay={400}>
            <Button
              color="warning"
              variant="flat"
              startContent={<FaBarcode />}
              onPress={openModalBuscarProducto}
              isDisabled={tipoNota !== 'ingreso' && !almacenOrigen}
            >
              Productos
            </Button>
          </Tooltip>
          <Link to="/almacen/nota_ingreso">
            <Button
              color="danger"
              variant="flat"
              startContent={<MdCancelPresentation />}
              onPress={handleCancel}
            >
              Cancelar
            </Button>
          </Link>
          <Tooltip content={isValid ? "Guardar (Ctrl+S)" : "Complete los campos requeridos"} placement="top">
            <Button
              color="success"
              startContent={<FiSave />}
              onPress={openModalGuardar}
              isDisabled={!isValid || isSaving}
              isLoading={isSaving}
            >
              Guardar
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Tabla productos */}
      <div className="rounded-2xl border-blue-100/60 dark:border-zinc-700/60  dark:bg-zinc-900/70 backdrop-blur-sm">
        <ScrollShadow className="max-h-[360px]">
          <RegistroTablaIngreso
            ingresos={productosSeleccionados}
            setProductosSeleccionados={setProductosSeleccionados}
          />
        </ScrollShadow>
      </div>

      {/* Modales */}
      <ModalBuscarProducto
        isOpen={isModalBuscar}
        onClose={closeModalBuscarProducto}
        onBuscar={() => debouncedBuscar({ descripcion: searchInput, almacen: almacenOrigen, cod_barras: codigoBarras })}
        setSearchInput={setSearchInput}
        productos={productos}
        agregarProducto={agregarProducto}
        setCodigoBarras={setCodigoBarras}
        hideStock={!almacenOrigen}
      />
      {isModalProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={() => setIsModalProducto(false)} />
      )}
      <AgregarProovedor
        isOpen={isModalProveedor}
        onClose={closeModalProveedor}
        titulo="destinatario"
      />
      {isModalGuardar && (
        <ConfirmationModal
          message={confirmationMessage}
          onClose={closeModalGuardar}
          isOpen={isModalGuardar}
          onConfirm={handleConfirmGuardar}
        />
      )}
    </div>
  );
}

export default Registro_Ingresos;