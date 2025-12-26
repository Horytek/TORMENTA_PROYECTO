import React, { useState } from "react";
import PropTypes from "prop-types";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardHeader, CardBody, Pagination, Chip, Select, SelectItem, Divider } from "@heroui/react";
import { ProgressBar } from "@tremor/react";
import { TrendingUp, Archive, Package, DollarSign } from 'lucide-react';

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
  let estadoColor = "bg-fuchsia-500";
  let estadoMsg = "El inventario está en un nivel medio. Considera programar un nuevo pedido pronto.";
  if (stockInventario <= 5) {
    estadoStock = "Stock Bajo";
    estadoColor = "bg-rose-500";
    estadoMsg = "El inventario es bajo. Es recomendable realizar un pedido.";
  } else if (stockInventario >= 30) {
    estadoStock = "Stock Alto";
    estadoColor = "bg-emerald-500";
    estadoMsg = "Inventario suficiente para la demanda actual.";
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

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Contenedor de Cards en una fila */}
      <div className="flex flex-wrap gap-6">
        {/* Card Histórico */}
        <Card className="relative rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 min-w-[340px] max-w-[420px] flex-1 p-0">
          <CardHeader className="flex items-center gap-3 mb-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-zinc-700">
            <Chip color="primary" variant="flat" className="font-bold text-base px-2 py-1 bg-cyan-50 text-cyan-700 flex items-center gap-2">
              HISTÓRICO
            </Chip>
          </CardHeader>
          <CardBody className="p-4">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <Package className="w-5 h-5 text-blue-400" /> Transacciones Anteriores
            </h2>
            <p className="text-gray-500 text-sm mb-4">{prev.numero || 0} documento(s)</p>
            <div className="flex gap-4 mb-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 flex-1 p-3 items-center flex flex-col shadow-none border-none">
                <span className="text-blue-600 dark:text-blue-300 font-bold text-2xl">{entradasPrev}</span>
                <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold">ENTRADAS</span>
                <span className="text-[10px] text-blue-400 dark:text-blue-500">Total acumulado</span>
              </Card>
              <Card className="bg-pink-50 dark:bg-pink-900/20 flex-1 p-3 items-center flex flex-col shadow-none border-none">
                <span className="text-pink-600 dark:text-pink-300 font-bold text-2xl">{salidasPrev}</span>
                <span className="text-xs text-pink-700 dark:text-pink-400 font-semibold">SALIDAS</span>
                <span className="text-[10px] text-pink-400 dark:text-pink-500">Total vendido</span>
              </Card>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Rotación de Inventario</span>
                <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">{rotacion.toFixed(1)}%</span>
              </div>
              <div className="w-full mb-1">
                <ProgressBar value={rotacion} color="fuchsia" className="h-2 rounded-full" />
              </div>
              <span className="text-[10px] text-gray-400">Relación entre ventas y compras</span>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between items-end mt-2">
              <div>
                <span className="block text-xs text-gray-500">Stock Inicial</span>
                <span className="text-xl font-bold text-gray-800 dark:text-zinc-200">{stockPrev} unid.</span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500">Valor Total</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">S/ {valorTotalPrev.toFixed(2)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card Actual */}
        <Card className="relative rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 min-w-[340px] max-w-[420px] flex-1 p-0">
          <CardHeader className="flex items-center gap-3 mb-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-zinc-700">
            <Chip color="secondary" variant="flat" className="font-bold text-base px-2 py-1 bg-fuchsia-50 text-fuchsia-600 flex items-center gap-2">
              ACTUAL
            </Chip>
          </CardHeader>
          <CardBody className="p-4">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <Archive className="w-5 h-5 text-fuchsia-400" /> Stock Actual
            </h2>
            <div className="bg-gradient-to-r from-fuchsia-50 to-blue-50 dark:from-fuchsia-900/10 dark:to-blue-900/10 rounded-xl p-4 mb-4 flex items-center justify-between border border-blue-50 dark:border-zinc-800">
              <div>
                <span className="block text-xs text-gray-500 dark:text-zinc-400">Disponible</span>
                <span className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400">{stockInventario}</span>
              </div>
              <Chip className={`text-xs font-bold px-3 py-1 ml-2 ${estadoColor} text-white border-none`} variant="solid" size="sm">
                {estadoStock}
              </Chip>
              <div className="text-right ml-4">
                <span className="block text-xs text-gray-500 dark:text-zinc-400">P. Unit</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {precioUnitActual.toFixed(2)}</span>
                <span className="block text-xs text-gray-500 dark:text-zinc-400 mt-1">Total</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {valorTotalActual.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <Card className="bg-blue-500 dark:bg-blue-600 flex-1 p-3 items-center flex flex-col shadow-none border-none text-white">
                <span className="font-bold text-2xl">+{entradasActual < 0 ? 0 : entradasActual}</span>
                <span className="text-xs font-semibold opacity-90">ENTRADAS</span>
                <span className="text-[10px] opacity-75">Este período</span>
              </Card>
              <Card className="bg-pink-500 dark:bg-pink-600 flex-1 p-3 items-center flex flex-col shadow-none border-none text-white">
                <span className="font-bold text-2xl">-{salidasActual < 0 ? 0 : salidasActual}</span>
                <span className="text-xs font-semibold opacity-90">SALIDAS</span>
                <span className="text-[10px] opacity-75">Este período</span>
              </Card>
            </div>
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-lg p-3 mt-2 shadow-none">
              <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <i className="fas fa-exclamation-circle" /> Estado
              </span>
              <span className="block text-amber-700 dark:text-amber-500 text-[10px] mt-1 pr-2">{estadoMsg}</span>
            </Card>
          </CardBody>
        </Card>

        {/* Card Financiero */}
        <Card className="relative rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 min-w-[340px] max-w-[420px] flex-1 p-0">
          <CardHeader className="flex items-center gap-3 mb-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-zinc-700">
            <Chip color="success" variant="flat" className="font-bold text-base px-2 py-1 bg-emerald-50 text-emerald-700 flex items-center gap-2">
              FINANCIERO
            </Chip>
          </CardHeader>
          <CardBody className="p-4">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Rendimiento
            </h2>
            <div className="bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl p-4 mb-4 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Ingresos Totals</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">S/ {totalIngresos.toFixed(2)}</span>
                </div>
                <Chip color="success" variant="flat" className="font-bold text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 border-none">
                  {porcentajeCrecimiento}
                </Chip>
              </div>
              <span className="block text-[10px] text-emerald-700 dark:text-emerald-500 mt-1">Basado en {salidasActual < 0 ? 0 : salidasActual} unidades vendidas</span>
            </div>
            <div className="flex gap-2 mb-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 flex-1 p-2 items-center flex flex-col shadow-none border-none">
                <span className="text-blue-700 dark:text-blue-300 font-bold text-base">S/ {inversionTotal.toFixed(2)}</span>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">INVERSIÓN</span>
                <span className="text-[9px] text-blue-400 dark:text-blue-500">{entradasPrev} unid.</span>
              </Card>
              <Card className="bg-fuchsia-50 dark:bg-fuchsia-900/20 flex-1 p-2 items-center flex flex-col shadow-none border-none">
                <span className="text-fuchsia-700 dark:text-fuchsia-300 font-bold text-base">S/ {valorTotalActual.toFixed(2)}</span>
                <span className="text-[10px] text-fuchsia-700 dark:text-fuchsia-400 font-semibold">EN STOCK</span>
                <span className="text-[9px] text-fuchsia-400 dark:text-fuchsia-500">{stockInventario} unid.</span>
              </Card>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Velocidad</span>
                <Chip color="secondary" variant="flat" className="font-bold text-[10px] px-2 py-0 bg-fuchsia-100 text-fuchsia-700 border-none">
                  {velocidadVenta} u/día
                </Chip>
              </div>
              <ProgressBar value={Math.min((stockInventario / (velocidadVenta > 0 ? velocidadVenta * 7 : 1)) * 100, 100)} color="emerald" className="h-1.5 rounded-full" />
              <span className="text-[10px] text-gray-400">Estimado: {diasParaAgotar !== "-" ? `${diasParaAgotar} días para agotar` : "Sin estimar"}</span>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between items-end mt-2">
              <div>
                <span className="block text-xs text-gray-500">Margen</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{margenGanancia.toFixed(1)}%</span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500">Próximo Pedido</span>
                <Chip color="default" variant="flat" className="font-bold text-[10px] px-2 py-0 bg-gray-100 text-gray-700 border-none">
                  {proximoPedido}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex w-full">
        {/* Tabla principal ocupando toda la pantalla */}
        <div className={`rounded-xl transition-all border border-blue-200 dark:border-zinc-800 overflow-hidden ${collapsedTransaction ? 'w-2/3' : 'w-full'}`}>
          <Table
            aria-label="Historico de Transacciones"
            classNames={{
              wrapper: "rounded-none shadow-none bg-white dark:bg-[#18192b]",
              th: "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold text-xs"
            }}
          >
            <TableHeader>
              {["Fecha", "Hora", "Documento", "Nombre", "Entra", "Sale", "Stock", "Precio", "Glosa"].map((header) => (
                <TableColumn key={header}>{header}</TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent={"No hay transacciones registradas."}>
              {paginatedTransactions.map((transaction, index) => (
                <TableRow key={index} onClick={() => toggleRow(transaction)} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  {/* Fecha */}
                  <TableCell className="text-xs font-medium">{transaction["fecha"] || "0"}</TableCell>
                  {/* Hora de creación */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {transaction["hora_creacion"]
                      ? new Date(`1970-01-01T${transaction["hora_creacion"]}`).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })
                      : "N/A"}
                  </TableCell>
                  {/* Resto de columnas */}
                  {["documento", "nombre", "entra", "sale", "stock", "precio", "glosa"].map((field) => (
                    <TableCell className="text-xs" key={field}>
                      {field === "entra" || field === "sale"
                        ? <span className={Number(transaction[field]) > 0 ? (field === "entra" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold") : "text-gray-400"}>{transaction[field] || "0"}</span>
                        : transaction[field] || "0"
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          <div className="p-4 flex justify-between bg-white dark:bg-[#18192b] border-t border-gray-100 dark:border-zinc-800">
            <Pagination
              showControls
              color="primary"
              page={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              size="sm"
              variant="light"
            />

            <Select
              id="itemsPerPage"
              className="w-24"
              selectedKeys={[`${itemsPerPage}`]}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Filas por página"
              size="sm"
              variant="bordered"
              classNames={{
                trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
              }}
            >
              <SelectItem key="5" value={5}>05</SelectItem>
              <SelectItem key="10" value={10}>10</SelectItem>
              <SelectItem key="20" value={20}>20</SelectItem>
              <SelectItem key="1000000" value={1000000}>Todos</SelectItem>
            </Select>
          </div>
        </div>

        {/* Tabla de productos a la derecha */}
        {collapsedTransaction && (
          <div className="w-1/3 ml-4 bg-white dark:bg-[#18192b] border border-blue-200 dark:border-zinc-700 p-0 rounded-xl shadow-sm transition-all overflow-hidden h-fit">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 border-b border-blue-100 dark:border-zinc-700">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">Detalles de Productos</h3>
            </div>
            <Table
              aria-label="Detalles de Productos"
              classNames={{
                wrapper: "shadow-none rounded-none bg-transparent",
                th: "bg-gray-50 dark:bg-zinc-800 text-xs"
              }}
            >
              <TableHeader>
                {["Código", "Descripción", "Marca", "Cantidad"].map((header) => (
                  <TableColumn key={header}>{header}</TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent={"No se encontró detalles de la transacción."}>
                {collapsedTransaction.productos && collapsedTransaction.productos.length > 0 ? (
                  collapsedTransaction.productos.map((producto, idx) => (
                    <TableRow key={idx}>
                      {["codigo", "descripcion", "marca", "cantidad"].map((field) => (
                        <TableCell className="text-xs" key={field}>{producto[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>
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