import { useState, useEffect } from "react";
import { Button, Avatar, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from "@heroui/react";
import { LogOut, CreditCard, Users, Bell, Lock, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { expressLogout, updateExpressPassword, getExpressMe } from "@/services/express.services";
import { getBusinessName } from "@/utils/expressStorage";
import { forceHeroUILightTheme } from "@/utils/clearHeroUITheme";

export default function ExpressSettings() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ name: "", email: "Cargando...", role: "" });
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [newPassword, setNewPassword] = useState("");
    const [loadingPass, setLoadingPass] = useState(false);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const me = await getExpressMe();
                if (me) {
                    setProfile({
                        name: me.name,
                        email: me.email || (me.username ? `@${me.username}` : ""),
                        role: me.role
                    });
                    setRole(me.role);
                } else {
                    // Fallback
                    const name = await getBusinessName();
                    setProfile({ name: name || "Mi Negocio", email: "Admin", role: 'admin' });
                    setRole('admin');
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadProfile();
    }, []);

    const handleLogout = async () => {
        await expressLogout();
        forceHeroUILightTheme();
        window.location.href = "/login";
    };

    const handleChangePassword = async (onClose) => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Mínimo 6 caracteres");
            return;
        }
        setLoadingPass(true);
        try {
            await updateExpressPassword(newPassword);
            toast.success("Contraseña actualizada");
            setNewPassword("");
            onClose();
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24 space-y-8">
            <h1 className="text-2xl font-black tracking-tight">Configuración</h1>

            {/* Profile Section */}
            <section className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 flex items-center gap-4">
                <Avatar
                    name={(profile.name || "U").charAt(0).toUpperCase()}
                    className="w-16 h-16 text-2xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center"
                    isBordered
                    color="secondary"
                />
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                    <p className="text-sm text-zinc-400 capitalize">{profile.role === 'admin' ? 'Administrador' : profile.role} <span className="text-zinc-600">•</span> {profile.email}</p>
                </div>
            </section>

            {/* Quick Links - Admin Only */}
            {role === 'admin' && (
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider px-2">General</h3>

                    <div className="grid gap-3">
                        <Button
                            className="bg-zinc-900/50 border border-white/5 h-16 justify-start px-6 gap-4"
                            onPress={() => navigate('/express/subscription')}
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-bold text-white">Suscripción y Planes</p>
                                <p className="text-xs text-zinc-500">Gestiona tu plan activo</p>
                            </div>
                            <Chip size="sm" color="success" variant="flat">Activo</Chip>
                        </Button>

                        <Button
                            className="bg-zinc-900/50 border border-white/5 h-16 justify-start px-6 gap-4"
                            onPress={() => navigate('/express/users')}
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-bold text-white">Equipo y Permisos</p>
                                <p className="text-xs text-zinc-500">Administra accesos</p>
                            </div>
                        </Button>

                        <Button
                            className="bg-zinc-900/50 border border-white/5 h-16 justify-start px-6 gap-4"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-bold text-white">Notificaciones</p>
                                <p className="text-xs text-zinc-500">Alertas de stock y sistema</p>
                            </div>
                        </Button>
                    </div>
                </section>
            )}

            {/* Danger Zone */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-red-500/70 uppercase tracking-wider px-2">Sesión y Seguridad</h3>

                <div className="space-y-3">
                    <Button
                        className="w-full bg-zinc-900/50 border border-white/5 h-14 justify-start px-6 gap-4 text-zinc-300 hover:text-white"
                        onPress={onOpen}
                    >
                        <Lock className="w-4 h-4" />
                        Cambiar Contraseña
                    </Button>

                    <Button
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white h-14 justify-start px-6 gap-4"
                        onPress={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </section>

            {/* Password Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" classNames={{
                base: "bg-zinc-950 border border-zinc-800",
                closeButton: "hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-white"
            }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                        <KeyRound className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl font-bold text-white">Cambiar Contraseña</h2>
                                        <p className="text-sm text-zinc-500 font-normal">Actualiza tu clave de acceso</p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody className="py-6">
                                <Input
                                    label="Nueva Contraseña"
                                    placeholder="Mínimo 6 caracteres"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    startContent={<Lock className="w-4 h-4 text-zinc-500" />}
                                    labelPlacement="outside"
                                    classNames={{
                                        input: "!bg-zinc-900 !text-white placeholder:text-zinc-600",
                                        inputWrapper: "!bg-zinc-900 border border-zinc-700 group-data-[focus=true]:border-emerald-500 h-12",
                                        label: "text-zinc-400 group-data-[filled-within=true]:text-zinc-300"
                                    }}
                                />
                            </ModalBody>
                            <ModalFooter className="border-t border-zinc-800 pt-4">
                                <Button className="bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20"
                                    isLoading={loadingPass}
                                    onPress={() => handleChangePassword(onClose)}
                                >
                                    Guardar Cambios
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
