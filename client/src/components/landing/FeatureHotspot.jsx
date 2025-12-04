import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const FeatureHotspot = ({
    label,
    imageSrc,
    description,
    positionClass = "",
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div
            ref={containerRef}
            className={`absolute z-30 ${positionClass}`}
        >
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-white/20 transition-colors group"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary-color animate-pulse" />
                        <span className="text-sm font-medium text-white group-hover:text-primary-color transition-colors">
                            {label}
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-[300px] sm:w-[350px] bg-[#1a1b23]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-white">{label}</h4>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="relative aspect-[4/3] w-full bg-black/20">
                            <img
                                src={imageSrc}
                                alt={label}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        <div className="p-4 bg-white/5">
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
