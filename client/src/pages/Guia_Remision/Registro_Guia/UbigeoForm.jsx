import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Button,
  Chip,
  Divider,
  Spinner,
  Tooltip
} from '@heroui/react';
import { IoClose, IoCopy, IoRefresh } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import { getUbigeosGuia } from '@/services/guiaRemision.services';

/**
 * Nuevo diseño + lógica:
 * - Dependencias (Departamento -> Provincia -> Distrito) para Partida y Destino.
 * - Copiar valores de Partida a Destino.
 * - Reset independiente.
 * - Guardado deshabilitado mientras falten selecciones.
 * - Preindexación para O(1) obtención de id distrito.
 * - Evita parpadeos con loading controlado.
 */

const UbigeoForm = ({ modalTitle = 'Ubigeos', onClose, onSave, initialOrigenId, initialDestinoId }) => {
  const [ubigeos, setUbigeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  // Cargar ubigeos
  useEffect(() => {
    const fetchUbigeos = async () => {
      setLoading(true);
      const result = await getUbigeosGuia();
      if (result.success) {
        setUbigeos(result.data);
      } else {
        console.error('Error al cargar ubigeos');
        toast.error('No se pudieron cargar los ubigeos');
      }
      setLoading(false);
    };
    fetchUbigeos();
  }, []);

  // Estado estructurado
  const [partida, setPartida] = useState({ departamento: '', provincia: '', distrito: '' });
  const [destino, setDestino] = useState({ departamento: '', provincia: '', distrito: '' });

  // Indexación y estructuras derivadas
  const {
    departamentos,
    provinciasByDep,
    distritosByDepProv,
    distritoIdIndex
  } = useMemo(() => {
    if (!Array.isArray(ubigeos) || !ubigeos.length) {
      return {
        departamentos: [],
        provinciasByDep: {},
        distritosByDepProv: {},
        distritoIdIndex: {}
      };
    }

    const depsSet = new Set();
    const provinciasByDepTmp = {};
    const distritosByDepProvTmp = {};
    const distritoIdIdx = {};

    for (const u of ubigeos) {
      depsSet.add(u.departamento);

      // Provincias
      if (!provinciasByDepTmp[u.departamento]) provinciasByDepTmp[u.departamento] = new Set();
      provinciasByDepTmp[u.departamento].add(u.provincia);

      // Distritos
      const keyDepProv = `${u.departamento}__${u.provincia}`;
      if (!distritosByDepProvTmp[keyDepProv]) distritosByDepProvTmp[keyDepProv] = new Set();
      distritosByDepProvTmp[keyDepProv].add(u.distrito);

      // Índice rápido (dep|prov|dist) -> id
      distritoIdIdx[`${u.departamento}__${u.provincia}__${u.distrito}`] = u.id;
    }

    return {
      departamentos: Array.from(depsSet).sort(),
      provinciasByDep: Object.fromEntries(
        Object.entries(provinciasByDepTmp).map(([dep, setVals]) => [dep, Array.from(setVals).sort()])
      ),
      distritosByDepProv: Object.fromEntries(
        Object.entries(distritosByDepProvTmp).map(([k, setVals]) => [k, Array.from(setVals).sort()])
      ),
      distritoIdIndex: distritoIdIdx
    };
  }, [ubigeos]);

  // Si llegan IDs iniciales (ej: editar) – lookup inverso
  useEffect(() => {
    if (!ubigeos?.length) return;
    const findById = (id) => ubigeos.find(u => String(u.id) === String(id));
    if (initialOrigenId) {
      const o = findById(initialOrigenId);
      if (o) setPartida({ departamento: o.departamento, provincia: o.provincia, distrito: o.distrito });
    }
    if (initialDestinoId) {
      const d = findById(initialDestinoId);
      if (d) setDestino({ departamento: d.departamento, provincia: d.provincia, distrito: d.distrito });
    }
  }, [ubigeos, initialOrigenId, initialDestinoId]);

  // Helpers de opciones
  const getProvincias = useCallback((dep) => provinciasByDep[dep] || [], [provinciasByDep]);
  const getDistritos = useCallback((dep, prov) => distritosByDepProv[`${dep}__${prov}`] || [], [distritosByDepProv]);

  // Handlers genéricos
  const handleChange = (type, level, value) => {
    const setter = type === 'partida' ? setPartida : setDestino;
    const current = type === 'partida' ? partida : destino;

    if (level === 'departamento') {
      setter({ departamento: value, provincia: '', distrito: '' });
    } else if (level === 'provincia') {
      setter({ ...current, provincia: value, distrito: '' });
    } else if (level === 'distrito') {
      setter({ ...current, distrito: value });
    }
  };

  const copyPartidaToDestino = () => {
    if (!partida.departamento || !partida.provincia || !partida.distrito) {
      toast.error('Completa primero Partida antes de copiar.');
      return;
    }
    setDestino({ ...partida });
    toast.success('Copiado a Destino.');
  };

  const resetAll = () => {
    setPartida({ departamento: '', provincia: '', distrito: '' });
    setDestino({ departamento: '', provincia: '', distrito: '' });
  };

  // Validación
  const ready =
    partida.departamento && partida.provincia && partida.distrito &&
    destino.departamento && destino.provincia && destino.distrito;

  const handleSave = () => {
    if (!ready) {
      toast.error('Complete ambos bloques (origen y destino)');
      return;
    }

    const origenKey = `${partida.departamento}__${partida.provincia}__${partida.distrito}`;
    const destinoKey = `${destino.departamento}__${destino.provincia}__${destino.distrito}`;

    const origenId = distritoIdIndex[origenKey];
    const destinoId = distritoIdIndex[destinoKey];

    if (!origenId || !destinoId) {
      toast.error('No se pudo resolver ID(s) de ubigeo. Verifique los datos.');
      return;
    }

    onSave(origenId, destinoId);
    setOpen(false);
    onClose();
  };

  const closeInternal = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => {
        // HeroUI llama con boolean; si cierra desde teclado o programático
        if (!isOpen) closeInternal();
        else setOpen(true);
      }}
      isDismissable={false}
      hideCloseButton
      backdrop="transparent"          // transparente base
      shouldBlockScroll={false}       // evita bloqueo global scroll si no lo deseas
      classNames={{
        backdrop: "z-[1200] bg-white/10", // blur suave + ligera neblina
        base: "z-[1210] pointer-events-auto bg-white/65 dark:bg-zinc-900/70 supports-[backdrop-filter]:backdrop-blur-xl border border-blue-100/40 dark:border-zinc-700/50 shadow-2xl rounded-2xl",
        header: "px-6 py-4",
        body: "px-6 pb-4 pt-2",
        footer: "px-6 py-4 border-t border-blue-100/30 dark:border-zinc-700/40"
      }}
      size="4xl"
      scrollBehavior="outside"
      motionProps={{
        variants: {
          enter: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 12, scale: 0.97 }
        }
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">{modalTitle}</h2>
              <span className="text-[11px] text-blue-600/70 dark:text-blue-300/70">
                Seleccione los ubigeos de origen y destino
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content="Copiar Partida → Destino" color="primary" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={copyPartidaToDestino}
                >
                  <IoCopy className="text-base" />
                </Button>
              </Tooltip>
              <Tooltip content="Resetear todo" color="warning" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="warning"
                  onPress={resetAll}
                >
                  <IoRefresh className="text-base" />
                </Button>
              </Tooltip>
              <Tooltip content="Cerrar" color="danger" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={closeInternal}
                >
                  <IoClose className="text-lg" />
                </Button>
              </Tooltip>
            </div>
          </ModalHeader>

          <Divider className="mb-2" />

          <ModalBody>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner color="primary" />
                <p className="mt-3 text-sm text-blue-600 dark:text-blue-300">Cargando ubigeos…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Partida */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Partida</h3>
                    {partida.distrito && (
                      <Chip size="sm" color="primary" variant="flat" className="text-[10px]">
                        {partida.departamento} / {partida.provincia} / {partida.distrito}
                      </Chip>
                    )}
                  </div>
                  <Select
                    label="Departamento"
                    placeholder="Selecciona..."
                    selectedKeys={partida.departamento ? new Set([partida.departamento]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('partida', 'departamento', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {departamentos.map(dep => (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Provincia"
                    placeholder="Selecciona..."
                    isDisabled={!partida.departamento}
                    selectedKeys={partida.provincia ? new Set([partida.provincia]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('partida', 'provincia', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {getProvincias(partida.departamento).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Distrito"
                    placeholder="Selecciona..."
                    isDisabled={!partida.provincia}
                    selectedKeys={partida.distrito ? new Set([partida.distrito]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('partida', 'distrito', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {getDistritos(partida.departamento, partida.provincia).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Destino */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Destino</h3>
                    {destino.distrito && (
                      <Chip size="sm" color="secondary" variant="flat" className="text-[10px]">
                        {destino.departamento} / {destino.provincia} / {destino.distrito}
                      </Chip>
                    )}
                  </div>
                  <Select
                    label="Departamento"
                    placeholder="Selecciona..."
                    selectedKeys={destino.departamento ? new Set([destino.departamento]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('destino', 'departamento', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {departamentos.map(dep => (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Provincia"
                    placeholder="Selecciona..."
                    isDisabled={!destino.departamento}
                    selectedKeys={destino.provincia ? new Set([destino.provincia]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('destino', 'provincia', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {getProvincias(destino.departamento).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Distrito"
                    placeholder="Selecciona..."
                    isDisabled={!destino.provincia}
                    selectedKeys={destino.distrito ? new Set([destino.distrito]) : new Set()}
                    onSelectionChange={(keys) =>
                      handleChange('destino', 'distrito', Array.from(keys)[0] || '')
                    }
                    size="sm"
                  >
                    {getDistritos(destino.departamento, destino.provincia).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="flex items-center justify-between">
            <div className="text-[11px] text-blue-600/70 dark:text-blue-300/70">
              {ready
                ? 'Listo para guardar.'
                : 'Complete ambos: Departamento, Provincia y Distrito.'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                color="default"
                size="sm"
                onPress={closeInternal}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                size="sm"
                onPress={handleSave}
                isDisabled={!ready || loading}
              >
                Guardar
              </Button>
            </div>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

UbigeoForm.propTypes = {
  modalTitle: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialOrigenId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialDestinoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default UbigeoForm;