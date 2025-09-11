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
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Grid de filtros */}
            <div className="flex-1">
              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  md:grid-cols-3
                  xl:grid-cols-6
                  gap-3
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
                    className="w-full"
                    size="sm"
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
                    className="w-full"
                    size="sm"
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
                    className="w-full"
                    size="sm"
                    classNames={{ trigger: "min-h-10" }}
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
                    className="w-full"
                    size="sm"
                    classNames={{ trigger: "min-h-10" }}
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
                    className="w-full"
                    size="sm"
                    classNames={{ trigger: "min-h-10" }}
                  >
                    <SelectItem key="" value="">Todos</SelectItem>
                    <SelectItem key="Aceptada" value="Aceptada">Aceptada</SelectItem>
                    <SelectItem key="En proceso" value="En proceso">En proceso</SelectItem>
                    <SelectItem key="Anulada" value="Anulada">Anulada</SelectItem>
                  </Select>
                </div>

                {/* Rango de fechas */}
                <div className="sm:col-span-2 md:col-span-2 xl:col-span-1">
                  <DateRangePicker
                    className="w-full rounded-lg"
                    classNames={{ inputWrapper: "bg-blue-50/60 shadow-none min-h-10" }}
                    value={tempValue}
                    onChange={handleDateChange}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className="p-2 bg-blue-50/60 border-none rounded-lg text-sm"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

          {/* Acciones */}
          <div className="flex items-start gap-3 lg:w-auto lg:pt-0">
            <Dropdown>
              <DropdownTrigger className="bg-gray-100 rounded-lg h-10 w-10 flex items-center justify-center">
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  icon={<CgOptions className="text-xl text-gray-600" />}
                />
              </DropdownTrigger>
              <DropdownMenu variant="faded" aria-label="Acciones masivas">
                <DropdownItem
                  key="sunat"
                  onClick={handleAccept}
                  startContent={<MdOutlineRealEstateAgent />}
                >
                  Enviar a SUNAT
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {hasCreatePermission ? (
              <Button
                color="primary"
                endContent={<MdAddCircleOutline style={{ fontSize: '22px' }} />}
                onClick={handleNavigation}
                className="h-10"
              >
                Nueva venta
              </Button>
            ) : (
              <Button
                color="primary"
                endContent={<MdAddCircleOutline style={{ fontSize: '22px' }} />}
                disabled
                className="h-10 opacity-50 cursor-not-allowed"
              >
                Nueva venta
              </Button>
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