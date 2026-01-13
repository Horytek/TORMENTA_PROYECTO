import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className, hoverEffect = true, onClick }) => {
    return (
        <motion.div
            whileHover={hoverEffect ? { y: -4 } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClick}
            className={`
        relative group overflow-hidden
        bg-[var(--premium-bg2)] 
        border border-[var(--premium-border)]
        rounded-[var(--radius-card)]
        shadow-[var(--shadow-soft)]
        backdrop-blur-[var(--blur-glass)]
        ${hoverEffect ? 'hover:border-white/20 hover:shadow-2xl' : ''}
        ${className || ''}
      `}
        >
            {/* Subtle Gradient Overlay on Hover - Fixed Opacity Handling */}
            {hoverEffect && (
                <div
                    className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
