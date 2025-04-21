import axios from 'axios';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getClaveSunatByUser } from "@/services/clave.services";
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
  const token = await getClaveSunatByUser();  
  const isoDate = ventaData.fechaEmision;
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const localDate = today.toISOString().slice(0, 10);
  const offsetHours = -5; // Ajuste de zona horaria para -05:00
  const result = convertDateToDesiredFormat(isoDate, offsetHours);
  const result1 = convertDateToDesiredFormat(localDate, offsetHours);
    // Obtener los datos de la empresa
    const empresaData = await getEmpresaDataByUser();

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
      ruc: empresaData.ruc,
      razonSocial: empresaData.razonSocial,
      nombreComercial: empresaData.nombreComercial,
      address: {
        direccion: empresaData.direccion,
        provincia: empresaData.provincia,
        departamento: empresaData.departamento,
        distrito: empresaData.distrito,
        ubigueo: empresaData.ubigueo,
      },
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
    const token = await getClaveSunatByUser();
    const isoDate = ventaData.fechaEmision;
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const localDate = today.toISOString().slice(0, 10);
    const offsetHours = -5; // Ajuste de zona horaria para -05:00
    const result = convertDateToDesiredFormat(isoDate, offsetHours);
    const result1 = convertDateToDesiredFormat(localDate, offsetHours);
        // Obtener los datos de la empresa
        const empresaData = await getEmpresaDataByUser();
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
        ruc: empresaData.ruc,
        razonSocial: empresaData.razonSocial,
        nombreComercial: empresaData.nombreComercial,
        address: {
          direccion: empresaData.direccion,
          provincia: empresaData.provincia,
          departamento: empresaData.departamento,
          distrito: empresaData.distrito,
          ubigueo: empresaData.ubigueo,
        },
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