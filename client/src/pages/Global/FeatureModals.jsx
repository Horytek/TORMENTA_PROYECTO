import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useForm } from "react-hook-form";
import { Input, Checkbox } from "@heroui/react";

// Modal base reutilizable
function ModalBase({ isOpen, onClose, title, children }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-blue-100/60 dark:border-zinc-700/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100/40 dark:border-zinc-700/40 bg-gradient-to-r from-blue-50/60 via-white/80 to-blue-100/60 dark:from-zinc-900/80 dark:via-zinc-900/90 dark:to-zinc-900/80 rounded-t-2xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{title}</h3>
          <button
            className="rounded-full p-1 hover:bg-blue-100 dark:hover:bg-zinc-800 transition"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <IoMdClose className="text-2xl text-blue-400 dark:text-blue-200" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

ModalBase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

// ---------------------- AGREGAR ----------------------

import { Select, SelectItem } from "@heroui/react";

// ... (ModalBase stays same)

// ---------------------- AGREGAR ----------------------

export const AddFeatureModal = ({ isOpen, onClose, handleAddFeature }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      funcion: "",
      codigo: "",
      tipo_valor: "boolean",
      estado_funcion: true,
    },
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    await handleAddFeature(data);
    handleClose();
  });

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Agregar Característica">
      <form onSubmit={onSubmit} autoComplete="off">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Nombre
            </label>
            <Input
              {...register("funcion", { required: true })}
              placeholder="Ej: Usuarios Máximos"
              className="w-full"
              errorMessage={errors.funcion && "Campo obligatorio"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Código (Opcional)
              </label>
              <Input
                {...register("codigo")}
                placeholder="Ej: MAX_USERS"
                className="w-full"
                description="Identificador único para el sistema"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Tipo de Valor
              </label>
              <Select
                defaultSelectedKeys={["boolean"]}
                onChange={(e) => setValue('tipo_valor', e.target.value)}
                aria-label="Seleccionar tipo de valor"
                variant="bordered"
              >
                <SelectItem key="boolean" value="boolean">Interruptor (Sí/No)</SelectItem>
                <SelectItem key="numeric" value="numeric">Numérico (Límite)</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Sección / Módulo
              </label>
              <Select
                defaultSelectedKeys={["General"]}
                onChange={(e) => setValue('seccion', e.target.value)}
                aria-label="Seleccionar sección"
                variant="bordered"
              >
                <SelectItem key="General" value="General">General</SelectItem>
                <SelectItem key="Inventario" value="Inventario">Inventario</SelectItem>
                <SelectItem key="Ventas" value="Ventas">Ventas</SelectItem>
                <SelectItem key="Reportes" value="Reportes">Reportes</SelectItem>
                <SelectItem key="Configuración" value="Configuración">Configuración</SelectItem>
                <SelectItem key="Usuarios" value="Usuarios">Usuarios</SelectItem>
                <SelectItem key="Chatbot" value="Chatbot">Chatbot</SelectItem>
                <SelectItem key="Atajo de funciones" value="Atajo de funciones">Atajo de funciones</SelectItem>
                <SelectItem key="Clientes" value="Clientes">Clientes</SelectItem>
                <SelectItem key="Proveedores" value="Proveedores">Proveedores</SelectItem>
                <SelectItem key="Compras" value="Compras">Compras</SelectItem>
                <SelectItem key="Financiero" value="Financiero">Financiero</SelectItem>
                <SelectItem key="RRHH" value="RRHH">RRHH</SelectItem>
                <SelectItem key="TPV" value="TPV">TPV</SelectItem>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-blue-100/50 dark:border-zinc-700/50">
            <Checkbox {...register("estado_funcion")} defaultSelected size="lg">
              <span className="font-medium text-slate-700 dark:text-slate-200">Característica Activa</span>
            </Checkbox>
            <p className="text-xs text-slate-400 mt-1 ml-8">
              Si se desactiva, esta característica no estará disponible para asignación en ningún plan.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <ButtonClose onClick={handleClose} />
          <ButtonSave type="submit" label="Guardar Característica" />
        </div>
      </form>
    </ModalBase>
  );
};

AddFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleAddFeature: PropTypes.func.isRequired,
};

// ---------------------- EDITAR ----------------------

