import { CardComponent } from "@/components/Cards/Card";
import { LineChartComponent } from "./LineChart";
import { RiShoppingBag4Line } from "@remixicon/react";
import { LuShirt } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import { TiStarburstOutline } from "react-icons/ti";
import { Tabs, Tab, Divider, Select, SelectItem, Button } from "@nextui-org/react";
import useProductTop from "./hooks/product_top";
import useProductSell from "./hooks/product_sell";
import useVentasTotal from "./hooks/ventas_total";
import { useState, useEffect } from "react";
import axios from "@/api/axios";


function Inicio() {
  const ADMIN_ROL = 1;
  const EMP_ROL = 3;

  const [selectedTab, setSelectedTab] = useState("24h");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [userRol, setUserRol] = useState(null);

  useEffect(() => {
    const fetchUserRol = async () => {
      const storedUser = localStorage.getItem("usuario");
      if (storedUser) {
        try {
          const response = await axios.get("/dashboard/usuarioRol", {
            params: { usuario: storedUser }
          });
          if (response.data && response.data.rol_id) {
            setUserRol(response.data.rol_id);
          }
        } catch (error) {
          console.error("Error al obtener rol de usuario:", error);
        }
      }
    };
    
    fetchUserRol();
  }, []);


  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get("/dashboard/sucursales");
        if (response.data && response.data.data) {
          setSucursales(response.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSucursales();
  }, []);


  const renderTabContent = () => {
    const { productTop } = useProductTop(selectedTab, selectedSucursal);
    const { totalProductsSold } = useProductSell(selectedTab, selectedSucursal);
    const { ventasTotal } = useVentasTotal(selectedTab, selectedSucursal);

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
            tooltip="Producto del día"
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
          />
        </div>

        <div className="mt-7">
          <LineChartComponent sucursal={selectedSucursal} />
        </div>
      </>
    );
  };

  return (
    <div className="relative items-center justify-between bg-white">
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-5xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 transform-gpu"
          >
            ERP Dashboard
          </h1>
          <p
            className="text-small text-default-400"
            style={{ fontSize: "16px", userSelect: "none", marginTop: "10px" }}
          >
            Visualiza el dashboard general de ventas por periodos de tiempo.
          </p>
        </div>
        <div className="flex items-center gap-2">
        {userRol === ADMIN_ROL && (
          <>
            <Select
              className="w-64"
              selectedKeys={new Set([selectedSucursal])}
              onSelectionChange={(keys) => {
                const firstKey = keys.values().next().value || "";
                setSelectedSucursal(firstKey);
              }}
              placeholder="Seleccionar sucursal"
              classNames={{
                trigger: "bg-gray-200 text-gray-700 hover:bg-gray-300",
              }}
            >
              {sucursales.map((sucursal) => (
                <SelectItem
                  key={sucursal.id.toString()}
                  value={sucursal.id.toString()}
                >
                  {sucursal.nombre}
                </SelectItem>
              ))}
            </Select>
            <Button
              auto
              light
              color="danger"
              onClick={() => setSelectedSucursal("")}
            >
              <MdDeleteForever style={{ fontSize: "20px" }} />
              Limpiar
            </Button>
          </>
        )}
        </div>
      </header>
      <div className="max-w-md">
        <Divider className="my-3" />
      </div>
      <div style={{ marginTop: "15px" }}>
        <main>
          <Tabs
            variant="underlined"
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
          >
            <Tab key="24h" title="Ult. 24hrs" />
            <Tab key="semana" title="Ult. Semana" />
            <Tab key="mes" title="Ult. mes" />
            <Tab key="anio" title="Ult. año" />
          </Tabs>
          <div className="mt-4">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Inicio;