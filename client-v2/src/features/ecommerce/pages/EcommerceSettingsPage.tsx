import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Home,
  ImagePlus,
  Palette,
  Store,
  MessageCircle,
} from "lucide-react";
import {
  ecommerceMe,
  ecommerceListProductos,
  ecommerceSaveMpCredentials,
  ecommerceUpdateTienda,
  ecommerceUploadBanner,
  ecommerceUploadLogo,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  DEFAULT_THEME,
  FONT_BODY_STACK,
  FONT_DISPLAY_STACK,
  PRESET_SURFACES,
  buildNavItemsFromCatalog,
  resolveTheme,
  type ColorSchemePref,
  type FontBody,
  type FontDisplay,
  type HeaderStyle,
  type NavItemKind,
  type NavStyle,
  type StoreModule,
  type StoreTheme,
  type ThemePreset,
} from "../types/theme";
import { getCategoria } from "../types/storefront";
import { DisponibilidadSettingsTab } from "../components/admin/DisponibilidadSettingsTab";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PRESETS: {
  id: ThemePreset;
  label: string;
  hint: string;
  preview: "light" | "dark";
}[] = [
  { id: "clara", label: "Clara", hint: "Fondo claro, fácil de leer", preview: "light" },
  { id: "store", label: "Digital", hint: "Oscura, como una app de tienda", preview: "dark" },
  { id: "nocturna", label: "Noche", hint: "Más dramática, fotos grandes", preview: "dark" },
  { id: "retail", label: "Clásica", hint: "Grises, look de tienda física", preview: "dark" },
];

const MODULE_COPY: Record<string, { title: string; hint: string }> = {
  spotlight: { title: "Portada", hint: "La foto grande y el mensaje al entrar" },
  featured: { title: "Destacados", hint: "Productos que marcaste como Story / Featured" },
  rows: { title: "Listas", hint: "Novedades, en stock, etc." },
  categories: { title: "Categorías", hint: "Atajos a Polos, Jeans…" },
  trust: { title: "Confianza", hint: "Envío, pago y WhatsApp" },
  promo: { title: "Promoción", hint: "Una franja con oferta o aviso" },
  browse: { title: "Catálogo", hint: "Todos los productos con filtros" },
  faq: { title: "Preguntas", hint: "Dudas de envío, tallas, cambios" },
};

function surf(preset: ThemePreset, scheme: "light" | "dark" = "dark") {
  return PRESET_SURFACES[preset]?.[scheme] ?? PRESET_SURFACES.store.dark;
}

