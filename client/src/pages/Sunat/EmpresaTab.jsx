import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Divider,
} from "@nextui-org/react";
import { toast } from "react-hot-toast";

const EmpresaTab = () => {
  const [formData, setFormData] = useState({
    ruc: "20123456789",
    razonSocial: "EMPRESA DEMO S.A.C.",
    nombreComercial: "DEMO COMPANY",
    direccion: "AV. PRINCIPAL 123",
    distrito: "SAN ISIDRO",
    provincia: "LIMA",
    departamento: "LIMA",
    codigoPostal: "15001",
    telefono: "01-1234567",
    email: "contacto@empresa-demo.com",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Datos guardados:", formData);
    toast.success("Datos de la empresa guardados correctamente");
  };

  const inputStyle = {
    border: "none",
    boxShadow: "none",
    outline: "none",
  };

  return (
    <Card className="p-6 shadow-2xl rounded-2xl max-w-4xl mx-auto">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-3xl font-semibold text-neutral-800">Empresa</h2>
        <p className="text-sm text-neutral-500">
          Complete cuidadosamente los datos fiscales y de contacto.
        </p>
      </CardHeader>

      <Divider className="my-2" />

      <CardBody className="space-y-8">
        {/* Información General */}
        <section>
          <h4 className="text-lg font-medium text-neutral-700 mb-4">Información General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="RUC *"
              name="ruc"
              value={formData.ruc}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Razón Social *"
              name="razonSocial"
              value={formData.razonSocial}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Nombre Comercial"
              name="nombreComercial"
              value={formData.nombreComercial}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Email *"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>
        </section>

        {/* Dirección */}
        <section>
          <h4 className="text-lg font-medium text-neutral-700 mb-4">Dirección Fiscal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Dirección *"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Distrito *"
              name="distrito"
              value={formData.distrito}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Provincia *"
              name="provincia"
              value={formData.provincia}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Departamento *"
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <Input
              label="Código Postal"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>
        </section>

        {/* Contacto */}
        <section>
          <h4 className="text-lg font-medium text-neutral-700 mb-4">Contacto</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>
        </section>

        {/* Botón de Acción */}
        <div className="flex justify-end">
          <Button
            color="primary"
            className="px-6 py-2 text-sm font-medium"
            onClick={handleSave}
          >
            Guardar Datos
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default EmpresaTab;
