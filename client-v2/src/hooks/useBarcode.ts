import { useEffect, useRef, type RefObject } from 'react';
import JsBarcode from 'jsbarcode';

export default function useBarcode(value: string, options: JsBarcode.Options = {}): RefObject<SVGSVGElement | null> {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE39',
          lineColor: '#000000',
          width: 0.62,
          height: 40,
          fontSize: 11,
          displayValue: true,
          ...options,
        });
      } catch (err) {
        console.error("JsBarcode generation error:", err);
      }
    }
  }, [value, options]);

  return barcodeRef;
}
