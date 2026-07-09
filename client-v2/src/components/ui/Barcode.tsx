import React from "react";
import useBarcode from "@/hooks/useBarcode";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  options?: JsBarcode.Options;
  className?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  title?: string;
}

export default function Barcode({ value, options, className, onClick, title }: BarcodeProps) {
  const barcodeRef = useBarcode(value, options);

  return (
    <svg 
      ref={barcodeRef} 
      className={className} 
      onClick={onClick} 
      title={title}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}
