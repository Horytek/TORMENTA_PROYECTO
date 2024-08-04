import './Inicio.css';
import { CardComponent } from '@/components/Cards/Card';
import { LineChartComponent } from '@/components/Charts/LineChart';
import { RiShoppingBag4Line } from '@remixicon/react';
import { LuShirt } from "react-icons/lu";
import { TiStarburstOutline } from "react-icons/ti";
import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react';

function Inicio() {

  return (
    <div className="bg-white justify-between items-center relative">
      <header>
        <h1 className="title-Inicio text-5xl font-bold text-gray-700 tracking-wide">
          DASHBOARD TORMENTA
        </h1>
      </header>
      
      { /* Tabs de Reporte */}

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
              { /* Tab Numero 1 */}

              <TabPanel className="mt-4">
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  <CardComponent titleCard={"Ventas del día"} contentCard={"S/. 5800"} color={"indigo"} icon={RiShoppingBag4Line} />
                  <CardComponent titleCard={"Total de productos"} contentCard={"250"} color={"purple"} icon={LuShirt}  />
                  <CardComponent titleCard={"Producto del día"} contentCard={"Polo Verano"} color={"cyan"} icon={TiStarburstOutline} />
                </div>
                <div>
                  <LineChartComponent />
                </div>
              </TabPanel>

              { /* Fin Tab Numero 1 */}

              { /* Tab Numero 2 */}

              <TabPanel className="mt-4">
                Content-2
              </TabPanel>

              { /* Fin Tab Numero 2 */}

              { /* Tab Numero 3 */}

              <TabPanel className="mt-4">
                Content-3
              </TabPanel>

              { /* Fin Tab Numero 3 */}

              { /* Tab Numero 4 */}

              <TabPanel className="mt-4">
                Content-4
              </TabPanel>

              { /* Fin Tab Numero 4 */}

            </TabPanels>
          </TabGroup>
        </main>
      </div>

    </div>

  );
}

export default Inicio;
