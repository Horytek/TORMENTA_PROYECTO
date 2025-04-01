import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from "@nextui-org/react";
import { Button, Input, Select, SelectItem, Chip } from "@nextui-org/react";
import { FaPlus, FaTrash, FaSyncAlt } from "react-icons/fa";
import { getUsuarios, updateUsuarioPlan, deleteUsuario } from "@/services/usuario.services";
import { Pagination } from "@nextui-org/pagination";
import UsuariosForm from './UsuariosForm';

const PlanUsers = () => {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchEmpresa, setSearchEmpresa] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [activeAdd, setModalOpen] = useState(false);
  const [editableUsers, setEditableUsers] = useState({});

  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await getUsuarios();
    const filteredUsuarios = data.filter((usuario) => usuario.id_rol === 1);
    setUsers(filteredUsuarios);
  };

  const removeUser = async (id) => {
    await deleteUsuario(id);
    fetchUsers(); // Refrescar la lista de usuarios después de la eliminación
  };

  const updateUserPlan = (id, plan) => {
    setUsers(users.map((user) => (user.id_usuario === id ? { ...user, plan_pago: plan } : user)));
  };

  const toggleEditable = (id) => {
    setEditableUsers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEmpresaChange = (id, value) => {
    setUsers(users.map((user) => (user.id_usuario === id ? { ...user, empresa: value } : user)));
  };

  const handleEstadoChange = (id, value) => {
    setUsers(users.map((user) => (user.id_usuario === id ? { ...user, estado_usuario_1: value || "0" } : user)));
  };

  const handleFechaChange = (id, nuevaFecha) => {
    setUsers(users.map((user) =>
      user.id_usuario === id
        ? { ...user, fecha_pago: nuevaFecha || null } // Si la fecha es vacía, establecer como null
        : user
    ));
  };
  

  const handleUpdateUserPlan = async (id) => {
    const user = users.find((user) => user.id_usuario === id);
    if (user) {
      // Validar y formatear fecha_pago
      const formattedFechaPago = user.fecha_pago
        ? new Date(user.fecha_pago).toISOString().split("T")[0] // Formato YYYY-MM-DD
        : null;
  
      try {
        await updateUsuarioPlan(id, {
          empresa: user.empresa,
          plan_pago: user.plan_pago === "enterprise" ? 1 : user.plan_pago === "pro" ? 2 : 3,
          estado_usuario: user.estado_usuario_1,
          fecha_pago: formattedFechaPago, // Usar la fecha formateada
        });
        fetchUsers(); // Refrescar la lista de usuarios después de la actualización
      } catch (error) {
        console.error("Error al actualizar el usuario:", error);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.usua?.toLowerCase() || "").includes(searchUser.toLowerCase()) &&
      (user.empresa?.toLowerCase() || "").includes(searchEmpresa.toLowerCase()) &&
      (selectedPlan ? user.plan_pago === selectedPlan : true)
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="space-y-6 p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          type="text"
          placeholder="Buscar usuario..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
        <Input
          type="text"
          placeholder="Buscar empresa..."
          value={searchEmpresa}
          onChange={(e) => setSearchEmpresa(e.target.value)}
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
        <Select
          label="Filtrar por Plan"
          selectedKeys={[selectedPlan]}
          onSelectionChange={(keys) => setSelectedPlan(keys.currentKey)}
        >
          <SelectItem key="">Todos</SelectItem>
          <SelectItem key="basic">Plan Básico</SelectItem>
          <SelectItem key="pro">Plan Pro</SelectItem>
          <SelectItem key="enterprise">Plan Enterprise</SelectItem>
        </Select>
        <div className="flex justify-center items-center">
          <Button color="primary" variant="shadow" onClick={handleModalAdd} startContent={<FaPlus />} className="bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto">
            Añadir
          </Button>
        </div>
      </div>
      <Table aria-label="Lista de Usuarios" className="border rounded-lg">
        <TableHeader>
          <TableColumn>Empresa</TableColumn>
          <TableColumn>Usuario</TableColumn>
          <TableColumn>Plan</TableColumn>
          <TableColumn>Estado</TableColumn>
          <TableColumn>Fecha de Pago</TableColumn>
          <TableColumn>Acciones</TableColumn>
        </TableHeader>
        <TableBody>
          {currentUsers.map((user) => (
            <TableRow key={user.id_usuario}>
              <TableCell>
                <div className="flex items-center">
                  <Checkbox
                    isSelected={editableUsers[user.id_usuario] || false}
                    onChange={() => toggleEditable(user.id_usuario)}
                  />
                  {editableUsers[user.id_usuario] ? (
                    <Input
                      value={user.empresa}
                      onChange={(e) => handleEmpresaChange(user.id_usuario, e.target.value)}
                      className="ml-2"
                      style={{
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                      }}
                    />
                  ) : (
                    <span className="ml-2">{user.empresa}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{user.usua}</TableCell>
              <TableCell>
                <Select
                  label="Plan"
                  selectedKeys={[user.plan_pago]}
                  onSelectionChange={(keys) => updateUserPlan(user.id_usuario, keys.currentKey)}
                >
                  <SelectItem key="basic">Plan Básico</SelectItem>
                  <SelectItem key="pro">Plan Pro</SelectItem>
                  <SelectItem key="enterprise">Plan Enterprise</SelectItem>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  label="Estado"
                  selectedKeys={[user.estado_usuario_1.toString()]}
                  onSelectionChange={(keys) => handleEstadoChange(user.id_usuario, keys.currentKey)}
                >
                  <SelectItem key="1">Activo</SelectItem>
                  <SelectItem key="0">Inactivo</SelectItem>
                </Select>
              </TableCell>
              <TableCell>
                {editableUsers[user.id_usuario] ? (
                  <Input
                    type="date"
                    value={user.fecha_pago ? new Date(user.fecha_pago).toISOString().split("T")[0] : ""} 
                    onChange={(e) => handleFechaChange(user.id_usuario, e.target.value)}
                  />
                ) : (
                  <span>{new Date(user.fecha_pago).toLocaleDateString("es-ES")}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    isIconOnly
                    variant="light" color="danger"
                    onClick={() => removeUser(user.id_usuario)}
                  >
                    <FaTrash />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light" color="primary"
                    onClick={() => handleUpdateUserPlan(user.id_usuario)}
                  >
                    <FaSyncAlt />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center mt-4">
        <Pagination
          showControls
          initialPage={1}
          currentPage={currentPage}
          total={Math.ceil(filteredUsers.length / usersPerPage)}
          onChange={setCurrentPage}
        />
      </div>
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Usuario'} onClose={handleModalAdd} />
      )}
    </div>
  );
};

export default PlanUsers;