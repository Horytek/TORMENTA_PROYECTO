import React from 'react';
import { Input, Textarea } from '@heroui/react';

export default function BusinessInfoForm({
  nombre, ruc, setNombre, setRuc,
  direccion, setDireccion,
  distrito, setDistrito,
  provincia, setProvincia,
  departamento, setDepartamento,
  codigoPostal, setCodigoPostal,
  email, setEmail,
  telefono, setTelefono,
  pais, setPais
}) {
  const glassInputClasses = {
    inputWrapper: "bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
    input: "text-slate-700 dark:text-slate-200 text-sm",
  };

  const glassAreaClasses = {
    inputWrapper: "bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
    input: "text-slate-700 dark:text-slate-200 text-sm",
  };

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <Input
          label="RUC"
          labelPlacement="outside"
          placeholder="Ej: 20100000001"
          value={ruc}
          onValueChange={setRuc}
          classNames={glassInputClasses}
        />
        <Input
          label="Nombre del negocio"
          labelPlacement="outside"
          placeholder="Ej: Mi Empresa S.A.C."
          value={nombre}
          onValueChange={setNombre}
          classNames={glassInputClasses}
        />
      </div>

      <Textarea
        label="Dirección Fiscal"
        labelPlacement="outside"
        placeholder="Ej: Av. Principal 123, Urb. Los Pinos"
        minRows={2}
        value={direccion}
        onValueChange={setDireccion}
        classNames={glassAreaClasses}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Input
          label="Departamento"
          labelPlacement="outside"
          placeholder="Ej: LIma"
          value={departamento}
          onValueChange={setDepartamento}
          classNames={glassInputClasses}
        />
        <Input
          label="Provincia"
          labelPlacement="outside"
          placeholder="Ej: Lima"
          value={provincia}
          onValueChange={setProvincia}
          classNames={glassInputClasses}
        />
        <Input
          label="Distrito"
          labelPlacement="outside"
          placeholder="Ej: Miraflores"
          value={distrito}
          onValueChange={setDistrito}
          classNames={glassInputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Input
          label="Código Postal"
          labelPlacement="outside"
          placeholder="Ej: 15046"
          value={codigoPostal}
          onValueChange={setCodigoPostal}
          classNames={glassInputClasses}
        />
        <Input
          label="País"
          labelPlacement="outside"
          placeholder="Ej: PE"
          value={pais}
          onValueChange={setPais}
          classNames={glassInputClasses}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Input
          label="Email de contacto"
          labelPlacement="outside"
          placeholder="contacto@empresa.com"
          value={email}
          onValueChange={setEmail}
          classNames={glassInputClasses}
        />
        <Input
          label="Teléfono"
          labelPlacement="outside"
          placeholder="Ej: 999888777"
          value={telefono}
          onValueChange={setTelefono}
          classNames={glassInputClasses}
        />
      </div>
    </div>
  );
}
