import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { MdAddCircleOutline, MdOutlineRealEstateAgent } from "react-icons/md";
import { DateRangePicker } from "@nextui-org/date-picker";
import useComprobanteData from "../../Data/data_comprobante_venta";
import useSucursalData from "../../Data/data_sucursal_venta";
import { parseDate } from "@internationalized/date";
import { Select, SelectItem } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { CgOptions } from "react-icons/cg";
//import { FaRegFilePdf } from "react-icons/fa";
import { Input } from "@heroui/input";
import { handleSunatMultiple } from "../../Data/add_sunat_multiple";
import { handleUpdateMultiple } from "../../Data/update_venta_multiple";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import PDFModal from "../hook/PDFModal"; 

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
  //const [modalTitle, setModalTitle] = useState(""); // Estado para el título del modal
  const ver_usu = localStorage.getItem('usuario');
  const ver_rol = localStorage.getItem('rol');
  //const ver_sur = localStorage.getItem('sur');

  const handleChange = (event) => {
    setRazon(event.target.value);
  };

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

   /* const sucursalesDict = sucursales.reduce((acc, item) => {
      acc[item.usuario] = {
        ubicacion: item.ubicacion,
        nombre: item.nombre,
      };
      return acc;
    }, {});

    // Obtener la sucursal fija en base al usuario
    const sucursal_fija = sucursalesDict[ver_usu]?.nombre || ""; // Solo obtenemos el nombre

    // Guardar la sucursal fija en el localStorage
    localStorage.setItem('sur', sucursal_fija);*/
    
  }, [
    comprobanteSeleccionado,
    sucursalSeleccionado,
    value,
    razon,
    numC,
    onFiltersChange,
    sucursales,
    ver_usu
  ]);



  useEffect(() => {
    if (isDeleted) {
      refetchVentas();
      setIsDeleted(false);
    }
  }, [isDeleted, refetchVentas]);

  /*
  const handleOpenPDFModal = (title) => {
    setModalTitle(title);
    setModalOpen(true);
  };*/
 
 // const sucursalEncontrada = sucursales.find(sucursal => sucursal.usuario === ver_usu);
  //localStorage.setItem("sur", JSON.stringify(sucursalEncontrada));


  /*const loadDetallesFromLocalStorage = () => {
      const savedDetalles = localStorage.getItem('sur');
      return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const sucursal_fija = loadDetallesFromLocalStorage();*/

  /*const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem('sur');
    
    // Verifica si los datos existen
    if (savedDetalles) {
      try {
        // Intentar parsear los datos almacenados
        return JSON.parse(savedDetalles);
      } catch (e) {
        console.error("Error al parsear JSON:", e);
        return null;  // Devuelve null en caso de error
      }
    } else {
      console.warn("No hay sucursal guardada en localStorage");
      return null;  // Devuelve null si no existe en localStorage
    }
  };
  
  const sucursal_fija = loadDetallesFromLocalStorage();
  const nombreSucursal = sucursal_fija ? sucursal_fija.nombre : null;

  const sucursalesDict = sucursales.reduce((acc, sucursal) => {
    acc[sucursal.nombre] = { key: sucursal.nombre, label: sucursal.nombre };
    return acc;
  }, {});

  localStorage.setItem("tipo", sucursalesDict);*/


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
                        /></div>
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
              isDisabled={ver_rol !=1}
              id="campo"
              placeholder="Sucursal"
              className="p-2 rounded-lg"
              style={{ width: "170px" }}
              value={sucursalSeleccionado}
              onChange={(e) => setSucursalSeleccionado(e.target.value)}
              defaultSelectedKeys={[ver_rol != 1 ? localStorage.getItem('sur') : sucursalSeleccionado]}
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
      </div>

      {/* Modal para confirmación de descarga de PDF */}
      <PDFModal
        isOpen={modalOpen}
        //modalTitle={modalTitle}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          //console.log(`Descargando ${modalTitle}...`);
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
