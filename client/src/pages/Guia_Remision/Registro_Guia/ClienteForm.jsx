import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
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
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      backdrop="opaque"
      classNames={{
        backdrop: "bg-slate-900/50 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl",
        header: "px-6 py-4 border-b border-slate-100 dark:border-zinc-800",
        body: "px-6 py-4",
        footer: "px-6 py-4 border-t border-slate-100 dark:border-zinc-800"
      }}
      motionProps={{
        variants: {
          enter: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 12, scale: 0.97 }
        }
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-blue-100">{modalTitle}</h2>
            <p className="text-xs text-slate-500 font-normal">Ingrese los datos del destinatario para la guía</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs
            aria-label="Tipo de Cliente"
            selectedKey={tab}
            onSelectionChange={setTab}
            variant="underlined"
            color="primary"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-blue-500",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 font-medium"
            }}
          >
            <Tab key="registro" title="Persona Natural">
              <div className="mt-4 space-y-4">
                <form onSubmit={handleSave} className="space-y-4">
                  <Input
                    variant="flat"
                    label="DNI"
                    id="ruc-dni"
                    value={dniOrRuc}
                    onChange={handleInputChange}
                    placeholder="Ingrese el DNI"
                    isRequired
                    classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      variant="flat"
                      label="Nombres"
                      id="nombres"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Ingrese los nombres"
                      isRequired
                      classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                    />
                    <Input
                      variant="flat"
                      label="Apellidos"
                      id="apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Ingrese los apellidos"
                      isRequired
                      classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                    />
                  </div>
                  <Input
                    variant="flat"
                    label="Dirección"
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ingrese la dirección"
                    isRequired
                    classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                  />
                </form>
              </div>
            </Tab>
            <Tab key="otros" title="Persona Jurídica">
              <div className="mt-4 space-y-4">
                <form onSubmit={handleSave} className="space-y-4">
                  <Input
                    variant="flat"
                    label="RUC"
                    id="ruc-dni"
                    value={dniOrRuc}
                    onChange={handleInputChange}
                    placeholder="Ingrese el RUC"
                    isRequired
                    classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                  />
                  <Input
                    variant="flat"
                    label="Razón Social"
                    id="razonSocial"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ingrese la razón social"
                    isRequired
                    classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                  />
                  <Input
                    variant="flat"
                    label="Dirección"
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ingrese la dirección"
                    isRequired
                    classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
                  />
                </form>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" color="default" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} className="shadow-lg shadow-blue-500/20">
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