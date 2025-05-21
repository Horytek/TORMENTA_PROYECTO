import React from "react";
import { Card, CardHeader, CardBody, Divider, Chip, Progress } from "@heroui/react";
import useVentasData from "../data/data_soles";
import useTotalProductosVendidos from "../data/data_prod";
import useProductoTop from "../data/data_top";
import useVentasSucursal from "../data/data_ventas_sucursal";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
  DollarSign,
  Store,
} from "lucide-react";

const SalesCard = ({
  idSucursal,
  periodoTexto = "vs. mes anterior",
  year,
  month,
  week,
}) => {
  // Ganancias
  const { totalRecaudado, totalAnterior: totalGananciasAnterior, porcentaje: porcentajeGanancias } =
    useVentasData(idSucursal, year, month, week);

  // Productos vendidos
  const {
    totalProductosVendidos,
    totalAnterior: totalProductosAnterior,
    porcentaje: porcentajeProductos,
    subcategorias,
  } = useTotalProductosVendidos(idSucursal, year, month, week);

  // Producto más vendido
  const { productoTop } = useProductoTop(idSucursal, year, month, week);

  // Sucursal con mayor rendimiento
  const { data: sucursalTop } = useVentasSucursal(year, month, week);

  return (
    <div className="flex flex-row flex-wrap gap-6 px-4 py-6">
      {/* Total de Ganancias */}
      <Card className="flex-1 min-w-[280px] max-w-[400px]">
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-medium">Total de Ganancias</p>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-2xl font-bold">S/. {totalRecaudado || "0.00"}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Chip
              color={porcentajeGanancias >= 0 ? "success" : "danger"}
              className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
            >
              <span className="flex items-center">
                {porcentajeGanancias >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                )}
                {porcentajeGanancias > 0 ? "+" : ""}
                {porcentajeGanancias || 0}%
              </span>
            </Chip>
            <p className="text-xs text-muted-foreground">{periodoTexto}</p>
          </div>
<div className="mt-3">
  {(() => {
    let meta = 0;
    let metaLabel = "";
    const diasMes = month && year ? new Date(year, month, 0).getDate() : 30;
if (week && week !== "all") {
  metaLabel = "Meta semanal";
  meta = totalGananciasAnterior && totalGananciasAnterior > 0 && diasMes
    ? Math.round((totalGananciasAnterior / diasMes) * 7)
    : 6000;
} else if (month) {
  metaLabel = "Meta mensual";
  meta = totalGananciasAnterior && totalGananciasAnterior > 0
    ? totalGananciasAnterior
    : 18000;
} else {
  metaLabel = "Meta anual";
  meta = totalGananciasAnterior && totalGananciasAnterior > 0
    ? totalGananciasAnterior
    : 1000000;
}
    const porcentajeMeta = meta > 0 ? Math.min((totalRecaudado / meta) * 100, 100) : 0;
    return (
      <>
        <div className="flex items-center justify-between text-xs mb-1">
          <span>{metaLabel}: S/. {meta}</span>
          <span className="font-medium">
            {porcentajeMeta.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={porcentajeMeta}
          className="h-1.5"
          color="primary"
        />
      </>
    );
  })()}
</div>
        </CardBody>
      </Card>

      {/* Total de Productos Vendidos */}
      <Card className="flex-1 min-w-[280px] max-w-[400px]">
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-medium">Total de Productos Vendidos</p>
          <Package className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-2xl font-bold">{totalProductosVendidos || "0"}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Chip
              color={porcentajeProductos >= 0 ? "success" : "danger"}
              className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
            >
              {porcentajeProductos >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
              )}
              {porcentajeProductos > 0 ? "+" : ""}
              {porcentajeProductos || 0}%
            </Chip>
            <p className="text-xs text-muted-foreground">{periodoTexto}</p>
          </div>
           <div className="mt-3">
      {/* Predicción dinámica de meta */}
      {(() => {
        // Predicción de meta según filtro
        let meta = 0;
        let metaLabel = "";
        const diasMes = month && year ? new Date(year, month, 0).getDate() : 30;
        if (week && week !== "all") {
          // Meta semanal: promedio diario del mes anterior * 7
          metaLabel = "Meta semanal";
          meta = totalProductosAnterior && diasMes
            ? Math.round((totalProductosAnterior / diasMes) * 7)
            : 400;
        } else if (month) {
          // Meta mensual: igual al mes anterior o promedio diario * días del mes actual
          metaLabel = "Meta mensual";
          meta = totalProductosAnterior
            ? totalProductosAnterior
            : 1700;
        } else {
          // Meta anual: igual al año anterior
          metaLabel = "Meta anual";
          meta = totalProductosAnterior
            ? totalProductosAnterior
            : 50000;
        }
        const porcentajeMeta = meta > 0 ? Math.min((totalProductosVendidos / meta) * 100, 100) : 0;
        return (
          <>
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{metaLabel}: {meta}</span>
              <span className="font-medium">
                {porcentajeMeta.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={porcentajeMeta}
              className="h-1.5"
              color="primary"
            />
          </>
        );
      })()}
    </div>
        </CardBody>
      </Card>

      {/* Producto Más Vendido */}
      <Card className="flex-1 min-w-[280px] max-w-[400px]">
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-medium">Producto Más Vendido</p>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-lg font-bold leading-tight">
            {productoTop?.descripcion || "No disponible"}
          </div>
          <div className="mt-2 flex items-center text-xs">
            <div className="flex items-center mr-3">
              <span className="font-medium mr-1">Unidades:</span> {productoTop?.unidades || "0"}
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1">Ingresos:</span> S/. {productoTop?.ingresos || "0.00"}
            </div>
          </div>
<div className="mt-3">
  <div className="flex items-center gap-2 mt-2">
    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
    <div className="text-xs flex items-center gap-1">
      {productoTop?.porcentajeSobreTotal !== undefined && productoTop?.porcentajeSobreTotal !== null
        ? (
          <>
            <span className="font-semibold">
              {Number(productoTop.porcentajeSobreTotal).toFixed(2)}%
            </span>
            <span>del total de ventas</span>
          </>
        )
        : "0% del total de ventas"}
    </div>
  </div>
  <div className="flex items-center gap-2 mt-1">
    <div className={`h-2 w-2 rounded-full ${Number(productoTop?.porcentajeCrecimiento) > 0 ? "bg-blue-500" : Number(productoTop?.porcentajeCrecimiento) < 0 ? "bg-red-500" : "bg-gray-400"}`}></div>
    <div className={`text-xs flex items-center gap-1 ${Number(productoTop?.porcentajeCrecimiento) > 0 ? "text-blue-600" : Number(productoTop?.porcentajeCrecimiento) < 0 ? "text-red-600" : "text-gray-500"}`}>
      {productoTop?.porcentajeCrecimiento !== undefined && productoTop?.porcentajeCrecimiento !== null
        ? (
          <>
            {Number(productoTop.porcentajeCrecimiento) > 0 && <ArrowUpRight className="inline h-3 w-3" />}
            {Number(productoTop.porcentajeCrecimiento) < 0 && <ArrowDownRight className="inline h-3 w-3" />}
            <span className="font-semibold">
              {Number(productoTop.porcentajeCrecimiento).toFixed(2)}%
            </span>
            <span>de {Number(productoTop.porcentajeCrecimiento) >= 0 ? "incremento" : "decremento"} vs. periodo anterior</span>
          </>
        )
        : "0% de incremento vs. periodo anterior"}
    </div>
  </div>
</div>
        </CardBody>
      </Card>

      {/* Sucursal con Mayor Rendimiento */}
      <Card className="flex-1 min-w-[280px] max-w-[400px]">
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-medium">Sucursal con Mayor Rendimiento</p>
          <Store className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-xl font-bold">
            {sucursalTop?.nombre || "No disponible"}
          </div>
          <div className="flex items-center space-x-2">
            <Chip
              color={sucursalTop?.porcentajeCrecimiento >= 0 ? "success" : "danger"}
              className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
            >
              {sucursalTop?.porcentajeCrecimiento >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
              )}
              {sucursalTop?.porcentajeCrecimiento > 0 ? "+" : ""}
              {sucursalTop?.porcentajeCrecimiento || 0}%
            </Chip>
            <p className="text-xs text-muted-foreground">{periodoTexto}</p>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>
                Ventas: S/. {sucursalTop?.totalVentas ? Number(sucursalTop.totalVentas).toFixed(2) : "0.00"}
              </span>
              <span className="font-medium">
                {sucursalTop?.porcentajeSobreTotal
                  ? `${sucursalTop.porcentajeSobreTotal}% del total`
                  : "0% del total"}
              </span>
            </div>
            <Progress
              value={sucursalTop?.porcentajeSobreTotal || 0}
              className="h-1.5"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SalesCard;