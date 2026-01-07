import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Pagination,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { getUsuarios, deleteUsuario } from "@/services/usuario.services";
import { getEmpresas } from "@/services/empresa.services";
import UsuariosForm from "./UsuariosForm";
import EditPlanUserModal from "./EditPlanUserModal";

const PlanUsers = () => {
  const [users, setUsers] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchEmpresa, setSearchEmpresa] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [activeAdd, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);

  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
    if (activeAdd) fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
    fetchEmpresas();
  }, []);

  const fetchUsers = useCallback(async () => {
    const data = await getUsuarios();
    const filteredUsuarios = (Array.isArray(data) ? data : []).filter(u => String(u.id_rol) === "1");
    setUsers(filteredUsuarios);
  }, []);

  const fetchEmpresas = async () => {
    const data = await getEmpresas();
    setEmpresas(data);
  };

  const removeUser = useCallback(async (id) => {
    try {
      await deleteUsuario(id);
      toast.success("Usuario eliminado correctamente");
      fetchUsers();
    } catch (error) {
      toast.error("Error al eliminar usuario");
    }
  }, [fetchUsers]);

  const handleEditUser = (user) => {
    setSelectedUserToEdit(user);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (user.usua?.toLowerCase() || "").includes(searchUser.toLowerCase()) &&
        (empresas.find((empresa) => empresa.id_empresa === user.id_empresa)?.razonSocial.toLowerCase() || "").includes(searchEmpresa.toLowerCase()) &&
        (selectedPlan ? user.plan_pago === selectedPlan : true)
    );
  }, [users, searchUser, searchEmpresa, selectedPlan, empresas]);

  const currentUsers = useMemo(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  }, [filteredUsers, currentPage]);

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center p-1">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
          <Input
            type="text"
            placeholder="Buscar usuario..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full flex-1"
            variant="faded"
            size="md"
            radius="lg"
            classNames={{
              inputWrapper: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm",
            }}
          />
          <Input
            type="text"
            placeholder="Buscar empresa..."
            value={searchEmpresa}
            onChange={(e) => setSearchEmpresa(e.target.value)}
            className="w-full flex-1"
            variant="faded"
            size="md"
            radius="lg"
            classNames={{
              inputWrapper: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm",
            }}
          />
          <Select
            placeholder="Filtrar por plan"
            selectedKeys={selectedPlan ? [selectedPlan] : []}
            onSelectionChange={(keys) => setSelectedPlan(keys.currentKey)}
            className="w-full flex-1"
            variant="faded"
            size="md"
            radius="lg"
            classNames={{
              trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm",
            }}
          >
            <SelectItem key="">Todos</SelectItem>
            <SelectItem key="basic">Plan Básico</SelectItem>
            <SelectItem key="pro">Plan Pro</SelectItem>
            <SelectItem key="enterprise">Plan Enterprise</SelectItem>
          </Select>
        </div>
        <div className="flex w-full lg:w-auto justify-end">
          <Button
            color="primary"
            size="md"
            className="font-medium shadow-lg shadow-blue-500/20 px-6"
            onPress={handleModalAdd}
            startContent={<FaPlus className="w-3 h-3" />}
          >
            Añadir Usuario
          </Button>
        </div>
      </div>

      <Table
        aria-label="Lista de Usuarios"
        classNames={{
          wrapper: "shadow-none bg-transparent p-0",
          th: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-semibold text-xs tracking-wider border-b border-slate-200 dark:border-zinc-700 h-12 first:rounded-l-lg last:rounded-r-lg",
          td: "py-4 border-b border-slate-100 dark:border-zinc-800/50 group-hover:bg-slate-50/50 dark:group-hover:bg-zinc-800/30 transition-colors",
          thead: "[&>tr]:first:shadow-none mb-2",
        }}
      >
        <TableHeader>
          <TableColumn>EMPRESA</TableColumn>
          <TableColumn>USUARIO</TableColumn>
          <TableColumn align="center">PLAN</TableColumn>
          <TableColumn align="center">ESTADO</TableColumn>
          <TableColumn align="center">FECHA DE PAGO</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={currentUsers} emptyContent="No se encontraron usuarios">
          {(user) => (
            <TableRow key={user.id_usuario} className="group">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {empresas.find((empresa) => empresa.id_empresa === user.id_empresa)?.razonSocial || "Sin asignar"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 text-xs font-bold shadow-sm">
                    {(user.usua || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{user.usua}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Chip
                    size="sm"
                    variant="flat"
                    className="capitalize"
                    color={user.plan_pago === 'enterprise' ? 'warning' : user.plan_pago === 'pro' ? 'secondary' : 'primary'}
                  >
                    {user.plan_pago === 'basic' ? 'Básico' : user.plan_pago === 'pro' ? 'Pro' : user.plan_pago === 'enterprise' ? 'Enterprise' : user.plan_pago}
                  </Chip>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${user.estado_usuario_1 == "1"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.estado_usuario_1 == "1" ? "bg-green-500" : "bg-red-500"}`} />
                    {user.estado_usuario_1 == "1" ? "Activo" : "Inactivo"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <span className="text-sm text-slate-500 font-medium">
                    {user.fecha_pago ? new Date(user.fecha_pago).toLocaleDateString("es-ES") : "Sin fecha"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="primary"
                    onPress={() => handleEditUser(user)}
                    className="text-blue-500 hover:bg-blue-50"
                  >
                    <FaEdit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeUser(user.id_usuario)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-center mt-4">
        <Pagination
          showControls
          initialPage={1}
          page={currentPage}
          total={Math.ceil(filteredUsers.length / usersPerPage) || 1}
          onChange={setCurrentPage}
        />
      </div>

      {activeAdd && (
        <UsuariosForm modalTitle={"Nuevo Usuario"} onClose={handleModalAdd} />
      )}

      <EditPlanUserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUserToEdit}
        companies={empresas}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default PlanUsers;