
import { FaSearch } from 'react-icons/fa';

const FiltrosGuias = () => {
    return (
        <div className="flex flex-wrap mb-4 justify-between">
            {/* Contenedor principal con filtros */}
            <div className="flex flex-wrap mb-4 justify-between">
    {/* Contenedor principal con filtros */}
    <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
        <div className="input-wrapper mb-2 md:mb-0">
            <label htmlFor="valor" className="label">
                Numero de guia:
            </label>
            <input type="text" id="numguia" className="input" placeholder="Buscar" />
        </div>
        <div className="input-wrapper mb-2 md:mb-0">
            <label htmlFor="dni" className="label">
                DNI:
            </label>
            <input type="text" id="dni" className="input" placeholder="Buscar" style={{ width: '170px' }} />
        </div>
        <div className="input-wrapper">
            <input type="date" id="fec1" className="input" placeholder="Buscar" />
        </div>
        <div className="input-wrapper">
            <input type="date" id="fec2" className="input" placeholder="Buscar" />
        </div>
        <div className="input-wrapper mb-2 md:mb-0">
            <select id="vend" className="input" style={{ width: "170px" }}>
                <option value="">Seleccione</option>
                <option value="cam1">CENTRAL 22</option>
                <option value="cam2">CENTRAL 52 -53</option>
                <option value="cam3">CENTRAL A - ESCALERA</option>
                <option value="cam4">OFICINA</option>
                <option value="cam5">TIENDA BALTA</option>
                <option value="cam6">@todos</option>
            </select>
        </div>
        <button className="btn btn-filtrar mr-0">
            <FaSearch className="inline-block mr-2" style={{ fontSize: '20px' }} />
        </button>
        </div>
    </div>

        </div>
    );
};

export default FiltrosGuias;
