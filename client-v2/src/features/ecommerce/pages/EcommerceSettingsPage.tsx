import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, ExternalLink } from "lucide-react";
import {
  ecommerceMe,
  ecommerceSaveMpCredentials,
  ecommerceUpdateTienda,
  ecommerceUploadBanner,
  ecommerceUploadLogo,
} from "../api/ecommerce";
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
import { toast } from "sonner";
import {
  DEFAULT_THEME,
  FONT_BODY_STACK,
  FONT_DISPLAY_STACK,
  PRESET_SURFACES,
  resolveTheme,
  type ColorSchemePref,
  type FontBody,
  type FontDisplay,
  type HeaderStyle,
  type StoreModule,
  type StoreTheme,
  type ThemePreset,
} from "../types/theme";

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
  /** Caracter visual de la tarjeta (no es el color-scheme del visitante) */
  preview: "light" | "dark";
}[] = [
  { id: "store", label: "Store", hint: "Storefront digital tipo Epic/Steam", preview: "dark" },
  { id: "nocturna", label: "Nocturna", hint: "Stage oscuro, discovery cinematográfico", preview: "dark" },
  { id: "clara", label: "Clara", hint: "Superficies claras, retail limpio", preview: "light" },
  { id: "retail", label: "Retail", hint: "Grises densos, look tienda", preview: "dark" },
];

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
      className={`text-left rounded-xl border-2 overflow-hidden transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
        selected
          ? "border-teal-600 ring-2 ring-teal-600/15 shadow-sm"
          : "border-stone-200 hover:border-stone-300"
      }`}
    >
      <div className="relative h-16" style={{ background: s.mist }}>
        <div
          className="absolute inset-x-0 top-0 h-3"
          style={{ background: s.elevated, borderBottom: `1px solid ${s.border}` }}
        />
        <div
          className="absolute inset-x-2 bottom-2 top-5 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${s.stageFrom}, ${s.stageTo})`,
          }}
        />
        <div
          className="absolute left-2 bottom-2 w-1.5 h-6 rounded-full"
          style={{ background: safeAccent }}
        />
        {selected && (
          <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
            ✓
          </span>
        )}
      </div>
      <div className="p-3 bg-white">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-[11px] text-stone-500 leading-snug mt-0.5">{hint}</p>
        <p className="text-[10px] uppercase tracking-wider text-stone-400 mt-2">
          Preview {preview === "light" ? "claro" : "oscuro"}
        </p>
      </div>
    </button>
  );
}

