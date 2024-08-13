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
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VybmFtZSI6IkRhdmlzdEVkdUJ1c3RhbWFudGUxMjMiLCJjb21wYW55IjoiMjA2MTA1ODg5ODEiLCJpYXQiOjE3MjIyMTIxODMsImV4cCI6ODAyOTQxMjE4M30.jTISqfzQh-HAa8XLPjJDipnCunA8aisPDmlOH3-Gqy4t3jRJUUSS1XElkimQj2qpiWJbS4bu-ySqC6WTy9kbbojo6_IgWvgtbs55EG3OMCDRTPrsFjADMf8OjLQ0geKUFqn981cDZkAamIVB9UTa5V8tU2anyUams4zr2JZf_qydBwa5ScaGiWRyPoCOi8Z7akdzNL5nfOKtYYtlg8qzGA2Za3bEMp7uxAVr2O-m9D-j_3zsU0TgSnnNiD4_sm6_R0YdZl-WfHlvxCrTHakLFxC_lC2UGTx-Q4zw0NXrybcq2nqESEuQZn-Su777yCc-oTGTm5zwO220NOBiEHXCm0imFW1NtptWtxE0jWatHM2s-TvTRSHndcMuunbIb9DWdkQ1PlQgx3o17LZDEDjnmQPG3b-z7h-wgtmW6OvJiEfQwvycGuOu0j_OkZaGZsXQcVAkItSLjZhPX5Yor0COwnccdBdbmd5mxNy5qiOT8E-Ssu1ua-iyT308saytvAGq36HP1CQHVIFAF0lciBR--AGl4ha24_7H4WhH3MUBljLc5xwxLq2659XSFmMe_x7QWa8rycQi1ZjeAIxv9fFr5JlSm-APz4Yw8v3nxu9gm7dCUUm2fYDyHDuAjlh5Lnt2RGtkmmZSa22e3PpBPshUgtEqQMrT-zBlJlsXwyU1uRc';
  
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
      toast.success(`Los datos se han enviado con éxito a la Sunat.`);
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

// Función principal para manejar la aceptación de la venta
export const handleSunat = (cliente, detalles, productos) => {
  // Calcular el monto total considerando que los precios ya incluyen IGV
  const totalGravada = detalles.reduce((acc, detalle) => {
    const precioUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', ''));
    const precioSinIgv = precioUnitarioConIgv / 1.18; // Eliminar el IGV para obtener el valor base
    return acc + (precioSinIgv * detalle.cantidad);
  }, 0);

  const mtoIGV = totalGravada * 0.18; // IGV calculado como el 18% del total gravado
  const subTotal = totalGravada + mtoIGV;

  const comprobante = JSON.parse(localStorage.getItem('ventas'));

  const tipoDocMapping = {
    "Boleta": "03",
    "Factura": "01",
  };

  const tipoDoc = tipoDocMapping[comprobante.tipoComprobante] || "03";

  // Obtener el nuevo correlativo
  const ultimaSerie = comprobante.serieNum;
  //const nuevoCorrelativo = parseInt(comprobante.num, 10);

  const tipoDocMapping1 = {
    "Boleta": "B",
    "Factura": "F",
  };

  const ultimaSerie_n = tipoDocMapping1[comprobante.tipoComprobante] || "B";
  const nuevaSerie_t = ultimaSerie_n + ultimaSerie;

  // Determinar el tipo de documento basado en el documento del cliente
  const tipoDocCliente = cliente?.documento?.length === 8 ? "1" : "6";
  const isoDate = cliente.fechaEmision;
  const offsetHours = -5; // Ajuste de zona horaria para -05:00
  const result = convertDateToDesiredFormat(isoDate, offsetHours);
  const data = {
    ublVersion: "2.1",
    tipoOperacion: "0101",
    tipoDoc: tipoDoc,
    serie: nuevaSerie_t.toString(),
    correlativo: comprobante.num.toString(),
    fechaEmision: result,
    formaPago: {
      moneda: "PEN",
      tipo: "Contado"
    },
    tipoMoneda: "PEN",
    client: {
      tipoDoc: tipoDocCliente,
      numDoc: cliente?.documento || '',
      rznSocial: cliente?.nombre || '',
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
      const producto = productos.find(prod => prod.codigo === detalle.codigo);
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
        unidad: producto?.undm || 'ZZ',
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

  const loadingToastId = toast.loading('Se están enviando los datos a la Sunat...');
  console.log('Datos de la venta:', data);
  enviarVentaASunat(data)
    .then(() => {
      toast.dismiss(loadingToastId);
    })
    .catch(() => {
      toast.dismiss(loadingToastId);
    });
};


/*
// Ejemplo de uso de la función handleAccept con datos dinámicos
const cliente = {
  nombre: 'Ruben Meladoblas',
  documento: '73747576',
  direccion: 'Av. Balta'
};

const detalles = [
  {
    codigo: '024',
    nombre: 'jeans 4 botones',
    cantidad: 1,
    precio: 'S/ 50.00',
    descuento: 'S/ 0.00',
    subtotal: 'S/ 50.00'
  }
];

const productos = [
  { codigo: '024', undm: 'NIU', nom_marca: 'Marca A' }
];

const igv_t = 'S/ 10.62';

// Llamada a la función con los datos dinámicos
handleAccept(cliente, detalles, productos, igv_t, total_t);
*/