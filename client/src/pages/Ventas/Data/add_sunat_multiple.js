import axios from 'axios';
import toast from 'react-hot-toast';
/*
// Función para obtener la última venta del mismo tipo de comprobante y calcular el correlativo
const obtenerUltimaVentaYCorrelativo = (tipoComprobante) => {
    // Obtener todas las ventas del localStorage
    const todasVentas = JSON.parse(localStorage.getItem('total_ventas')) || [];
  
    // Filtrar por tipo de comprobante
    const ventasDelTipo = todasVentas.filter(venta => venta.tipoComprobante === tipoComprobante);
  
    // Ordenar por correlativo para encontrar la última venta
    ventasDelTipo.sort((a, b) => {
      // Comparar correlativos como números
      return parseInt(b.num, 10) - parseInt(a.num, 10);
    });
  
    // Obtener la última venta
    const ultimaVenta = ventasDelTipo[0];
  
    // Obtener la última serie y calcular el nuevo correlativo
    const ultimaSerie = ultimaVenta ? ultimaVenta.serieNum : '';
    const nuevoCorrelativo = ultimaVenta ? parseInt(ultimaVenta.num, 10) + 1 : 1;

    const tipoDocMapping = {
        "Boleta": "B",
        "Factura": "F",
      };
    
      const ultimaSerie_n = tipoDocMapping[tipoComprobante] || "B";

  
    return { nuevaSerie: ultimaSerie_n+ultimaSerie, nuevoCorrelativo };
  };*/
  function convertDateToDesiredFormat(dateString, offsetHours) {
    // Crear una instancia de la fecha en UTC
    const date = new Date(dateString);

    // Ajustar la fecha al desfase horario deseado
    const offsetMilliseconds = offsetHours * 60 * 60 * 1000;
    const adjustedDate = new Date(date.getTime() - offsetMilliseconds);

    // Obtener los componentes de la fecha en el formato deseado
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0'); // Meses están en el rango [0, 11]
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

    // Formatear en la cadena deseada
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
    return formattedDate;
}


// Función para enviar los datos a SUNAT
const enviarVentaASunat = async (data) => {

  const url = 'https://facturacion.apisperu.com/api/v1/invoice/send';
  const token = import.meta.env.VITE_TOKEN_SUNAT || '';
  console.log('Payload enviado:', JSON.stringify(data, null, 2)); // Añadir esto para verificar los datos

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Respuesta de la API:', response.data);

    if (response.status === 200) {
      //toast.success(`Los datos se han enviado con éxito a la Sunat.`);
    } else {
      toast.error('Error al enviar los datos a la Sunat. Por favor, inténtelo de nuevo.');
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
    if (error.response) {
      toast.error(`Error al enviar los datos a la Sunat: ${error.response.status} - ${error.response.data}`);
    } else {
      toast.error('Error al enviar los datos a la Sunat. Por favor, inténtelo de nuevo.');
    }
  }
};

