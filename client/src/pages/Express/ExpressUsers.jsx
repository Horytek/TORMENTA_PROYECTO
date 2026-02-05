import { useEffect, useState } from "react";
import { getExpressUsers, createExpressUser, deleteExpressUser } from "@/services/express.services";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem } from "@heroui/react";
import { FaTrash, FaUserPlus, FaUserShield, FaUserTie } from "react-icons/fa";

function ExpressUsers() {
    const [users, setUsers] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [newName, setNewName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("cashier");
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const data = await getExpressUsers();
            setUsers(data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (onClose) => {
        setLoading(true);
        try {
            await createExpressUser({ name: newName, username: newUsername, password: newPassword, role: newRole });
            await loadUsers();
            setNewName(""); setNewUsername(""); setNewPassword("");
            onClose();
        } catch (e) { alert("Error"); console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar usuario?")) return;
        try {
            await deleteExpressUser(id);
            loadUsers();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <div>
                    <h2 className="text-xl font-bold text-white">Equipo</h2>
                    <p className="text-xs text-zinc-500">Gestiona quién accede a tu POS</p>
                </div>
                <Button color="primary" onPress={onOpen} startContent={<FaUserPlus />}>
                    Agregar
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {users.length === 0 && <div className="text-center text-zinc-500 py-10">No hay usuarios registrados.</div>}
                {users.map(u => (
                    <div key={u.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {u.role === 'admin' ? <FaUserShield /> : <FaUserTie />}
                            </div>
                            <div>
                                <p className="font-bold text-white">{u.name}</p>
                                <p className="text-sm text-zinc-400">@{u.username} • <span className="capitalize">{u.role === 'cashier' ? 'Cajero' : 'Admin'}</span></p>
                            </div>
                        </div>
                        <Button isIconOnly color="danger" variant="light" onPress={() => handleDelete(u.id)}>
                            <FaTrash />
                        </Button>
                    </div>
                ))}
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur">
                <ModalContent className="bg-zinc-900 text-white border border-zinc-700">
                    {(onClose) => (
                        <>
                            <ModalHeader>Nuevo Usuario</ModalHeader>
                            <ModalBody>
                                <Input label="Nombre Completo" placeholder="Ej. Juan Perez" value={newName} onChange={e => setNewName(e.target.value)} variant="bordered" classNames={{ inputWrapper: "border-zinc-700" }} />
                                <Input label="Usuario (Login)" placeholder="Ej. juanp" value={newUsername} onChange={e => setNewUsername(e.target.value)} variant="bordered" classNames={{ inputWrapper: "border-zinc-700" }} />
                                <Input label="Contraseña" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} variant="bordered" classNames={{ inputWrapper: "border-zinc-700" }} />
                                <Select label="Rol" selectedKeys={[newRole]} onChange={e => setNewRole(e.target.value)} variant="bordered" classNames={{ trigger: "border-zinc-700" }}>
                                    <SelectItem key="cashier" value="cashier">Cajero (Ventas)</SelectItem>
                                    <SelectItem key="admin" value="admin">Admin (Total)</SelectItem>
                                </Select>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                                <Button color="primary" onPress={() => handleCreate(onClose)} isLoading={loading}>Guardar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
export default ExpressUsers;
