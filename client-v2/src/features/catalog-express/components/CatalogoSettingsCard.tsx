import { useState } from "react";
import { MessageCircle, ExternalLink, Copy, Check, Store, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/useUserStore";

export const CatalogoSettingsCard = () => {
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/catalogo/${id_tenant || 1}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Enlace del Catálogo copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`¡Hola! Te compartimos nuestro catálogo digital interactivo para realizar tus pedidos directamente por WhatsApp: ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Catálogo Digital & Pedidos por WhatsApp</CardTitle>
              <CardDescription className="text-xs">
                Vitrina pública sin contraseña para que tus clientes exploren tus productos y te envíen pedidos a tu WhatsApp.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Enlace Público de tu Tienda</label>
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="font-mono text-xs bg-muted/50 text-muted-foreground" />
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(publicUrl, "_blank")}
              className="gap-1.5 shrink-0 bg-brand hover:bg-brand/90"
            >
              <ExternalLink className="h-4 w-4" /> Abrir Vitrina
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Store className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Los productos con stock &gt; 0 se muestran automáticamente en tu catálogo.</span>
          </div>
          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
          >
            <Share2 className="h-3.5 w-3.5" /> Compartir por WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
