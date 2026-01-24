import React from "react";
import SimpleCrud from "@/components/SimpleCrud";

export default function Tallas() {
    return (
        <SimpleCrud
            title="Gestión de Tallas"
            subtitle="Administra las tallas de productos disponibles en el sistema."
            endpoint="/talla"
            itemName="Talla"
            columns={[
                { key: 'nombre', label: 'Nombre' },
                {
                    key: 'orden',
                    label: 'Orden',
                    render: (val) => (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                            {val || 0}
                        </span>
                    )
                }
            ]}
            formFields={[
                { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: XL', autoFocus: true },
                { name: 'orden', label: 'Orden', type: 'number', placeholder: 'Ej: 10' }
            ]}
        />
    );
}
