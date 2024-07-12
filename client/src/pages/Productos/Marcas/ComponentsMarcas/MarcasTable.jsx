import React from "react";
import PropTypes from "prop-types";
import { MdDeleteForever, MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { IoIosCloudDone } from "react-icons/io";

const TablaMarcas = ({
  marcas,
  modalOpen,
  deleteOptionSelected,
  openModal,
  openEditModal,
  darBajaModal,
}) => {
 


  return (
    <div className="container-table-marca px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/12">CODIGO</th>
            <th className="w-3/12">NOMBRE</th>
            <th className="w-2/12">ESTADO</th>
            <th className="w-1/6">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((marca) => (
            <tr
              key={marca.id}
              onClick={() => toggleRow(marca.id)}
              className="tr-tabla-marca justify-center hover:bg-gray-100"
            >
              <td style={{ textAlign: "center" }} className="font-bold">
                <div>{marca.serieNum}</div>
                <div className="text-gray-500 ">{marca.num}</div>
              </td>
              <td style={{ textAlign: "center" }} className="font-bold">
                {marca.nombre}
              </td>
              <td
                style={{
                  textAlign: "center",
                  color: marca.estado === "Activo" ? "#1DD75BFF" : "red",
                }}
              >
                <div className="flex items-center justify-center">
                  <IoIosCloudDone
                    style={{ fontSize: "20px", marginRight: "5px" }}
                  />
                  <span>{marca.estado}</span>
                </div>
              </td>
              <td style={{ textAlign: "center" }}>
                <div className="flex justify-center items-center space-x-4">
                  <MdEdit
                    className="cursor-pointer hover:text-blue-500"
                    style={{ fontSize: "20px", color: "blue" }}
                    onClick={() => openEditModal(marca.id)}
                  />
                  <MdDeleteForever
                    className={`cursor-pointer ${
                      modalOpen && !deleteOptionSelected
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                    style={{ fontSize: "25px", color: "red" }}
                    onClick={() => openModal(marca.id)}
                  />
                  <MdDoNotDisturbAlt
                    className="cursor-pointer hover:text-orange-500"
                    style={{ fontSize: "20px", color: "orange" }}
                    onClick={() => darBajaModal(marca.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

TablaMarcas.propTypes = {
  marcas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  editMarca: PropTypes.func.isRequired,
  darBajaModal: PropTypes.func.isRequired,
};

export default TablaMarcas;
