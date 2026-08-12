import { getVitrinaAtributos, type StoreProducto } from "../../../types/storefront";

type Props = {
  producto: StoreProducto;
  /** En cards del catálogo: menos chips */
  compact?: boolean;
  className?: string;
};

export function VitrinaAttrsPreview({ producto, compact = false, className = "" }: Props) {
  const { talla, tonalidad } = getVitrinaAtributos(producto);
  if (talla.length === 0 && tonalidad.length === 0) return null;

  const maxTallas = compact ? 4 : talla.length;
  const maxTonos = compact ? 3 : tonalidad.length;
  const tallasVis = talla.slice(0, maxTallas);
  const tonosVis = tonalidad.slice(0, maxTonos);
  const extraTallas = talla.length - tallasVis.length;
  const extraTonos = tonalidad.length - tonosVis.length;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tallasVis.map((t) => (
        <span
          key={t}
          className="store-chip text-[10px] px-2 py-0.5 border store-hairline font-medium leading-none"
        >
          {t}
        </span>
      ))}
      {extraTallas > 0 && (
        <span className="text-[10px] store-muted">+{extraTallas}</span>
      )}
      {tonosVis.map((t) => (
        <span
          key={`${t.nombre}-${t.hex}`}
          className="inline-flex items-center gap-1 store-chip text-[10px] px-1.5 py-0.5 border store-hairline font-medium leading-none"
          title={t.nombre}
        >
          <span
            className="size-2.5 rounded-full border store-hairline shrink-0"
            style={{ backgroundColor: t.hex }}
            aria-hidden
          />
          {!compact && <span>{t.nombre}</span>}
        </span>
      ))}
      {extraTonos > 0 && (
        <span className="text-[10px] store-muted">+{extraTonos}</span>
      )}
    </div>
  );
}
