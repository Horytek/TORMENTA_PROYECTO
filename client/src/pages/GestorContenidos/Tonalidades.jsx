import React from "react";
import SimpleCrud from "@/components/SimpleCrud";

export default function Tonalidades() {
    return (
        <SimpleCrud
            title="Gestión de Tonalidades"
            subtitle="Administra las tonalidades o variantes de color."
            endpoint="/tonalidad"
            itemName="Tonalidad"
            columns={[
                { key: 'nombre', label: 'Nombre' },
                {
                    key: 'codigo_hex',
                    label: 'Color',
                    render: (val) => (
                        <div className="flex items-center gap-2">
                            {val ? (
                                <div
                                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-zinc-700 shadow-sm"
                                    style={{ backgroundColor: val }}
                                ></div>
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-transparent"></div>
                            )}
                            <span className="text-xs uppercase text-slate-500 font-mono">{val || "-"}</span>
                        </div>
                    )
                }
            ]}
            formFields={[
                { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Azul Marino', autoFocus: true },
                { name: 'codigo_hex', label: 'Color', type: 'color' }
            ]}
        />
    );
}
