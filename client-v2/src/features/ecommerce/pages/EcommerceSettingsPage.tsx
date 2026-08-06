import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ecommerceMe, ecommerceSaveMpCredentials, ecommerceUpdateTienda } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EcommerceSettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["ecom-me"], queryFn: ecommerceMe });
  const tienda = data?.data?.tienda;

  const [mp, setMp] = useState({ public_key: "", access_token: "", modo: "test" as "test" | "prod" });
  const [brand, setBrand] = useState({ nombre: "", color_primario: "#0E7C7B", descripcion: "" });

  const saveMp = useMutation({
    mutationFn: () => ecommerceSaveMpCredentials(mp),
    onSuccess: () => {
      toast.success("Credenciales Mercado Pago guardadas");
      qc.invalidateQueries({ queryKey: ["ecom-me"] });
      setMp((s) => ({ ...s, access_token: "" }));
    },
    onError: () => toast.error("No se pudieron guardar"),
  });

  const saveBrand = useMutation({
    mutationFn: () =>
      ecommerceUpdateTienda({
        nombre: brand.nombre || tienda?.nombre,
        color_primario: brand.color_primario || tienda?.color_primario,
        descripcion: brand.descripcion || tienda?.descripcion,
      }),
    onSuccess: () => {
      toast.success("Tienda actualizada");
      qc.invalidateQueries({ queryKey: ["ecom-me"] });
    },
  });

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-stone-500 text-sm mt-1">
          Branding y credenciales MP del comerciante (el dinero de las ventas llega a tu cuenta).
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h2 className="font-medium text-sm">Tienda</h2>
        <p className="text-xs text-stone-500">
          Slug público: <code className="bg-stone-100 px-1 rounded">/tienda/{tienda?.slug}</code>
        </p>
        <div>
          <Label>Nombre</Label>
          <Input
            defaultValue={tienda?.nombre || ""}
            onChange={(e) => setBrand((b) => ({ ...b, nombre: e.target.value }))}
          />
        </div>
        <div>
          <Label>Color primario</Label>
          <Input
            defaultValue={tienda?.color_primario || "#0E7C7B"}
            onChange={(e) => setBrand((b) => ({ ...b, color_primario: e.target.value }))}
          />
        </div>
        <div>
          <Label>Descripción</Label>
          <Input
            defaultValue={tienda?.descripcion || ""}
            onChange={(e) => setBrand((b) => ({ ...b, descripcion: e.target.value }))}
          />
        </div>
        <Button type="button" onClick={() => saveBrand.mutate()} disabled={saveBrand.isPending}>
          Guardar tienda
        </Button>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h2 className="font-medium text-sm">Mercado Pago (cuenta del negocio)</h2>
        <p className="text-xs text-stone-500">
          Pega las credenciales TEST o PROD de tu aplicación MP. Estado:{" "}
          {data?.data?.mp_conectado ? (
            <span className="text-teal-700 font-medium">conectado ({data?.data?.mp_modo})</span>
          ) : (
            <span className="text-amber-700 font-medium">sin configurar</span>
          )}
        </p>
        <div>
          <Label>Public Key</Label>
          <Input
            value={mp.public_key}
            onChange={(e) => setMp({ ...mp, public_key: e.target.value })}
            placeholder="APP_USR-... o TEST-..."
          />
        </div>
        <div>
          <Label>Access Token</Label>
          <Input
            type="password"
            value={mp.access_token}
            onChange={(e) => setMp({ ...mp, access_token: e.target.value })}
            placeholder="APP_USR-... o TEST-..."
          />
        </div>
        <div>
          <Label>Modo</Label>
          <select
            className="w-full h-9 rounded-md border border-stone-200 px-2 text-sm"
            value={mp.modo}
            onChange={(e) => setMp({ ...mp, modo: e.target.value as "test" | "prod" })}
          >
            <option value="test">test</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (!mp.public_key || !mp.access_token) {
              toast.error("Completa ambas credenciales");
              return;
            }
            saveMp.mutate();
          }}
          disabled={saveMp.isPending}
        >
          Guardar Mercado Pago
        </Button>
      </section>
    </div>
  );
}
