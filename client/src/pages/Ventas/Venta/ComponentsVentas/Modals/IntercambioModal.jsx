import React, { useState, useEffect } from 'react';
// HeroUI
import {
  Modal, ModalContent, ModalHeader, ModalFooter, ModalBody,
  Button, Input, Select, SelectItem, Card, CardBody, Chip
} from "@heroui/react";
import { Search } from "lucide-react";
import axios from "@/api/axios"; // usa baseURL = VITE_API_URL + "/api"
import { useUserStore } from "@/store/useStore";

const IntercambioModal = ({ isOpen, onClose, venta, onConfirm }) => {
  const [step, setStep] = useState(1); // 1: Seleccionar detalle, 2: Seleccionar nuevo producto
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedNewProduct, setSelectedNewProduct] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const nombre = useUserStore((state) => state.nombre); // usuario desde Zustand

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDetalle(null);
      setSelectedNewProduct(null);
      setSearchTerm("");
      setSearchResults([]);
      setCantidad(1);
    }
  }, [isOpen]);

  // Debounce manual para búsqueda 
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() && step === 2) {
        handleSearch();
      } else if (!searchTerm.trim()) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, step]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      // Construir params sin hardcodear URL
      const params = {};
      if (venta?.id_sucursal) {
        params.id_sucursal = venta.id_sucursal; // prioriza filtro por sucursal si disponible
      } else if (nombre) {
        params.usua = nombre; // fallback: usuario
      }

      const { data } = await axios.get("/ventas/producto_venta", { params });
      if (data.code === 1) {
        const filtered = data.data.filter(p =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(p.codigo).includes(searchTerm)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error buscando productos", error);
      setSearchResults([]);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedDetalle) {
      setStep(2);
    } else if (step === 2 && selectedNewProduct) {
      onConfirm({
        id_venta: venta.id,
        id_detalle: selectedDetalle.codigo, // mapeado desde detalle_venta
        id_producto_nuevo: selectedNewProduct.codigo,
        cantidad,
        id_sucursal: venta.id_sucursal,
        usuario: nombre || "" // desde Zustand
      });
    }
  };

  if (!venta) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" backdrop="blur">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Intercambio de Producto
              <span className="text-xs text-default-500">
                Paso {step} de 2
              </span>
            </ModalHeader>

            <ModalBody>
              {step === 1 && (
                <div className="space-y-3">
                  <div className="text-sm text-default-600">Seleccione el producto a devolver:</div>
                  <Card className="border border-default-200">
                    <CardBody className="max-h-[300px] overflow-y-auto p-0">
                      {venta.detalles.map((det, idx) => {
                        const selected = selectedDetalle?.codigo === det.codigo;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDetalle(det)}
                            className={`w-full text-left px-3 py-3 flex items-center justify-between transition-colors ${selected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-default-100"
                              }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{det.nombre}</span>
                              <span className="text-xs text-default-500">
                                Cant: {det.cantidad} • S/ {det.precio}
                              </span>
                            </div>
                            {selected && (
                              <Chip color="primary" size="sm" variant="flat">
                                Seleccionado
                              </Chip>
                            )}
                          </button>
                        );
                      })}
                    </CardBody>
                  </Card>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-sm text-default-600">Seleccione el nuevo producto:</div>
                  <div className="flex gap-2">
                    <Input
                      aria-label="Buscar producto"
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      // onKeyDown removed as search is now automatic
                      className="flex-1"
                    />
                    <Button isIconOnly color="primary" variant="flat" onPress={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <Card className="border border-default-200">
                    <CardBody className="max-h-[220px] overflow-y-auto p-0">
                      {searchResults.map((prod) => {
                        const selected = selectedNewProduct?.codigo === prod.codigo;
                        return (
                          <button
                            key={prod.codigo}
                            type="button"
                            onClick={() => setSelectedNewProduct(prod)}
                            className={`w-full text-left px-3 py-3 flex items-center justify-between transition-colors ${selected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-default-100"
                              }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{prod.nombre}</span>
                              <span className="text-xs text-default-500">
                                Stock: {prod.stock} • S/ {prod.precio}
                              </span>
                            </div>
                            {selected && (
                              <Chip color="primary" size="sm" variant="flat">
                                Seleccionado
                              </Chip>
                            )}
                          </button>
                        );
                      })}
                      {searchResults.length === 0 && searchTerm && (
                        <div className="text-center text-default-500 text-sm p-3">
                          No se encontraron productos
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {selectedNewProduct && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm">Cantidad:</span>
                      <Input
                        type="number"
                        min={1}
                        max={selectedNewProduct.stock}
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                  )}

                  {selectedNewProduct && selectedDetalle && (
                    <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-900 rounded-md p-3 text-sm">
                      <p className="font-medium">Resumen</p>
                      <p>Devuelve: {selectedDetalle.nombre} (x{selectedDetalle.cantidad})</p>
                      <p>Recibe: {selectedNewProduct.nombre} (x{cantidad})</p>
                      <p>
                        Diferencia a pagar: S/{" "}
                        {(
                          (Number(selectedNewProduct.precio) * Number(cantidad)) -
                          Number(selectedDetalle.subtotal || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="flat" onPress={close}>Cancelar</Button>
              <Button
                color="primary"
                onPress={handleNext}
                isDisabled={
                  (step === 1 && !selectedDetalle) ||
                  (step === 2 && (!selectedNewProduct || (selectedNewProduct.precio * cantidad) < (selectedDetalle?.subtotal || 0)))
                }
              >
                {step === 1 ? "Siguiente" : "Confirmar Intercambio"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default IntercambioModal;