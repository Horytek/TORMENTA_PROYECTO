import axios from 'axios';
import toast from 'react-hot-toast';

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

// Función para anular los datos de una venta en la SUNAT
export const anularVentaEnSunatF = async (ventaData) => {
  const url = 'https://facturacion.apisperu.com/api/v1/voided/send';
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VybmFtZSI6IkRhdmlzdEVkdUJ1c3RhbWFudGUxMjMiLCJjb21wYW55IjoiMjA2MTA1ODg5ODEiLCJpYXQiOjE3MjIyMTIxODMsImV4cCI6ODAyOTQxMjE4M30.jTISqfzQh-HAa8XLPjJDipnCunA8aisPDmlOH3-Gqy4t3jRJUUSS1XElkimQj2qpiWJbS4bu-ySqC6WTy9kbbojo6_IgWvgtbs55EG3OMCDRTPrsFjADMf8OjLQ0geKUFqn981cDZkAamIVB9UTa5V8tU2anyUams4zr2JZf_qydBwa5ScaGiWRyPoCOi8Z7akdzNL5nfOKtYYtlg8qzGA2Za3bEMp7uxAVr2O-m9D-j_3zsU0TgSnnNiD4_sm6_R0YdZl-WfHlvxCrTHakLFxC_lC2UGTx-Q4zw0NXrybcq2nqESEuQZn-Su777yCc-oTGTm5zwO220NOBiEHXCm0imFW1NtptWtxE0jWatHM2s-TvTRSHndcMuunbIb9DWdkQ1PlQgx3o17LZDEDjnmQPG3b-z7h-wgtmW6OvJiEfQwvycGuOu0j_OkZaGZsXQcVAkItSLjZhPX5Yor0COwnccdBdbmd5mxNy5qiOT8E-Ssu1ua-iyT308saytvAGq36HP1CQHVIFAF0lciBR--AGl4ha24_7H4WhH3MUBljLc5xwxLq2659XSFmMe_x7QWa8rycQi1ZjeAIxv9fFr5JlSm-APz4Yw8v3nxu9gm7dCUUm2fYDyHDuAjlh5Lnt2RGtkmmZSa22e3PpBPshUgtEqQMrT-zBlJlsXwyU1uRc';  // Token de acceso a la API
  const isoDate = ventaData.fechaEmision;
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const localDate = today.toISOString().slice(0, 10);
  const offsetHours = -5; // Ajuste de zona horaria para -05:00
  const result = convertDateToDesiredFormat(isoDate, offsetHours);
  const result1 = convertDateToDesiredFormat(localDate, offsetHours);


    // Obtener el nuevo correlativo
    const ultimaSerie = ventaData.serieNum;
    //const nuevoCorrelativo = parseInt(comprobante.num, 10);
  
    const tipoDocMapping1 = {
      "Boleta": "B",
      "Factura": "F",
    };
  
    const ultimaSerie_n = tipoDocMapping1[ventaData.tipoComprobante] || "B";
    const nuevaSerie_t = ultimaSerie_n + ultimaSerie;

  const data = {
    correlativo: ventaData.anular,
    fecGeneracion: result,
    fecComunicacion: result1,
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
    details:[
        {
      tipoDoc: "01",
      serie: nuevaSerie_t.toString(),
      correlativo: ventaData.num.toString(),
      desMotivoBaja: "ERROR EN CÁLCULOS"
    }
    ]
  };

  console.log('Payload enviado:', JSON.stringify(data, null, 2)); // Verificar los datos antes de enviarlos

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Respuesta de la API:', response.data);
    
    if (response.status === 200) {
     //toast.success('La anulación de la venta se ha enviado con éxito a la Sunat.');
    } else {
      toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
    if (error.response) {
      toast.error(`Error al anular la venta en la Sunat: ${error.response.status} - ${error.response.data}`);
    } else {
      toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
    }
  }
};


// Función para anular los datos de una venta en la SUNAT
export const anularVentaEnSunatB = async (ventaData,detalles) => {
    const url = 'https://facturacion.apisperu.com/api/v1/summary/send';
    const token = import.meta.env.VITE_TOKEN_SUNAT || '';  // Token de acceso a la API
    const isoDate = ventaData.fechaEmision;
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const localDate = today.toISOString().slice(0, 10);
    const offsetHours = -5; // Ajuste de zona horaria para -05:00
    const result = convertDateToDesiredFormat(isoDate, offsetHours);
    const result1 = convertDateToDesiredFormat(localDate, offsetHours);
    
      // Calcular el monto total considerando que los precios ya incluyen IGV
    const totalGravada = detalles.reduce((acc, detalle) => {
        const precioUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', ''));
        const precioSinIgv = precioUnitarioConIgv / 1.18; // Eliminar el IGV para obtener el valor base
        return acc + (precioSinIgv * detalle.cantidad);
    }, 0);

    const mtoIGV = totalGravada * 0.18; // IGV calculado como el 18% del total gravado
    const subTotal = totalGravada + mtoIGV;
  
      // Obtener el nuevo correlativo
      const ultimaSerie = ventaData.serieNum;
      //const nuevoCorrelativo = parseInt(comprobante.num, 10);
    
      const tipoDocMapping1 = {
        "Boleta": "B",
        "Factura": "F",
      };
    
      const ultimaSerie_n = tipoDocMapping1[ventaData.tipoComprobante] || "B";
      const nuevaSerie_t = ultimaSerie_n + ultimaSerie;

      const serieNum = nuevaSerie_t + '-' + ventaData.num;
      const tipoDocCliente = ventaData.documento.length === 11 ? "6" : "1";
  
    const data = {
      fecGeneracion: result,
      fecResumen: result1,
      correlativo: ventaData.anular_b,
      moneda: "PEN",
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
      details:[
          {
        tipoDoc: "03",
        serieNro: serieNum.toString(),
        estado: "3",
        clienteTipo: tipoDocCliente,
        clienteNro: ventaData.documento,
        total: subTotal.toFixed(2),
        mtoOperGravadas: totalGravada.toFixed(2),
        mtoOperInafectas: 0,
        mtoOperExoneradas: 0,
        mtoOperExportacion: 0,
        mtoOtrosCargos: 0,
        mtoIGV: mtoIGV.toFixed(2)
      }
      ]
    };
  
    console.log('Payload enviado:', JSON.stringify(data, null, 2)); // Verificar los datos antes de enviarlos
  
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      console.log('Respuesta de la API:', response.data);
  
      if (response.status === 200) {
        //toast.success('La anulación de la venta se ha enviado con éxito a la Sunat.');
      } else {
        toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
      if (error.response) {
        toast.error(`Error al anular la venta en la Sunat: ${error.response.status} - ${error.response.data}`);
      } else {
        toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
      }
    }
  };




/*
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
};*/