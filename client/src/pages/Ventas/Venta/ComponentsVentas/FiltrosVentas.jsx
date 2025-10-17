import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { MdAddCircleOutline, MdOutlineRealEstateAgent } from "react-icons/md";
import { DateRangePicker } from "@heroui/date-picker";
import useComprobanteData from "@/services/data/data_comprobante_venta";
import useSucursalData from "@/services/data/data_sucursal_venta";
import { parseDate } from "@internationalized/date";
import { Select, SelectItem } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { CgOptions } from "react-icons/cg";
import { Input } from '@heroui/react';
import { handleSunatMultiple } from "@/services/data/add_sunat_multiple";
import { handleUpdateMultiple } from "@/services/data/update_venta_multiple";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import PDFModal from "../hook/PDFModal";
import { usePermisos } from '@/routes';
import { Button } from '@heroui/react';
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { ActionButton } from "@/components/Buttons/Buttons";


const FiltrosVentas = ({ onFiltersChange }) => {
  const { comprobantes } = useComprobanteData();
  const { sucursales } = useSucursalData();
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState("");
  const [sucursalSeleccionado, setSucursalSeleccionado] = useState("");
  const [value, setValue] = React.useState({
    start: parseDate("2024-04-01"),
    end: parseDate("2028-04-08"),
  });
  const [tempValue, setTempValue] = useState(value);
  const [razon, setRazon] = useState("");
  const [numC, setNumC] = useState("");
  const [estado, setEstado] = useState(""); // Estado de la venta
  const [modalOpen, setModalOpen] = useState(false);

  // Zustand
  const nombre = useUserStore((state) => state.nombre);
  const rol = useUserStore((state) => state.rol);
  const sur = useUserStore((state) => state.sur);
  const total_ventas = useVentaSeleccionadaStore((state) => state.total_ventas);

  const handleChange = (event) => {
    setRazon(event.target.value);
  };

  const { hasCreatePermission } = usePermisos();
  const navigate = useNavigate();

  const handleChanger = (event) => {
    setNumC(event.target.value);
  };

  const handleDateChange = (newValue) => {
    if (newValue.start && newValue.end) {
      setValue(newValue);
      setTempValue(newValue);
    } else {
      setTempValue(newValue);
    }
  };

   useEffect(() => {
    const date_i = new Date(
      value.start.year,
      value.start.month - 1,
      value.start.day
    );
    const fecha_i = `${date_i.getFullYear()}-${String(
      date_i.getMonth() + 1
    ).padStart(2, "0")}-${String(date_i.getDate()).padStart(2, "0")}`;

    const date_e = new Date(value.end.year, value.end.month - 1, value.end.day);
    const fecha_e = `${date_e.getFullYear()}-${String(
      date_e.getMonth() + 1
    ).padStart(2, "0")}-${String(date_e.getDate()).padStart(2, "0")}`;

    const filtros = {
      comprobanteSeleccionado,
      sucursalSeleccionado,
      fecha_i,
      fecha_e,
      razon,
      numC,
      estado, // <-- Añadido para filtrar por estado
    };

    onFiltersChange(filtros);
  }, [
    comprobanteSeleccionado,
    sucursalSeleccionado,
    value,
    razon,
    numC,
    estado, // <-- Añadido dependencia
    onFiltersChange,
  ]);

  const loadDetallesFromStore = () => {
    return total_ventas || [];
  };

  const handleAccept = () => {
    const d_ventas = loadDetallesFromStore();
    const ventas_new = d_ventas.filter(
      (venta) => venta.estado === "En proceso" && venta.tipoComprobante !== "Nota"
    );

    if (ventas_new.length === 0) {
      toast.error(
        "Todas las ventas de esta paginación ya han sido enviadas a la Sunat."
      );
      return;
    }

    const loadingToastId = toast.loading(
      "Se están enviando los datos a la Sunat..."
    );

    handleSunatMultiple(ventas_new, nombre);
    handleUpdateMultiple(ventas_new);

    toast.dismiss(loadingToastId);
    toast.success("Los datos se han enviado con éxito!");
    // Si necesitas actualizar el estado local, hazlo aquí usando Zustand o una función del padre
  };

  const handleNavigation = () => {
    navigate("/ventas/registro_venta");
  };

  return (
    <>
      <Toaster />
      {/* Contenedor filtros */}
      <div
        className="
          mb-1 rounded-2xl
         dark:border-blue-900/40
           dark:bg-[#1b2330]/80
          backdrop-blur-md
          px-1 transition-colors
        "
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Grid de filtros */}
          <div className="flex-1">
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                md:grid-cols-3
                xl:grid-cols-6
                gap-4
              "
            >
              {/* Número de comprobante */}
              <div className="col-span-1">
                <Input
                  type="text"
                  id="numC"
                  placeholder="Número comprobante"
                  value={numC}
                  onChange={handleChanger}
                  size="sm"
                  classNames={{
                    inputWrapper:
                      "h-10 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 rounded-lg transition",
                    input:
                      "text-sm text-blue-900 dark:text-zinc-100 placeholder:text-blue-400/60 dark:placeholder:text-zinc-500"
                  }}
                />
              </div>

              {/* Razón social / nombre */}
              <div className="col-span-1">
                <Input
                  type="text"
                  id="valor"
                  placeholder="Nombre o Razón Social"
                  value={razon}
                  onChange={handleChange}
                  size="sm"
                  classNames={{
                    inputWrapper:
                      "h-10 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 rounded-lg transition",
                    input:
                      "text-sm text-blue-900 dark:text-zinc-100 placeholder:text-blue-400/60 dark:placeholder:text-zinc-500"
                  }}
                />
              </div>

              {/* Tipo comprobante */}
              <div className="col-span-1">
                <Select
                  id="tipo"
                  placeholder="Tipo Comprobante"
                  selectionMode="multiple"
                  selectedKeys={
                    comprobanteSeleccionado
                      ? new Set(comprobanteSeleccionado.split(","))
                      : new Set([])
                  }
                  onChange={(e) => setComprobanteSeleccionado(e.target.value)}
                  size="sm"
                  className="w-full"
                  classNames={{
                    trigger:
                      "h-10 min-h-10 bg-white/70 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg",
                    value:
                      "text-sm text-blue-900 dark:text-zinc-100",
                    listbox:
                      "bg-white dark:bg-[#222a36]"
                  }}
                >
                  {comprobantes.map((comprobante) => (
                    <SelectItem key={comprobante.id} value={comprobante.nombre}>
                      {comprobante.nombre}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Sucursal */}
              <div className="col-span-1">
                <Select
                  id="campo"
                  placeholder="Sucursal"
                  value={sucursalSeleccionado}
                  onChange={(e) => setSucursalSeleccionado(e.target.value)}
                  defaultSelectedKeys={[rol !== 1 ? sur : sucursalSeleccionado]}
                  size="sm"
                  className="w-full"
                  classNames={{
                    trigger:
                      "h-10 min-h-10 bg-white/70 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg",
                    value: "text-sm text-blue-900 dark:text-zinc-100",
                    listbox: "bg-white dark:bg-[#222a36]"
                  }}
                >
                  {sucursales.map((sucursal) => (
                    <SelectItem
                      key={sucursal.nombre}
                      value={sucursal.nombre}
                      isDisabled={rol !== 1 && sucursal.nombre !== sur}
                    >
                      {sucursal.nombre}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Estado */}
              <div className="col-span-1">
                <Select
                  id="estado"
                  placeholder="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  size="sm"
                  className="w-full"
                  classNames={{
                    trigger:
                      "h-10 min-h-10 bg-white/70 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg",
                    value: "text-sm text-blue-900 dark:text-zinc-100",
                    listbox: "bg-white dark:bg-[#222a36]"
                  }}
                >
                  <SelectItem key="" value="">
                    Todos
                  </SelectItem>
                  <SelectItem key="Aceptada" value="Aceptada">
                    Aceptada
                  </SelectItem>
                  <SelectItem key="En proceso" value="En proceso">
                    En proceso
                  </SelectItem>
                  <SelectItem key="Anulada" value="Anulada">
                    Anulada
                  </SelectItem>
                </Select>
              </div>

              {/* Rango de fechas */}
              <div className="sm:col-span-2 md:col-span-2 xl:col-span-1">
                <DateRangePicker
                  className="w-full rounded-lg"
                  classNames={{
                    inputWrapper:
                      "h-10 min-h-10 bg-blue-50/70 dark:bg-zinc-800/60 border border-blue-200/60 dark:border-zinc-700/60 hover:border-blue-300 dark:hover:border-zinc-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 rounded-lg transition",
                    calendar:
                      "dark:bg-[#1e2734]",
                    content:
                      "text-sm text-blue-900 dark:text-zinc-100"
                  }}
                  value={tempValue}
                  onChange={handleDateChange}
                  renderInput={(props) => (
                    <input
                      {...props}
                      className="p-2 bg-transparent border-none rounded-lg text-sm text-blue-900 dark:text-zinc-100 placeholder:text-blue-400/60 dark:placeholder:text-zinc-500 focus:outline-none"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-start gap-3 lg:w-auto lg:pt-0">
            <Dropdown>
              <DropdownTrigger className="rounded-lg h-10 w-10 flex items-center justify-center border border-blue-200/60 dark:border-zinc-700/60 bg-blue-50/70 dark:bg-zinc-800/60 hover:bg-blue-100 dark:hover:bg-zinc-700 transition">
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  icon={<CgOptions className="text-xl text-blue-600 dark:text-zinc-300" />}
                />
              </DropdownTrigger>
              <DropdownMenu
                variant="faded"
                aria-label="Acciones masivas"
                className="dark:bg-[#222a36]"
              >
                <DropdownItem
                  key="sunat"
                  onClick={handleAccept}
                  startContent={<MdOutlineRealEstateAgent className="text-blue-600 dark:text-blue-400" />}
                  className="text-blue-700 dark:text-zinc-200"
                >
                  Enviar a SUNAT
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {hasCreatePermission ? (
              <ActionButton
                color="blue"
                icon={<MdAddCircleOutline className="w-5 h-5 text-blue-500" />}
                onClick={handleNavigation}
                disabled={!hasCreatePermission}
                size="sm"
                className="h-10 px-5 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
                style={{ boxShadow: "none", border: "none" }}
              >
                Nueva venta
              </ActionButton>
            ) : (
              <ActionButton
                color="blue"
                icon={<MdAddCircleOutline className="w-5 h-5 text-blue-500" />}
                disabled
                size="sm"
                className="h-10 px-5 font-semibold rounded-lg border-0 shadow-none bg-blue-50 text-blue-700 opacity-50 cursor-not-allowed"
                style={{ boxShadow: "none", border: "none" }}
              >
                Nueva venta
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* Modal para confirmación de descarga de PDF */}
      <PDFModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />
    </>
  );
};

FiltrosVentas.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
};

export default FiltrosVentas;