import { useState, useEffect, useRef } from 'react';
import TablaNotasAlmacen from './components/NotaAlmacenTable';
import { getNotasIngreso } from '@/services/notaIngreso.services';
import { getNotasSalida } from '@/services/notaSalida.services';
import { useAlmacenesIngreso } from '@/hooks/useNotaIngreso';
import FiltrosAlmacen from './components/FiltrosAlmacen';
import { Tabs, Tab, Button, Card, CardBody, Chip } from "@heroui/react";
import { RoutePermission } from '@/routes';
import { useUserStore } from "@/store/useStore";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { ArrowUpCircle, ArrowDownCircle, Package, Archive } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Nota_Almacen = () => {
    const [filtersIngreso, setFiltersIngreso] = useState({});
    const [filtersSalida, setFiltersSalida] = useState({});
    const [ingresos, setIngresos] = useState([]);
    const [salidas, setSalidas] = useState([]);
    const { almacenes } = useAlmacenesIngreso();
    const almacenGlobal = useUserStore((state) => state.almacen);
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
    const [tabActiva, setTabActiva] = useState("ingreso");

    // Initial Load State
    const [isInitialLoadingIngresos, setIsInitialLoadingIngresos] = useState(true);
    const [isInitialLoadingSalidas, setIsInitialLoadingSalidas] = useState(true);

    const tablaSalidaRef = useRef(null);

    // Initial Data Fetch
    const fetchIngresos = async () => {
        const result = await getNotasIngreso({ ...filtersIngreso, almacen: filtersIngreso.almacen || undefined });
        setIngresos(result.data || []);
        setIsInitialLoadingIngresos(false);
    };

    const fetchSalidas = async () => {
        const result = await getNotasSalida(filtersSalida);
        setSalidas(result.data || []);
        setIsInitialLoadingSalidas(false);
    };

    useEffect(() => {
        if (isInitialLoadingIngresos) fetchIngresos();
    }, []);

    useEffect(() => {
        if (tabActiva === "salida" && isInitialLoadingSalidas) fetchSalidas();
    }, [tabActiva]);

    // Warehouse Selection Sync
    useEffect(() => {
        if (almacenGlobal && almacenes.length > 0) {
            const match = almacenes.find(a => a.id === parseInt(almacenGlobal));
            if (match) setAlmacenSeleccionado(match);
        }
    }, [almacenes, almacenGlobal]);

    const handleAlmacenChange = (almacen) => {
        setAlmacenSeleccionado(almacen || null);
        const id = almacen ? almacen.id : '%';
        setFiltersIngreso(prev => ({ ...prev, almacen: id }));
        setFiltersSalida(prev => ({ ...prev, almacen: id }));
    };

    const handleFiltersChange = (newFilters) => {
        if (tabActiva === "ingreso") {
            const nf = { ...newFilters, almacen: newFilters.almacen || '%' };
            if (JSON.stringify(filtersIngreso) !== JSON.stringify(nf)) {
                setFiltersIngreso(nf);
                getNotasIngreso({ ...nf, almacen: nf.almacen || undefined }).then(res => setIngresos(res.data || []));
            }
        } else {
            if (JSON.stringify(filtersSalida) !== JSON.stringify(newFilters)) {
                setFiltersSalida(newFilters);
                getNotasSalida(newFilters).then(res => setSalidas(res.data || []));
            }
        }
    };

    const handleRefresh = () => {
        if (tabActiva === "ingreso") {
            getNotasIngreso({ ...filtersIngreso, almacen: filtersIngreso.almacen || undefined }).then(res => setIngresos(res.data || []));
        } else {
            getNotasSalida(filtersSalida).then(res => setSalidas(res.data || []));
        }
    };

    const handleNotaAnulada = (notaId) => {
        if (tabActiva === "ingreso") {
            setIngresos(prev => prev.map(i => i.id === notaId ? { ...i, estado: 0 } : i));
        } else {
            setSalidas(prev => prev.map(s => s.id === notaId ? { ...s, estado: 0 } : s));
        }
    };

    // Export Logic
    const handleExportExcel = () => {
        const data = tabActiva === 'ingreso' ? ingresos : salidas;
        const filename = tabActiva === 'ingreso' ? 'Reporte_Ingresos.xlsx' : 'Reporte_Salidas.xlsx';

        const exportData = data.map(item => ({
            ID: item.id,
            Fecha: item.fecha,
            Documento: item.documento,
            Referencia: item.proveedor || item.destino || '-',
            Almacen_Origen: item.almacen_O || '-',
            Almacen_Destino: item.almacen_D || '-',
            Estado: item.estado === 1 ? 'Anulado' : 'Activo',
            Usuario: item.usuario || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const title = tabActiva === 'ingreso' ? 'Reporte de Ingresos de Almacén' : 'Reporte de Salidas de Almacén';

        doc.setFontSize(16);
        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

        const data = tabActiva === 'ingreso' ? ingresos : salidas;

        const tableColumn = ["Fecha", "Documento", "Ref.", "Origen", "Destino", "Est.", "Usuario"];
        const tableRows = data.map(item => [
            item.fecha,
            item.documento,
            (item.proveedor || item.destino || '-').substring(0, 15),
            (item.almacen_O || '-').substring(0, 10),
            (item.almacen_D || '-').substring(0, 10),
            item.estado === 1 ? 'ANUL' : 'ACT',
            item.usuario || '-'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 163, 74] }
        });

        doc.save(tabActiva === 'ingreso' ? 'reporte_ingresos.pdf' : 'reporte_salidas.pdf');
    };

    // Stats
    const totalIngresos = ingresos.length;
    const totalSalidas = salidas.length;

    // Clean White Classes
    const cardClass = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl";

    // KPI Card Component
    const KpiCard = ({ title, value, icon: Icon, colorClass }) => (
        <Card className={`${cardClass} border-none shadow-sm`}>
            <CardBody className="flex flex-row items-center gap-4 p-4">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                    <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('/10', '')} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter">
            <div className="max-w-[1920px] mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">
                            Nota de Almacén
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                            Control de movimientos, entradas y salidas de inventario.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            color="success"
                            variant="flat"
                            className="bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                            startContent={<FaFileExcel size={18} />}
                            onPress={handleExportExcel}
                        >
                            Exportar Excel
                        </Button>
                        <Button
                            color="danger"
                            variant="flat"
                            className="bg-rose-50 text-rose-600 font-bold border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                            startContent={<FaFilePdf size={18} />}
                            onPress={handleExportPDF}
                        >
                            Exportar PDF
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Entradas"
                        value={totalIngresos}
                        icon={ArrowDownCircle}
                        colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <KpiCard
                        title="Total Salidas"
                        value={totalSalidas}
                        icon={ArrowUpCircle}
                        colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                    />
                    <KpiCard
                        title="Almacén Actual"
                        value={almacenSeleccionado?.sucursal || "Global"}
                        icon={Package}
                        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <KpiCard
                        title="Total Registros"
                        value={totalIngresos + totalSalidas}
                        icon={Archive}
                        colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    />
                </div>

                {/* Main Content */}
                <div className="space-y-4">
                    <Tabs
                        aria-label="Movimientos"
                        selectedKey={tabActiva}
                        onSelectionChange={setTabActiva}
                        variant="light"
                        classNames={{
                            base: "mb-4 w-full max-w-2xl",
                            tabList: "bg-transparent p-0 gap-4",
                            cursor: "w-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-700",
                            tab: "h-10 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 data-[selected=true]:border-transparent transition-all",
                            tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-bold text-slate-500 font-medium"
                        }}
                    >
                        <Tab
                            key="ingreso"
                            title={
                                <div className="flex items-center gap-2">
                                    <ArrowDownCircle size={18} />
                                    <span>Entradas</span>
                                    <Chip size="sm" variant="flat" classNames={{ base: "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold h-5 min-w-5 px-0" }}>
                                        {ingresos.length}
                                    </Chip>
                                </div>
                            }
                        >
                            <div className="mt-4 space-y-5 bg-transparent">
                                <FiltrosAlmacen
                                    almacenes={almacenes}
                                    onFiltersChange={handleFiltersChange}
                                    onAlmacenChange={handleAlmacenChange}
                                    onRefresh={handleRefresh}
                                    ingresos={ingresos}
                                    almacenSseleccionado={almacenSeleccionado}
                                    tipo="ingreso"
                                />
                                <RoutePermission idModulo={10} idSubmodulo={10}>
                                    <TablaNotasAlmacen
                                        registros={ingresos}
                                        tipo="ingreso"
                                        onNotaAnulada={handleNotaAnulada}
                                    />
                                </RoutePermission>
                            </div>
                        </Tab>
                        <Tab
                            key="salida"
                            title={
                                <div className="flex items-center gap-2">
                                    <ArrowUpCircle size={18} />
                                    <span>Salidas</span>
                                    <Chip size="sm" variant="flat" classNames={{ base: "bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold h-5 min-w-5 px-0" }}>
                                        {salidas.length}
                                    </Chip>
                                </div>
                            }
                        >
                            <div className="mt-4 space-y-5 bg-transparent">
                                <FiltrosAlmacen
                                    almacenes={almacenes}
                                    onFiltersChange={handleFiltersChange}
                                    onAlmacenChange={handleAlmacenChange}
                                    onRefresh={handleRefresh}
                                    ingresos={salidas}
                                    almacenSseleccionado={almacenSeleccionado}
                                    tipo="salida"
                                />
                                <TablaNotasAlmacen
                                    ref={tablaSalidaRef}
                                    registros={salidas}
                                    tipo="salida"
                                    onNotaAnulada={handleNotaAnulada}
                                />
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Nota_Almacen;
