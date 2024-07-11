import { GrDocumentWindows } from 'react-icons/gr';

const FiltrosVentas = () => {
    return (
        <div className="flex flex-wrap mb-4 justify-between">
            {/* Contenedor principal con filtros */}
            <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
                <div className="input-wrapper mb-2 md:mb-0">
                    <label htmlFor="campo" className="label">
                        Campo
                    </label>
                    <select id="campo" className="input" style={{width: "170px"}}>
                        <option value="">Seleccione</option>
                        <option value="cam1">Cam1</option>
                        <option value="cam2">Cam2</option>
                        <option value="cam3">Cam3</option>
                    </select>
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    <label htmlFor="tipo" className="label">
                        Tipo
                    </label>
                    <select id="tipo" className="input" style={{width: "170px"}}>
                        <option value="">Seleccione</option>
                        <option value="tipo1">Tipo1</option>
                        <option value="tipo2">Tipo2</option>
                        <option value="tipo3">Tipo3</option>
                    </select>
                </div>
                <div className="input-wrapper">
                    <label htmlFor="valor" className="label">
                        Valor
                    </label>
                    <input type="text" id="valor" className="input" placeholder="Buscar" />
                </div>
            </div>

            {/* Segundo div para botones de acción */}
            <div className="flex space-x-2 items-center xl:justify-end xl:w-4/12 mt-3 md:mt-3 lg:mt-3 xl:mt-0">
                <button className="btn btn-filtrar mr-0">Filtrar</button>
                <button className="btn btn-resetear">Resetear</button>
                <button className="btn btn-exportar flex items-center">
                    <GrDocumentWindows className="inline-block mr-2" style={{ fontSize: '20px' }} />
                    Exportar
                </button>
            </div>
        </div>
    );
};

export default FiltrosVentas;
