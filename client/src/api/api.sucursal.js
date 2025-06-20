import axios from "@/api/axios";

// Obtener la sucursal de inicio (filtrada por nombre opcionalmente)
export const getSucursalInicioRequest = (filters) => {
  return axios.get("/sucursales/inicio", {
    params: filters,
  });
};

// Obtener todas las sucursales, con filtros opcionales: nombre, estado
export const getSucursalesRequest = (filters) => {
  return axios.get("/sucursales/", {
    params: filters,
  });
};

// Insertar nueva sucursal
export const insertSucursalRequest = (data) => {
  return axios.post("/sucursales/addsucursal", data);
};

// Actualizar sucursal
export const updateSucursalRequest = (data) => {
  return axios.post("/sucursales/updatesucursal", data);
};

// Obtener lista de vendedores activos
export const getVendedoresRequest = () => {
  return axios.get("/sucursales/vendedores");
};

// Eliminar una sucursal por ID
export const deleteSucursalRequest = (id) => {
  return axios.delete(`/sucursales/delete/${id}`);
};