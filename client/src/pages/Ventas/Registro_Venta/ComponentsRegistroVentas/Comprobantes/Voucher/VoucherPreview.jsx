import React from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import img from '@/assets/icono.ico';

const Voucher = React.forwardRef(function VoucherComponent(props, ref) {
    const [pdfUrl, setPdfUrl] = React.useState(null);

    React.useEffect(() => {
        generatePDF();
    }, []);

    const generatePDF = async () => {
        const publicPdfUrl = "https://www.tormentaejeans.com";
        setPdfUrl(publicPdfUrl);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-5 ">
            <div ref={ref} className="w-full p-5 bg-white font-sans text-xs text-gray-700 px-60">
                <div className="text-center mb-4">
                    <img src={img} alt="Logo" className="mx-auto w-40" />
                    <p className="font-bold text-sm">TEXTILES CREANDO MODA S.A.C.</p>
                    <p>Central: Cal San Martin 1573 Urb Urrunaga SC</p>
                    <p>Tres</p>
                    <p>Chiclayo - Chiclayo - Lambayeque</p>
                    <p>RUC: 20610508901</p>
                    <p>Tel: 918378590</p>
                    <p className="font-bold text-sm">Factura Venta Electrónica: F200-000000028</p>
                </div>
                <hr />
                <div className="mt-4">
                    <p className="text-gray-500"><strong>Fecha de Emisión:</strong> 13/07/2024</p>
                    <p className="text-gray-500"><strong>Tienda:</strong> AV. BALTA 1444 INT. 01 GALERIA D ANGELO</p>
                    <p className="text-gray-500"><strong>Vendedor:</strong> TIENDA BALTA</p>
                </div>
                <hr />
                <div className="mt-4">
                    <p className="text-gray-500"><strong>Cliente:</strong> SUC COMITE DE ADMINISTRACION DEL FONDO DE ASISTENCIA Y ESTIMULO DE LOS TRABAJADORES DE LA UGEL-FERRE</p>
                    <p className="text-gray-500"><strong>RUC:</strong> 20480122136</p>
                    <p>AV. VICTOR RAUL HAYA DE LA TO NRO 200</p>
                </div>

                <table className="w-full mt-4 border-collapse">
                    <thead>
                        <tr>
                            <th className="border-b text-left py-2 text-gray-600">Descripción</th>
                            <th className="border-b text-right py-2 text-gray-600">Cant.</th>
                            <th className="border-b text-right py-2 text-gray-600">P.Unit</th>
                            <th className="border-b text-right py-2 text-gray-600">S.Tot</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-1">MULTI-CARGO COLOR TORMENTA</td>
                            <td className="py-1 text-right">1.00</td>
                            <td className="py-1 text-right">50.00</td>
                            <td className="py-1 text-right">50.00</td>
                        </tr>
                        <tr>
                            <td className="py-1">MULTI-CARGO JEANS TORMENTA</td>
                            <td className="py-1 text-right">1.00</td>
                            <td className="py-1 text-right">60.00</td>
                            <td className="py-1 text-right">60.00</td>
                        </tr>
                        <tr>
                            <td className="py-1">MOM CON PARCHES Y RASGADOS</td>
                            <td className="py-1 text-right">1.00</td>
                            <td className="py-1 text-right">50.00</td>
                            <td className="py-1 text-right">50.00</td>
                        </tr>
                    </tbody>
                </table>

                <div className="text-right mt-4">
                    <p className="text-gray-500"><strong>Total Original:</strong> 160.00</p>
                    <p className="text-gray-500"><strong>Descuento:</strong> 0.00</p>
                    <p className="text-gray-500"><strong>Op. Gravada S/:</strong> 135.59</p>
                    <p className="text-gray-500"><strong>Exonerado:</strong> 0.00</p>
                    <p className="text-gray-500"><strong>IGV. 18.00% S/:</strong> 24.41</p>
                    <p className="text-gray-500"><strong>ICBPER:</strong> 0.00</p>
                    <p className="text-gray-500"><strong>Importe Total S/:</strong> 160.00</p>
                </div>

                <div className="text-center mt-4">
                    <p className="font-bold text-sm">SON: CIENTO SESENTA Y 00/100 SOLES</p>
                    <p className="text-gray-500"><strong>Cond. de Venta:</strong> CONTADO</p>
                    <p className="text-gray-500"><strong>Forma Pago:</strong> EFECTIVO</p>
                    <p className="text-gray-500"><strong>Recibido:</strong> S/ 160.00</p>
                    <p className="text-gray-500"><strong>Vuelto:</strong> S/ 0.00</p>
                    <p className="text-gray-500"><strong>Peso Kg:</strong> 0.00</p>
                    {pdfUrl && (
                        <div className="m-auto flex justify-center my-4">
                            <QRCode value={pdfUrl} size={128} />
                        </div>
                    )}
                    <p>Representación impresa de la Factura Venta Electrónica, esta puede ser consultada en</p>
                    <p className="text-gray-500"><strong>Fec. Regist:</strong> 13/07/2024 04:10:33 PM</p>
                    <p className="text-gray-500"><strong>Fec. Imp:</strong> 13/07/2024 07:58:16 PM</p>
                </div>
            </div>
        </div>
    );
});

Voucher.propTypes = {
    detalles: PropTypes.array,
    cliente: PropTypes.string,
    total: PropTypes.number,
};

export default Voucher;
