
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonClose } from "@/components/Buttons/Buttons";
import { getProductAttributes } from "@/services/productos.services";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
    Tooltip,
    Spinner
} from "@heroui/react";
import { FaBoxOpen, FaRuler, FaPalette } from "react-icons/fa";

export const ViewVariantsModal = ({ productId, productName, onClose, isOpen }) => {
    const [loading, setLoading] = useState(true);
    const [attributes, setAttributes] = useState({ tonalidades: [], tallas: [] });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && productId) {
            fetchAttributes();
        }
    }, [isOpen, productId]);

    const fetchAttributes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProductAttributes(productId);
            if (data) {
                setAttributes(data);
            }
        } catch (err) {
            console.error("Error fetching attributes:", err);
            setError("No se pudieron cargar las variantes.");
        } finally {
            setLoading(false);
        }
    };

    const { tonalidades, tallas } = attributes;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            backdrop="blur"
            classNames={{
                backdrop: "bg-slate-900/40 backdrop-blur-md z-[10005]",
                wrapper: "z-[10006] overflow-hidden",
                base: "z-[10007] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden",
                header: "border-b border-slate-100 dark:border-zinc-800 py-3 px-6 bg-white dark:bg-zinc-900",
                body: "py-6 px-6",
                footer: "border-t border-slate-100 dark:border-zinc-800 py-3 px-6 bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-sm"
            }}
        >
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <span className="text-xl font-bold text-slate-800 dark:text-white">Variantes del Producto</span>
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{productName}</span>
                        </ModalHeader>
                        <ModalBody className="min-h-[300px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                    <Spinner size="lg" color="primary" />
                                    <p className="text-slate-400 text-sm">Cargando variantes...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-danger-500">
                                    <FaBoxOpen size={40} className="opacity-50" />
                                    <p>{error}</p>
                                </div>
                            ) : (tonalidades.length === 0 && tallas.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-slate-400">
                                    <FaBoxOpen size={40} className="opacity-30" />
                                    <p>Este producto no tiene variantes registradas.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Tonalidades */}
                                        <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                                <FaPalette className="text-pink-500" />
                                                Tonalidades ({tonalidades.length})
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tonalidades.length > 0 ? tonalidades.map(t => (
                                                    <Tooltip key={t.id} content={t.nombre} closeDelay={0}>
                                                        <div
                                                            className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm cursor-help hover:scale-110 transition-transform"
                                                            style={{ backgroundColor: t.hex || '#000' }}
                                                        />
                                                    </Tooltip>
                                                )) : <span className="text-xs text-slate-400">Sin tonalidades</span>}
                                            </div>
                                        </div>

                                        {/* Tallas */}
                                        <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                                <FaRuler className="text-blue-500" />
                                                Tallas ({tallas.length})
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tallas.length > 0 ? tallas.map(t => (
                                                    <Chip key={t.id} size="sm" variant="flat" className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                                                        {t.nombre}
                                                    </Chip>
                                                )) : <span className="text-xs text-slate-400">Sin tallas</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <ButtonClose onPress={onClose} text="Cerrar" />
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

ViewVariantsModal.propTypes = {
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productName: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
};

export default ViewVariantsModal;
