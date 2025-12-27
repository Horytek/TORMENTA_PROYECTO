import React, { useState } from "react";
import PropTypes from "prop-types";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Chip, Select, SelectItem } from "@heroui/react";
import { ProgressBar } from "@tremor/react";
import { TrendingUp, Archive, Package, DollarSign, ArrowRight, TrendingDown, Activity } from 'lucide-react';

function HistoricoTable({ transactions, previousTransactions, productoData = [] }) {
  const [collapsedTransaction, setCollapsedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ordenar transacciones por fecha descendente (más reciente primero)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    return dateB - dateA;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const toggleRow = (transaction) => {
    setCollapsedTransaction(collapsedTransaction === transaction ? null : transaction);
  };

  // Stock actual real desde inventario/productoData
  const stockInventario = Array.isArray(productoData) && productoData.length > 0
    ? Number(productoData[0].stock) || 0
    : 0;

  // Entradas y salidas del rango filtrado
  const entradasActual = sortedTransactions.reduce((acc, t) => acc + (parseFloat(t.entra) || 0), 0);
  const salidasActual = sortedTransactions.reduce((acc, t) => acc + (parseFloat(t.sale) || 0), 0);

  // Stock inicial antes del rango
  const stockPrev = Math.max(0, stockInventario + salidasActual - entradasActual);

  // Entradas y salidas históricas (acumulado antes del rango)
  const prev = previousTransactions?.[0] || {};
  const entradasPrev = Math.max(0, Number(prev.entra) || 0);
  const salidasPrev = Math.max(0, Number(prev.sale) || 0);

  // Solo ventas reales para cálculos financieros
  const transaccionesFinancieras = sortedTransactions.filter(
    t =>
      !(typeof t.documento === "string" && (t.documento.startsWith("I") || t.documento.startsWith("S"))) &&
      t.nombre !== "INGRESO" &&
      t.nombre !== "SALIDA" &&
      parseFloat(t.sale) > 0
  );

  // Precio unitario actual SOLO de ventas reales
  const precioUnitActual = (() => {
    const lastVenta = [...transaccionesFinancieras].reverse().find(t => t.precio);
    if (lastVenta) return Number(lastVenta.precio);
    if (transaccionesFinancieras.length > 0) return Number(transaccionesFinancieras[0].precio) || 0;
    return 0;
  })();

  // Valor total actual (stock actual * precio unitario)
  const valorTotalActual = Math.max(0, stockInventario * precioUnitActual);

  // Valor total histórico (stock inicial * precio unitario anterior)
  const precioUnitPrev = Number(prev.precio) || precioUnitActual;
  const valorTotalPrev = Math.max(0, stockPrev * precioUnitPrev);

  // Rotación (ventas/entradas en el rango)
  const rotacion = entradasActual > 0 ? (salidasActual / entradasActual) * 100 : 0;

  // Velocidad de venta y días para agotar stock
  const velocidadVenta = salidasActual > 0 && sortedTransactions.length > 0
    ? (salidasActual / sortedTransactions.length).toFixed(1)
    : "0";
  const diasParaAgotar = velocidadVenta > 0 ? Math.round(stockInventario / velocidadVenta) : "-";

  // Margen de ganancia
  const margenGanancia = rotacion;

  // Próximo pedido
  const proximoPedido = diasParaAgotar > 0 ? `En ${diasParaAgotar} días` : "Sin estimar";

  // Estado de stock
  let estadoStock = "Stock Medio";
  let estadoColor = "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-100 dark:border-fuchsia-800";
  let estadoMsg = "Inventario nivel medio.";
  if (stockInventario <= 5) {
    estadoStock = "Stock Bajo";
    estadoColor = "text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800";
    estadoMsg = "Inventario crítico.";
  } else if (stockInventario >= 30) {
    estadoStock = "Stock Alto";
    estadoColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800";
    estadoMsg = "Inventario suficiente.";
  }

  // Datos para el Card Financiero
  const totalIngresos = transaccionesFinancieras.reduce(
    (acc, t) => acc + ((parseFloat(t.sale) || 0) * (parseFloat(t.precio) || 0)),
    0
  );

  const inversionTotal = Math.max(0, entradasPrev * precioUnitPrev);
  let porcentajeCrecimiento = "0%";
  if (entradasPrev > 0) {
    porcentajeCrecimiento = `${(((entradasActual - entradasPrev) / entradasPrev) * 100).toFixed(1)}%`;
  } else if (entradasActual > 0) {
    porcentajeCrecimiento = `${(entradasActual * 100).toFixed(1)}%`;
  }

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Componente Reutilizable KPI Card
  const KpiCard = ({ title, icon: Icon, children, className }) => (
    <div className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
          {title}
        </h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 w-full pb-8">
      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Histórico */}
        <KpiCard title="Histórico" icon={Package}>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Entradas Acum.</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{entradasPrev}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Salidas Acum.</p>
              <p className="text-lg font-bold text-rose-500 dark:text-rose-400">{salidasPrev}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-zinc-300 font-medium">Rotación</span>
              <span className="font-bold">{rotacion.toFixed(1)}%</span>
            </div>
            <ProgressBar value={rotacion} color="indigo" className="h-1.5 rounded-full" />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Stock Inicial</span>
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">{stockPrev} unid.</span>
          </div>
        </KpiCard>

        {/* Actual */}
        <KpiCard title="Stock Actual" icon={Archive}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{stockInventario}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Unidades disponibles</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${estadoColor}`}>
              {estadoStock}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2.5 text-center border border-emerald-100 dark:border-emerald-900/20">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <TrendingUp size={14} /> +{entradasActual}
              </div>
              <p className="text-[10px] text-emerald-600/70 font-medium uppercase mt-0.5">Entradas</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg p-2.5 text-center border border-rose-100 dark:border-rose-900/20">
              <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <TrendingDown size={14} /> -{salidasActual}
              </div>
              <p className="text-[10px] text-rose-600/70 font-medium uppercase mt-0.5">Salidas</p>
            </div>
          </div>
        </KpiCard>

        {/* Financiero */}
        <KpiCard title="Financiero" icon={DollarSign}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Ingresos Totales</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">S/ {totalIngresos.toFixed(2)}</p>
            </div>
            <Chip size="sm" color="success" variant="flat" classNames={{ content: "font-bold text-xs" }}>
              {porcentajeCrecimiento}
            </Chip>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-zinc-800">
              <span className="text-slate-500">Valor Total (Stock)</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-200">S/ {valorTotalActual.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-slate-500">Velocidad</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{velocidadVenta} u/día</span>
            </div>
          </div>
          <div className="mt-3 text-right">
            <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded-full">
              {proximoPedido}
            </span>
          </div>
        </KpiCard>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 w-full items-start">
        {/* Tabla principal */}
        <div className={`transition-all duration-300 w-full ${collapsedTransaction ? 'xl:w-2/3' : 'xl:w-full'}`}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl overflow-hidden">

            {/* Header Styled */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 dark:text-zinc-200 text-sm uppercase tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-blue-500" />
                Transacciones
              </h3>
              <span className="text-xs text-slate-500">{sortedTransactions.length} registros</span>
            </div>

            <Table
              aria-label="Historico de Transacciones"
              removeWrapper
              classNames={{
                base: "max-h-[600px] overflow-y-auto",
                th: "bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase border-b border-slate-100 dark:border-zinc-800",
                td: "py-3 px-4 text-xs border-b border-slate-50 dark:border-zinc-800/50",
                tr: "hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20",
              }}
            >
              <TableHeader>
                {["Fecha", "Hora", "Documento", "Nombre", "Entra", "Sale", "Stock", "Precio", "Glosa"].map((header) => (
                  <TableColumn key={header}>{header}</TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={
                <div className="py-10 text-center text-slate-400">
                  <Package size={40} className="mx-auto mb-2 opacity-20" />
                  <p>No hay transacciones registradas en este rango.</p>
                </div>
              }>
                {paginatedTransactions.map((transaction, index) => (
                  <TableRow key={index} onClick={() => toggleRow(transaction)}>
                    {/* Fecha */}
                    <TableCell className="text-slate-700 dark:text-zinc-300 font-medium whitespace-nowrap">{transaction["fecha"] || "0"}</TableCell>
                    {/* Hora de creación */}
                    <TableCell className="text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {transaction["hora_creacion"]
                        ? new Date(`1970-01-01T${transaction["hora_creacion"]}`).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                        : "N/A"}
                    </TableCell>
                    {/* Resto de columnas */}
                    {["documento", "nombre", "entra", "sale", "stock", "precio", "glosa"].map((field) => (
                      <TableCell key={field} className="whitespace-nowrap">
                        {field === "entra" || field === "sale"
                          ? <span className={Number(transaction[field]) > 0 ? (field === "entra" ? "text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded" : "text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded") : "text-slate-300 dark:text-zinc-600"}>{transaction[field] || "0"}</span>
                          : <span className="text-slate-600 dark:text-zinc-400 max-w-[150px] truncate block" title={transaction[field]}>{transaction[field] || "-"}</span>
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación Standard Styled */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-3">
              <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={totalPages || 1}
                onChange={setCurrentPage}
                size="sm"
                variant="light"
                classNames={{
                  cursor: "bg-blue-600 text-white font-bold",
                }}
              />

              <Select
                selectedKeys={[`${itemsPerPage}`]}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Filas por página"
                size="sm"
                variant="flat"
                className="w-32"
                classNames={{
                  trigger: "bg-slate-50 dark:bg-zinc-800 border-none h-8 min-h-8",
                  value: "text-xs font-medium"
                }}
              >
                <SelectItem key="5" value={5}>5 filas</SelectItem>
                <SelectItem key="10" value={10}>10 filas</SelectItem>
                <SelectItem key="20" value={20}>20 filas</SelectItem>
                <SelectItem key="1000000" value={1000000}>Todo</SelectItem>
              </Select>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Detalles (Split View) */}
        {collapsedTransaction && (
          <div className="w-full xl:w-1/3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-xl overflow-hidden sticky top-4">
              <div className="bg-slate-50 dark:bg-zinc-800 p-4 border-b border-slate-200 dark:border-zinc-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ArrowRight size={16} className="text-blue-500" /> Detalle de Movimiento
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Documento: <span className="font-mono text-slate-700 dark:text-zinc-300">{collapsedTransaction.documento}</span>
                  </p>
                </div>
                <button onClick={() => setCollapsedTransaction(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                  &times;
                </button>
              </div>

              <div className="p-0">
                <Table
                  aria-label="Detalles de Productos"
                  removeWrapper
                  classNames={{
                    th: "bg-white dark:bg-zinc-900 text-slate-400 font-semibold text-[10px] uppercase tracking-wider",
                    td: "py-2 px-3 text-xs border-b border-slate-50 dark:border-zinc-800"
                  }}
                >
                  <TableHeader>
                    {["Código", "Descripción", "Cant."].map((header) => (
                      <TableColumn key={header}>{header}</TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody emptyContent={"No se encontró detalles."}>
                    {collapsedTransaction.productos && collapsedTransaction.productos.length > 0 ? (
                      collapsedTransaction.productos.map((producto, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-slate-500">{producto.codigo}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-slate-700 dark:text-zinc-200 font-medium truncate max-w-[120px]" title={producto.descripcion}>{producto.descripcion}</span>
                              <span className="text-[10px] text-slate-400">{producto.marca}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 dark:text-zinc-200">{producto.cantidad}</TableCell>
                        </TableRow>
                      ))
                    ) : null}
                  </TableBody>
                </Table>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800 text-center">
                <p className="text-[10px] text-slate-400">Fin del detalle</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

HistoricoTable.propTypes = {
  transactions: PropTypes.array.isRequired,
  previousTransactions: PropTypes.array,
  productoData: PropTypes.array,
};

export default HistoricoTable;