import { useState } from "react";
import { Fuel, ShieldCheck, Truck } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

type Panel = "none" | "soat" | "combustible";

export function OpsFleetHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [panel, setPanel] = useState<Panel>("none");

  function toggle(next: Panel) {
    setPanel((p) => (p === next ? "none" : next));
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Flotas · unidad">
      <div className="border border-white/10 bg-black/25 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center"
            style={{ backgroundColor: `${accent}28` }}
          >
            <Truck className="h-6 w-6" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold">ABC-482</p>
            <p className="text-[11px] text-white/50">Camión 3.5t · Lima Norte</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <AccentBtn
            accent={accent}
            variant={panel === "soat" ? "solid" : "ghost"}
            onClick={() => toggle("soat")}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            SOAT
          </AccentBtn>
          <AccentBtn
            accent={accent}
            variant={panel === "combustible" ? "solid" : "ghost"}
            onClick={() => toggle("combustible")}
          >
            <Fuel className="h-3.5 w-3.5" />
            Combustible
          </AccentBtn>
        </div>

        <div
          className={`mt-3 overflow-hidden border border-white/10 transition-all duration-500 ${
            panel === "none" ? "max-h-0 border-0 opacity-0" : "max-h-40 opacity-100"
          }`}
        >
          {panel === "soat" ? (
            <div className="bg-white/[0.04] p-3 text-[12px]">
              <p className="font-semibold" style={{ color: accent }}>
                SOAT vigente
              </p>
              <p className="mt-1 text-white/55">Vence: 14 mar 2027 · Póliza #8821</p>
            </div>
          ) : null}
          {panel === "combustible" ? (
            <div className="bg-white/[0.04] p-3 text-[12px]">
              <p className="font-semibold" style={{ color: accent }}>
                Tanque 68%
              </p>
              <div className="mt-2 h-2 w-full bg-white/10">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: "68%", backgroundColor: accent }}
                />
              </div>
              <p className="mt-1 text-white/55">Última carga: 42 L · ayer</p>
            </div>
          ) : null}
        </div>
      </div>
    </DemoShell>
  );
}
