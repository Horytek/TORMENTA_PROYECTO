import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Input } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import {Chip} from "@nextui-org/react";

const PlanUsers = () => {
  const [users, setUsers] = useState([
    { id: 1, email: "usuario1@ejemplo.com", plan: "basic", status: "active" },
    { id: 2, email: "usuario2@ejemplo.com", plan: "pro", status: "pending" },
  ]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");

  const addUser = () => {
    if (!newEmail.trim()) return;
    setUsers([
      ...users,
      {
        id: users.length + 1,
        email: newEmail,
        plan: selectedPlan,
        status: "pending",
      },
    ]);
    setNewEmail("");
  };

  const removeUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const updateUserPlan = (id, plan) => {
    setUsers(
      users.map((user) => (user.id === id ? { ...user, plan } : user))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Email del usuario..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1"
          type="email"
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
        <Select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="w-[180px]"
        >
          <SelectItem value="basic">Plan Básico</SelectItem>
          <SelectItem value="pro">Plan Pro</SelectItem>
          <SelectItem value="enterprise">Plan Enterprise</SelectItem>
        </Select>
        <Button onClick={addUser} className="shrink-0" color="primary">
          <FaPlus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>
      <Table aria-label="Lista de usuarios por plan">
        <TableHeader>
          <TableColumn>Email</TableColumn>
          <TableColumn>Plan</TableColumn>
          <TableColumn>Estado</TableColumn>
          <TableColumn>Acciones</TableColumn>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.plan}
                  onChange={(e) => updateUserPlan(user.id, e.target.value)}
                >
                  <SelectItem value="basic">Plan Básico</SelectItem>
                  <SelectItem value="pro">Plan Pro</SelectItem>
                  <SelectItem value="enterprise">Plan Enterprise</SelectItem>
                </Select>
              </TableCell>
              <TableCell>
                <Chip className={`px-2 py-1 rounded text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {user.status === "active" ? "Activo" : "Pendiente"}
                </Chip>
              </TableCell>
              <TableCell>
                <Button isIconOnly variant="light" color="danger" onClick={() => removeUser(user.id)}>
                  <FaTrash className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanUsers;
