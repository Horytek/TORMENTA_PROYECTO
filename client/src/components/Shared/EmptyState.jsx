import React from 'react';

const EmptyState = ({
    title = "No se encontraron resultados",
    description = "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.",
    icon
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center w-full">
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-full mb-4 shadow-sm border border-slate-100 dark:border-zinc-800">
                <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-1 font-inter">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default EmptyState;
