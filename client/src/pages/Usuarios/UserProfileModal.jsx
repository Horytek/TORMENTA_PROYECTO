import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Divider,
} from "@heroui/react";
import { FiEdit, FiShield, FiX, FiTrash2 } from "react-icons/fi";
import { PiPlugsConnected } from "react-icons/pi";
import { VscDebugDisconnect } from "react-icons/vsc";

export default function UserProfileModal({
    isOpen,
    onClose,
    usuario,
    onEdit,
    onToggleStatus,
    onDelete
}) {
    if (!usuario) return null;

    const isActive = usuario.estado_usuario === "Activo" || usuario.estado_usuario === 1;
    const isConnected = usuario.estado_token === 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div
                            className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 shadow-sm
                ${isConnected
                                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30"
                                    : "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/30"
                                }
              `}
                        >
                            {isConnected ? (
                                <PiPlugsConnected className="text-emerald-500 dark:text-emerald-300 text-2xl" />
                            ) : (
                                <VscDebugDisconnect className="text-rose-500 dark:text-rose-300 text-2xl" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                {usuario.usua}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Perfil de Usuario
                            </p>
                        </div>
                    </div>
                </ModalHeader>

                <ModalBody>
                    <div className="space-y-4">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Información Básica
                            </h3>
                            <div className="space-y-2">
                                <InfoRow label="Usuario" value={usuario.usua} />
                                <InfoRow label="Rol" value={usuario.nom_rol} />
                                <InfoRow
                                    label="Estado"
                                    value={
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={isActive ? "success" : "danger"}
                                        >
                                            {isActive ? "Activo" : "Inactivo"}
                                        </Chip>
                                    }
                                />
                                <InfoRow
                                    label="Conexión"
                                    value={
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={isConnected ? "success" : "default"}
                                        >
                                            {isConnected ? "Conectado" : "Desconectado"}
                                        </Chip>
                                    }
                                />
                            </div>
                        </div>

                        <Divider />

                        {/* Company Information */}
                        {usuario.id_empresa && (
                            <>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Empresa
                                    </h3>
                                    <InfoRow label="ID Empresa" value={usuario.id_empresa} />
                                </div>
                                <Divider />
                            </>
                        )}

                        {/* Quick Actions (solo dentro del detalle ahora) */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Acciones Rápidas
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    startContent={<FiEdit />}
                                    onClick={() => {
                                        onEdit(usuario.id_usuario);
                                        onClose();
                                    }}
                                >
                                    Editar Usuario
                                </Button>
                                <Button
                                    size="sm"
                                    color={isActive ? "danger" : "success"}
                                    variant="flat"
                                    startContent={<FiShield />}
                                    onClick={() => {
                                        onToggleStatus(usuario);
                                        onClose();
                                    }}
                                >
                                    {isActive ? "Bloquear" : "Desbloquear"}
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    startContent={<FiTrash2 />}
                                    onClick={() => {
                                        onDelete(usuario);
                                        onClose();
                                    }}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="default"
                        variant="light"
                        startContent={<FiX />}
                        onPress={onClose}
                    >
                        Cerrar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {value}
            </span>
        </div>
    );
}
