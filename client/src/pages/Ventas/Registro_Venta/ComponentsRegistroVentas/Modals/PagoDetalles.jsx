import React from 'react';
import PropTypes from 'prop-types';
import { Input, Checkbox, Select, SelectItem } from "@heroui/react";

const PagoDetalles = ({
  totalImporte,
  metodo_pago,
  setmetodo_pago,
  disabledKeys1,
  options,
  montoRecibido,
  setMontoRecibido,
  validateDecimalInput,
  descuentoActivado,
  setDescuentoActivado,
  montoDescuento,
  setMontoDescuento,
  cambio,
  faltante,
}) => {
  return (
    <>
                        <div className="flex mb-4">
      {/* Total a pagar */}
      <Input
        label="Total a pagar"
        labelPlacement="outside"
        value={`S/. ${totalImporte}`}
        readOnly
        className="input-c w-40 ml-2"
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
      />

      {/* Método de pago */}
      <div style={{ marginLeft: "20px" }}>
        <Select
          isRequired
          label="Método de pago"
          labelPlacement="outside"
          placeholder="Método de pago"
          className={"input-c h-10 pr-8"}
          classNamediv={"flex items-center mt-2"}
          value={metodo_pago}
          style={{ width: '13rem' }}
          onChange={(e) => setmetodo_pago(e.target.value)}
          containerStyle={{ marginLeft: "5px" }}
          disabledKeys={disabledKeys1}
        >
          {options.map(({ key, value, label }) => (
            <SelectItem key={key} value={value}>
              {label}
            </SelectItem>
          ))}
        </Select>
      </div>
      </div>
      <div className="flex">
        <Input
          label="Monto recibido"
          labelPlacement="outside"
          placeholder="S/."
          value={montoRecibido}
          onChange={(e) => setMontoRecibido(e.target.value)}
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

        <div className="mb-4 ml-[45px]">
          <div className="flex items-center mt-2 space-x-3">
            <Checkbox
              isSelected={descuentoActivado}
              onValueChange={setDescuentoActivado}
              className="mt-1"
            >
              <span className="text-sm font-medium text-gray-700">S/.</span>
            </Checkbox>

            <Input
              type="text"
              value={montoDescuento}
              label="Aplicar descuento"
              labelPlacement="outside"
              placeholder="0.00"
              isDisabled={!descuentoActivado}
              onChange={(e) => {
                const { value } = e.target;
                if (/^\d*\.?\d{0,2}$/.test(value)) {
                  setMontoDescuento(value);
                } else if (value === '' || value === '.') {
                  setMontoDescuento(value);
                }
              }}
              onKeyDown={validateDecimalInput}
              className="w-[8.5rem]"
              classNames={{
                inputWrapper: descuentoActivado
                  ? "bg-white"
                  : "bg-gray-100",
                input: "text-base text-gray-700",
              }}
            />
          </div>
        </div>
      </div>

        <div className="flex mb-4">
            <div>
            {/* Cambio */}
            <Input
                label="Cambio"
                labelPlacement="outside"
                placeholder="S/."
                value={cambio >= 0 ? cambio.toFixed(2) : ""}
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
            <div className="ml-12 w-60">
            <Input
                label="Faltante"
                labelPlacement="outside"
                placeholder="S/."
                value={faltante >= 0 ? faltante.toFixed(2) : ""}
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
    </>
  );
};

PagoDetalles.propTypes = {
  totalImporte: PropTypes.number.isRequired,
  metodo_pago: PropTypes.string.isRequired,
  setmetodo_pago: PropTypes.func.isRequired,
  disabledKeys1: PropTypes.array.isRequired,
  options: PropTypes.array.isRequired,
  montoRecibido: PropTypes.string.isRequired,
  setMontoRecibido: PropTypes.func.isRequired,
  validateDecimalInput: PropTypes.func.isRequired,
  descuentoActivado: PropTypes.bool.isRequired,
  setDescuentoActivado: PropTypes.func.isRequired,
  montoDescuento: PropTypes.string.isRequired,
  setMontoDescuento: PropTypes.func.isRequired,
  cambio: PropTypes.number.isRequired,
  faltante: PropTypes.number.isRequired,
};

export default PagoDetalles;