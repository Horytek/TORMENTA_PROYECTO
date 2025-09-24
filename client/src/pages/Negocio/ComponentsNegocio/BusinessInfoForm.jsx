import React from 'react';
import { Input, Textarea } from '@heroui/react';

export default function BusinessInfoForm({ nombre, ruc, setNombre, setRuc, direccion, setDireccion }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-50/60 hover:border-blue-200 transition-colors p-6">
      <h2 className="text-lg font-semibold text-blue-900 mb-4">Información general</h2>
      <div className="grid md:grid-cols-1 gap-5">
        <Input
          label="Nombre del negocio"
          variant="bordered"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          isRequired
        />
        <Input 
         label ="RUC"
          variant="bordered"  
          value={ruc}
          onChange={e => setRuc(e.target.value)}
          isRequired
          />
        <Textarea
          label="Dirección"
          variant="bordered"
          minRows={2}
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          isRequired
        />
      </div>
    </div>
  );
}
