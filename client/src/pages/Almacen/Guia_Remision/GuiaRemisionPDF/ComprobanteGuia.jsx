import React, { useState, useEffect } from 'react';
import img from '@/assets/icono.ico';
import './ComprobanteGuia.css';
import QRCode from 'qrcode.react';
import PropTypes from 'prop-types';
import NumeroALetras from '../../../../utils/ConvertidorDeNumALetras';

const GuiaPDF = React.forwardRef(({ datosGuiaRemision }, ref) => {
    const { 
        detalles, 
        fecha, 
        nombre_dest, 
        documento_dest, 
        direccion_dest, 
        vendedor, 
        cant_paquetes, 
        peso_kg, 
        dir_partida, 
        dir_entrega, 
        empresa_transporte, 
        motivo_transporte 
    } = datosGuiaRemision;

    const [currentDate, setCurrentDate] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);

    const generatePDF = async () => {
        const publicPdfUrl = "https://www.facebook.com/profile.php?id=100055385846115";
        setPdfUrl(publicPdfUrl);
    };

    const formatHours = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        setCurrentDate(formatHours());
        generatePDF();
    }, []);

    return (
        <div ref={ref} className="p-5 text-sm leading-6 font-sans w-[800px]">
            <div className="flex justify-between items-center mb-3">
                <div className='flex'>
                    <div className="Logo-compro">
                        <img src={img} alt="Logo-comprobante" />
                    </div>
                    <div className="text-start ml-8">
                        <h1 className="text-xl font-extrabold leading-snug text-blue-800">TORMENTA JEANS</h1>
                        <p className="font-semibold leading-snug text-gray-700">TEXTILES CREANDO MODA S.A.C.</p>
                        <p className="leading-snug text-gray-600"><span className="font-bold text-gray-800">Central:</span> Cal San Martin 1573 Urb Urrunaga SC Tres</p>
                        <p className="leading-snug text-gray-600">Chiclayo - Chiclayo - Lambayeque</p>
                        <p className="leading-snug text-gray-600"><span className="font-bold text-gray-800">TELF:</span> 918378590</p>
                        <p className="leading-snug text-gray-600"><span className="font-bold text-gray-800">EMAIL:</span> textiles.creando.moda.sac@gmail.com</p>
                    </div>
                </div>

                <div className="text-center border border-gray-400 rounded-md ml-8 overflow-hidden w-80">
                    <h2 className="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">RUC 20610588981</h2>
                    <div className="bg-blue-200">
                        <h2 className="text-lg font-bold text-gray-900 py-2">GUIA DE REMISION</h2>
                    </div>
                </div>
            </div>

            <div className="container-datos-compro bg-white rounded-lg mb-6 ">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">NRO. DOCU.:</span> <span className="font-semibold text-gray-600">{documento_dest}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">DESTINATARIO:</span> <span className="font-semibold text-gray-600">{nombre_dest}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">REMITENTE:</span> <span className="font-semibold text-gray-600">TEXTILES CREANDO MODA S.A.C.</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">DIR. PARTIDA:</span><span className="font-semibold text-gray-600">{dir_partida}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">DIR. ENTREGA:</span><span className="font-semibold text-gray-600">{dir_entrega}</span>
                        </p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">FECHA EMISIÓN:</span> <span className="font-semibold text-gray-600">{fecha}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">VENDEDOR:</span> <span className="font-semibold text-gray-600">{vendedor}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">CANT. PAQUETES:</span> <span className="font-semibold text-gray-600">{cant_paquetes}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">PESO KG:</span> <span className="font-semibold text-gray-600">{peso_kg}</span>
                        </p>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse mb-6 bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-blue-200 text-blue-800">
                    <tr>
                        <th className="border-b p-3 text-center">Código</th>
                        <th className="border-b p-3 text-start">Descripción</th>
                        <th className="border-b p-3 text-start">Marca</th>
                        <th className="border-b p-3 text-center">Cant.</th>
                        <th className="border-b p-3 text-center">U.M.</th>
                    </tr>
                </thead>
                <tbody>
                    {detalles.map((detalle, index) => (
                        <tr key={index} className="bg-gray-50 hover:bg-gray-100">
                            <td className="border-b p-2 text-center">{detalle.codigo}</td>
                            <td className="border-b p-2 text-start">{detalle.descripcion}</td>
                            <td className="border-b p-2 text-start">{detalle.marca}</td>
                            <td className="border-b p-2 text-center">{detalle.cantidad}</td>
                            <td className="border-b p-2 text-center">KGM</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="bg-white rounded-lg shadow-lg">
                <div className="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                    <p className="text-md font-semibold text-gray-800 mb-1">OBSERVACION:</p>
                    <div>
                        <p className="text-md font-semibold text-gray-800 items-center">
                            RECOJE: SR. ANGEL JARA MELGAREJO __________ DNI: 47134542
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-between mb-6">
                    <div className='flex items-center justify-center bg-gray-100 rounded border' style={{ width: "170px" }}>
                        {pdfUrl && (
                            <QRCode value={pdfUrl} size={128} />
                        )}
                    </div>

                    <div className="flex-1 mr-6 py-6 pl-6 pr-0">
                        <p className="text-md font-bold text-gray-900 mb-2">TRANSPORTE PUBLICO:</p>

                        <div className="space-y-1">
                            <p className="text-sm text-gray-700">EMPRESA: {empresa_transporte}</p>
                            <p className="text-sm text-gray-700">RUC: 20508074281</p>
                        </div>
                        <p className="text-md font-bold text-gray-900 mb-2">MOTIVO TRANSPORTE: {motivo_transporte}</p>
                        <p className="text-sm text-gray-700">Generado desde el Sistema de Tormenta S.A.C</p>
                        <p className="text-sm text-gray-700">Generado desde el Sistema de Tormenta S.A.C</p>
                        <p className="text-sm text-gray-700">Fecha de Generación: {fecha}</p>
                        <p className="text-sm text-gray-700">Hora de Generación: {currentDate}</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <div className="w-1/3 text-center">
                    <p className="text-md font-bold text-gray-900">_____________________________</p>
                    <p className="text-md text-gray-700">Firma del Transportista</p>
                </div>
            </div>
        </div>
    );
});

GuiaPDF.propTypes = {
    datosGuiaRemision: PropTypes.shape({
        detalles: PropTypes.arrayOf(
            PropTypes.shape({
                codigo: PropTypes.string.isRequired,
                descripcion: PropTypes.string.isRequired,
                marca: PropTypes.string,
                cantidad: PropTypes.number.isRequired,
                um: PropTypes.string.isRequired
            })
        ).isRequired,
        fecha: PropTypes.string.isRequired,
        nombre_dest: PropTypes.string.isRequired,
        documento_dest: PropTypes.string.isRequired,
        direccion_dest: PropTypes.string.isRequired,
        vendedor: PropTypes.string.isRequired,
        cant_paquetes: PropTypes.number.isRequired,
        peso_kg: PropTypes.number.isRequired,
        dir_partida: PropTypes.string.isRequired,
        dir_entrega: PropTypes.string.isRequired,
        empresa_transporte: PropTypes.string.isRequired,
        motivo_transporte: PropTypes.string.isRequired
    }).isRequired
};

export default GuiaPDF;

