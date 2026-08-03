import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getPuntosConfig, updatePuntosConfig } from "../api/puntos";

export function PuntosSettingsCard() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ["puntos-config"], queryFn: getPuntosConfig });

  const [activo, setActivo] = useState(false);
  const [solesPorPunto, setSolesPorPunto] = useState("10");
  const [valorCanje, setValorCanje] = useState("0.10");

  useEffect(() => {
    if (config) {
      setActivo(config.activo);
      setSolesPorPunto(String(config.soles_por_punto));
      setValorCanje(String(config.valor_canje_por_punto));
    }
  }, [config]);

  const guardar = useMutation({
    mutationFn: () => updatePuntosConfig({
      activo,
      soles_por_punto: Number(solesPorPunto) || 10,
      valor_canje_por_punto: Number(valorCanje) || 0,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["puntos-config"] }),
  });

  const dirty = config && (
    activo !== config.activo ||
    Number(solesPorPunto) !== config.soles_por_punto ||
    Number(valorCanje) !== config.valor_canje_por_punto
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-brand" />
          Club de puntos
        </CardTitle>
        <CardDescription>
          Tus clientes ganan puntos al comprar y los canjean como descuento en el POS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-zinc-50 px-4 py-3 dark:bg-zinc-900/50">
              <div>
                <p className="text-sm font-medium">Activar club de puntos</p>
                <p className="text-xs text-muted-foreground">
                  {activo ? "Los clientes acumulan puntos en cada venta." : "Nadie acumula puntos mientras esté apagado."}
                </p>
              </div>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Soles por punto ganado</Label>
                <Input type="number" min={0.5} step="0.5" value={solesPorPunto} onChange={(e) => setSolesPorPunto(e.target.value)} disabled={!activo} />
                <p className="text-[11px] text-muted-foreground">Ej. 10 → 1 punto por cada S/10 de compra.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Valor de canje por punto (S/)</Label>
                <Input type="number" min={0} step="0.01" value={valorCanje} onChange={(e) => setValorCanje(e.target.value)} disabled={!activo} />
                <p className="text-[11px] text-muted-foreground">Ej. 0.10 → 10 puntos = S/1 de descuento.</p>
              </div>
            </div>

            <Button size="sm" className="gap-2" disabled={!dirty || guardar.isPending} onClick={() => guardar.mutate()}>
              {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
