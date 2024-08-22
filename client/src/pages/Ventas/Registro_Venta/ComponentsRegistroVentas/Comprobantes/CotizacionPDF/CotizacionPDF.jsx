// Comprobante.jsx
import React, { useState, useEffect } from 'react';
import img from '@/assets/icono.ico';
import './CotizacionPDF.css';
import QRCode from 'qrcode.react';
import PropTypes from 'prop-types';
import NumeroALetras from '../../../../../../utils/ConvertidorDeNumALetras';

// Uso en el componente React

const Comprobante = React.forwardRef(({ datosVentaComprobante }, ref) => {

    const { detalles, fecha, total_t, igv, /*totalImporte_venta,*/ descuento_venta, nombre_cliente, documento_cliente, direccion_cliente } = datosVentaComprobante;
    const [currentDate, setCurrentDate] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);

    const generatePDF = async () => {
        const publicPdfUrl = "https://www.facebook.com/profile.php?id=100055385846115";
        setPdfUrl(publicPdfUrl);
    };

    const formatHpurs = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        const today = new Date();

        setCurrentDate(formatHpurs(today));

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
                        <h2 className="text-lg font-bold text-gray-900 py-2">COTIZACIÓN</h2>
                    </div>
                </div>
            </div>

            <div className="container-datos-compro bg-white rounded-lg mb-6 ">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">NRO. DOCU.:</span> <span className="font-semibold text-gray-600"> {documento_cliente} </span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">CLIENTE:</span> <span className="font-semibold text-gray-600"> {nombre_cliente} </span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">DIRECCIÓN:</span><span className="font-semibold text-gray-600"> {direccion_cliente} </span>
                        </p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">FECHA EMISIÓN:</span> <span className="font-semibold text-gray-600">{fecha}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">FECHA VCTO:</span> <span className="font-semibold text-gray-600">{fecha}</span>
                        </p>

                    </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">SUCURSAL:</span> <span className="font-semibold text-gray-600">CENTRAL 22</span>
                        </p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">TELÉFONO:</span> <span className="font-semibold text-gray-600">-</span>
                        </p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">MONEDA:</span> <span className="font-semibold text-gray-600">SOLES</span>
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
                        <th className="border-b p-3 text-center">U.M.</th>
                        <th className="border-b p-3 text-start">P. Unit</th>
                        <th className="border-b p-3 text-center">Cant.</th>
                        <th className="border-b p-3 text-start">Desc.</th>
                        <th className="border-b p-3 text-start">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    {detalles.map((detalle, index) => (
                        <tr key={index} className="bg-gray-50 hover:bg-gray-100">
                            <td className="border-b p-2 text-center">{detalle.id_producto}</td>
                            <td className="border-b p-2 text-start">{detalle.nombre}</td>
                            <td className="border-b p-2 text-start">{detalle.nom_marca}</td>
                            <td className="border-b p-2 text-center">{detalle.undm}</td>
                            <td className="border-b p-2 text-start">S/. {detalle.precio.toFixed(2)}</td>
                            <td className="border-b p-2 text-center">{detalle.cantidad}</td>
                            <td className="border-b p-2 text-start">% {detalle.descuento}</td>
                            <td className="border-b p-2 text-start">S/. {detalle.sub_total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="bg-white rounded-lg shadow-lg">
                <div className="px-4 py-2 border-b border-gray-700 rounded-lg bg-gray-100">
                    <p className="text-md font-semibold text-gray-800 mb-1">OBSERVACION:</p>
                    <div>
                        <p className="text-md font-semibold text-gray-800 items-center">
                            SON: <NumeroALetras num={total_t} />
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
                        <p className="text-md font-bold text-gray-900 mb-2">ORDEN DE COMPRA:</p>

                        <a href="#" className="text-blue-500 hover:underline text-md mb-2 block">Regrese Pronto...!</a>

                        <div className="space-y-1">
                            <p className="text-sm text-gray-700">Representación impresa de una COTIZACIÓN</p>
                            <p className="text-sm font-semibold text-gray-900">Generado el: {fecha} {currentDate}</p>
                            <p className="text-sm text-gray-700">Generado desde el Sistema de Tormenta S.A.C</p>
                            <p className="text-sm text-gray-700">Un Producto de TORMENTA S.A.C</p>
                        </div>
                    </div>


                    <div className="flex flex-col items-center bg-gray-100 p-4 rounded border shadow-inner">
                        <div className="w-full mb-4">
                            <p className="text-sm text-gray-700 mb-1 text-right">Total Orig. S/ : <span className="font-bold text-gray-900"> {total_t} </span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">Descuento S/ : <span className="font-bold text-gray-900">{descuento_venta}</span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">Sub.Total S/ : <span className="font-bold text-gray-900">{(total_t - igv).toFixed(2)}</span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">Exonerado S/ : <span className="font-bold text-gray-900">0.00</span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">Gratuita S/ : <span className="font-bold text-gray-900">0.00</span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">Igv (18.00%) S/ : <span className="font-bold text-gray-900">{igv}</span></p>
                            <p className="text-sm text-gray-700 mb-1 text-right">ICBPER S/ : <span className="font-bold text-gray-900">0.00</span></p>
                            <hr className='border-black' />
                            <p className="text-lg font-bold text-gray-900 mt-2">Total S/ : <span className="text-xl"> {total_t} </span></p>
                        </div>

                    </div>
                </div>
            </div>


        </div>
    );
});

Comprobante.displayName = 'Comprobante';

Comprobante.propTypes = {
    datosVentaComprobante: PropTypes.shape({
        fecha: PropTypes.string.isRequired,
        nombre_cliente: PropTypes.string.isRequired,
        documento_cliente: PropTypes.string.isRequired,
        direccion_cliente: PropTypes.string.isRequired,
        igv: PropTypes.number.isRequired,
        total_t: PropTypes.number.isRequired,
        totalImporte_venta: PropTypes.number.isRequired,
        descuento_venta: PropTypes.number.isRequired,
        detalles: PropTypes.arrayOf(PropTypes.shape({
            id_producto: PropTypes.number.isRequired,
            nombre: PropTypes.string.isRequired,
            undm: PropTypes.string.isRequired,
            nom_marca: PropTypes.string.isRequired,
            cantidad: PropTypes.number.isRequired,
            precio: PropTypes.number.isRequired,
            descuento: PropTypes.number.isRequired,
            sub_total: PropTypes.number.isRequired,
        })).isRequired,

    }).isRequired,

};
export default Comprobante;