// Función principal para manejar la aceptación de múltiples ventas
export const handleSunatMultiple = (ventas) => {
    //const loadingToastId = toast.loading('Enviando ventas a la Sunat...');

    // Iterar sobre cada venta y enviarla a SUNAT
    ventas.forEach((venta) => {
        // Obtener los detalles de la venta
        const detalles = venta.detalles;

        // Calcular el monto total considerando que los precios ya incluyen IGV
        const totalGravada = detalles.reduce((acc, detalle) => {
            const precioUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', ''));
            const precioSinIgv = precioUnitarioConIgv / 1.18; // Eliminar el IGV para obtener el valor base
            return acc + (precioSinIgv * detalle.cantidad);
        }, 0);

        const mtoIGV = totalGravada * 0.18; // IGV calculado como el 18% del total gravado
        const subTotal = totalGravada + mtoIGV;

        const tipoDocMapping = {
            "Boleta": "03",
            "Factura": "01",
        };

        const tipoDoc = tipoDocMapping[venta.tipoComprobante] || "03";

        // Obtener el nuevo correlativo
        const nuevoCorrelativo = parseInt(venta.num, 10);

        const tipoDocMapping1 = {
            "Boleta": "B",
            "Factura": "F",
        };

        const ultimaSerie_n = tipoDocMapping1[venta.tipoComprobante] || "B";
        const nuevaSerie_t = ultimaSerie_n + venta.serieNum;

        // Determinar el tipo de documento basado en el documento del cliente
        const tipoDocCliente = venta.ruc.length === 11 ? "6" : "1";
        const isoDate = venta.fecha_iso;
        const offsetHours = -5; // Ajuste de zona horaria para -05:00
        const result = convertDateToDesiredFormat(isoDate, offsetHours);

        const data = {
            ublVersion: "2.1",
            tipoOperacion: "0101",
            tipoDoc: tipoDoc,
            serie: nuevaSerie_t.toString(),
            correlativo: venta.num.toString(),
            fechaEmision: result,
            formaPago: {
                moneda: "PEN",
                tipo: "Contado"
            },
            tipoMoneda: "PEN",
            client: {
                tipoDoc: tipoDocCliente,
                numDoc: venta.ruc || '',
                rznSocial: venta.cliente || '',
                address: {
                    direccion: "",
                    provincia: "",
                    departamento: "",
                    distrito: "",
                    ubigueo: ""
                }
            },
            company: {
                ruc: 20610588981,
                razonSocial: "TEXTILES CREANDO MODA S.A.C.",
                nombreComercial: "TEXTILES CREANDO MODA S.A.C.",
                address: {
                    direccion: "CAL. SAN MARTIN NRO. 1573 URB. URRUNAGA SC. TRES LAMBAYEQUE CHICLAYO JOSE LEONARDO ORTIZ",
                    provincia: "CHICLAYO",
                    departamento: "LAMBAYEQUE",
                    distrito: "JOSE LEONARDO ORTIZ",
                    ubigueo: "140105"
                }
            },
            mtoOperGravadas: totalGravada.toFixed(2),
            mtoIGV: mtoIGV.toFixed(2),
            valorVenta: totalGravada.toFixed(2),
            totalImpuestos: mtoIGV.toFixed(2),
            subTotal: subTotal.toFixed(2),
            mtoImpVenta: subTotal.toFixed(2),
            details: detalles.map(detalle => {
                const cantidad = parseInt(detalle.cantidad);
                const mtoValorUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', '')).toFixed(2);
                const mtoValorUnitarioSinIgv = (mtoValorUnitarioConIgv / 1.18).toFixed(2);
                const mtoValorVenta = (cantidad * mtoValorUnitarioSinIgv).toFixed(2);
                const mtoBaseIgv = mtoValorVenta;
                const igv = (parseFloat(mtoBaseIgv) * 0.18).toFixed(2);
                const totalImpuestos = igv;
                const mtoPrecioUnitario = mtoValorUnitarioConIgv;

                return {
                    codProducto: detalle.codigo,
                    unidad: detalle.undm || 'ZZ',
                    descripcion: detalle.nombre,
                    cantidad: cantidad,
                    mtoValorUnitario: mtoValorUnitarioSinIgv,
                    mtoValorVenta: mtoValorVenta,
                    mtoBaseIgv: mtoBaseIgv,
                    porcentajeIgv: 18,
                    igv: igv,
                    tipAfeIgv: 10,
                    totalImpuestos: totalImpuestos,
                    mtoPrecioUnitario: mtoPrecioUnitario
                };
            }),
            legends: [
                {
                    code: "1000",
                    value: `SON ${subTotal.toFixed(2)} CON 00/100 SOLES`
                }
            ]
        };

        enviarVentaASunat(data)
            .then(() => {
                console.log(`Venta ${nuevaSerie_t}-${nuevoCorrelativo} enviada con éxito.`);
            })
            .catch((error) => {
                console.error(`Error al enviar la venta ${nuevaSerie_t}-${nuevoCorrelativo}:`, error);
            });
    });

    //toast.dismiss(loadingToastId);
};