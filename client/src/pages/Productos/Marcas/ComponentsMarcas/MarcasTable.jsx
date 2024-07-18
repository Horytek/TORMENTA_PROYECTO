import React from "react";
import PropTypes from "prop-types";
import { MdDeleteForever, MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { IoIosCloudDone } from "react-icons/io";

const TablaMarcas = ({ marcas, openModal, openEditModal, darBajaModal }) => {
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
              key={marca.id_marca}
              className="tr-tabla-marca justify-center hover:bg-gray-100"
            >
              <td style={{ textAlign: "center" }} className="font-bold">
                {marca.id_marca}
              </td>
              <td style={{ textAlign: "center" }} className="font-bold">
                {marca.nom_marca}
              </td>
              <td style={{ textAlign: "center" }}>
                <div className="flex justify-center items-center">
                  <IoIosCloudDone
                    style={{
                      color: marca.estado_marca === 1 ? "green" : "red",
                      fontSize: "20px", 
                      marginRight: "5px", 
                    }}
                  />
                  <span>
                    {marca.estado_marca === 1 ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </td>
              <td style={{ textAlign: "center" }}>
                <div className="flex justify-center items-center space-x-4">
                  <MdEdit
                    className="cursor-pointer hover:text-blue-500"
                    style={{ fontSize: "20px", color: "blue" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(marca.id_marca);
                    }}
                  />
                  <MdDeleteForever
                    className="cursor-pointer hover:text-red-600"
                    style={{ fontSize: "25px", color: "red" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(marca.id_marca);
                    }}
                  />
                  <MdDoNotDisturbAlt
                    className="cursor-pointer hover:text-orange-500"
                    style={{ fontSize: "20px", color: "orange" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      darBajaModal(marca.id_marca);
                    }}
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
  openModal: PropTypes.func.isRequired,
  openEditModal: PropTypes.func.isRequired,
  darBajaModal: PropTypes.func.isRequired,
};

export default TablaMarcas;