export default function EcommerceSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ecom-me"], queryFn: ecommerceMe });
  const tienda = data?.data?.tienda;

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
    setHydrated(true);
  }, [tienda, hydrated]);

  const patchTheme = (partial: Partial<StoreTheme>) => {
    setTheme((t) =>
      resolveTheme({
        ...t,
        ...partial,
        sections: { ...t.sections, ...partial.sections },
        trust: { ...t.trust, ...partial.trust },
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
      toast.success("Identidad de tienda guardada");
      qc.invalidateQueries({ queryKey: ["ecom-me"] });
      if (tienda?.slug) qc.invalidateQueries({ queryKey: ["store", tienda.slug] });
    },
    onError: () => toast.error("No se pudo guardar la tienda"),
  });

  const saveMp = useMutation({
    mutationFn: () => ecommerceSaveMpCredentials(mp),
    onSuccess: () => {
      toast.success("Credenciales Mercado Pago guardadas");
      qc.invalidateQueries({ queryKey: ["ecom-me"] });
      setMp((s) => ({ ...s, access_token: "" }));
    },
    onError: () => toast.error("No se pudieron guardar"),
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
        qc.invalidateQueries({ queryKey: ["ecom-me"] });
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
        toast.success("Banner del Stage actualizado");
        qc.invalidateQueries({ queryKey: ["ecom-me"] });
      }
    },
    onError: () => toast.error("Error al subir banner"),
  });

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

  if (isLoading && !tienda) {
    return <div className="text-stone-400 text-sm py-10">Cargando configuración…</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-stone-500 text-sm mt-1">
            Identidad visual y layout de tu Vitrina. El dinero de las ventas llega a tu Mercado Pago.
          </p>
        </div>
        {tienda?.slug && (
          <a
            href={`/tienda/${tienda.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"
          >
            Ver tienda pública <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          {/* Identidad */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h2 className="font-medium text-sm">Identidad</h2>
            <p className="text-xs text-stone-500">
              Slug público: <code className="bg-stone-100 px-1 rounded">/tienda/{tienda?.slug}</code>
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                className="size-16 rounded-full border border-dashed border-stone-300 overflow-hidden bg-stone-50 flex items-center justify-center shrink-0 hover:border-teal-600"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-5 text-stone-400" />
                )}
              </button>
              <div className="text-xs text-stone-500">
                <p className="font-medium text-stone-700">Logo</p>
                <p>PNG/JPG/WebP. Se muestra en header y footer.</p>
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
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999000111" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
          </section>

          {/* Color + preset */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-5">
            <div>
              <h2 className="font-medium text-sm">Color y ambiente</h2>
              <p className="text-xs text-stone-500 mt-1">
                El color primario es tu marca. El preset define el look de la vitrina (independiente del modo claro/oscuro del visitante).
              </p>
            </div>
            <div>
              <Label>Color primario</Label>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B"}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-11 rounded-md border border-stone-200 cursor-pointer p-0.5 shrink-0"
                  aria-label="Selector de color"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-36 font-mono"
                  placeholder="#0E7C7B"
                />
                <div
                  className="h-11 flex-1 min-w-[6rem] max-w-[12rem] rounded-md border border-stone-200"
                  style={{ background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B" }}
                  title="Vista previa del acento"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Preset de marca</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <p className="text-[11px] text-stone-400 mt-2">
                Activo: <span className="font-medium text-stone-600">{theme.preset}</span>
                {" · "}
                Guarda con el botón de abajo para aplicar en la tienda pública.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h2 className="font-medium text-sm">Modo oscuro del visitante</h2>
            <p className="text-xs text-stone-500">
              Independiente del preset de marca. El comprador puede cambiar claro/oscuro/sistema.
            </p>
            <div>
              <Label>Default</Label>
              <Select
                value={theme.color_scheme_default}
                onValueChange={(v) => patchTheme({ color_scheme_default: v as ColorSchemePref })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Permitir toggle en la vitrina</span>
              <Switch
                checked={theme.allow_visitor_scheme_toggle}
                onCheckedChange={(v) => patchTheme({ allow_visitor_scheme_toggle: v })}
              />
            </div>
          </section>

          {/* Tipografía */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h2 className="font-medium text-sm">Tipografía</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Display (títulos)</Label>
                <Select
                  value={theme.font_display}
                  onValueChange={(v) => patchTheme({ font_display: v as FontDisplay })}
                >
                  <SelectTrigger className="mt-1">
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
                <Label>Cuerpo</Label>
                <Select
                  value={theme.font_body}
                  onValueChange={(v) => patchTheme({ font_body: v as FontBody })}
                >
                  <SelectTrigger className="mt-1">
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
            <p
              className="text-2xl tracking-tight"
              style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}
            >
              {nombre || "Tu marca"}
            </p>
            <p className="text-sm text-stone-500" style={{ fontFamily: FONT_BODY_STACK[theme.font_body] }}>
              Así se lee el cuerpo de tu catálogo y descripciones.
            </p>
          </section>

          {/* Hero */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h2 className="font-medium text-sm">Hero / Stage</h2>
            <div>
              <Label>Titular (opcional)</Label>
              <Input
                value={theme.hero_headline || ""}
                onChange={(e) => patchTheme({ hero_headline: e.target.value || null })}
                placeholder={nombre || "Usa el nombre de la tienda"}
              />
            </div>
            <div>
              <Label>Subtítulo (opcional)</Label>
              <Input
                value={theme.hero_tagline || ""}
                onChange={(e) => patchTheme({ hero_tagline: e.target.value || null })}
                placeholder="Override de la descripción en el Stage"
              />
            </div>
            <div>
              <Label>Estilo del header</Label>
              <Select
                value={theme.header_style}
                onValueChange={(v) => patchTheme({ header_style: v as HeaderStyle })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="accent">Color de marca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banner de fondo del Stage</Label>
              <div className="mt-2 flex items-center gap-3">
                {theme.banner_url ? (
                  <img src={theme.banner_url} alt="" className="h-16 w-28 object-cover rounded-md border" />
                ) : (
                  <div className="h-16 w-28 rounded-md border border-dashed border-stone-300 bg-stone-50" />
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => bannerInput.current?.click()}>
                  {uploadBanner.isPending ? "Subiendo…" : "Subir banner"}
                </Button>
                {theme.banner_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => patchTheme({ banner_url: null })}
                  >
                    Quitar
                  </Button>
                )}
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
          </section>

          {/* Módulos ordenables */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h2 className="font-medium text-sm">Arquitecto de vitrina (módulos)</h2>
            <p className="text-xs text-stone-500">Activa, desactiva y reordena bloques. Browse = catálogo con filtros.</p>
            <ul className="space-y-2">
              {theme.modules.map((m, i) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg border border-stone-100 px-3 py-2"
                >
                  <Switch checked={m.enabled} onCheckedChange={(v) => toggleModule(m.id, v)} />
                  <span className="flex-1 text-sm font-medium capitalize">{m.type}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{m.id}</span>
                  <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => moveModule(i, -1)}>
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={i === theme.modules.length - 1}
                    onClick={() => moveModule(i, 1)}
                  >
                    ↓
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 text-sm pt-2 border-t border-stone-100">
              <label className="inline-flex items-center gap-2">
                <Switch
                  checked={theme.quick_actions.cart_fab !== false}
                  onCheckedChange={(v) =>
                    patchTheme({ quick_actions: { ...theme.quick_actions, cart_fab: v } })
                  }
                />
                Cart FAB
              </label>
              <label className="inline-flex items-center gap-2">
                <Switch
                  checked={theme.quick_actions.quick_add !== false}
                  onCheckedChange={(v) =>
                    patchTheme({ quick_actions: { ...theme.quick_actions, quick_add: v } })
                  }
                />
                Quick add
              </label>
              <label className="inline-flex items-center gap-2">
                <Switch
                  checked={theme.quick_actions.whatsapp !== false}
                  onCheckedChange={(v) =>
                    patchTheme({ quick_actions: { ...theme.quick_actions, whatsapp: v } })
                  }
                />
                WhatsApp
              </label>
            </div>
          </section>

          {/* Trust texts */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
            <h2 className="font-medium text-sm">Textos de confianza</h2>
            <div>
              <Label>Envío</Label>
              <Input
                value={theme.trust.envio}
                onChange={(e) => patchTheme({ trust: { ...theme.trust, envio: e.target.value } })}
              />
            </div>
            <div>
              <Label>Pago</Label>
              <Input
                value={theme.trust.pago}
                onChange={(e) => patchTheme({ trust: { ...theme.trust, pago: e.target.value } })}
              />
            </div>
            <div>
              <Label>Soporte</Label>
              <Input
                value={theme.trust.soporte}
                onChange={(e) => patchTheme({ trust: { ...theme.trust, soporte: e.target.value } })}
              />
            </div>
          </section>

          <Button
            type="button"
            onClick={() => {
              if (!nombre.trim()) {
                toast.error("El nombre es obligatorio");
                return;
              }
              saveBrand.mutate();
            }}
            disabled={saveBrand.isPending}
            className="w-full sm:w-auto"
          >
            {saveBrand.isPending ? "Guardando…" : "Guardar identidad y layout"}
          </Button>

          {/* MP */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
            <h2 className="font-medium text-sm">Mercado Pago (cuenta del negocio)</h2>
            <p className="text-xs text-stone-500">
              Estado:{" "}
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

        {/* Live preview */}
        <aside className="lg:sticky lg:top-20 space-y-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">Vista previa</p>
          <div
            className="rounded-xl overflow-hidden border border-stone-200 shadow-sm"
            style={previewStyle}
          >
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
              <span
                className="font-semibold truncate"
                style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}
              >
                {nombre || "Tu tienda"}
              </span>
            </div>
            <div
              className="relative h-36 p-4 flex flex-col justify-end text-white"
              style={{
                background: `linear-gradient(145deg, ${surf(theme.preset, theme.preset === "clara" ? "light" : "dark").stageFrom}, ${surf(theme.preset, theme.preset === "clara" ? "light" : "dark").stageTo})`,
                color: theme.preset === "clara" ? surf(theme.preset, "light").ink : "#fff",
              }}
            >
              {theme.banner_url && (
                <img src={theme.banner_url} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
              )}
              <div className="relative">
                <p
                  className="text-xl leading-none"
                  style={{ fontFamily: FONT_DISPLAY_STACK[theme.font_display] }}
                >
                  {theme.hero_headline || nombre || "Headline"}
                </p>
                <p
                  className="text-[10px] mt-2 line-clamp-2"
                  style={{ opacity: 0.7 }}
                >
                  {theme.hero_tagline || descripcion || "Tu tagline aparece aquí"}
                </p>
                <span
                  className="inline-block mt-3 text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0E7C7B" }}
                >
                  Explorar
                </span>
              </div>
            </div>
            <div className="bg-[var(--vitrina-mist)] p-3 grid grid-cols-3 gap-1.5">
              {theme.modules.some((m) => m.type === "trust" && m.enabled) &&
                [theme.trust.envio, theme.trust.pago, theme.trust.soporte].map((t) => (
                  <div key={t} className="rounded bg-white border border-stone-100 p-1.5 text-[9px] text-stone-600 truncate">
                    {t}
                  </div>
                ))}
              {!theme.modules.some((m) => m.type === "trust" && m.enabled) && (
                <p className="col-span-3 text-[10px] text-stone-400 text-center py-2">Trust oculto</p>
              )}
            </div>
            <div className="px-3 py-2 bg-white border-t border-stone-100 text-[10px] text-stone-400 flex flex-wrap gap-1">
              {theme.modules
                .filter((m) => m.enabled)
                .map((m) => (
                  <span key={m.id} className="px-1.5 py-0.5 rounded bg-stone-100">
                    {m.type}
                  </span>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
