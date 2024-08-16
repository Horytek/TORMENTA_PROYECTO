import "./Inicio.css";
import { CardComponent } from "@/components/Cards/Card";
import { LineChartComponent } from "./LineChart";
import { RiShoppingBag4Line } from "@remixicon/react";
import { LuShirt } from "react-icons/lu";
import { TiStarburstOutline } from "react-icons/ti";
import { Tabs, Tab, Divider } from "@nextui-org/react";
import useProductTop from "./hooks/product_top";
import useProductSell from "./hooks/product_sell";
import useVentasTotal from "./hooks/ventas_total";
import { useState } from "react";

function Inicio() {
  const [selectedTab, setSelectedTab] = useState("24h");

  const renderTabContent = () => {
    const {
      productTop,
    } = useProductTop(selectedTab);
    const {
      totalProductsSold,
    } = useProductSell(selectedTab);
    const {
      ventasTotal,
    } = useVentasTotal(selectedTab);

    
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardComponent
            titleCard={"Total de ganancias"}
            contentCard={`S/. ${ventasTotal}`}
            color={"indigo"}
            icon={RiShoppingBag4Line}
            tooltip="Dinero recaudado"
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
          />
          <CardComponent
            titleCard={"Total de productos"}
            contentCard={`${totalProductsSold}`}
            color={"purple"}
            icon={LuShirt}
            tooltip="Productos vendidos"
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
          />
          <CardComponent
            titleCard={"Producto más vendido"}
            contentCard={productTop ? productTop.descripcion : "No disponible"}
            color={"cyan"}
            icon={TiStarburstOutline}
            tooltip="Producto top"
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
          />
        </div>

        <div className="mt-7">
          <LineChartComponent />
        </div>
      </>
    );
  };

  return (
    <div className="relative items-center justify-between bg-white">
      <header>
        <h1 className="text-5xl font-bold tracking-wide text-gray-700 title-Inicio">
          DASHBOARD TORMENTA
        </h1>
        <p
          className="text-small text-default-400"
          style={{
            fontSize: "16px",
            pointerEvents: "none",
            userSelect: "none",
            marginTop: "10px",
          }}
        >
          Visualiza el dashboard general de ventas por periodos de tiempo.
        </p>
      </header>
      <div className="max-w-md">
        <Divider className="my-3" />
      </div>
      {/* Tabs de Reporte */}
      <div style={{ marginTop: "15px" }}>
        <main>
          <Tabs
            variant="underlined"
            aria-label="Tabs variants"
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
          >
            <Tab key="24h" title="Ult. 24hrs" />
            <Tab key="semana" title="Ult. Semana" />
            <Tab key="mes" title="Ult. mes" />
            <Tab key="anio" title="Ult. año" />
          </Tabs>

          <div className="mt-4 leading-6 text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Inicio;
