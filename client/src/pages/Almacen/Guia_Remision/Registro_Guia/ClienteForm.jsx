import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from 'react-hot-toast';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody
} from '@heroui/react';
import { IoMdClose } from "react-icons/io";
import { addDestinatarioNatural, addDestinatarioJuridico } from '@/services/guiaRemision.services';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro');
  const [dniOrRuc, setDniOrRuc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [direccion, setDireccion] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');

  useEffect(() => {
    const fetchSunatData = async () => {
      if (dniOrRuc.length === 8 || dniOrRuc.length === 11) {
        const url = tipoCliente === 'Natural'
          ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`
          : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`;

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.success === true) {
            if (tipoCliente === 'Natural') {
              setNombres(data.nombres || '');
              setApellidos(`${data.apellidoPaterno} ${data.apellidoMaterno}` || '');
              setDireccion(data.direccion || '');
            } else if (tipoCliente === 'Juridico') {
              setRazonSocial(data.razonSocial || '');
              setDireccion(data.direccion || '');
            }
          } else {
            toast.error('DNI/RUC no válido');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Error al conectarse a SUNAT');
        }
      }
    };

    fetchSunatData();
  }, [dniOrRuc, tipoCliente]);

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    if (id === 'ruc-dni') {
      const filteredValue = value.replace(/[^\d]/g, '').slice(0, tab === 'registro' ? 8 : 11);
      setDniOrRuc(filteredValue);
      setTipoCliente(filteredValue.length === 8 ? 'Natural' : filteredValue.length === 11 ? 'Juridico' : '');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (tab === 'registro') {
      if (dniOrRuc.length !== 8 || isNaN(dniOrRuc)) {
        toast.error('El DNI debe tener 8 dígitos y solo contener números.');
        return;
      }
      if (!nombres || !apellidos || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataNatural = { dni: dniOrRuc, nombres, apellidos, ubicacion: direccion };
      const result = await addDestinatarioNatural(dataNatural);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success('Destinatario natural añadido exitosamente');
        onClose();
      }
    } else if (tab === 'otros') {
      if (dniOrRuc.length !== 11 || isNaN(dniOrRuc)) {
        toast.error('El RUC debe tener 11 dígitos y solo contener números.');
        return;
      }
      if (!razonSocial || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataJuridica = { ruc: dniOrRuc, razon_social: razonSocial, ubicacion: direccion };
      const result = await addDestinatarioJuridico(dataJuridica);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success('Destinatario jurídico añadido exitosamente');
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <Toaster />
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Tipo de Cliente" selectedKey={tab} onSelectionChange={setTab}>
            <Tab key="registro" title="Persona Natural">
              <Card>
                <CardBody>
                  <form onSubmit={handleSave} className="space-y-4">
                    <Input
                      label="DNI"
                      id="ruc-dni"
                      value={dniOrRuc}
                      onChange={handleInputChange}
                      placeholder="Ingrese el DNI"
                      isRequired
                    />
                    <Input
                      label="Nombres"
                      id="nombres"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Ingrese los nombres"
                      isRequired
                    />
                    <Input
                      label="Apellidos"
                      id="apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Ingrese los apellidos"
                      isRequired
                    />
                    <Input
                      label="Dirección"
                      id="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ingrese la dirección"
                      isRequired
                    />
                  </form>
                </CardBody>
              </Card>
            </Tab>
            <Tab key="otros" title="Persona Jurídica">
              <Card>
                <CardBody>
                  <form onSubmit={handleSave} className="space-y-4">
                    <Input
                      label="RUC"
                      id="ruc-dni"
                      value={dniOrRuc}
                      onChange={handleInputChange}
                      placeholder="Ingrese el RUC"
                      isRequired
                    />
                    <Input
                      label="Razón Social"
                      id="razonSocial"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ingrese la razón social"
                      isRequired
                    />
                    <Input
                      label="Dirección"
                      id="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ingrese la dirección"
                      isRequired
                    />
                  </form>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

ClienteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ClienteForm;