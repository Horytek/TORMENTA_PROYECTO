// Comprobante.jsx
import React, { useState, useEffect } from 'react';
import img from '@/assets/icono.ico';
import QRCode from 'qrcode';
import PropTypes from 'prop-types';
import NumeroALetras from '../../../../../../utils/ConvertidorDeNumALetras';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import useSucursalData from '@/services/data/data_sucursal_venta';

const Comprobante = React.forwardRef(({ datosVentaComprobante }, ref) => {
    const { detalles, fecha, total_t, igv, descuento_venta, nombre_cliente, documento_cliente, direccion_cliente } = datosVentaComprobante;
    const [currentDate, setCurrentDate] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [empresaData, setEmpresaData] = useState(null); // Estado para almacenar los datos de la empresa
    const [sucursalData, setSucursalData] = useState(null);
    
    const generatePDF = async () => {
        const publicPdfUrl = "https://www.facebook.com/profile.php?id=100055385846115";
        setPdfUrl(publicPdfUrl);
    };
    const nombre = useUserStore((state) => state.nombre);
    const { sucursales } = useSucursalData();

    const formatHours = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        const fetchEmpresaData = async () => {
            try {
                const data = await getEmpresaDataByUser(nombre);
                setEmpresaData(data); // Establecer los datos de la empresa en el estado
            } catch (error) {
                console.error("Error al obtener los datos de la empresa:", error);
            }
        };

        const today = new Date();
        setCurrentDate(formatHours(today));
        generatePDF();
        fetchEmpresaData(); // Llamar a la función para obtener los datos de la empresa
    }, [nombre]);

    useEffect(() => {
        if (pdfUrl) {
            QRCode.toDataURL(pdfUrl, { width: 128, margin: 1 }, (err, url) => {
                if (!err) setQrDataUrl(url);
            });
        }
    }, [pdfUrl]);

    useEffect(() => {
        // Busca la sucursal del usuario actual
        if (sucursales && nombre) {
            const sucursal = sucursales.find(s => s.usuario === nombre);
            setSucursalData(sucursal || null);
        }
    }, [sucursales, nombre]);

    return (
        <div ref={ref} className="p-5 text-sm leading-6 font-sans w-[800px]">
            <div className="flex justify-between items-center mb-3">
                <div className='flex'>
                    <div className="w-[120px] h-[120px]">
                        <img src={empresaData?.logotipo} alt="Logo-comprobante" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-start ml-8">
                        {/* Mostrar los datos de la empresa */}
                        <h1 className="text-xl font-extrabold leading-snug text-blue-800">{empresaData?.nombreComercial || "Nombre Comercial"}</h1>
                        <p className="font-semibold leading-snug text-gray-700">{empresaData?.razonSocial || "Razón Social"}</p>
                        <p className="leading-snug text-gray-600">
                            <span className="font-bold text-gray-800">Dirección:</span> {empresaData?.direccion || "Dirección no disponible"}
                        </p>
                        <p className="leading-snug text-gray-600">
                            {empresaData?.distrito}, {empresaData?.provincia}, {empresaData?.departamento}
                        </p>
                        <p className="leading-snug text-gray-600">
                            <span className="font-bold text-gray-800">TELF:</span> {empresaData?.telefono || "Teléfono no disponible"}
                        </p>
                        <p className="leading-snug text-gray-600">
                            <span className="font-bold text-gray-800">EMAIL:</span> {empresaData?.email || "Email no disponible"}
                        </p>
                    </div>
                </div>
                <div className="text-center border border-gray-400 rounded-md ml-8 overflow-hidden w-80">
                    <h2 className="text-lg font-bold text-gray-800 p-2 border-b border-gray-400">RUC 20610588981</h2>
                    <div className="bg-blue-200">
                        <h2 className="text-lg font-bold text-gray-900 py-2">COTIZACIÓN</h2>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">NRO. DOCU.:</span> <span className="font-semibold text-gray-600"> --- </span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">CLIENTE:</span> <span className="font-semibold text-gray-600"> Cliente Varios </span>
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="font-bold text-gray-900">DIRECCIÓN:</span><span className="font-semibold text-gray-600"> {sucursalData?.ubicacion || "Dirección no disponible"} </span>
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
                            <span className="font-bold text-gray-900">SUCURSAL:</span> <span className="font-semibold text-gray-600">{sucursalData?.nombre || "Sucursal no encontrada"}</span>
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
                <div className='flex items-center justify-center bg-gray-100 rounded border w-[170px] h-[170px]'>
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR" className="w-[128px] h-[128px]" />
                    ) : (
                        <span className="text-xs text-gray-500">Generando QR...</span>
                    )}
                </div>

                    <div className="flex-1 mr-6 py-6 pl-6 pr-0">
                        <p className="text-md font-bold text-gray-900 mb-2">ORDEN DE COMPRA:</p>
                        <a href="#" className="text-blue-500 hover:underline text-md mb-2 block">Regrese Pronto...!</a>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-700">Representación impresa de una COTIZACIÓN</p>
                            <p className="text-sm font-semibold text-gray-900">Generado el: {fecha} {currentDate}</p>
                            <p className="text-sm text-gray-700">Generado desde el Sistema de Horytek</p>
                            <p className="text-sm text-gray-700">Un Producto de {empresaData?.razonSocial}</p>
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
