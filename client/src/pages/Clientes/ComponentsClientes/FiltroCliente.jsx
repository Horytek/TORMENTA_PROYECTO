import React, { useState } from "react";
import { Select, SelectItem } from "@nextui-org/react";

const FiltroCliente = ({ onFilter }) => {
    const [documentType, setDocumentType] = useState("");

    const handleChange = (value) => {
        setDocumentType(value);
        if (onFilter) {
            onFilter({ type: value });
        }
    };

    return (
        <Select
            label="Tipo de documento"
            value={documentType}
            onChange={handleChange}
            className="w-64"
        >
            <SelectItem key="dni" value="dni">
                DNI
            </SelectItem>
            <SelectItem key="ruc" value="ruc">
                RUC
            </SelectItem>
        </Select>
    );
};

export default FiltroCliente;