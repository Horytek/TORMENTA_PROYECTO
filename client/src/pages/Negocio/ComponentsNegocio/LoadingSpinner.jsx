import React from 'react';
import { Spinner } from '@heroui/react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-8 justify-center">
      <Spinner color="primary" size="lg" />
      <span className="text-blue-700 font-medium">Cargando configuración...</span>
    </div>
  );
}
