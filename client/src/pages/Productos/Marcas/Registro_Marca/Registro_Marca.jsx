import React, { useState } from "react";
import Modal from "./ComponentsRegistroMarcas/Modals/RegistroModal";  // Asegúrate de que la ruta de importación es correcta

const Registro_Marca = () => {
  const [brandName, setBrandName] = useState("");
  const [openRegistroModal, setIsModalRegistroOpen] = useState(false);

  return (
    <Modal isOpen={openRegistroModal} onClose={() => setIsModalRegistroOpen(true)}>
      <h1 className="text-xl font-bold mb-4">Nueva marca</h1>
      <hr className="mb-4" />
      <div className="flex flex-col space-y-4">
        <label htmlFor="brand-name" className="block text-sm font-semibold">
          Nombre de la Marca <span className="text-red-500">*</span>
        </label>
        <input
          id="brand-name"
          type="text"
          placeholder="Ingresa el nombre"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={() => setIsModalRegistroOpen(false)} 
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100"
        >
          Cerrar
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
          Guardar
        </button>
      </div>
    </Modal>
  );
};

export default Registro_Marca;
