import React from 'react';
// import { cn } from '../../../../lib/utils'; // Removed to avoid redeclaration

// Simplest cn inline if not available:
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export const SectionShell = ({ children, className, id }) => {
    return (
        <section
            id={id}
            className={cn(
                "w-full relative overflow-hidden",
                "py-20 md:py-24 lg:py-32", // Mobile 80px, Desktop 128px approx
                className
            )}
        >
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {children}
            </div>
        </section>
    );
};
