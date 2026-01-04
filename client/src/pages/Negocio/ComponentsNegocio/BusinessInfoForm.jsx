import React from 'react';
import { Input, Textarea } from '@heroui/react';

export default function BusinessInfoForm({ nombre, ruc, setNombre, setRuc, direccion, setDireccion }) {
  const glassInputClasses = {
    inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
    input: "text-slate-700 dark:text-slate-200 text-sm",
  };

  const glassAreaClasses = {
    inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
    input: "text-slate-700 dark:text-slate-200 text-sm",
  };

  return (
    <div className="grid md:grid-cols-1 gap-5">
      <Input
        label="Nombre del negocio"
        labelPlacement="outside"
        placeholder="Ej: Mi Empresa S.A.C."
        value={nombre}
        onValueChange={setNombre}
        classNames={glassInputClasses}
      />
      <Input
        label="RUC"
        labelPlacement="outside"
        placeholder="Ej: 20100000001"
        value={ruc}
        onValueChange={setRuc}
        classNames={glassInputClasses}
      />
      <Textarea
        label="Dirección"
        labelPlacement="outside"
        placeholder="Ej: Av. Principal 123, Lima"
        minRows={3}
        value={direccion}
        onValueChange={setDireccion}
        classNames={glassAreaClasses}
      />
    </div>
  );
}
