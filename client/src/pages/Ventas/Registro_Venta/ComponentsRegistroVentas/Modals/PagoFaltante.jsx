import React from 'react';
import PropTypes from 'prop-types';
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/react";
import InputField from '../Inputs/PagarInputs';

const PagoFaltante = ({
  faltante,
  montoRecibido2,
  setMontoRecibido2,
  validateDecimalInput,
  metodo_pago2,
  setmetodo_pago2,
  disabledKeys2,
  options,
  cambio2,
  faltante2,
}) => {
  return (
    <div>
      <div className="flex justify-center text-center mb-4">
        <InputField
          label="Total a pagar"
          symbol="S/."
          value={faltante.toFixed(2)}
          readOnly
          style={{
            height: "40px",
            border: "1px solid #ccc",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            padding: "0 12px",
            fontSize: "16px",
            color: "#333",
            outline: "none",
            boxShadow: "inset 0 0 5px rgba(0, 0, 0, 0.1)",
            transition: "box-shadow 0.3s ease",
          }}
          className="input-c w-40 ml-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex mb-4">
        <Input
          label="N°2 || Monto recibido"
          labelPlacement="outside"
          placeholder="S/."
          value={montoRecibido2}
          onChange={(e) => setMontoRecibido2(e.target.value)}
          pattern="[0-9]*[.]?[0-9]{0,2}"
          onKeyDown={validateDecimalInput}
          className="input-c w-40 ml-2"
          style={{
            height: "40px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "0 12px",
            fontSize: "16px",
            color: "#333",
            outline: "none",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        />
        <div style={{ marginLeft: "20px" }}>
          <Select
            isRequired
            label="Método de pago"
            labelPlacement="outside"
            placeholder="Método de pago"
            className={"input-c h-10 pr-8"}
            classNamediv={"flex items-center mt-2"}
            value={metodo_pago2}
            style={{ width: '13rem' }}
            onChange={(e) => setmetodo_pago2(e.target.value)}
            containerStyle={{ marginLeft: "5px" }}
            disabledKeys={disabledKeys2}
          >
            {options.map(({ key, value, label }) => (
              <SelectItem key={key} value={value}>
                {label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex mb-4">
        <Input
          label="Cambio"
          labelPlacement="outside"
          placeholder="S/."
          value={cambio2 >= 0 ? cambio2.toFixed(2) : ''}
          readOnly
          className="input-c w-40 ml-2"
          style={{
            height: "40px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "0 12px",
            fontSize: "16px",
            color: "#333",
            outline: "none",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        />
        <div className="ml-12 w-60">
          <Input
            label="Faltante"
            labelPlacement="outside"
            placeholder="S/."
            value={faltante2 >= 0 ? faltante2.toFixed(2) : ''}
            readOnly
            className="input-c w-40 ml-2"
            style={{
              height: "40px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "0 12px",
              fontSize: "16px",
              color: "#333",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
          />
        </div>
      </div>
      <hr className="mb-5" />
    </div>
  );
};

PagoFaltante.propTypes = {
  faltante: PropTypes.number.isRequired,
  montoRecibido2: PropTypes.string.isRequired,
  setMontoRecibido2: PropTypes.func.isRequired,
  validateDecimalInput: PropTypes.func.isRequired,
  metodo_pago2: PropTypes.string.isRequired,
  setmetodo_pago2: PropTypes.func.isRequired,
  disabledKeys2: PropTypes.array.isRequired,
  options: PropTypes.array.isRequired,
  cambio2: PropTypes.number.isRequired,
  faltante2: PropTypes.number.isRequired,
};

export default PagoFaltante;