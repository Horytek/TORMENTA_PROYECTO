import PropTypes from 'prop-types';
import { BsCashCoin, BsCash } from "react-icons/bs";
import { IoCloseSharp } from 'react-icons/io5';
import { GrFormAdd } from "react-icons/gr";

const CobrarModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="bg-white p-6 rounded-xl shadow-lg w-1/3 relative">
                <div className="flex justify-between items-center mb-4 ">
                    <button onClick={onClose} className="close-modal-pagar absolute top-0 right-0 text-black-500 p-2" >
                        <IoCloseSharp />

                    </button>
                    <h2 className="text-lg font-bold flex items-center" >
                        <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                        Pago</h2>
                </div>
                <form>
                    <div className="mb-4">
                        <label className="block text-gray-800 mb-2" style={{ fontWeight: "600" }}>Seleccione el cliente</label>
                        <div className='flex items-center justify-between'>
                            <select className="input w-full mr-3">
                                <option>Cliente 1</option>
                                <option>Cliente 2</option>
                            </select>
                            <button className="btn-nuevo-cliente">
                                <GrFormAdd style={{ fontSize: '24px' }} />
                            </button>
                        </div>

                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Total a Pagar</label>
                        <input type="text" className="form-input mt-1 block w-full" readOnly value="200" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Monto recibido</label>
                        <input type="text" className="form-input mt-1 block w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Cambio</label>
                        <input type="text" className="form-input mt-1 block w-full" readOnly value="100" />
                    </div>
                    <div className="flex justify-between mt-4">
                        <button type="submit" className="btn btn-cobrar">
                            <BsCashCoin className="mr-2" />
                            Cobrar e Imprimir
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CobrarModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CobrarModal;