function PresetCard({
  preset,
  label,
  hint,
  preview,
  selected,
  accent,
  onSelect,
}: {
  preset: ThemePreset;
  label: string;
  hint: string;
  preview: "light" | "dark";
  selected: boolean;
  accent: string;
  onSelect: () => void;
}) {
  const s = surf(preset, preview);
  const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : "#0E7C7B";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left rounded-xl border-2 overflow-hidden transition touch-manipulation min-h-11 ${
        selected
          ? "border-teal-600 ring-2 ring-teal-600/15 shadow-sm"
          : "border-stone-200 hover:border-stone-300"
      }`}
    >
      <div className="relative h-14" style={{ background: s.mist }}>
        <div
          className="absolute inset-x-0 top-0 h-3"
          style={{ background: s.elevated, borderBottom: `1px solid ${s.border}` }}
        />
        <div
          className="absolute inset-x-2 bottom-2 top-5 rounded-sm"
          style={{ background: `linear-gradient(135deg, ${s.stageFrom}, ${s.stageTo})` }}
        />
        <div className="absolute left-2 bottom-2 w-1.5 h-6 rounded-full" style={{ background: safeAccent }} />
        {selected && (
          <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
            <Check className="size-3" />
          </span>
        )}
      </div>
      <div className="p-3 bg-white">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-xs text-stone-500 leading-snug mt-0.5">{hint}</p>
      </div>
    </button>
  );
}

function Advanced({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-stone-200 bg-stone-50/60">
      <summary className="flex items-center justify-between gap-2 min-h-11 px-4 py-2 text-sm font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 text-stone-400 shrink-0" />
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-stone-100 bg-white rounded-b-xl">
        {children}
      </div>
    </details>
  );
}

export default function EcommerceSettingsPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-me", tid],
    queryFn: ecommerceMe,
    enabled: Boolean(tid),
  });
  const { data: productosData } = useQuery({
    queryKey: ["ecom-productos", tid],
    queryFn: ecommerceListProductos,
    enabled: Boolean(tid),
  });
  const tienda = data?.data?.tienda;

  const catalogCategorias = useMemo(() => {
    const list = (productosData?.data || []) as { categoria?: string | null; attrs_json?: unknown }[];
    const map = new Map<string, number>();
    for (const p of list) {
      const cat = getCategoria(p as Parameters<typeof getCategoria>[0]);
      if (!cat) continue;
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return [...map.entries()]
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [productosData]);

  const [mp, setMp] = useState({ public_key: "", access_token: "", modo: "test" as "test" | "prod" });
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [color, setColor] = useState("#0E7C7B");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [hydrated, setHydrated] = useState(false);

  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tienda || hydrated) return;
    setNombre(tienda.nombre || "");
    setTelefono(tienda.telefono || "");
    setDescripcion(tienda.descripcion || "");
    setColor(tienda.color_primario || "#0E7C7B");
    setLogoUrl(tienda.logo_url || null);
    setTheme(resolveTheme(tienda.theme_json));
    setMp((s) => ({
      ...s,
      public_key: String(data?.data?.mp_public_key || ""),
      modo: data?.data?.mp_modo === "prod" ? "prod" : "test",
    }));
    setHydrated(true);
  }, [tienda, hydrated, data]);

  const patchTheme = (partial: Partial<StoreTheme>) => {
    setTheme((t) =>
      resolveTheme({
        ...t,
        ...partial,
        sections: { ...t.sections, ...partial.sections },
        trust: { ...t.trust, ...partial.trust },
        nav: {
          ...t.nav,
          ...partial.nav,
          items: partial.nav?.items !== undefined ? partial.nav.items : t.nav.items,
        },
        modules: partial.modules ?? t.modules,
        quick_actions: { ...t.quick_actions, ...partial.quick_actions },
      })
    );
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    const next = [...theme.modules];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    patchTheme({ modules: next });
  };

  const toggleModule = (id: string, enabled: boolean) => {
    patchTheme({
      modules: theme.modules.map((m) => (m.id === id ? ({ ...m, enabled } as StoreModule) : m)),
    });
  };

  const saveBrand = useMutation({
    mutationFn: () =>
      ecommerceUpdateTienda({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        descripcion: descripcion.trim() || null,
        color_primario: color.trim() || "#0E7C7B",
        logo_url: logoUrl,
        theme_json: theme,
      }),
    onSuccess: () => {
      toast.success("Cambios guardados. Ya se ven en tu tienda.");
      qc.invalidateQueries({ queryKey: ["ecom-me", tid] });
      if (tienda?.slug) qc.invalidateQueries({ queryKey: ["store", tienda.slug] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const saveMp = useMutation({
    mutationFn: () => ecommerceSaveMpCredentials(mp),
    onSuccess: () => {
      toast.success("Mercado Pago guardado");
      qc.invalidateQueries({ queryKey: ["ecom-me", tid] });
      setMp((s) => ({ ...s, access_token: "" }));
    },
    onError: () => toast.error("No se pudieron guardar las claves"),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const b64 = await fileToBase64(file);
      return ecommerceUploadLogo(b64, file.name);
    },
    onSuccess: (res) => {
      if (res.success && res.data?.url) {
        setLogoUrl(res.data.url);
        toast.success("Logo actualizado");
        qc.invalidateQueries({ queryKey: ["ecom-me", tid] });
      }
    },
    onError: () => toast.error("Error al subir logo"),
  });

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      const b64 = await fileToBase64(file);
      return ecommerceUploadBanner(b64, file.name);
    },
    onSuccess: (res) => {
      if (res.success && res.data?.url) {
        patchTheme({ banner_url: res.data.url });
        if (res.data.theme_json) setTheme(resolveTheme(res.data.theme_json));
        toast.success("Foto de portada actualizada");
        qc.invalidateQueries({ queryKey: ["ecom-me", tid] });
      }
    },
    onError: () => toast.error("Error al subir la foto"),
  });

  const onSaveBrand = () => {
    if (!nombre.trim()) {
      toast.error("Ponle un nombre a tu tienda");
      return;
    }
    saveBrand.mutate();
  };

  const previewStyle = useMemo(() => {
    const scheme = theme.preset === "clara" ? "light" : "dark";
    const surfaces = surf(theme.preset, scheme);
    const accent = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B";
    return {
      "--vitrina-accent": accent,
      "--vitrina-ink": surfaces.ink,
      "--vitrina-fog": surfaces.fog,
      "--vitrina-mist": surfaces.mist,
      "--vitrina-elevated": surfaces.elevated,
      "--vitrina-border": surfaces.border,
      "--vitrina-muted": surfaces.muted,
      "--vitrina-stage-from": surfaces.stageFrom,
      "--vitrina-stage-to": surfaces.stageTo,
      "--font-vitrina-display": FONT_DISPLAY_STACK[theme.font_display],
      "--font-vitrina-body": FONT_BODY_STACK[theme.font_body],
      fontFamily: FONT_BODY_STACK[theme.font_body],
      background: surfaces.mist,
      color: surfaces.ink,
    } as CSSProperties;
  }, [theme, color]);

  const headerPreview =
    theme.header_style === "accent"
      ? { background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B", color: "#fff" }
      : theme.header_style === "light"
        ? {
            background: surf(theme.preset, "light").elevated,
            color: surf(theme.preset, "light").ink,
            borderBottom: `1px solid ${surf(theme.preset, "light").border}`,
          }
        : {
            background: surf(theme.preset, theme.preset === "clara" ? "light" : "dark").mist,
            color: surf(theme.preset, theme.preset === "clara" ? "light" : "dark").ink,
            borderBottom: `1px solid ${surf(theme.preset, theme.preset === "clara" ? "light" : "dark").border}`,
          };

  const publicUrl = tienda?.slug ? `${window.location.origin}/tienda/${tienda.slug}` : "";
  const mpOk = Boolean(data?.data?.mp_conectado);

  if (isLoading && !tienda) {
    return <div className="text-stone-400 text-sm py-10">Cargando…</div>;
  }

  const saveBar = (
    <Button type="button" className="w-full sm:w-auto min-h-11" onClick={onSaveBrand} disabled={saveBrand.isPending}>
      {saveBrand.isPending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );

  return (
    <div className="space-y-6 max-w-5xl pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-stone-500 text-sm mt-1">
            Datos de tu tienda, cómo se ve y cómo cobras.
          </p>
        </div>
        {tienda?.slug && (
          <a
            href={`/tienda/${tienda.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-teal-700 hover:underline"
          >
            Ver mi tienda <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <Tabs defaultValue="tienda" className="gap-5">
        <TabsList className="group-data-[orientation=horizontal]/tabs:h-auto h-auto w-full grid grid-cols-2 md:grid-cols-5 gap-1 p-1.5 rounded-2xl bg-stone-100">
          {(
            [
              { value: "tienda", label: "Tu tienda", hint: "Nombre y logo", icon: Store },
              { value: "look", label: "Cómo se ve", hint: "Colores y portada", icon: Palette },
              { value: "inicio", label: "Inicio", hint: "Bloques de la tienda", icon: Home },
              { value: "whatsapp", label: "WhatsApp", hint: "Disponibilidad", icon: MessageCircle },
              { value: "cobros", label: "Cobros", hint: "Mercado Pago", icon: CreditCard },
            ] as const
          ).map(({ value, label, hint, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto! min-h-14 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl px-2.5 py-2.5 text-stone-500 whitespace-normal shadow-none data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex flex-col items-center sm:items-start leading-tight">
                <span className="text-sm font-medium">{label}</span>
                <span className="hidden sm:block text-[11px] font-normal text-stone-400">
                  {hint}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tienda" className="space-y-4">
          <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="font-medium">Datos que ve el cliente</h2>
              <p className="text-sm text-stone-500 mt-0.5">Nombre, logo y cómo te contactan.</p>
            </div>
            {tienda?.slug && (
              <div>
                <Label>Enlace de tu tienda</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input readOnly value={publicUrl} className="min-h-11 font-mono text-xs sm:text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 min-w-11 shrink-0"
                    onClick={() => {
                      void navigator.clipboard.writeText(publicUrl);
                      toast.success("Enlace copiado");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                className="size-20 rounded-full border border-dashed border-stone-300 overflow-hidden bg-stone-50 flex items-center justify-center shrink-0 hover:border-teal-600 touch-manipulation"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-6 text-stone-400" />
                )}
              </button>
              <div className="text-sm text-stone-500">
                <p className="font-medium text-stone-700">Logo</p>
                <p>Toca el círculo para cambiarlo. Se ve arriba y abajo de la tienda.</p>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo.mutate(f);
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Nombre de la tienda</Label>
              <Input className="min-h-11 mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp / teléfono</Label>
              <Input
                className="min-h-11 mt-1"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="999000111"
              />
            </div>
            <div>
              <Label>Una frase sobre tu tienda</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="resize-y mt-1"
                placeholder="Moda femenina, envíos a Lima…"
              />
            </div>
            {saveBar}
          </section>
        </TabsContent>

        <TabsContent value="look">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="space-y-4">
              <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
                <div>
                  <h2 className="font-medium">Color de tu marca</h2>
                  <p className="text-sm text-stone-500 mt-0.5">Botones, enlaces y acentos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B"}
                    onChange={(e) => setColor(e.target.value)}
                    className="size-11 rounded-md border border-stone-200 cursor-pointer p-0.5 shrink-0"
                    aria-label="Color de marca"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-32 min-h-11 font-mono"
                    placeholder="#0E7C7B"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-3">
                <div>
                  <h2 className="font-medium">Estilo general</h2>
                  <p className="text-sm text-stone-500 mt-0.5">Elige el ambiente. El color de arriba se mantiene.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map((p) => (
                    <PresetCard
                      key={p.id}
                      preset={p.id}
                      label={p.label}
                      hint={p.hint}
                      preview={p.preview}
                      selected={theme.preset === p.id}
                      accent={color}
                      onSelect={() => patchTheme({ preset: p.id })}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
                <div>
                  <h2 className="font-medium">Portada</h2>
                  <p className="text-sm text-stone-500 mt-0.5">Lo primero que se ve al abrir la tienda.</p>
                </div>
                <div>
                  <Label>Título</Label>
                  <Input
                    className="min-h-11 mt-1"
                    value={theme.hero_headline || ""}
                    onChange={(e) => patchTheme({ hero_headline: e.target.value || null })}
                    placeholder={nombre || "Nueva temporada"}
                  />
                </div>
                <div>
                  <Label>Frase corta</Label>
                  <Input
                    className="min-h-11 mt-1"
                    value={theme.hero_tagline || ""}
                    onChange={(e) => patchTheme({ hero_tagline: e.target.value || null })}
                    placeholder="Vestidos, blusas y denim…"
                  />
                </div>
                <div>
                  <Label>Foto de fondo</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {theme.banner_url ? (
                      <img src={theme.banner_url} alt="" className="h-20 w-32 object-cover rounded-md border" />
                    ) : (
                      <div className="h-20 w-32 rounded-md border border-dashed border-stone-300 bg-stone-50" />
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => bannerInput.current?.click()}
                      >
                        {uploadBanner.isPending ? "Subiendo…" : "Subir foto"}
                      </Button>
                      {theme.banner_url && (
                        <Button type="button" variant="ghost" className="min-h-11" onClick={() => patchTheme({ banner_url: null })}>
                          Quitar
                        </Button>
                      )}
                    </div>
                    <input
                      ref={bannerInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadBanner.mutate(f);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Barra de arriba</Label>
                  <Select
                    value={theme.header_style}
                    onValueChange={(v) => patchTheme({ header_style: v as HeaderStyle })}
                  >
                    <SelectTrigger className="mt-1 min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clara</SelectItem>
                      <SelectItem value="dark">Oscura</SelectItem>
                      <SelectItem value="accent">Color de tu marca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <Advanced title="Tipografía y modo claro/oscuro">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Letra de títulos</Label>
                    <Select
                      value={theme.font_display}
                      onValueChange={(v) => patchTheme({ font_display: v as FontDisplay })}
                    >
                      <SelectTrigger className="mt-1 min-h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="syne">Syne</SelectItem>
                        <SelectItem value="outfit">Outfit</SelectItem>
                        <SelectItem value="sora">Sora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Letra del texto</Label>
                    <Select
                      value={theme.font_body}
                      onValueChange={(v) => patchTheme({ font_body: v as FontBody })}
                    >
                      <SelectTrigger className="mt-1 min-h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dm-sans">DM Sans</SelectItem>
                        <SelectItem value="manrope">Manrope</SelectItem>
                        <SelectItem value="space-grotesk">Space Grotesk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-2xl tracking-tight" style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}>
                  {nombre || "Tu marca"}
                </p>
                <div>
                  <Label>Al entrar, la tienda se ve</Label>
                  <Select
                    value={theme.color_scheme_default}
                    onValueChange={(v) => patchTheme({ color_scheme_default: v as ColorSchemePref })}
                  >
                    <SelectTrigger className="mt-1 min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Como el celular del cliente</SelectItem>
                      <SelectItem value="light">Siempre clara</SelectItem>
                      <SelectItem value="dark">Siempre oscura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center justify-between gap-3 min-h-11 text-sm">
                  <span>El cliente puede cambiar claro/oscuro</span>
                  <Switch
                    checked={theme.allow_visitor_scheme_toggle}
                    onCheckedChange={(v) => patchTheme({ allow_visitor_scheme_toggle: v })}
                  />
                </label>
              </Advanced>

              <Advanced title="Menú de categorías (opcional)">
                <p className="text-sm text-stone-500">
                  Por defecto se arman solas con las categorías de tus productos.
                </p>
                <label className="flex items-center justify-between gap-3 min-h-11 text-sm">
                  <span>Mostrar menú arriba</span>
                  <Switch
                    checked={theme.nav.show_categories !== false}
                    onCheckedChange={(v) => patchTheme({ nav: { ...theme.nav, show_categories: v } })}
                  />
                </label>
                {theme.nav.show_categories !== false && (
                  <NavMenuEditor
                    theme={theme}
                    catalogCategorias={catalogCategorias}
                    patchTheme={patchTheme}
                  />
                )}
              </Advanced>

              {saveBar}
            </div>

            <aside className="lg:sticky lg:top-20 space-y-2">
              <p className="text-xs uppercase tracking-wider text-stone-400">Así se ve</p>
              <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm" style={previewStyle}>
                <div className="px-3 py-2.5 flex items-center gap-2 text-[11px]" style={headerPreview}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="size-6 rounded-full object-cover" />
                  ) : (
                    <span
                      className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: theme.header_style === "accent" ? "rgba(0,0,0,0.25)" : color }}
                    >
                      {(nombre || "H").slice(0, 1)}
                    </span>
                  )}
                  <span className="font-semibold truncate" style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}>
                    {nombre || "Tu tienda"}
                  </span>
                </div>
                <div
                  className="relative h-36 p-4 flex flex-col justify-end"
                  style={{
                    background: `linear-gradient(145deg, ${surf(theme.preset, theme.preset === "clara" ? "light" : "dark").stageFrom}, ${surf(theme.preset, theme.preset === "clara" ? "light" : "dark").stageTo})`,
                    color: theme.preset === "clara" ? surf(theme.preset, "light").ink : "#fff",
                  }}
                >
                  {theme.banner_url && (
                    <img src={theme.banner_url} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
                  )}
                  <div className="relative">
                    <p className="text-xl leading-none" style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}>
                      {theme.hero_headline || nombre || "Tu portada"}
                    </p>
                    <p className="text-[10px] mt-2 line-clamp-2 opacity-70">
                      {theme.hero_tagline || descripcion || "Tu frase aparece aquí"}
                    </p>
                    <span
                      className="inline-block mt-3 text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B" }}
                    >
                      Explorar
                    </span>
                  </div>
                </div>
                {theme.modules.some((m) => m.type === "trust" && m.enabled) && (
                  <div className="p-3 grid grid-cols-3 gap-1.5">
                    {[theme.trust.envio, theme.trust.pago, theme.trust.soporte].map((t) => (
                      <div
                        key={t}
                        className="rounded bg-white border border-stone-100 p-1.5 text-[9px] text-stone-600 truncate"
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400">Es un boceto. Mira la tienda real con el enlace de arriba.</p>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="inicio" className="space-y-4">
          <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="font-medium">Qué aparece al entrar</h2>
              <p className="text-sm text-stone-500 mt-0.5">
                Enciende o apaga cada bloque. Sube o baja para cambiar el orden.
              </p>
            </div>
            <ul className="space-y-2">
              {theme.modules.map((m, i) => {
                const copy = MODULE_COPY[m.type] || { title: m.type, hint: "" };
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 px-3 py-2.5"
                  >
                    <Switch checked={m.enabled} onCheckedChange={(v) => toggleModule(m.id, v)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{copy.title}</p>
                      <p className="text-xs text-stone-400 truncate">{copy.hint}</p>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="min-h-11 min-w-11"
                        disabled={i === 0}
                        onClick={() => moveModule(i, -1)}
                        aria-label="Subir"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="min-h-11 min-w-11"
                        disabled={i === theme.modules.length - 1}
                        onClick={() => moveModule(i, 1)}
                        aria-label="Bajar"
                      >
                        ↓
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {theme.modules.some((m) => m.type === "trust" && m.enabled) && (
            <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-3">
              <h2 className="font-medium">Frases de confianza</h2>
              <div>
                <Label>Envío</Label>
                <Input
                  className="min-h-11 mt-1"
                  value={theme.trust.envio}
                  onChange={(e) => patchTheme({ trust: { ...theme.trust, envio: e.target.value } })}
                />
              </div>
              <div>
                <Label>Pago</Label>
                <Input
                  className="min-h-11 mt-1"
                  value={theme.trust.pago}
                  onChange={(e) => patchTheme({ trust: { ...theme.trust, pago: e.target.value } })}
                />
              </div>
              <div>
                <Label>Soporte</Label>
                <Input
                  className="min-h-11 mt-1"
                  value={theme.trust.soporte}
                  onChange={(e) => patchTheme({ trust: { ...theme.trust, soporte: e.target.value } })}
                />
              </div>
            </section>
          )}

          <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-1">
            <h2 className="font-medium mb-2">En el celular</h2>
            <label className="flex items-center justify-between gap-3 min-h-11 text-sm">
              <span>Botón del carrito siempre visible</span>
              <Switch
                checked={theme.quick_actions.cart_fab !== false}
                onCheckedChange={(v) => patchTheme({ quick_actions: { ...theme.quick_actions, cart_fab: v } })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 min-h-11 text-sm">
              <span>Agregar al carrito desde la lista</span>
              <Switch
                checked={theme.quick_actions.quick_add !== false}
                onCheckedChange={(v) => patchTheme({ quick_actions: { ...theme.quick_actions, quick_add: v } })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 min-h-11 text-sm">
              <span>Botón de WhatsApp</span>
              <Switch
                checked={theme.quick_actions.whatsapp !== false}
                onCheckedChange={(v) => patchTheme({ quick_actions: { ...theme.quick_actions, whatsapp: v } })}
              />
            </label>
          </section>

          {saveBar}
        </TabsContent>

        <TabsContent value="whatsapp">
          <DisponibilidadSettingsTab />
        </TabsContent>

        <TabsContent value="cobros">
          <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4 max-w-xl">
            <div>
              <h2 className="font-medium">Mercado Pago</h2>
              <p className="text-sm text-stone-500 mt-0.5">
                El dinero de las ventas llega a tu cuenta. Las claves salen de{" "}
                <a
                  href="https://www.mercadopago.com.pe/developers/panel/app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  tu panel de Mercado Pago
                </a>
                .
              </p>
            </div>
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                mpOk ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {mpOk
                ? `Conectado (${data?.data?.mp_modo === "prod" ? "producción" : "pruebas"}).`
                : "Todavía no está conectado. El cliente puede ver el catálogo, pero no pagar en línea."}
            </p>
            <div>
              <Label>Clave pública (Public Key)</Label>
              <Input
                className="min-h-11 mt-1 font-mono text-sm"
                value={mp.public_key}
                onChange={(e) => setMp({ ...mp, public_key: e.target.value })}
                placeholder="APP_USR-… o TEST-…"
              />
            </div>
            <div>
              <Label>Token de acceso (Access Token)</Label>
              <Input
                className="min-h-11 mt-1 font-mono text-sm"
                type="password"
                value={mp.access_token}
                onChange={(e) => setMp({ ...mp, access_token: e.target.value })}
                placeholder="APP_USR-… o TEST-…"
              />
            </div>
            <div>
              <Label>Modo</Label>
              <Select value={mp.modo} onValueChange={(v) => setMp({ ...mp, modo: v as "test" | "prod" })}>
                <SelectTrigger className="mt-1 min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Pruebas — no cobra de verdad</SelectItem>
                  <SelectItem value="prod">Producción — cobra de verdad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto min-h-11"
              onClick={() => {
                if (!mp.public_key || !mp.access_token) {
                  toast.error("Completa las dos claves");
                  return;
                }
                saveMp.mutate();
              }}
              disabled={saveMp.isPending}
            >
              {saveMp.isPending ? "Guardando…" : "Guardar Mercado Pago"}
            </Button>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NavMenuEditor({
  theme,
  catalogCategorias,
  patchTheme,
}: {
  theme: StoreTheme;
  catalogCategorias: { nombre: string; count: number }[];
  patchTheme: (partial: Partial<StoreTheme>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Estilo de los enlaces</Label>
          <Select
            value={theme.nav.style}
            onValueChange={(v) => patchTheme({ nav: { ...theme.nav, style: v as NavStyle } })}
          >
            <SelectTrigger className="mt-1 min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="soft">Suave</SelectItem>
              <SelectItem value="pill">Cápsula</SelectItem>
              <SelectItem value="underline">Subrayado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cuántos se ven</Label>
          <Select
            value={String(theme.nav.max_items)}
            onValueChange={(v) => patchTheme({ nav: { ...theme.nav, max_items: Number(v) } })}
          >
            <SelectTrigger className="mt-1 min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6, 8, 10, 12].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            const items = buildNavItemsFromCatalog(catalogCategorias, theme.nav.label_all || "Todo");
            patchTheme({ nav: { ...theme.nav, items } });
            toast.success(
              catalogCategorias.length
                ? `Menú con ${catalogCategorias.length} categorías`
                : "Menú base creado"
            );
          }}
        >
          Armar desde mis categorías
        </Button>
        {theme.nav.items.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11"
            onClick={() => patchTheme({ nav: { ...theme.nav, items: [] } })}
          >
            Volver al automático
          </Button>
        )}
      </div>
      {theme.nav.items.length > 0 && (
        <ul className="space-y-2">
          {theme.nav.items.map((item, index) => (
            <li key={item.id} className="rounded-lg border border-stone-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.enabled !== false}
                  onCheckedChange={(v) => {
                    const items = theme.nav.items.map((it, i) => (i === index ? { ...it, enabled: v } : it));
                    patchTheme({ nav: { ...theme.nav, items } });
                  }}
                />
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const items = theme.nav.items.map((it, i) =>
                      i === index ? { ...it, label: e.target.value.slice(0, 40) } : it
                    );
                    patchTheme({ nav: { ...theme.nav, items } });
                  }}
                  className="min-h-11 text-sm flex-1"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <Select
                  value={item.kind}
                  onValueChange={(v) => {
                    const kind = v as NavItemKind;
                    const items = theme.nav.items.map((it, i) => {
                      if (i !== index) return it;
                      if (kind === "all") return { ...it, kind, category: null, href: null };
                      if (kind === "link")
                        return { ...it, kind, category: null, href: it.href || "#catalogo" };
                      return {
                        ...it,
                        kind,
                        category: it.category || catalogCategorias[0]?.nombre || "",
                        href: null,
                      };
                    });
                    patchTheme({ nav: { ...theme.nav, items } });
                  }}
                >
                  <SelectTrigger className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ver todo</SelectItem>
                    <SelectItem value="category">Categoría</SelectItem>
                    <SelectItem value="link">Enlace</SelectItem>
                  </SelectContent>
                </Select>
                {item.kind === "category" && catalogCategorias.length > 0 && (
                  <Select
                    value={item.category || catalogCategorias[0]?.nombre || ""}
                    onValueChange={(v) => {
                      const items = theme.nav.items.map((it, i) =>
                        i === index ? { ...it, category: v } : it
                      );
                      patchTheme({ nav: { ...theme.nav, items } });
                    }}
                  >
                    <SelectTrigger className="min-h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogCategorias.map((c) => (
                        <SelectItem key={c.nombre} value={c.nombre}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {item.kind === "link" && (
                  <Input
                    className="min-h-11"
                    value={item.href || ""}
                    onChange={(e) => {
                      const items = theme.nav.items.map((it, i) =>
                        i === index ? { ...it, href: e.target.value } : it
                      );
                      patchTheme({ nav: { ...theme.nav, items } });
                    }}
                    placeholder="#catalogo o https://…"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
