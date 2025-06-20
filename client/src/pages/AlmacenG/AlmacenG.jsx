import { useState, useEffect } from 'react';
import { ShowAlmacenes } from '@/pages/AlmacenG/ShowAlmacenes';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import AlmacenesForm from './AlmacenesForm';
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import { Tooltip } from "@heroui/react";
import BarraSearch from "@/components/Search/Search";
import { getAlmacenes_A, deleteAlmacen } from '@/services/almacen.services';
function Almacenes() {
  const [activeAdd, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [almacenes, setAlmacenes] = useState([]);

  const estadoToText = (estado) =>
  String(estado) === "1" ? "Activo" : "Inactivo";

  const handleModalAdd = () => setModalOpen(!activeAdd);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const { hasCreatePermission } = usePermisos();

  // Cargar almacenes solo una vez
  useEffect(() => {
    const fetchAlmacenes = async () => {
      const data = await getAlmacenes_A();
      setAlmacenes(data || []);
    };
    fetchAlmacenes();
  }, []);

const handleAddAlmacen = (nuevoAlmacen) => {
  setAlmacenes(prev => [
    {
      ...nuevoAlmacen,
      estado_almacen: estadoToText(nuevoAlmacen.estado_almacen)
    },
    ...prev
  ]);
};

// Al editar almacén localmente
const handleEditAlmacen = (id_almacen, updatedData) => {
  setAlmacenes(prev =>
    prev.map(almacen =>
      almacen.id_almacen === id_almacen
        ? { ...almacen, ...updatedData, estado_almacen: estadoToText(updatedData.estado_almacen) }
        : almacen
    )
  );
};

const handleDeleteAlmacen = async (id_almacen) => {
  const result = await deleteAlmacen(id_almacen);
  if (result === 1) {
    setAlmacenes(prev => prev.filter(almacen => almacen.id_almacen !== id_almacen));
  } else if (result === 2) {
    setAlmacenes(prev =>
      prev.map(almacen =>
        almacen.id_almacen === id_almacen
          ? { ...almacen, estado_almacen: "Inactivo" }
          : almacen
      )
    );
  }
};

  return (
    <div>
      <Toaster />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Gestión de almacenes</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Almacenes</h6>
        <BarraSearch
          placeholder="Ingrese un almacén"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Tooltip content={hasCreatePermission ? "Agregar almacén" : "No tiene permisos para agregar almacenes"}>
            <Button
              color={hasCreatePermission ? "primary" : "default"}
              endContent={<FaPlus style={{ fontSize: '25px' }} />}
              onClick={() => hasCreatePermission ? handleModalAdd() : null}
              className={hasCreatePermission ? "" : "opacity-50 cursor-not-allowed"}
            >
              Agregar almacén
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div>
        <ShowAlmacenes
          searchTerm={searchTerm}
          almacenes={almacenes}
          onEdit={handleEditAlmacen}
          onDelete={handleDeleteAlmacen}
        />
      </div>

      {activeAdd && (
        <AlmacenesForm 
          modalTitle="Agregar Almacén"
          onClose={handleModalAdd}
          onSuccess={handleAddAlmacen}
          initialData={null}
        />
      )}
    </div>
  );
}

export default Almacenes;