import useBarcode from '@/hooks/useBarcode';

const Barcode = ({ value, options }) => {
  const barcodeRef = useBarcode(value, options);

  return <svg ref={barcodeRef}></svg>;
};

export default Barcode;
