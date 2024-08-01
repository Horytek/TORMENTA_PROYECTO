import PropTypes from "prop-types";
import { MdDeleteForever, MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { IoIosCloudDone } from "react-icons/io";
import { FaTrash } from "react-icons/fa";

const TablaMarcas = ({ marcas, openModal, openEditModal, darBajaModal }) => {
  return (
    <div className="container-tabla-marca-rv px-4 bg-white rounded-lg">
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
              className="tr-tabla-marca-rv justify-center hover:bg-gray-100"
            >
              <td style={{ textAlign: "center" }} className="font-bold">
                {marca.id_marca}
              </td>
              <td style={{ textAlign: "center" }} className="font-bold">
                {marca.nom_marca}
              </td>
              <td style={{ textAlign: "center" }}>
                <div className="flex justify-center items-center">
                  <div
                    className="text-center"
                    style={{
                      color: marca.estado_marca === 1 ? "green" : "red",
                      fontWeight: "400",
                    }}
                  >
                    <div
                      className="ml-2 px-2.5 py-1.5 rounded-full"
                      style={{
                        background:
                          marca.estado_marca === 1
                            ? "rgb(191, 237, 206)"
                            : "#F5CBCBFF",
                      }}
                    >
                      <span>
                        {marca.estado_marca === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ textAlign: "center" }}>
                <div className="flex justify-center items-center space-x-4">
                  <MdEdit
                    className="cursor-pointer hover:text-blue-500"
                    style={{ fontSize: "20px", color: "#FBBF24" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(marca.id_marca);
                    }}
                  />
                  <FaTrash
                    className="cursor-pointer hover:text-red-600"
                    style={{ fontSize: "15px", color: "#EF4444" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(marca.id_marca);
                    }}
                  />
                  <MdDoNotDisturbAlt
                    className="cursor-pointer hover:text-orange-500"
                    style={{ fontSize: "20px", color: "#EF4444" }}
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
