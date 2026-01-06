
import React, { useState, useEffect } from "react";
import axios from "@/api/axios";
import { useSucursalData } from "@/services/ventas.services";
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
  Checkbox,
  CheckboxGroup
} from '@heroui/react';
import { FaFileExcel } from "react-icons/fa";
import { toast } from "react-hot-toast";

const ExcelIcon = ({ size = 20, color = "currentColor", ...props }) => (
  <FaFileExcel size={size} color={color} {...props} />
);

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

const COMPROBANTES = [
  { value: "Boleta", label: "Boleta" },
  { value: "Factura", label: "Factura" },
  { value: "Nota de venta", label: "Nota de venta" }
];

const ExportarExcel = ({
  buttonText = "Exportar Excel",
  presetSucursal,
  presetMes,
  presetAno,
  presetTipos,
  autoSelect = false,
  ...props
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { sucursales } = useSucursalData();

  const [mesSeleccionado, setMesSeleccionado] = useState(new Set());
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Set());
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(new Set());
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState(new Set(["Boleta", "Factura"]));
  const [isExporting, setIsExporting] = useState(false);

  // Sync state with presets when modal opens or presets change
  useEffect(() => {
    if (isOpen && autoSelect) {
      if (presetSucursal) setSucursalSeleccionada(new Set([String(presetSucursal)]));
      if (presetMes) setMesSeleccionado(new Set([String(presetMes)]));
      if (presetAno) setAnoSeleccionado(new Set([String(presetAno)]));
      if (presetTipos && presetTipos.length > 0) setTipoComprobanteSeleccionado(new Set(presetTipos));
    }
  }, [isOpen, autoSelect, presetSucursal, presetMes, presetAno, presetTipos]);

  const handleExportExcel = async (mes, ano, idSucursal, tipoComprobanteArr) => {
    setIsExporting(true);
    try {
      const tipoComprobante = tipoComprobanteArr.join(",");
      let url = `/ reporte / registro_ventas_sunat ? mes = ${mes}& ano=${ano}& tipoComprobante=${tipoComprobante} `;
      if (idSucursal) {
        url += `& idSucursal=${idSucursal} `;
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

      const sucursalNombre = idSucursal
        ? sucursales.find(s => String(s.id) === String(idSucursal))?.nombre || 'Sucursal'
        : 'Todas';

      const fileName = `RegistroVentas_${sucursalNombre}_${mes} -${ano}.xlsx`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Archivo exportado correctamente");
      onOpenChange(false); // Close modal on success
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error("Error al exportar el archivo Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    const mes = Array.from(mesSeleccionado)[0];
    const ano = Array.from(anoSeleccionado)[0];
    const idSucursal = Array.from(sucursalSeleccionada)[0];
    const tipoComprobanteArr = Array.from(tipoComprobanteSeleccionado);

    if (!mes || !ano || !idSucursal || tipoComprobanteArr.length === 0) {
      toast.error("Por favor, complete todos los campos requeridos");
      return;
    }

    handleExportExcel(mes, ano, idSucursal, tipoComprobanteArr);
  };

  return (
    <>
      <Button
        color="success"
        variant="flat"
        startContent={<ExcelIcon className="text-emerald-600 dark:text-emerald-400" />}
        onPress={onOpen}
        className="font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
        {...props}
      >
        {buttonText}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        classNames={{
          base: "bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800",
          header: "border-b border-slate-100 dark:border-zinc-800",
          footer: "border-t border-slate-100 dark:border-zinc-800",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">Exportar Registro de Ventas</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Seleccione los parámetros para generar el reporte Excel</span>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <Select
                    label="Sucursal"
                    placeholder="Seleccione sucursal"
                    selectedKeys={sucursalSeleccionada}
                    onSelectionChange={setSucursalSeleccionada}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      trigger: "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700",
                    }}
                  >
                    {(sucursales || []).map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Mes"
                      placeholder="Mes"
                      selectedKeys={mesSeleccionado}
                      onSelectionChange={setMesSeleccionado}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{
                        trigger: "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700",
                      }}
                    >
                      {MONTHS.map(({ value, name }) => (
                        <SelectItem key={value} value={value}>
                          {name}
                        </SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Año"
                      placeholder="Año"
                      selectedKeys={anoSeleccionado}
                      onSelectionChange={setAnoSeleccionado}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{
                        trigger: "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700",
                      }}
                    >
                      {["2023", "2024", "2025"].map((ano) => (
                        <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="pt-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Tipo de Comprobante</span>
                    <CheckboxGroup
                      value={Array.from(tipoComprobanteSeleccionado)}
                      onValueChange={(val) => setTipoComprobanteSeleccionado(new Set(val))}
                      orientation="horizontal"
                      color="success"
                      classNames={{
                        wrapper: "gap-4"
                      }}
                    >
                      {COMPROBANTES.map((c) => (
                        <Checkbox key={c.value} value={c.value} classNames={{ label: "text-sm text-slate-600 dark:text-slate-400" }}>
                          {c.label}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="success"
                  onPress={handleExport}
                  isLoading={isExporting}
                  className="bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                >
                  {isExporting ? "Generando..." : "Descargar Excel"}
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