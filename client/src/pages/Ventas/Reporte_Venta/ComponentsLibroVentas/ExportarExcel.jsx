import React, { useState } from "react";
import axios from "@/api/axios";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
} from "@nextui-org/react";
import { FaFileExcel } from "react-icons/fa";

const ExcelIcon = ({ size = 20, color = "green", ...props }) => {
  return <FaFileExcel size={size} color={color} {...props} />;
};

const MONTHS = [
  { value: "01", name: "Enero" },
  { value: "02", name: "Febrero" },
  { value: "03", name: "Marzo" },
  { value: "04", name: "Abril" },
  { value: "05", name: "Mayo" },
  { value: "06", name: "Junio" },
  { value: "07", name: "Julio" },
  { value: "08", name: "Agosto" },
  { value: "09", name: "Septiembre" },
  { value: "10", name: "Octubre" },
  { value: "11", name: "Noviembre" },
  { value: "12", name: "Diciembre" }
];

const SUCURSALES = [
  { id: 1, nombre: "Tienda Arica-3" },
  { id: 2, nombre: "Tienda Arica-2" },
  { id: 3, nombre: "Tienda Arica-1" },
  { id: 4, nombre: "Tienda Balta" },
  { id: 5, nombre: "Oficina" }
];

const ExportarExcel = ({ buttonText = "Exportar a Excel", ...props }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [mesSeleccionado, setMesSeleccionado] = useState(new Set());
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Set());
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(new Set());

  const handleExportExcel = async (mes, ano, idSucursal) => {
    try {
      let url = `/reporte/registro_ventas_sunat?mes=${mes}&ano=${ano}`;
      if (idSucursal) {
        url += `&idSucursal=${idSucursal}`;
      }

      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const sucursalNombre = idSucursal ? 
        SUCURSALES.find(s => s.id === parseInt(idSucursal))?.nombre : '';
      const fileName = idSucursal ? 
        `RegistroVentas_${sucursalNombre}_${mes}_${ano}.xlsx` : 
        `RegistroVentas_${mes}_${ano}.xlsx`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert("Ocurrió un error al exportar el archivo Excel.");
    }
  };

  const handleExport = () => {
    const mes = mesSeleccionado.size > 0 ? Array.from(mesSeleccionado)[0] : null;
    const ano = anoSeleccionado.size > 0 ? Array.from(anoSeleccionado)[0] : null;
    const idSucursal = sucursalSeleccionada.size > 0 ? Array.from(sucursalSeleccionada)[0] : null;

    if (!mes || !ano || !idSucursal) {
      alert("Por favor, seleccione la sucursal, mes y año antes de exportar.");
      return;
    }

    handleExportExcel(mes, ano, idSucursal);
  };

  return (
    <>
      <Button
        color="success"
        startContent={<ExcelIcon />}
        onPress={onOpen}
        {...props}
      >
        {buttonText}
      </Button>

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Exportar Registro de Ventas</ModalHeader>
              <ModalBody>
                <Select
                  label="Sucursal"
                  placeholder="Seleccione sucursal"
                  selectionMode="single"
                  selectedKeys={sucursalSeleccionada}
                  onSelectionChange={setSucursalSeleccionada}
                  isRequired
                >
                  {SUCURSALES.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Mes"
                  placeholder="Seleccione mes"
                  selectionMode="single"
                  selectedKeys={mesSeleccionado}
                  onSelectionChange={setMesSeleccionado}
                >
                  {MONTHS.map(({ value, name }) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Año"
                  placeholder="Seleccione año"
                  selectionMode="single"
                  selectedKeys={anoSeleccionado}
                  onSelectionChange={setAnoSeleccionado}
                >
                  {["2024", "2025"].map((ano) => (
                    <SelectItem key={ano}>{ano}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="success" onPress={handleExport}>
                  Exportar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ExportarExcel;