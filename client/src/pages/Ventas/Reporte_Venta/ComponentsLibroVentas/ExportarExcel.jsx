import React, { useState } from "react";
import axios from "@/api/axios";
import useSucursalData from "@/services/Data/data_sucursal_venta";
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

const ExcelIcon = ({ size = 20, color = "white", ...props }) => {
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

const COMPROBANTES = [
  { value: "Boleta", label: "Boleta" },
  { value: "Factura", label: "Factura" },
  { value: "Nota de venta", label: "Nota de venta" }
];

const ExportarExcel = ({ buttonText = "Exportar a Excel", ...props }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { sucursales } = useSucursalData();
  const [mesSeleccionado, setMesSeleccionado] = useState(new Set());
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Set());
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(new Set());
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState(new Set());

  const handleExportExcel = async (mes, ano, idSucursal, tipoComprobante) => {
    try {
      let url = `/reporte/registro_ventas_sunat?mes=${mes}&ano=${ano}&tipoComprobante=${tipoComprobante}`;
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
      sucursales.find(s => s.id === parseInt(idSucursal))?.nombre : '';
      const fileName = idSucursal ? 
        `RegistroVentas_${sucursalNombre}_${tipoComprobante}_${mes}_${ano}.xlsx` : 
        `RegistroVentas_${tipoComprobante}_${mes}_${ano}.xlsx`;
      
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
    const tipoComprobante = tipoComprobanteSeleccionado.size > 0 ? Array.from(tipoComprobanteSeleccionado) : null;

    if (!mes || !ano || !idSucursal || !tipoComprobante) {
      alert("Por favor, seleccione la sucursal, mes, año y tipo de comprobante antes de exportar.");
      return;
    }

    handleExportExcel(mes, ano, idSucursal, tipoComprobante);
  };

  return (
    <>
      <Button
        color="success"
        endContent={<ExcelIcon />}
        onPress={onOpen}
        className="text-white"
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
                  {sucursales.map((sucursal) => (
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
                <Select
                  label="Tipo de Comprobante"
                  placeholder="Seleccione tipo de comprobante"
                  selectionMode="multiple"
                  selectedKeys={tipoComprobanteSeleccionado}
                  onSelectionChange={setTipoComprobanteSeleccionado}
                  isRequired
                >
                  {COMPROBANTES.map((comprobante) => (
                    <SelectItem key={comprobante.value} value={comprobante.value}>
                      {comprobante.label}
                    </SelectItem>
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
