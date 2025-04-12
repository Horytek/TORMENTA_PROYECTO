import PropTypes from 'prop-types';
import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@nextui-org/react";

const TablaKardex = ({ kardex }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = kardex.slice(indexOfFirstItem, indexOfLastItem);

    const handleDetailClick = (id) => {
        window.open(`/almacen/kardex/historico/${id}`, '_blank');
    };

    const totalPages = Math.ceil(kardex.length / itemsPerPage);

    return (
        <div className="w-full ">
            <Table  aria-label="Tabla de Kardex" shadow={"md"} className="rounded-lg overflow-hidden">
                <TableHeader>
                    <TableColumn>CÓDIGO</TableColumn>
                    <TableColumn>DESCRIPCIÓN</TableColumn>
                    <TableColumn>MARCA</TableColumn>
                    <TableColumn>STOCK ACTUAL</TableColumn>
                    <TableColumn>UM</TableColumn>
                </TableHeader>
                <TableBody>
                    {currentItems.map((item) => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleDetailClick(item.codigo)}>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell className={item.stock === 0 ? "text-red-500" : ""}>{item.descripcion}</TableCell>
                            <TableCell>{item.marca}</TableCell>
                            <TableCell>{item.stock}</TableCell>
                            <TableCell>{item.um}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            <div className="flex justify-between items-center mt-4">
                <Pagination
                    showControls
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    shadow
                />
                <select
                    id="itemsPerPage"
                    className="border-gray-300 bg-gray-50 rounded-lg p-2 w-20"
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    <option value={5}>05</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={100000}>Todo</option>
                </select>
            </div>
        </div>
    );
};

TablaKardex.propTypes = {
    kardex: PropTypes.array.isRequired,
};

export default TablaKardex;