import { Package, Receipt, ShoppingCart, Store } from "lucide-react";

/**
 * Diagrama radial del hero: las capacidades orbitando el centro.
 *
 * El hero tenía una tarjeta rectangular de 470px y nada más; el resto de la
 * página no tenía una sola pieza gráfica grande. Un diagrama radial resuelve
 * dos cosas a la vez: es el ancla visual que faltaba y dice "todo esto es un
 * solo sistema" sin un párrafo que lo explique.
 *
 * Se construye con SVG para los anillos y el texto curvo (`textPath`), y con
 * HTML posicionado encima para las insignias y el centro, que así pueden usar
 * los iconos de lucide en vez de trazarlos a mano.
 *
 * Los seis rótulos son módulos que existen y funcionan. Ver `MODULE_TILES`.
 */

const C = 240; // centro del viewBox
const R_TEXTO = 208; // radio del anillo de texto exterior
const R_PUNTEADO = 156; // radio del anillo punteado interior

/** Arco para `textPath`. `barrido` 1 lee de izquierda a derecha por arriba. */
function arco(radio: number, desdeGrados: number, hastaGrados: number, barrido: 0 | 1) {
  const p = (g: number) => {
    const rad = ((g - 90) * Math.PI) / 180;
    return [C + radio * Math.cos(rad), C + radio * Math.sin(rad)];
  };
  const [x1, y1] = p(desdeGrados);
  const [x2, y2] = p(hastaGrados);
  const largo = Math.abs(hastaGrados - desdeGrados) > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)},${y1.toFixed(1)} A ${radio},${radio} 0 ${largo} ${barrido} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

const ROTULOS_EXTERIORES = [
  { id: "ro-a", d: arco(R_TEXTO, -78, -6, 1), texto: "Control de stock" },
  { id: "ro-b", d: arco(R_TEXTO, 6, 78, 1), texto: "Facturación SUNAT" },
  // `barrido` unificado para evitar que algunos rótulos se “volteen” en ciertos navegadores.
  { id: "ro-c", d: arco(R_TEXTO, 186, 258, 1), texto: "Punto de venta" },
  { id: "ro-d", d: arco(R_TEXTO, 102, 174, 1), texto: "Tienda online" },
];

const ROTULOS_INTERIORES = [
  { id: "ri-a", d: arco(R_PUNTEADO, -52, 52, 1), texto: "Reportes y margen" },
  { id: "ri-b", d: arco(R_PUNTEADO, 128, 232, 1), texto: "Compras y proveedores" },
];

const INSIGNIAS = [
  { icon: Store, label: "Tienda", tono: "#3b82f6", pos: "left-[3%] top-[26%]" },
  { icon: Package, label: "Almacén", tono: "#14b8a6", pos: "right-[2%] top-[52%]" },
  { icon: Receipt, label: "SUNAT", tono: "#8b5cf6", pos: "left-[22%] bottom-[2%]" },
];

export function HeroOrbit() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[440px] select-none"
      role="img"
      aria-label="Control de stock, facturación SUNAT, punto de venta, tienda online, reportes y compras funcionando como un solo sistema."
    >
      <svg viewBox="0 0 480 480" className="h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="orbita-fondo" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="hsl(var(--lp-accent))" stopOpacity="0.13" />
            <stop offset="70%" stopColor="hsl(var(--lp-accent))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--lp-accent))" stopOpacity="0" />
          </radialGradient>
          {[...ROTULOS_EXTERIORES, ...ROTULOS_INTERIORES].map((r) => (
            <path key={r.id} id={r.id} d={r.d} fill="none" />
          ))}
        </defs>

        <circle cx={C} cy={C} r={190} fill="url(#orbita-fondo)" />
        <circle
          cx={C}
          cy={C}
          r={R_PUNTEADO}
          fill="none"
          stroke="hsl(var(--lp-accent))"
          strokeOpacity="0.42"
          strokeWidth="1.5"
          strokeDasharray="5 7"
        />
        <circle
          cx={C}
          cy={C}
          r={112}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeOpacity="0.8"
        />

        {ROTULOS_EXTERIORES.map((r) => (
          <text
            key={r.id}
            className="fill-foreground"
            fontSize="16.5"
            fontWeight="700"
            letterSpacing="-0.12"
          >
            <textPath href={`#${r.id}`} startOffset="50%" textAnchor="middle">
              {r.texto}
            </textPath>
          </text>
        ))}

        {ROTULOS_INTERIORES.map((r) => (
          <text
            key={r.id}
            fill="hsl(var(--lp-accent))"
            fontSize="12"
            fontWeight="600"
            letterSpacing="0.45"
          >
            <textPath href={`#${r.id}`} startOffset="50%" textAnchor="middle">
              {r.texto}
            </textPath>
          </text>
        ))}
      </svg>

      {/* Centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[20px] font-bold tracking-[-0.03em] text-foreground">
            Horytek<span className="text-[hsl(var(--lp-accent))]">.pe</span>
          </p>
          <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Un solo sistema
          </p>
          <div className="mt-2.5 flex justify-center">
            <ShoppingCart
              className="h-5 w-5 text-[hsl(var(--lp-accent))]"
              strokeWidth={1.8}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Insignias */}
      {INSIGNIAS.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.label} className={`absolute ${b.pos} flex flex-col items-center gap-1.5`}>
            <span
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full text-white shadow-lg"
              style={{ background: b.tono, boxShadow: `0 10px 24px -8px ${b.tono}` }}
            >
              <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
