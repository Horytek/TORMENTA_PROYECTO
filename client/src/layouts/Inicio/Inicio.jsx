import "./Inicio.css";
import { CardComponent } from "@/components/Cards/Card";
import { LineChartComponent } from "@/components/Charts/LineChart";
import { RiShoppingBag4Line } from "@remixicon/react";
import { LuShirt } from "react-icons/lu";
import { TiStarburstOutline } from "react-icons/ti";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import useProductTop from './data/product_top';
import useProductSell from './data/product_sell';

function Inicio() {
  const renderTabContent = (timePeriod) => {
    const { productTop, loading: loadingTop, error: errorTop } = useProductTop(timePeriod);
    const { totalProductsSold, loading: loadingSell, error: errorSell } = useProductSell(timePeriod);

    if (loadingTop || loadingSell) return <p>Cargando...</p>;
    if (errorTop || errorSell) return <p>Error: {errorTop?.message || errorSell?.message}</p>;

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardComponent
            titleCard={"Ventas del día"}
            contentCard={`S/. ${totalProductsSold}`} 
            color={"indigo"}
            icon={RiShoppingBag4Line}
            tooltip="Producto más vendido"
          />
          <CardComponent
            titleCard={"Total de productos"}
            contentCard={`${totalProductsSold}`} 
            color={"purple"}
            icon={LuShirt}
          />
          <CardComponent
            titleCard={"Producto del día"}
            contentCard={productTop ? productTop.descripcion : "No disponible"} 
            color={"cyan"}
            icon={TiStarburstOutline}
          />
        </div>
        <div className="mt-7">
          <LineChartComponent />
        </div>
      </>
    );
  };

  return (
    <div className="bg-white justify-between items-center relative">
      <header>
        <h1 className="title-Inicio text-5xl font-bold text-gray-700 tracking-wide">
          DASHBOARD TORMENTA
        </h1>
      </header>

      {/* Tabs de Reporte */}
      <div>
        <main>
          <TabGroup>
            <TabList variant="line" className="mt-6">
              <Tab>Ult. 24hrs</Tab>
              <Tab>Ult. Semana</Tab>
              <Tab>Ult. mes</Tab>
              <Tab>Ult. año</Tab>
            </TabList>
            <TabPanels>
              {/* Tab Numero 1 */}
              <TabPanel className="mt-4">
                {renderTabContent('24h')}
              </TabPanel>

              {/* Tab Numero 2 */}
              <TabPanel className="mt-4">
                {renderTabContent('semana')}
              </TabPanel>

              {/* Tab Numero 3 */}
              <TabPanel className="mt-4">
                {renderTabContent('mes')}
              </TabPanel>

              {/* Tab Numero 4 */}
              <TabPanel className="mt-4">
                {renderTabContent('anio')}
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </main>
      </div>
    </div>
  );
}

export default Inicio;
