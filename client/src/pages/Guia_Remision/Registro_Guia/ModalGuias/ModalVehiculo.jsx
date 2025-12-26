import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave } from '@/components/Buttons/Buttons';
import { addVehiculo } from '@/services/guiaRemision.services';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from '@heroui/react';

export const ModalVehiculo = ({ modalTitle, closeModel, onVehiculoSaved }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            placa: '',
            tipo: '',
        }
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            const { placa, tipo } = data;
            const newVehiculo = {
                placa: placa.toUpperCase().trim(),
                tipo: tipo.toUpperCase().trim(),
            };

            const result = await addVehiculo(newVehiculo, closeModel); // Llamada a la API para añadir el vehículo
            if (result.success) {
                toast.success(result.message);
                onVehiculoSaved(newVehiculo.placa); // Llama a la función para actualizar la placa
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al añadir el vehículo");
        }
    });

    return (
        <Modal
            isOpen={true}
            onClose={closeModel}
            size="md"
            backdrop="blur"
            classNames={{
                backdrop: "z-[1200] bg-white/10",
                base: "z-[1210] pointer-events-auto bg-white/80 dark:bg-zinc-900/80 supports-[backdrop-filter]:backdrop-blur-xl border border-blue-100/40 dark:border-zinc-700/50 shadow-2xl rounded-2xl",
                header: "px-6 py-4 border-b border-blue-100/30 dark:border-zinc-700/40",
                body: "px-6 pb-4 pt-4",
                footer: "px-6 py-4 border-t border-blue-100/30 dark:border-zinc-700/40"
            }}
            motionProps={{
                variants: {
                    enter: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 12, scale: 0.97 }
                }
            }}
        >
            <Toaster />
            <ModalContent>
                <form onSubmit={onSubmit} className="flex flex-col h-full w-full">
                    <ModalHeader>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-blue-100">{modalTitle}</h2>
                            <p className="text-xs text-slate-500 font-normal">Registre un nuevo vehículo</p>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="w-full">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 mb-1 block">Placa</label>
                                <input
                                    {...register('placa', { required: true })}
                                    type="text"
                                    className={`w-full px-3 py-2 text-sm bg-white/50 dark:bg-zinc-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.placa
                                            ? 'border-red-400 focus:ring-red-200 text-red-700 placeholder:text-red-300'
                                            : 'border-slate-200/50 focus:border-blue-400 focus:ring-blue-100 text-slate-800'
                                        }`}
                                    placeholder="Ej: ABC-123"
                                />
                                {errors.placa && <span className="text-[10px] text-red-500 ml-1 mt-1">Campo requerido</span>}
                            </div>

                            <div className="w-full">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 mb-1 block">Tipo</label>
                                <input
                                    {...register('tipo', { required: true })}
                                    type="text"
                                    className={`w-full px-3 py-2 text-sm bg-white/50 dark:bg-zinc-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.tipo
                                            ? 'border-red-400 focus:ring-red-200 text-red-700 placeholder:text-red-300'
                                            : 'border-slate-200/50 focus:border-blue-400 focus:ring-blue-100 text-slate-800'
                                        }`}
                                    placeholder="Ej: Furgón, Camión..."
                                />
                                {errors.tipo && <span className="text-[10px] text-red-500 ml-1 mt-1">Campo requerido</span>}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className='flex justify-end gap-2 w-full'>
                            <Button
                                variant="flat"
                                color="default"
                                onPress={closeModel}
                                className="font-medium"
                            >
                                Cancelar
                            </Button>
                            <ButtonSave type="submit" label="Guardar Vehículo" className="shadow-lg shadow-blue-500/20" />
                        </div>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

ModalVehiculo.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
    onVehiculoSaved: PropTypes.func.isRequired,
};

export default ModalVehiculo;
