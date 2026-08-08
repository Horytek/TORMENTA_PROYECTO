import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

export function CommerceSyncHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [erp, setErp] = useState(42);
  const [ecom, setEcom] = useState(28);
  const [syncing, setSyncing] = useState(false);

  function reconciliar() {
    setSyncing(true);
    setErp(42);
    setEcom(28);
    window.setTimeout(() => {
      setErp(100);
      setEcom(100);
      setSyncing(false);
    }, 80);
  }

  function desalinear() {
    setErp(55);
    setEcom(31);
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Sync · ERP ↔ Ecommerce">
      <div className="space-y-5">
        <ChannelBar label="ERP" value={erp} accent={accent} />
        <ChannelBar label="Ecommerce" value={ecom} accent={accent} muted />
      </div>

      <p className="mt-4 text-[11px] text-white/45">
        {erp === ecom && erp === 100
          ? "Stock alineado en ambos canales"
          : syncing
            ? "Reconciliando…"
            : "Hay desfase entre canales"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <AccentBtn accent={accent} theme={theme} onClick={reconciliar}>
          Reconciliar
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={desalinear}>
          Simular desfase
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

function ChannelBar({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px]">
        <span className="uppercase tracking-[0.14em] text-white/50">{label}</span>
        <span className="font-mono tabular-nums text-white/70">{value}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden bg-white/10">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: muted ? `${accent}99` : accent,
          }}
        />
      </div>
    </div>
  );
}
