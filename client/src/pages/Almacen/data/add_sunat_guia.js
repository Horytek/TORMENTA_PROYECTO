import axios from 'axios';
import toast from 'react-hot-toast';

//POR AHORA NO FUNCIONA

const enviarGuiaRemisionASunat = async (data) => {
  const url = 'https://facturacion.apisperu.com/api/v1/despatch/send';
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VybmFtZSI6IkRhdmlzdEVkdUJ1c3RhbWFudGUxMjMiLCJjb21wYW55IjoiMjA2MTA1ODg5ODEiLCJpYXQiOjE3MjIyMTIxODMsImV4cCI6ODAyOTQxMjE4M30.jTISqfzQh-HAa8XLPjJDipnCunA8aisPDmlOH3-Gqy4t3jRJUUSS1XElkimQj2qpiWJbS4bu-ySqC6WTy9kbbojo6_IgWvgtbs55EG3OMCDRTPrsFjADMf8OjLQ0geKUFqn981cDZkAamIVB9UTa5V8tU2anyUams4zr2JZf_qydBwa5ScaGiWRyPoCOi8Z7akdzNL5nfOKtYYtlg8qzGA2Za3bEMp7uxAVr2O-m9D-j_3zsU0TgSnnNiD4_sm6_R0YdZl-WfHlvxCrTHakLFxC_lC2UGTx-Q4zw0NXrybcq2nqESEuQZn-Su777yCc-oTGTm5zwO220NOBiEHXCm0imFW1NtptWtxE0jWatHM2s-TvTRSHndcMuunbIb9DWdkQ1PlQgx3o17LZDEDjnmQPG3b-z7h-wgtmW6OvJiEfQwvycGuOu0j_OkZaGZsXQcVAkItSLjZhPX5Yor0COwnccdBdbmd5mxNy5qiOT8E-Ssu1ua-iyT308saytvAGq36HP1CQHVIFAF0lciBR--AGl4ha24_7H4WhH3MUBljLc5xwxLq2659XSFmMe_x7QWa8rycQi1ZjeAIxv9fFr5JlSm-APz4Yw8v3nxu9gm7dCUUm2fYDyHDuAjlh5Lnt2RGtkmmZSa22e3PpBPshUgtEqQMrT-zBlJlsXwyU1uRc';
  
  console.log('Payload enviado:', JSON.stringify(data, null, 2)); // Verificar los datos enviados

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Respuesta de la API:', response.data);

    if (response.status === 200) {
      toast.success(`La guía de remisión se ha enviado con éxito a la Sunat.`);
    } else {
      toast.error('Error al enviar la guía de remisión a la Sunat. Por favor, inténtelo de nuevo.');
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
    if (error.response) {
      toast.error(`Error al enviar la guía de remisión a la Sunat: ${error.response.status} - ${error.response.data}`);
    } else {
      toast.error('Error al enviar la guía de remisión a la Sunat. Por favor, inténtelo de nuevo.');
    }
  }
};

export const handleGuiaRemisionSunat = (guia, cliente, transportista, detalles) => {
  const tipoDoc = "05"; // Código para guía de remisión
  const isoDate = guia.fechaEmision;
  const offsetHours = -5; // Ajuste de zona horaria para -05:00
  const result = convertDateToDesiredFormat(isoDate, offsetHours);

  const data = {
    version: 2022,
    tipoDoc: tipoDoc,
    serie: guia.serie,
    correlativo: guia.correlativo.toString(),
    fechaEmision: result,
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
    destinatario: {
      tipoDoc: cliente.tipoDoc,
      numDoc: cliente.documento,
      rznSocial: cliente.nombre
    },
    observacion: guia.observacion || "",
    envio: {
      codTraslado: "",
      desTraslado: "",
      modTraslado: "",
      fecTraslado: convertDateToDesiredFormat(guia.fecTraslado, offsetHours),
      pesoTotal: guia.pesoTotal,
      undPesoTotal: guia.undPesoTotal,
      llegada: {
        ubigueo: guia.llegada.ubigueo,
        direccion: guia.llegada.direccion
      },
      partida: {
        ubigueo: guia.partida.ubigueo,
        direccion: guia.partida.direccion
      },
      transportista: {
        tipoDoc: transportista.tipoDoc,
        numDoc: transportista.numDoc,
        rznSocial: transportista.rznSocial,
        placa: transportista.placa,
        choferTipoDoc: transportista.choferTipoDoc,
        choferDoc: transportista.choferDoc
      }
    },
    details: detalles.map(detalle => ({
      cantidad: detalle.cantidad,
      unidad: detalle.unidad || 'ZZ',
      descripcion: detalle.descripcion,
      codigo: detalle.codigo
    }))
  };

  const loadingToastId = toast.loading('Se están enviando los datos a la Sunat...');
  console.log('Datos de la guía de remisión:', data);
  enviarGuiaRemisionASunat(data)
    .then(() => {
      toast.dismiss(loadingToastId);
    })
    .catch(() => {
      toast.dismiss(loadingToastId);
    });
};
