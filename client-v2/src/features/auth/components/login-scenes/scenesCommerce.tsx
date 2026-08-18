import { SceneCard, SceneChip, SceneLabel, SceneProgress } from "./sceneShared";

const SWATCHES = ["#243645", "#3E6B89", "#0E7C7B", "#C9A227", "#B23A48"];

export function SceneErp() {
  return (
    <SceneCard accent="#1e293b">
      <div className="absolute -top-3 left-8 h-6 w-6 rounded-full border-4 border-[#1e293b] bg-[#FAFAF8]" />
      <div className="absolute -top-9 left-[2.6rem] h-6 w-px rotate-12 bg-white/30" />
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#3E6B89]">
        TAG · POL-0432
      </p>
      <h2 className="mt-1 text-xl font-semibold leading-tight">Polo Oversize</h2>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <SceneLabel>Tonalidades</SceneLabel>
          <div className="mt-1.5 flex -space-x-1.5">
            {SWATCHES.map((c) => (
              <span
                key={c}
                className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="text-right">
          <SceneLabel>Precio</SceneLabel>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">S/ 49.90</p>
        </div>
      </div>
      <div className="mt-4 border-t border-dashed border-black/15 pt-3">
        <SceneLabel>Curva de tallas</SceneLabel>
        <div className="mt-1.5 flex gap-1.5">
          {["S", "M", "L"].map((s) => (
            <span
              key={s}
              className="flex h-8 w-8 items-center justify-center rounded border border-black/15 text-[12px] font-semibold"
            >
              {s}
            </span>
          ))}
          <span className="relative flex h-8 w-8 items-center justify-center rounded border border-black/10 text-[12px] text-black/30">
            XL
            <span className="absolute inset-x-1 top-1/2 h-px -rotate-12 bg-black/35" />
          </span>
        </div>
        <p className="mt-3 text-xs text-black/45">
          stock <span className="font-semibold text-[#0E7C7B]">128</span> · almacén central
        </p>
      </div>
    </SceneCard>
  );
}

export function ScenePocket() {
  return (
    <SceneCard rotate={false} accent="#f59e0b" className="font-mono">
      <div className="flex items-center justify-between">
        <SceneLabel>Pocket POS</SceneLabel>
        <SceneChip color="#f59e0b">Venta #1842</SceneChip>
      </div>
      <p className="mt-3 text-[11px] text-black/40">Hoy · 14:32</p>
      <ul className="mt-3 space-y-2 border-y border-dashed border-black/15 py-3 text-[13px]">
        <li className="flex justify-between gap-2">
          <span>Café americano ×2</span>
          <span className="tabular-nums">12.00</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Sandwich mixto</span>
          <span className="tabular-nums">9.50</span>
        </li>
      </ul>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <SceneLabel>Pago</SceneLabel>
          <p className="mt-0.5 text-sm font-semibold text-[#d97706]">Yape</p>
        </div>
        <div className="text-right">
          <SceneLabel>Total</SceneLabel>
          <p className="text-2xl font-bold tabular-nums">S/ 21.50</p>
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] tracking-widest text-black/35">
        · · · GRACIAS · · ·
      </p>
    </SceneCard>
  );
}

export function SceneEcommerce() {
  return (
    <SceneCard accent="#0f766e">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#0f766e]/10 text-[11px] font-bold text-[#0f766e]">
          IMG
        </div>
        <div className="min-w-0 flex-1">
          <SceneChip color="#0f766e">Pedido #4091</SceneChip>
          <p className="mt-2 text-[15px] font-semibold leading-snug">Zapatillas Runner Pro</p>
          <p className="text-[12px] text-black/45">Talla 40 · Negro</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-[12px]">
        <li className="flex justify-between border-b border-black/8 pb-2">
          <span>Zapatillas ×1</span>
          <span className="tabular-nums font-medium">S/ 189.00</span>
        </li>
        <li className="flex justify-between border-b border-black/8 pb-2">
          <span>Medias pack ×1</span>
          <span className="tabular-nums font-medium">S/ 29.00</span>
        </li>
        <li className="flex justify-between pt-1 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">S/ 218.00</span>
        </li>
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="rounded-md bg-[#00a0e3]/15 px-2 py-1 text-[10px] font-bold text-[#0077ad]">
          Mercado Pago
        </span>
        <span className="text-[11px] font-medium text-emerald-700">Pagado · por enviar</span>
      </div>
    </SceneCard>
  );
}

export function SceneCatalogoWa() {
  return (
    <SceneCard rotate={false} accent="#0D9488" className="bg-[#E8F5E9]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">
          WA
        </span>
        <div>
          <p className="text-[13px] font-semibold">Abarrotes Rosa</p>
          <p className="text-[10px] text-black/45">en línea</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-white px-3 py-2 text-[12px] shadow-sm">
          <p className="font-medium">Carrito listo</p>
          <p className="mt-1 text-black/55">Arroz 5kg · Aceite · Leche ×2</p>
          <p className="mt-1 font-semibold tabular-nums text-[#0D9488]">Total S/ 48.90</p>
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#DCF8C6] px-3 py-2 text-[12px]">
          ¿Lo enviamos hoy por la tarde?
        </div>
      </div>
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-[12px] font-semibold text-white"
        tabIndex={-1}
      >
        Enviar por WhatsApp · 3 ítems
      </button>
    </SceneCard>
  );
}

export function SceneSync() {
  return (
    <SceneCard accent="#0284C7">
      <div className="flex items-center justify-between">
        <SceneLabel>Job nocturno</SceneLabel>
        <SceneChip color="#0284C7">Reconciliado</SceneChip>
      </div>
      <div className="mt-4 flex items-center justify-between gap-1 text-center text-[10px] font-semibold">
        {["ERP", "Shopify", "Market"].map((c, i) => (
          <div key={c} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="flex h-10 w-full items-center justify-center rounded-lg border border-black/10 bg-white text-[11px]"
              style={{ color: "#0284C7" }}
            >
              {c}
            </span>
            {i < 2 ? <span className="text-black/30">↔</span> : null}
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-[12px]">
        {[
          { sku: "POL-0432", d: "+12" },
          { sku: "ZAP-091", d: "−3" },
          { sku: "ACC-12", d: "0" },
        ].map((r) => (
          <li key={r.sku} className="flex justify-between border-b border-black/8 pb-1.5 font-mono">
            <span>{r.sku}</span>
            <span className={r.d.startsWith("−") ? "text-rose-600" : "text-emerald-700"}>{r.d}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-black/45">1.2k SKUs · 3 canales auditados</p>
    </SceneCard>
  );
}

export function SceneMayorista() {
  return (
    <SceneCard accent="#B45309">
      <SceneLabel>Cuenta B2B</SceneLabel>
      <p className="mt-1 text-lg font-semibold">Distribuidora Norte</p>
      <p className="text-[12px] text-black/45">Lista volumen · pago 30 días</p>
      <div className="mt-4 space-y-2 rounded-lg border border-black/10 bg-white/80 p-3 text-[12px]">
        <div className="flex justify-between">
          <span>Detergente 20L</span>
          <span className="font-mono font-semibold">S/ 68.00</span>
        </div>
        <div className="flex justify-between text-black/50">
          <span>MOQ</span>
          <span>4 bultos</span>
        </div>
        <div className="flex justify-between text-black/50">
          <span>En carrito</span>
          <span>8 bultos</span>
        </div>
      </div>
      <div
        className="mt-4 rounded-lg py-2.5 text-center text-[12px] font-semibold text-white"
        style={{ backgroundColor: "#B45309" }}
      >
        Agregar al pedido
      </div>
    </SceneCard>
  );
}

export function ScenePreventa() {
  return (
    <SceneCard accent="#E11D48">
      <div className="flex items-center justify-between">
        <SceneLabel>Drop limitado</SceneLabel>
        <SceneChip color="#E11D48">Live</SceneChip>
      </div>
      <p className="mt-2 text-lg font-semibold leading-snug">Colección Invierno 26</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { v: "02", l: "hrs" },
          { v: "14", l: "min" },
          { v: "38", l: "seg" },
        ].map((t) => (
          <div key={t.l} className="rounded-lg bg-black/5 py-2">
            <p className="font-mono text-xl font-bold tabular-nums">{t.v}</p>
            <p className="text-[9px] uppercase tracking-wider text-black/40">{t.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span>Cupo 156 / 200</span>
          <span className="font-semibold text-[#E11D48]">Anticipo 30%</span>
        </div>
        <SceneProgress value={78} color="#E11D48" />
      </div>
      <p className="mt-3 text-[11px] text-black/45">44 plazas restantes</p>
    </SceneCard>
  );
}

export function SceneAtelier() {
  return (
    <SceneCard accent="#DB2777">
      <div className="flex items-center justify-between gap-2">
        <SceneLabel>Encargo #AT-184</SceneLabel>
        <SceneChip color="#DB2777">Pagado</SceneChip>
      </div>
      <p className="mt-2 text-lg font-semibold leading-snug">Retrato de mascota</p>
      <p className="text-[12px] text-black/45">Acuarela · A4 · Luna Ink</p>
      <ul className="mt-4 space-y-2 border-y border-dashed border-black/15 py-3 text-[12px]">
        <li className="flex justify-between gap-2">
          <span>Brief aprobado</span>
          <span className="font-medium text-emerald-700">listo</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Cotización</span>
          <span className="tabular-nums font-medium">S/ 180.00</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Mercado Pago</span>
          <span className="font-medium text-emerald-700">escrow</span>
        </li>
      </ul>
      <div className="mt-4">
        <SceneLabel>Entrega</SceneLabel>
        <SceneProgress value={72} color="#DB2777" />
        <p className="mt-2 text-[11px] text-black/45">Borrador en revisión · 1 ajuste restante</p>
      </div>
    </SceneCard>
  );
}
