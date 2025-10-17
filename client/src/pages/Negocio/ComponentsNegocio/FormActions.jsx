import React from 'react';
import { Tooltip } from '@heroui/react';
import { FaSave, FaUndo } from 'react-icons/fa';
import { ActionButton } from "@/components/Buttons/Buttons";

export default function FormActions({ 
  hasChanges, 
  saving, 
  resetChanges, 
  onSubmit 
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center mt-8">
        <ActionButton
          type="button"
          color="blue"
          icon={<FaUndo className="w-5 h-5 text-blue-500" />}
          onClick={resetChanges}
          disabled={!hasChanges || saving}
          size="md"
          className="font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl px-6 py-3 shadow-none transition-colors"
        >
          Revertir
        </ActionButton>
      <ActionButton
        type="submit"
        color="blue"
        icon={<FaSave className="w-5 h-5 text-blue-500" />}
        disabled={!hasChanges}
        size="md"
        isLoading={saving}
        className="font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl px-6 py-3 shadow-none transition-colors"
        onClick={onSubmit}
        style={{ minWidth: 180 }}
      >
        Guardar cambios
      </ActionButton>
    </div>
  );
}