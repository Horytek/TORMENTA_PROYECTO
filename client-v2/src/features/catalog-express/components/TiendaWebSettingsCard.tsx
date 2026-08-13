import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Phone,
  Settings,
  Share2,
  Store,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/useUserStore";
import { adminGetTiendaConfig, adminPatchTiendaConfig } from "../api/catalogoPublico";
import { cn } from "@/lib/utils";

const BTN =
  "h-11 min-h-11 w-full gap-2 text-sm font-semibold sm:h-11";

type Props = {
  /** En Configuración de empresa: enlace al módulo. En el módulo, se oculta. */
  showAdminLink?: boolean;
};

export function TiendaWebSettingsCard({ showAdminLink = true }: Props) {
  const qc = useQueryClient();
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const { data: cfg, isLoading } = useQuery({
    queryKey: ["tienda-admin-config"],
    queryFn: adminGetTiendaConfig,
  });

  const [copied, setCopied] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [modo, setModo] = useState<"test" | "prod">("test");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!cfg) return;
    setPublicKey(String(cfg.mp_public_key || ""));
    setModo((cfg.mp_modo === "prod" ? "prod" : "test") as "test" | "prod");
    setAccessToken("");
  }, [cfg]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        mp_public_key: publicKey.trim() || null,
        mp_modo: modo,
      };
      if (accessToken.trim()) body.mp_access_token = accessToken.trim();
      return adminPatchTiendaConfig(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tienda-admin-config"] });
      setAccessToken("");
      toast.success("Credenciales de Mercado Pago guardadas");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "No se pudieron guardar las credenciales");
    },
  });

  const slug = (cfg?.slug as string) || `t${id_tenant || 1}`;
  const publicUrl = `${window.location.origin}/s/${slug}`;
  const conectado = Boolean(cfg?.mp_conectado);
  const phoneOk = Boolean(cfg?.whatsapp);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Enlace de la tienda copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent(`¡Hola! Te compartimos nuestra tienda online: ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">Tienda web</CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Vitrina pública con checkout MercadoPago. Las ventas entran al ERP y a Reportes.
                WhatsApp queda solo como consulta.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Público
            </Badge>
            <Badge
              variant="outline"
              className={
                conectado
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }
            >
              MP {conectado ? "conectado" : "sin conectar"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {showAdminLink && (
          <Button asChild variant="outline" className={BTN}>
            <Link to="/catalog-express">
              <Settings className="h-4 w-4" />
              Ir a configuración
              <ArrowRight className="h-4 w-4 ml-auto sm:ml-0" />
            </Link>
          </Button>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Enlace público</label>
          <Input
            value={publicUrl}
            readOnly
            className="font-mono text-xs bg-muted/50 text-muted-foreground h-11"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button type="button" variant="outline" className={BTN} onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              type="button"
              className={cn(BTN, "bg-brand hover:bg-brand/90 text-white")}
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" /> Abrir tienda web
            </Button>
            <Button type="button" variant="outline" className={BTN} onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Compartir
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Checklist rápida
          </p>
          <ul className="space-y-2 text-xs text-stone-700">
            <li className="flex items-start gap-2">
              <CreditCard
                className={cn(
                  "size-3.5 mt-0.5 shrink-0",
                  conectado ? "text-emerald-600" : "text-amber-600"
                )}
              />
              <span>
                MercadoPago {conectado ? "conectado" : "pendiente"}
                {!conectado && (
                  <span className="text-amber-700 font-medium"> — falta configurar</span>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Phone
                className={cn(
                  "size-3.5 mt-0.5 shrink-0",
                  phoneOk ? "text-emerald-600" : "text-amber-600"
                )}
              />
              <span>
                WhatsApp de consulta
                {phoneOk ? (
                  <span className="text-emerald-700 font-medium"> — listo</span>
                ) : (
                  <span className="text-amber-700 font-medium"> — falta configurar</span>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="size-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Productos activos con stock se publican en la vitrina</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 border-t border-stone-100 pt-5">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand" />
              Mercado Pago
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Credenciales del checkout. El access token se cifra y no se vuelve a mostrar.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp_public_key">Public key</Label>
            <Input
              id="mp_public_key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="APP_USR-…"
              className="font-mono text-xs h-11"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp_access_token">
              Access token{" "}
              <span className="text-muted-foreground font-normal">
                {conectado ? "(dejar vacío para no cambiar)" : ""}
              </span>
            </Label>
            <div className="relative">
              <Input
                id="mp_access_token"
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={conectado ? "•••••••• (ya configurado)" : "APP_USR-…"}
                className="font-mono text-xs pr-11 h-11"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowToken((v) => !v)}
                aria-label={showToken ? "Ocultar" : "Mostrar"}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Modo</Label>
            <Select value={modo} onValueChange={(v) => setModo(v as "test" | "prod")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Elegir modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test / Sandbox</SelectItem>
                <SelectItem value="prod">Producción</SelectItem>
              </SelectContent>
            </Select>
            {cfg?.mp_modo && (
              <p className="text-xs text-muted-foreground">
                Modo actual en servidor: <strong>{cfg.mp_modo}</strong>
              </p>
            )}
          </div>

          <Button
            type="button"
            className={cn(BTN, "sm:w-auto sm:px-6")}
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveMut.isSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Guardar Mercado Pago
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TiendaWebSettingsCard;
