import { GrDocumentWindows } from 'react-icons/gr';

const FiltrosVentas = () => {
    return (
        <div className="flex flex-wrap mb-4 justify-between">
            {/* Contenedor principal con filtros */}
            <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
                <div className="input-wrapper flex">
                    <input type="text" id="valor" className="input-c" placeholder="Nombre o Razón Social" />
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    <select id="tipo" className="input-c" style={{width: "190px"}}>
                        <option value="" disabled selected>Tipo Comprobante</option>
                        <option value="boleta">Boleta</option>
                        <option value="factura">Factura</option>
                        <option value="nota">Nota</option>
                    </select>
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    {/* <label htmlFor="campo" className="label">
                        Campo
                    </label> */}
                    <select id="campo" className="input-c" style={{width: "170px"}}>
                        <option value="" disabled selected>Sucursal</option>
                        <option value="sucursal_1">Tienda Arica 3</option>
                        <option value="sucursal_1">Tienda Balta 7-8</option>
                    </select>
                </div>
                <div className="input-wrapper flex gap-2">
                    <input type="date" id="valor" className="input-c"/>
                    <input type="date" id="valor" className="input-c"/>
                </div>
            </div>

            {/* Segundo div para botones de acción */}
            <div className="flex items-center xl:justify-end mt-3 md:mt-3 lg:mt-0 xl:mt-0">
                <button className="btn btn-exportar flex items-center mr-0">
                    <GrDocumentWindows className="inline-block mr-2" style={{ fontSize: '20px' }} />
                    Exportar
                </button>
            </div>
        </div>
    );
};

export default FiltrosVentas;
