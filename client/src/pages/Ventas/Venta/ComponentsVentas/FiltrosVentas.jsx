import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { MdAddCircleOutline, MdOutlineRealEstateAgent } from "react-icons/md";
import { DateRangePicker } from "@nextui-org/date-picker";
import useComprobanteData from "../../Data/data_comprobante_venta";
import useSucursalData from "../../Data/data_sucursal_venta";
import { parseDate } from "@internationalized/date";
import { Select, SelectItem } from "@nextui-org/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { CgOptions } from "react-icons/cg";
import { Input } from "@nextui-org/input";
import { handleSunatMultiple } from "../../Data/add_sunat_multiple";
import { handleUpdateMultiple } from "../../Data/update_venta_multiple";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import PDFModal from "../hook/PDFModal"; 
import { usePermisos } from '@/routes';
import { Button } from "@nextui-org/button";


const FiltrosVentas = ({ onFiltersChange, refetchVentas }) => {
  const { comprobantes } = useComprobanteData();
  const { sucursales } = useSucursalData();
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState("");
  const [sucursalSeleccionado, setSucursalSeleccionado] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [value, setValue] = React.useState({
    start: parseDate("2024-04-01"),
    end: parseDate("2028-04-08"),
  });
  const [tempValue, setTempValue] = useState(value);
  const [razon, setRazon] = useState("");
   const [numC, setNumC] = useState("");
   const [modalOpen, setModalOpen] = useState(false); // Estado para controlar la apertura del modal
 
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
     };
 
     onFiltersChange(filtros);
     localStorage.setItem("filtros", JSON.stringify(filtros));
   }, [
     comprobanteSeleccionado,
     sucursalSeleccionado,
     value,
     razon,
     numC,
     onFiltersChange,
   ]);
 

  const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem("total_ventas");
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const handleAccept = () => {
    const d_ventas = loadDetallesFromLocalStorage();
    const ventas_new = d_ventas.filter(
      (venta) => venta.estado === "En proceso" && venta.tipoComprobante !== "Nota"
    );
    localStorage.setItem("d_new", JSON.stringify(ventas_new));

    if (ventas_new.length === 0) {
      toast.error(
        "Todas las ventas de esta paginación ya han sido enviadas a la Sunat."
      );
      return;
    }

    const loadingToastId = toast.loading(
      "Se están enviando los datos a la Sunat..."
    );

    handleSunatMultiple(ventas_new);
    handleUpdateMultiple(ventas_new);

    // Actualizamos el estado para que React maneje los cambios
    setIsDeleted(true);
    toast.dismiss(loadingToastId);
    toast.success("Los datos se han enviado con éxito!");
  };

  useEffect(() => {
    if (isDeleted) {
      refetchVentas(); // Refrescamos las ventas
      setIsDeleted(false); // Reseteamos el estado
    }
  }, [isDeleted, refetchVentas]);

  const handleNavigation = () => {
    navigate("/ventas/registro_venta");
  };

  return (
    <>
      <Toaster />
      <div className="flex flex-wrap justify-between mb-4">
        <div className="items-center justify-between block ms:block md:flex lg:w-12/12 xl:8/12 md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap">
          <div className="flex input-wrapper">
            <Input
              type="text"
              id="numC"
              className="rounded-lg"
              placeholder="Numero de comprobante"
              value={numC}
              onChange={handleChanger}
              style={{
                border: "none",
                boxShadow: "none",
                outline: "none",
              }}
            />
          </div>
          <div className="flex input-wrapper">
            <Input
              type="text"
              id="valor"
              className="rounded-lg"
              placeholder="Nombre o Razón Social"
              value={razon}
              onChange={handleChange}
              style={{
                border: "none",
                boxShadow: "none",
                outline: "none",
              }}
            />
          </div>
          <div className="mb-2 input-wrapper md:mb-0">
            <Select
              id="tipo"
              placeholder="Tipo Comprobante"
              selectionMode="multiple"
              className="p-0 rounded-lg"
              style={{ width: "190px" }}
              value={comprobanteSeleccionado}
              onChange={(e) => setComprobanteSeleccionado(e.target.value)}
            >
              {comprobantes.map((comprobante) => (
                <SelectItem key={comprobante.id} value={comprobante.nombre}>
                  {comprobante.nombre}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="mb-2 input-wrapper md:mb-0">
            <Select
              id="campo"
              placeholder="Sucursal"
              className="p-2 rounded-lg"
              style={{ width: "170px" }}
              value={sucursalSeleccionado}
              onChange={(e) => setSucursalSeleccionado(e.target.value)}
            >
              {sucursales.map((sucursal) => (
                <SelectItem key={sucursal.nombre} value={sucursal.nombre}>
                  {sucursal.nombre}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 input-wrapper">
            <DateRangePicker
              className="w-xs"
              classNames={{ inputWrapper: "bg-white" }}
              value={tempValue}
              onChange={handleDateChange}
              renderInput={(props) => (
                <input
                  {...props}
                  className="p-2 bg-white border border-gray-300 rounded-lg"
                />
              )}
            />
          </div>
        </div>

        <div className="flex items-center mt-3 xl:justify-end md:mt-3 lg:mt-0 xl:mt-0">
          <button className="mr-4">
            <Dropdown>
              <DropdownTrigger className="bg-gray-100">
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  icon={<CgOptions className="text-xl text-gray-600" />}
                />
              </DropdownTrigger>
              <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                <DropdownItem
                  key="sunat"
                  onClick={handleAccept}
                  startContent={<MdOutlineRealEstateAgent />}
                >
                  Enviar a SUNAT
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </button>
          
          {hasCreatePermission ? (
            <Button
              color="primary"
              endContent={<MdAddCircleOutline style={{ fontSize: '25px' }} />}
              onClick={handleNavigation}
              className="mr-0"
            >
              Nueva venta
            </Button>
          ) : (
            <Button
              color="primary"
              endContent={<MdAddCircleOutline style={{ fontSize: '25px' }} />}
              disabled
              className="mr-0 opacity-50 cursor-not-allowed"
            >
              Nueva venta
            </Button>
          )}
        </div>
      </div>

      {/* Modal para confirmación de descarga de PDF */}
      <PDFModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false);
        }}
      />
    </>
  );
};

FiltrosVentas.propTypes = {
  refetchVentas: PropTypes.func.isRequired,
};

export default FiltrosVentas;
