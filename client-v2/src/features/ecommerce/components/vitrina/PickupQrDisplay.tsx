import { QRCodeSVG } from "qrcode.react";

type Props = {
  payload: string;
  codigo?: string | null;
  className?: string;
  size?: number;
  hint?: boolean;
};

export function PickupQrDisplay({
  payload,
  codigo,
  className = "",
  size = 220,
  hint = true,
}: Props) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
        <QRCodeSVG value={payload} size={size} level="M" includeMargin />
      </div>
      {hint && (
        <p className="text-sm text-stone-500 text-center max-w-xs">
          Muestra este código QR en la tienda para retirar tu pedido.
        </p>
      )}
      {codigo && (
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-stone-400">Código de retiro</p>
          <p className="text-2xl font-mono font-bold tracking-widest mt-1">{codigo}</p>
        </div>
      )}
    </div>
  );
}
