import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { FaSave, FaUndo } from 'react-icons/fa';

export default function FormActions({ 
  hasChanges, 
  saving, 
  resetChanges, 
  onSubmit 
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Tooltip content="Revertir cambios no guardados" color="primary" offset={8}>
        <Button
          type="button"
          variant="flat"
          color="primary"
          startContent={<FaUndo />}
          onClick={resetChanges}
          isDisabled={!hasChanges || saving}
          className="font-semibold"
        >
          Revertir
        </Button>
      </Tooltip>
      <Button
        type="submit"
        color="primary"
        startContent={<FaSave />}
        isDisabled={!hasChanges}
        isLoading={saving}
        className="font-semibold shadow-sm"
        onClick={onSubmit}
      >
        Guardar cambios
      </Button>
    </div>
  );
}
