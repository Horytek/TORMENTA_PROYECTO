import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip, ScrollShadow } from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import Barcode from '../../components/Barcode/Barcode';
import { usePermisos } from '@/routes';

export function ShowProductos({ searchTerm, productos, onEdit, onDelete }) {
    const [currentPage, setCurrentPage] = useState(1);
    const productosPerPage = 10;

    // Filtrar productos
    const filteredProductos = productos.filter(producto =>
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        || producto.cod_barras.toLowerCase().includes(searchTerm.toLowerCase())
        || producto.id_producto.toString().includes(searchTerm.toLowerCase())
    );

    // Productos a mostrar en la página actual
    const indexOfLastProducto = currentPage * productosPerPage;
    const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
    const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

    // Estados de modal de eliminación de producto
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const handleOpenConfirmationModal = (row, id_producto) => {
        setSelectedRow(row);
        setSelectedId(id_producto);
        setIsConfirmationModalOpen(true);
    };
    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    // Función para manejar la acción de confirmación de eliminación de producto
    const handleConfirmDelete = async () => {
        await deleteProducto(selectedId);
        onDelete(selectedId);
        handleCloseConfirmationModal();
    };

    // Función para descargar código de barras
    const downloadBarcode = (producto) => {
        const svg = document.querySelector(`#barcode-${producto.id_producto} svg`);
        if (!svg) {
            console.error('SVG element not found');
            return;
        }
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const dataUri = 'data:image/svg+xml;base64,' + btoa(source);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `${producto.descripcion}-barcode.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const { hasEditPermission, hasDeletePermission } = usePermisos();

   return (
  <div>
    <div className="bg-white rounded-2xl shadow border border-blue-100 p-0">
      <ScrollShadow hideScrollBar>
        <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
          <thead>
            <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
              <th className="py-2 px-2 text-left">Descripción</th>
              <th className="py-2 px-2 text-center">Línea</th>
              <th className="py-2 px-2 text-center">Sub-línea</th>
              <th className="py-2 px-2 text-center">Und. Med.</th>
              <th className="py-2 px-2 text-center">Precio (S/.)</th>
              <th className="py-2 px-2 text-center">Cod. Barras</th>
              <th className="py-2 px-2 text-center">Estado</th>
              <th className="py-2 px-2 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentProductos.map((producto, idx) => (
              <tr
                key={producto.id_producto}
                className={`transition-colors duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                } hover:bg-blue-100/60`}
              >
                <td className="py-1.5 px-2">{producto.descripcion}</td>
                <td className="py-1.5 px-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[12px] font-semibold shadow-sm">
                    {producto.nom_marca}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[12px] font-semibold shadow-sm">
                    {producto.nom_subcat}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-center">{producto.undm}</td>
                <td className="py-1.5 px-2 text-center">{producto.precio}</td>
                <td className="py-1.5 px-2 text-center">
                  {producto.cod_barras === '-' ? '-' :
                    <div
                      id={`barcode-${producto.id_producto}`}
                      className="flex cursor-pointer justify-center"
                      onClick={() => downloadBarcode(producto)}
                    >
                      <Barcode
                        className="bg-transparent"
                        value={producto.cod_barras}
                        width={0.9}
                        height={18}
                        fontSize={7}
                      />
                    </div>
                  }
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span className={`
                    inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                    ${producto.estado_producto === 'Inactivo'
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-green-100 text-green-700 border border-green-200"}
                  `}>
                    {producto.estado_producto === 'Inactivo' ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {producto.estado_producto}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color={hasEditPermission ? "warning" : "default"}
                        onClick={() => hasEditPermission ? onEdit(producto) : null}
                        className={hasEditPermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                      >
                        <MdEdit />
                      </Button>
                    </Tooltip>
                    <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color={hasDeletePermission ? "danger" : "default"}
                        onClick={() => hasDeletePermission ? handleOpenConfirmationModal(producto.descripcion, producto.id_producto) : null}
                        className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                      >
                        <FaTrash />
                      </Button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollShadow>
      {/* Paginación a la izquierda */}
      <div className="flex justify-between items-center mt-2 px-4 pb-2">
        <Pagination
          showControls
          page={currentPage}
          total={Math.ceil(filteredProductos.length / productosPerPage)}
          onChange={(page) => setCurrentPage(page)}
          color="primary"
          size="sm"
        />
        <div />
      </div>
    </div>

    {/* Modal de Confirmación para eliminar Producto */}
    {isConfirmationModalOpen && (
      <ConfirmationModal
        message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmDelete}
      />
    )}
  </div>
);
}

export default ShowProductos;