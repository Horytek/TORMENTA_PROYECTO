import { useEffect, useState } from "react";
import { getExpressUsers, createExpressUser, deleteExpressUser, updateExpressUser } from "@/services/express.services";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Checkbox, Chip } from "@heroui/react";
import { FaTrash, FaUserPlus, FaUserShield, FaUserTie, FaPencilAlt } from "react-icons/fa";
import { getBusinessName } from "@/utils/expressStorage";
import { toast } from "react-hot-toast";

function ExpressUsers() {
    const [users, setUsers] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    // Permissions (default empty)
    const [permissions, setPermissions] = useState({
        sales: true,
        inventory: false
    });
    const [userStatus, setUserStatus] = useState(1); // 1 = Active, 0 = Inactive
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessNameStr] = useState("");

    useEffect(() => {
        loadUsers();
        getBusinessName().then(setBusinessNameStr);
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getExpressUsers();
            // Parse permissions if string
            const parsed = data.map(u => ({
                ...u,
                permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {})
            }));
            setUsers(parsed);
        } catch (e) { console.error(e); }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setNewName("");
        setNewUsername("");
        setNewPassword("");
        setPermissions({ sales: true, inventory: false });
        setUserStatus(1);
        onOpen();
    };

    const handleOpenEdit = (user) => {
        setEditingId(user.id);
        setNewName(user.name);
        setNewUsername(user.username);
        setNewPassword(""); // Leave empty to keep unchanged
        setPermissions({
            sales: user.permissions?.sales || false,
            inventory: user.permissions?.inventory || false
        });
        setUserStatus(user.status !== undefined ? user.status : 1);
        onOpen();
    };

    const handleSave = async (onClose) => {
        if (!newName || !newUsername) {
            toast.error("Nombre y Usuario son requeridos");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: newName,
                username: newUsername,
                role: 'cashier', // Fixed to cashier as per requirement
                permissions,
                status: userStatus
            };
            if (newPassword) payload.password = newPassword;

            if (editingId) {
                await updateExpressUser(editingId, payload);
                toast.success("Usuario actualizado");
            } else {
                if (!newPassword) {
                    toast.error("Contraseña requerida para nuevos usuarios");
                    setLoading(false);
                    return;
                }
                await createExpressUser(payload);
                toast.success("Usuario creado");
            }
            await loadUsers();
            onClose();
        } catch (e) {
            toast.error("Error al guardar usuario");
            console.error(e);
        } finally { setLoading(false); }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent row click
        if (!window.confirm("¿Eliminar usuario?")) return;
        try {
            await deleteExpressUser(id);
            toast.success("Usuario eliminado");
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
                <Button color="primary" onPress={handleOpenCreate} startContent={<FaUserPlus />}>
                    Agregar
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {users.length === 0 && <div className="text-center text-zinc-500 py-10">No hay usuarios registrados.</div>}
                {users.map(u => (
                    <div
                        key={u.id}
                        className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer group"
                        onClick={() => handleOpenEdit(u)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {u.role === 'admin' ? <FaUserShield /> : <FaUserTie />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{u.name}</p>
                                    {u.status === 0 && <Chip size="sm" color="danger" variant="flat" className="h-5 text-[10px]">Inactivo</Chip>}
                                    {u.permissions?.inventory && <Chip size="sm" color="warning" variant="flat" className="h-5 text-[10px]">Inventario</Chip>}
                                    {u.permissions?.sales && <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">Ventas</Chip>}
                                </div>
                                <p className="text-sm text-zinc-400">@{u.username} • <span className="capitalize">Cajero</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaPencilAlt className="text-zinc-600 group-hover:text-white mr-2 opacity-0 group-hover:opacity-100 transition-all" />
                            <Button isIconOnly color="danger" variant="light" onPress={(e) => handleDelete(u.id, e)}>
                                <FaTrash />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" classNames={{
                base: "bg-zinc-950 border border-zinc-800",
                closeButton: "hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-white"
            }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-zinc-800 pb-4">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                    <p className="text-sm text-zinc-500 font-normal">
                                        {editingId ? 'Modifica los datos y permisos' : 'Agrega un miembro a tu equipo'}
                                    </p>
                                </div>
                            </ModalHeader>
                            <ModalBody className="py-6 space-y-4">
                                <div className="space-y-4">
                                    <Input
                                        label="Nombre Completo"
                                        placeholder="Ej. Juan Pérez"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        labelPlacement="outside"
                                        classNames={{
                                            input: "!bg-zinc-900 !text-white placeholder:text-zinc-600",
                                            inputWrapper: "!bg-zinc-900 border border-zinc-700 group-data-[focus=true]:border-emerald-500 h-12",
                                            label: "text-zinc-400 group-data-[filled-within=true]:text-zinc-300"
                                        }}
                                    />
                                    <div>
                                        <Input
                                            label="Usuario (Login)"
                                            placeholder="Ej. juanp"
                                            value={newUsername}
                                            onChange={e => setNewUsername(e.target.value)}
                                            labelPlacement="outside"
                                            description={
                                                <span className="text-zinc-500 text-xs">
                                                    Login Pocket POS: <span className="text-emerald-400 font-bold">{newName.replace(/\s+/g, '')}@{newUsername || '...'}</span>
                                                </span>
                                            }
                                            classNames={{
                                                input: "!bg-zinc-900 !text-white placeholder:text-zinc-600",
                                                inputWrapper: "!bg-zinc-900 border border-zinc-700 group-data-[focus=true]:border-emerald-500 h-12",
                                                label: "text-zinc-400 group-data-[filled-within=true]:text-zinc-300"
                                            }}
                                        />
                                    </div>

                                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                        <p className="text-sm text-zinc-400 mb-3 font-bold uppercase tracking-wider">Permisos de Acceso</p>
                                        <div className="flex flex-col gap-2">
                                            <Checkbox
                                                isSelected={permissions.sales}
                                                onValueChange={(v) => setPermissions(p => ({ ...p, sales: v }))}
                                                classNames={{ label: "text-white" }}
                                                color="success"
                                            >
                                                Acceso a Ventas (POS)
                                            </Checkbox>
                                            <Checkbox
                                                isSelected={permissions.inventory}
                                                onValueChange={(v) => setPermissions(p => ({ ...p, inventory: v }))}
                                                classNames={{ label: "text-white" }}
                                                color="warning"
                                            >
                                                Acceso a Inventario y Productos
                                            </Checkbox>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                        <p className="text-sm text-zinc-400 mb-3 font-bold uppercase tracking-wider">Estado del Usuario</p>
                                        <Checkbox
                                            isSelected={userStatus === 1}
                                            onValueChange={(v) => setUserStatus(v ? 1 : 0)}
                                            classNames={{ label: "text-white" }}
                                            color="success"
                                        >
                                            Usuario Activo
                                        </Checkbox>
                                        {userStatus === 0 && <p className="text-xs text-red-400 mt-2">El usuario no podrá iniciar sesión</p>}
                                    </div>

                                    <Input
                                        label={editingId ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                        type="password"
                                        placeholder={editingId ? "Dejar en blanco para mantener" : "••••••••"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        labelPlacement="outside"
                                        classNames={{
                                            input: "!bg-zinc-900 !text-white placeholder:text-zinc-600",
                                            inputWrapper: "!bg-zinc-900 border border-zinc-700 group-data-[focus=true]:border-emerald-500 h-12",
                                            label: "text-zinc-400 group-data-[filled-within=true]:text-zinc-300"
                                        }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-zinc-800 pt-4">
                                <Button className="bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button className="bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20" onPress={() => handleSave(onClose)} isLoading={loading}>
                                    {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
export default ExpressUsers;
