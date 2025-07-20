import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/react";

const FiltroCliente = ({ docType = "", onFilter }) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set([docType]));

  useEffect(() => {
    setSelectedKeys(new Set([docType]));
  }, [docType]);

  const handleSelectionChange = (keys) => {
    setSelectedKeys(keys);
    const newValue = Array.from(keys)[0] || "";
    if (onFilter) {
      onFilter({ docType: newValue });
    }
  };

  return (
    <div className="flex gap-4 items-end pb-4">
      <Select
        label="Tipo de documento"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        className="w-48"
        selectionMode="single"
      >
        <SelectItem key="" value="">Todos</SelectItem>
        <SelectItem key="dni" value="dni">DNI</SelectItem>
        <SelectItem key="ruc" value="ruc">RUC</SelectItem>
      </Select>
    </div>
  );
};

export default FiltroCliente;