import { useState, useEffect, useCallback } from "react";
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { Card, CardHeader, CardBody, Chip, Button, Divider, Tooltip, Select, SelectItem } from "@heroui/react";
import { DateRangePicker } from "@nextui-org/date-picker";
import useAlmacenData from "../../data/data_almacen_kardex";
import { parseDate } from "@internationalized/date";
import { startOfWeek, endOfWeek } from "date-fns";
import { exportHtmlToPdf } from '@/utils/pdf/exportHtmlToPdf';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";

function HeaderHistorico({ productoData, onDateChange, transactions, previousTransactions, dateRange }) {
  const { almacenes } = useAlmacenData();
  const nombre = useUserStore(state => state.nombre);
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

  // Calcular el rango de la semana actual (lunes a domingo) según la fecha actual
  function getCurrentWeekRange() {
    const today = new Date();
    // Lunes como primer día de la semana
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    return {
      start: weekStart,
      end: weekEnd,
    };
  }

    // Inicializar el rango de fechas al rango de la semana actual
  const initialWeekRange = getCurrentWeekRange();

  const [selectedAlmacen, setSelectedAlmacen] = useState(almacenGlobal || "");
  const [selectedDates, setSelectedDates] = useState({
    startDate: initialWeekRange.start,
    endDate: initialWeekRange.end,
  });

  const [value, setValue] = useState({
    start: parseDate(initialWeekRange.start.toISOString().slice(0, 10)),
    end: parseDate(initialWeekRange.end.toISOString().slice(0, 10)),
  });

  const [empresaData, setEmpresaData] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        setEmpresaData(data);
        if (data?.logotipo && !data.logotipo.startsWith('data:image')) {
          const response = await fetch(data.logotipo);
          const blob = await response.blob();
          const reader = new window.FileReader();
          reader.onloadend = () => setLogoBase64(reader.result);
          reader.readAsDataURL(blob);
        } else {
          setLogoBase64(data?.logotipo || null);
        }
      } catch (error) {
        setEmpresaData(null);
        setLogoBase64(null);
      }
    };
    fetchEmpresa();
  }, []);

  useEffect(() => {
    if (almacenGlobal) {
      setSelectedAlmacen(almacenGlobal);
    }
    const formattedStartDate = selectedDates.startDate.toISOString().split("T")[0];
    const formattedEndDate = selectedDates.endDate.toISOString().split("T")[0];
    onDateChange(formattedStartDate, formattedEndDate, almacenGlobal || "");
  }, [onDateChange, selectedDates.startDate, selectedDates.endDate, almacenGlobal]);

  useEffect(() => {
    if (selectedAlmacen && selectedDates.startDate && selectedDates.endDate) {
      const formattedStartDate = selectedDates.startDate.toISOString().split("T")[0];
      const formattedEndDate = selectedDates.endDate.toISOString().split("T")[0];
      onDateChange(formattedStartDate, formattedEndDate, selectedAlmacen);
      setAlmacenGlobal(selectedAlmacen); // Actualiza el almacén global en Zustand
    }
  }, [selectedAlmacen, selectedDates.startDate, selectedDates.endDate, onDateChange, setAlmacenGlobal]);

  const handleAlmacenChange = useCallback((selectedId) => {
    setSelectedAlmacen(selectedId);
    setAlmacenGlobal(selectedId); // Actualiza el almacén global en Zustand
  }, [setAlmacenGlobal]);
  
  // ADAPTADO: Usa datos de empresa dinámicos
  const generatePDFKardex = (productoData, transactions, previousTransactions, dateRange) => {
    const empresaNombre = empresaData?.nombreComercial || 'TORMENTA JEANS';
    const empresaRazon = empresaData?.razonSocial || 'TEXTILES CREANDO MODA S.A.C.';
    const empresaDireccion = empresaData?.direccion || 'Cal San Martin 1573 Urb Urrunaga SC Tres';
    const empresaUbicacion = `${empresaData?.distrito || 'Chiclayo'} - ${empresaData?.provincia || 'Chiclayo'} - ${empresaData?.departamento || 'Lambayeque'}`;
    const empresaTelefono = empresaData?.telefono || '918378590';
    const empresaEmail = empresaData?.email || 'textiles.creando.moda.sac@gmail.com';
    const empresaRuc = empresaData?.ruc || '20610588981';

    const htmlContent = `
    <div class="p-5 text-sm leading-6 font-sans w-full">
        <div class="flex justify-between items-center mb-3">
                <div class='flex'>
                    <div class="Logo-compro">
                        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo-comprobante" />` : ''}
                    </div>
                    <div class="text-start ml-8">
                        <h1 class="text-xl font-extrabold leading-snug text-blue-800">${empresaNombre}</h1>
                        <p class="font-semibold leading-snug text-gray-700">${empresaRazon}</p>
                        <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">Central:</span> ${empresaDireccion}</p>
                        <p class="leading-snug text-gray-600">${empresaUbicacion}</p>
                        <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">TELF:</span> ${empresaTelefono}</p>
                        <p class="leading-snug text-gray-600"><span class="font-bold text-gray-800">EMAIL:</span> ${empresaEmail}</p>
                    </div>
                </div>
            </div>

            <div class="container-datos-compro bg-white rounded-lg mb-6 ">
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="space-y-2">
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">HISTÓRICO</span> <span class="font-semibold text-gray-600"></span>
                    </p>
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">RUC:</span> <span class="font-semibold text-gray-600">${empresaRuc}</span>
                    </p>
                </div>
            </div>
        </div>
        <!-- Información del Producto -->
        <div class="container-datos-compro bg-white rounded-lg mb-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="space-y-2">
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">Producto:</span> <span class="font-semibold text-gray-600">${productoData[0].descripcion}</span>
                    </p>
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">Marca:</span> <span class="font-semibold text-gray-600">${productoData[0].marca}</span>
                    </p>
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">Stock actual:</span> <span class="font-semibold text-gray-600">${productoData[0].stock}</span>
                    </p>
                    <p class="text-sm font-semibold text-gray-800">
                        <span class="font-bold text-gray-900">Fecha:</span> <span class="font-semibold text-gray-600">${dateRange.fechaInicio} - ${dateRange.fechaFin}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Información de Transacciones Anteriores -->
        <div class="mb-6">
        <p class="text-sm font-semibold text-gray-800">
                <span class="font-bold text-gray-900">TRANSACCIÓN ANTERIORES</span> 
            </p>
            <p class="text-sm font-semibold text-gray-800">
                <span class="font-bold text-gray-900">Entra:</span> ${previousTransactions[0].entra} 
            </p>
            <p class="text-sm font-semibold text-gray-800">
                <span class="font-bold text-gray-900">Sale:</span> ${previousTransactions[0].sale}
            </p>
            <p class="text-sm font-semibold text-gray-800">
                <span class="font-bold text-gray-900">Stock:</span> ${previousTransactions[0].entra - previousTransactions[0].sale}
            </p>
        </div>

        <!-- Tabla de Transacciones Actuales -->
        <table class="w-full border-collapse mb-6 bg-white shadow-md rounded-lg overflow-hidden">
            <thead class="bg-blue-200 text-blue-800">
                <tr>
                    <th class="border-b p-3 text-center">Fecha</th>
                    <th class="border-b p-3 text-center">Documento</th>
                    <th class="border-b p-3 text-center">Nombre</th>
                    <th class="border-b p-3 text-center">Entra</th>
                    <th class="border-b p-3 text-center">Sale</th>
                    <th class="border-b p-3 text-center">Stock</th>
                    <th class="border-b p-3 text-center">Precio</th>
                    <th class="border-b p-3 text-center">Glosa</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(item => 
                `<tr class="bg-gray-50 hover:bg-gray-100">
                    <td class="border-b p-2 text-center">${new Date(item.fecha).toLocaleDateString()}</td>
                    <td class="border-b p-2 text-center">${item.documento}</td>
                    <td class="border-b p-2 text-center">${item.nombre}</td>
                    <td class="border-b p-2 text-center">${item.entra || 0}</td>
                    <td class="border-b p-2 text-center">${item.sale || 0}</td>
                    <td class="border-b p-2 text-center">${item.stock}</td>
                    <td class="border-b p-2 text-center">${item.precio}</td>
                    <td class="border-b p-2 text-center whitespace-pre-wrap">${item.glosa}</td>
                </tr>`
                ).join('')}
            </tbody>
        </table>
    </div>
    `;

    const options = {
      filename: `kardex_movimientos.pdf`,
      onInstance: (inst) => {
        inst.toPdf().get('pdf').then(pdf => {
          const total = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
              pdf.setPage(i);
              pdf.setFontSize(8);
              pdf.text(
                `Página ${i} de ${total}`,
                pdf.internal.pageSize.getWidth() - 20,
                pdf.internal.pageSize.getHeight() - 10
              );
            }
        });
      }
    };
    exportHtmlToPdf(htmlContent, `kardex_movimientos.pdf`, options);
  };

  const handleGeneratePDFKardex = () => {
    generatePDFKardex(productoData, transactions, previousTransactions, dateRange);
  };

  const handleDateChange = (newValue) => {
    if (newValue.start && newValue.end) {
      const newStartDate = new Date(newValue.start.year, newValue.start.month - 1, newValue.start.day);
      const newEndDate = new Date(newValue.end.year, newValue.end.month - 1, newValue.end.day);
      setValue(newValue);
      setSelectedDates({
        startDate: newStartDate,
        endDate: newEndDate,
      });
    }
  };

return (
    <Card className="relative overflow-hidden rounded-2xl border-1 shadow-xl bg-white dark:bg-zinc-900 transition-all mb-4">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 dark:from-blue-900/40 dark:to-cyan-900/20 rounded-t-2xl">
        <div className="flex items-center gap-4">
          {logoBase64 && (
            <img
              src={logoBase64}
              alt="Logo empresa"
              className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
              style={{ background: "#fff" }}
            />
          )}
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{empresaData?.nombreComercial || "TORMENTA JEANS"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{empresaData?.razonSocial || "TEXTILES CREANDO MODA S.A.C."}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{empresaData?.direccion || "Cal San Martin 1573 Urb Urrunaga SC Tres"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{empresaData?.distrito || "Chiclayo"} - {empresaData?.provincia || "Chiclayo"} - {empresaData?.departamento || "Lambayeque"}</p>
            <div className="flex gap-2 mt-1">
              <Chip color="primary" variant="flat" className="font-bold text-xs px-2 py-0.5">
                RUC: {empresaData?.ruc || "20610588981"}
              </Chip>
              <Chip color="default" variant="flat" className="font-bold text-xs px-2 py-0.5">
                {empresaData?.telefono || "918378590"}
              </Chip>
              <Chip color="default" variant="flat" className="font-bold text-xs px-2 py-0.5">
                {empresaData?.email || "textiles.creando.moda.sac@gmail.com"}
              </Chip>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Button onClick={handleGeneratePDFKardex} color="primary" variant="flat" startContent={<MdOutlineLocalPrintshop className="inline-block text-lg" />}>
            Guardar PDF
          </Button>
          <Select
            selectedKeys={[selectedAlmacen]}
            onSelectionChange={(keys) => handleAlmacenChange([...keys][0])}
            disabled={almacenes.length === 0}
            className="w-60"
            classNames={{
              trigger: "bg-white",
              value: "text-black",
            }}
          >
            {almacenes.map((almacen) => (
              <SelectItem key={almacen.id} value={almacen.id}>
                {almacen.almacen}
              </SelectItem>
            ))}
          </Select>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-gray-700">
            Producto: {productoData.length > 0 ? `${productoData[0].descripcion} - ${productoData[0].marca}` : "Producto no registrado en el almacén seleccionado."}
          </p>
          <p className="text-gray-700">
            COD: {productoData.length > 0 ? productoData[0].codigo : "Cargando..."} / 
            Stock Actual: {productoData.length > 0 ? productoData[0].stock : "Cargando..."} UND / 
            Marca: {productoData.length > 0 ? productoData[0].marca : "Cargando..."}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <h6 className="font-bold mb-0">Fecha:</h6>
          <DateRangePicker
            className="w-64"
            classNames={{ inputWrapper: "bg-white" }}
            value={value}
            onChange={handleDateChange}
          />
        </div>
      </CardBody>
    </Card>
  );
}

export default HeaderHistorico;