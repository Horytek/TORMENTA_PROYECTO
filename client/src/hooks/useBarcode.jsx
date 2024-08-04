import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const useBarcode = (value, options = {}) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      JsBarcode(barcodeRef.current, value, {
        format: 'CODE39',
        lineColor: '#000000',
        width: 0.62,
        height: 40,
        fontSize: 11,
        displayValue: true,
        ...options,
      });
    }
  }, [value, options]);

  return barcodeRef;
};

export default useBarcode;
