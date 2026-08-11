import { useState } from "react";
import {
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Store,
  Share2,
  Phone,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/useUserStore";

type ChecklistProps = {
  hasPhone?: boolean | null;
};

export const CatalogoSettingsCard = ({ hasPhone }: ChecklistProps = {}) => {
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/catalogo/${id_tenant || 1}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Enlace del catálogo copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te compartimos nuestro catálogo digital para armar tu pedido por WhatsApp: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Catálogo Digital & Pedidos WhatsApp
              </CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Tus clientes arman el pedido en la vitrina y te llega por WhatsApp. Sin app ni
                contraseña.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 font-medium shrink-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Público
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Enlace público</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={publicUrl}
              readOnly
              className="font-mono text-xs bg-muted/50 text-muted-foreground"
            />
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 flex-1 sm:flex-none">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(publicUrl, "_blank")}
                className="gap-1.5 bg-brand hover:bg-brand/90 flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4" /> Abrir
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Checklist rápida
          </p>
          <ul className="space-y-2 text-xs text-stone-700">
            <li className="flex items-start gap-2">
              <Phone className="size-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>
                Teléfono WhatsApp en datos de empresa
                {hasPhone === false && (
                  <span className="text-amber-700 font-medium"> — falta configurar</span>
                )}
                {hasPhone === true && (
                  <span className="text-emerald-700 font-medium"> — listo</span>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="size-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Productos activos con stock &gt; 0 se publican solos</span>
            </li>
            <li className="flex items-start gap-2">
              <ImageIcon className="size-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Imágenes mejoran la conversión en la vitrina</span>
            </li>
            <li className="flex items-start gap-2">
              <Store className="size-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Logo y nombre comercial aparecen en el hero del catálogo</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200/70 bg-emerald-50/50">
          <p className="text-xs text-emerald-900 font-medium max-w-md leading-relaxed">
            Comparte el link con clientes o en tus estados. Ellos eligen productos y te escriben con
            el pedido listo.
          </p>
          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold shrink-0"
          >
            <Share2 className="h-3.5 w-3.5" /> Compartir por WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
