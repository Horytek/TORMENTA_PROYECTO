// src/components/AddProviderModal.js
import React from 'react';
import './AgregarProovedor.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
const AgregarProovedor = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlaywa">
            <div className="modalwa">
                <div className="modal-headerwa">
                    <h2 className='modal-titlewa'>Agregar proveedor</h2>
                    <button className="close-button" onClick={onClose}>X</button>
                </div>
                <br />
                <div className="modal-bodywa">
                    <form>
                        <div className="form-row">
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="ruc-dni">RUC/DNI:</label>
                                <input className='w-full pocaal bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="text" id="ruc-dni" placeholder="12345678" />
                            </div>
                            <div className="items-center justify-center pt-1">
                                <button className="sunat-button rounded-lg border" >SUNAT</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="provider">Proveedor:</label>
                            <input className='pocaal w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="text" id="provider" placeholder="Jorge Saldarriaga Vignolo" />
                        </div>
                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="address">Dirección:</label>
                            <input className='pocaal w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="text" id="address" placeholder="Los amautas" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="phone">Teléfono:</label>
                                <input className='pocaal w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="text" id="phone" placeholder="123 456 789" />
                            </div>
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="email">Email:</label>
                                <input className='pocaal w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="email" id="email" placeholder="elsensualcandunga@gmail.com" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="web">Web:</label>
                            <input className='pocaal w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border' type="text" id="web" placeholder="123 456 789" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="status">Estado:</label>
                                <select id="status" className="input pocaal" style={{ width: "220px" }}>
                                    <option value="activo">Activo (Default)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="cat-sunat">Cat. Sunat:</label>
                                <select id="cat-sunat" className="input pocaal" style={{ width: "220px" }}>
                                    <option value="">Seleccione</option>
                                </select>
                            </div> 
                        </div>
                        <div className="form-group">
                            <label className=' text-sm font-bold text-black' htmlFor="observation">Observación:</label>
                            <textarea className='w-full pocaal bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' id="observation" placeholder="Observación" style={{height: 28 }}></textarea>
                        </div>
                        <div className="form-group">
                            <label className='pocaal text-sm font-bold text-black' htmlFor="status-sunat">Status Sunat:</label>
                            <div id="status-sunat" className="status-sunat"></div>

                        </div>
                        <div className="form-row">
                            <div>
                                <input className='pocaal bg-gray-100 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" placeholder="" />
                            </div>
                            <div>
                                <input className='pocaal bg-gray-100 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" placeholder="" />
                            </div>
                        </div>
                        <div className='modal-buttons' style={{fontSize: 16 }}>
                            <ButtonClose onClick={onClose} />
                            <ButtonSave />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgregarProovedor;
