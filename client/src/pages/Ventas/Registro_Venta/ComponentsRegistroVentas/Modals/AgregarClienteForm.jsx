import React from 'react';
import PropTypes from 'prop-types';
import { IoPersonAddSharp } from 'react-icons/io5';
import { GrValidate } from 'react-icons/gr';
import { Button } from '@heroui/react';
import InputField from '../Inputs/PagarInputs';
import SelectField from '../Inputs/PagarSelectField';

const AgregarClienteForm = ({
  tipo_cliente,
  settipo_cliente,
  dniOrRuc,
  setDni,
  nombreCliente,
  direccionCliente,
  handleValidate,
  handleGuardarClientes,
  setShowNuevoCliente,
}) => {
  return (
    <div className="pt-0 py-4 pl-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex">
        <IoPersonAddSharp className="mr-2" style={{ fontSize: '25px' }} />
        Agregar Cliente
      </h3>
      <div className="flexflex-col mb-4">
        <div className="w-full">
          <SelectField
            label="Tipo de cliente"
            options={['Natural', 'Jurídico']}
            value={tipo_cliente}
            onChange={(e) => settipo_cliente(e.target.value)}
            className={"input-c w-full h-10 border border-gray-300 pr-8"}
            classNamediv={"flex items-center mt-2 "}
          />
        </div>
      </div>

      <div className="flex justify-between mb-4 ml-2">
        <div className="w-full">
          <InputField
            placeholder="EJEM: 78541236"
            label="DNI/RUC: *"
            className="input-c "
            style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '11rem' }}
            value={dniOrRuc}
            onChange={(e) => setDni(e.target.value)}
          />
        </div>
        <div className="flex flex-col justify-end ml-4">
          <Button
            type="button"
            color="success"
            variant="shadow"
            className="btn-validar text-white px-5 flex py-2 rounded"
            style={{ height: "40px", marginTop: "10px" }}
            onClick={handleValidate}
          >
            <GrValidate className="mr-2" style={{ fontSize: '20px' }} />
            Validar
          </Button>
        </div>
      </div>

      <div className="flex justify-between mb-4 ml-2 ">
        <div className="w-full">
          <InputField
            placeholder="EJEM: Juan Perez"
            label="Nombre del cliente / Razón social * "
            className="input-c w-full"
            style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
            value={nombreCliente}
            readOnly
          />
        </div>
      </div>
      <div className="flex justify-between mb-4 ml-2 ">
        <div className="w-full">
          <InputField
            type="address"
            placeholder="EJEM: Balta y Leguia"
            label="Dirección"
            className="input-c w-full"
            style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
            value={direccionCliente}
            readOnly
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          className="btn-aceptar-cliente text-white px-4 py-2 rounded"
          onClick={handleGuardarClientes}
        >
          Guardar
        </Button>
        <Button
          type="button"
          className="btn-cerrar text-white px-4 py-2 rounded ml-4"
          onClick={() => setShowNuevoCliente(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

AgregarClienteForm.propTypes = {
  tipo_cliente: PropTypes.string.isRequired,
  settipo_cliente: PropTypes.func.isRequired,
  dniOrRuc: PropTypes.string.isRequired,
  setDni: PropTypes.func.isRequired,
  nombreCliente: PropTypes.string.isRequired,
  direccionCliente: PropTypes.string.isRequired,
  handleValidate: PropTypes.func.isRequired,
  handleGuardarClientes: PropTypes.func.isRequired,
  setShowNuevoCliente: PropTypes.func.isRequired,
};

export default AgregarClienteForm;