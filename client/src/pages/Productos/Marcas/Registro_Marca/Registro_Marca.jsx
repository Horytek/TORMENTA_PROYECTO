import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb"; // Asegúrate de tener este componente
import "./Registro_Venta.css";
import { Link } from "react-router-dom";

// Definición simple de componentes UI
const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-100 p-4 rounded-lg shadow ${className}`}>
    {children}
  </div>
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-semibold ${className}`}
  >
    {children}
  </label>
);

const Input = ({ id, value, onChange, placeholder, className = "" }) => (
  <input
    id={id}
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full p-2 border rounded ${className}`}
  />
);



// Iconos SVG simples
const CircleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none" // Aquí definimos que no se rellene el SVG principal
    stroke="currentColor"
    strokeWidth="2"
    className="w-4 h-4"
  >
    <circle cx="12" cy="12" r="10" fill="black" /> 
  </svg>
);


const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-4 h-4"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-4 h-4 text-white"
  >
    <path d="M20 6l-11 11-5-5" />
  </svg>
);

const DoorClosedIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-6 h-6"
  >
    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
    <path d="M2 20h20" />
    <path d="M14 12v.01" />
  </svg>
);

const Registro_Venta = () => {
  const [brandName, setBrandName] = useState("");

  return (
    <>
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Marcas", href: "/productos/marcas" },
          { name: "Registrar", href: "/marcas/registrar_marca" },
        ]}
      />
      <hr className="mb-4" />
      <div className="max-w-2xl  p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Nueva marca</h1>
          <button className="text-gray-500">
            <DoorClosedIcon />
          </button>
        </div>
        <div className="border-t border-gray-200 mb-4" />
        <Card>
          <div className="flex items-center mb-4">
            <CircleIcon />
            <h2 className="ml-2 text-lg font-medium">Información general</h2>
          </div>
          <div className="border-t border-gray-300 mb-4" />
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="brand-name">
                Nombre de la Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand-name"
                placeholder="Ingresa el nombre"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
          </div>
        </Card>
        <div className="flex justify-end mt-4 space-x-2">
          <Link
            to="/productos/marcas"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            <ArrowLeftIcon />
            <span>Regresar</span>
          </Link>
          <Link
            to="/productos/marcas"
            style={{ backgroundColor: "#4069E5FF" }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500  transition"
          >
            <CheckIcon />
            <span style={{color: "white"}}>Guardar</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Registro_Venta;