export const EditFeatureModal = ({
  isOpen,
  onClose,
  selectedFeature,
  handleEditFeature,
  plans
}) => {
  const [funcion, setFuncion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tipoValor, setTipoValor] = useState("boolean");
  const [seccion, setSeccion] = useState("General");
  const [estadoFuncion, setEstadoFuncion] = useState(true);
  const [allocation, setAllocation] = useState({});

  useEffect(() => {
    if (isOpen && selectedFeature) {
      setFuncion(selectedFeature.funcion || "");
      setCodigo(selectedFeature.codigo || "");
      setTipoValor(selectedFeature.tipo_valor || "boolean");
      setSeccion(selectedFeature.seccion || "General");
      setEstadoFuncion(selectedFeature.estado_funcion === 1);

      // Initialize allocations from plans
      const initialAllocation = {};
      if (plans && plans.length > 0) {
        plans.forEach(plan => {
          const assignment = plan.funciones_detalles?.find(f => f.id_funcion == selectedFeature.id_funciones);
          initialAllocation[plan.id_plan] = {
            enabled: !!assignment,
            value: assignment ? assignment.valor : (selectedFeature.tipo_valor === 'numeric' ? '0' : 'true')
          };
        });
      }
      setAllocation(initialAllocation);
    }
  }, [isOpen, selectedFeature, plans]);

  const handleClose = () => {
    setFuncion("");
    setCodigo("");
    setTipoValor("boolean");
    setSeccion("General");
    setEstadoFuncion(true);
    setAllocation({});
    onClose();
  };

  const handleAllocationChange = (planId, field, value) => {
    setAllocation(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcion) return;

    // 1. Update Feature Definition
    await handleEditFeature({
      funcion,
      codigo,
      tipo_valor: tipoValor,
      seccion,
      estado_funcion: estadoFuncion ? 1 : 0,
      allocations: allocation // Pass allocations to be handled by parent or here
    });

    handleClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Editar Característica">
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Nombre
            </label>
            <Input
              value={funcion}
              onChange={(e) => setFuncion(e.target.value)}
              placeholder="Nombre de la característica..."
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Código
              </label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: MAX_USERS"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Tipo de Valor
              </label>
              <Select
                selectedKeys={[tipoValor]}
                onChange={(e) => setTipoValor(e.target.value)}
                aria-label="Seleccionar tipo de valor"
                variant="bordered"
              >
                <SelectItem key="boolean" value="boolean">Interruptor (Sí/No)</SelectItem>
                <SelectItem key="numeric" value="numeric">Numérico (Límite)</SelectItem>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Sección / Módulo
              </label>
              <Select
                selectedKeys={[seccion]}
                onChange={(e) => setSeccion(e.target.value)}
                aria-label="Seleccionar sección"
                variant="bordered"
              >
                <SelectItem key="General" value="General">General</SelectItem>
                <SelectItem key="Dashboard" value="Dashboard">Dashboard</SelectItem>

                <SelectItem key="Productos" value="Productos">Productos</SelectItem>
                <SelectItem key="Ventas" value="Ventas">Ventas</SelectItem>
                <SelectItem key="Reportes" value="Reportes">Reportes</SelectItem>

                <SelectItem key="Clientes" value="Clientes">Clientes</SelectItem>
                <SelectItem key="Empleados" value="Empleados">Empleados</SelectItem>
                <SelectItem key="Proveedores" value="Proveedores">Proveedores</SelectItem>

                <SelectItem key="Kárdex" value="Kárdex">Kárdex</SelectItem>
                <SelectItem key="Almacenes" value="Almacenes">Almacenes</SelectItem>
                <SelectItem key="Sucursal" value="Sucursal">Sucursal</SelectItem>

                <SelectItem key="Usuarios" value="Usuarios">Usuarios</SelectItem>
                <SelectItem key="Roles y permisos" value="Roles y permisos">Roles y permisos</SelectItem>
                <SelectItem key="Logs" value="Logs">Logs</SelectItem>
                <SelectItem key="Negocio" value="Negocio">Negocio</SelectItem>
                <SelectItem key="Llamadas" value="Llamadas">Llamadas</SelectItem>

                <SelectItem key="Desarrollo" value="Desarrollo">Desarrollo</SelectItem>
                <SelectItem key="Módulos" value="Módulos">Módulos</SelectItem>
                <SelectItem key="Permisos Globales" value="Permisos Globales">Permisos Globales</SelectItem>
                <SelectItem key="Limpiador DB" value="Limpiador DB">Limpiador DB</SelectItem>
                <SelectItem key="Inf. empresas" value="Inf. empresas">Inf. empresas</SelectItem>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Disponibilidad por Plan
            </label>
            <div className="space-y-3">
              {plans && plans.map(plan => (
                <div key={plan.id_plan} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      isSelected={allocation[plan.id_plan]?.enabled}
                      onValueChange={(val) => handleAllocationChange(plan.id_plan, 'enabled', val)}
                      size="md"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{plan.descripcion_plan}</span>
                    </Checkbox>
                  </div>
                  {tipoValor === 'numeric' && allocation[plan.id_plan]?.enabled && (
                    <div className="w-24">
                      <Input
                        type="number"
                        size="sm"
                        placeholder="0"
                        value={allocation[plan.id_plan]?.value}
                        onChange={(e) => handleAllocationChange(plan.id_plan, 'value', e.target.value)}
                        classNames={{ input: "text-center" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-blue-100/50 dark:border-zinc-700/50">
            <Checkbox
              isSelected={estadoFuncion}
              onValueChange={setEstadoFuncion}
              size="lg"
            >
              <span className="font-medium text-slate-700 dark:text-slate-200">Característica Activa</span>
            </Checkbox>
            <p className="text-xs text-slate-400 mt-1 ml-8">
              Si se desactiva, esta característica no estará disponible para asignación en ningún plan.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <ButtonClose onClick={handleClose} />
          <ButtonSave type="submit" label="Guardar Cambios" />
        </div>
      </form>
    </ModalBase>
  );
};

EditFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedFeature: PropTypes.object,
  handleEditFeature: PropTypes.func.isRequired,
  plans: PropTypes.array,
};
