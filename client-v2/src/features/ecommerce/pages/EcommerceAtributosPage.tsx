import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminAddAtributoValor,
  adminAtributoProductos,
  adminCreateAtributo,
  adminDeleteAtributo,
  adminDeleteAtributoValor,
  adminListAtributos,
  adminUpdateAtributo,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const TIPOS = [
  { value: "seleccion", label: "Una opción", hint: "El cliente elige una: S, M, L…" },
  { value: "color", label: "Color", hint: "Opciones con muestra de color" },
  { value: "seleccion_multiple", label: "Varias opciones", hint: "Puede marcar más de una" },
  { value: "texto", label: "Texto libre", hint: "El cliente escribe, ej. dedicación" },
  { value: "numero", label: "Número", hint: "Ej. voltaje, cantidad de piezas" },
  { value: "medida", label: "Medida", hint: "Ej. 1.5 m, 250 ml" },
  { value: "booleano", label: "Sí / No", hint: "Ej. ¿incluye estuche?" },
  { value: "rango", label: "Rango", hint: "Ej. de–hasta" },
] as const;

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

function puedeSerVariante(tipo: string) {
  return tipo === "seleccion" || tipo === "color";
}

type Valor = { id_valor: number; valor: string; hex?: string | null; activo?: boolean };
type Atributo = {
  id_atributo: number;
  codigo: string;
  nombre: string;
  tipo: string;
  es_variante: boolean;
  activo: boolean;
  productos_count?: number;
  valores: Valor[];
};

const emptyForm = {
  nombre: "",
  tipo: "seleccion" as string,
  es_variante: false,
  activo: true,
};

export default function EcommerceAtributosPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [activo, setActivo] = useState("");
  const [editing, setEditing] = useState<Atributo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newValor, setNewValor] = useState("");
  const [newHex, setNewHex] = useState("#888888");
  const [assocId, setAssocId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-atributos", tid, q, tipo, activo],
    queryFn: () => adminListAtributos({ q: q || undefined, tipo: tipo || undefined, activo: activo || undefined }),
    enabled: Boolean(tid),
  });
  const atributos = (data?.data || []) as Atributo[];

  const assocQ = useQuery({
    queryKey: ["ecom-attr-prods", assocId],
    queryFn: () => adminAtributoProductos(assocId!),
    enabled: Boolean(assocId),
  });

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre,
        tipo: editing.tipo,
        es_variante: editing.es_variante,
        activo: editing.activo,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const saveMut = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateAtributo(editing.id_atributo, form)
        : adminCreateAtributo(form),
    onSuccess: () => {
      toast.success(editing ? "Atributo actualizado" : "Atributo creado");
      setCreating(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ecom-atributos", tid] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteAtributo(id),
    onSuccess: () => {
      toast.success("Atributo eliminado");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ecom-atributos", tid] });
    },
  });

  const sheetOpen = creating || Boolean(editing);
  const current = editing;
  const isColor = form.tipo === "color" || current?.tipo === "color";
  const tipoMeta = TIPOS.find((t) => t.value === form.tipo);
  const varianteOk = puedeSerVariante(form.tipo);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Atributos</h1>
          <p className="text-stone-500 text-sm mt-1 max-w-xl">
            Características que el cliente ve al comprar: talla, color, material, voltaje… Créalas
            aquí y luego asígnalas a cada producto en{" "}
            <Link to="/ecommerce-admin/productos" className="text-teal-700 hover:underline">
              Productos
            </Link>
            .
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus className="size-3.5 mr-1.5" />
          Nuevo atributo
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="size-4 absolute left-2.5 top-2.5 text-stone-400" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-stone-200 px-2 text-sm"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-stone-200 px-2 text-sm"
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : atributos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <Tags className="size-8 mx-auto text-stone-300 mb-3" />
          <p className="font-medium">Aún no hay características</p>
          <p className="text-sm text-stone-500 mt-1">
            Empieza con lo que el cliente elige: Talla, Color, Material…
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white divide-y">
          {atributos.map((a) => (
            <div key={a.id_atributo} className="p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{a.nombre}</p>
                <p className="text-xs text-stone-400">
                  {TIPO_LABEL[a.tipo] || a.tipo}
                  {a.es_variante ? " · con stock propio por opción" : " · solo informativo"}
                  {a.activo ? "" : " · oculto"}
                  {" · "}
                  {a.productos_count || 0}{" "}
                  {a.productos_count === 1 ? "producto" : "productos"}
                </p>
                {a.valores.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {a.valores.slice(0, 8).map((v) => (
                      <span
                        key={v.id_valor}
                        className="inline-flex items-center gap-1 text-[10px] rounded-full border border-stone-200 px-1.5 py-0.5"
                      >
                        {v.hex && (
                          <span
                            className="size-2 rounded-full border border-stone-200"
                            style={{ backgroundColor: v.hex }}
                          />
                        )}
                        {v.valor}
                      </span>
                    ))}
                    {a.valores.length > 8 && (
                      <span className="text-[10px] text-stone-400">+{a.valores.length - 8}</span>
                    )}
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setAssocId(a.id_atributo)}>
                Productos
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                Editar
              </Button>
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar atributo" : "Nuevo atributo"}</SheetTitle>
            <SheetDescription>
              Así el cliente elige talla, color u otra opción al agregar al carrito.
            </SheetDescription>
          </SheetHeader>
          <form
            className="px-4 py-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nombre.trim()) return;
              saveMut.mutate();
            }}
          >
            <div>
              <Label>¿Cómo se llama?</Label>
              <Input
                placeholder="Ej. Talla, Color, Material"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>¿Cómo elige el cliente?</Label>
              <select
                className="w-full h-9 rounded-md border border-stone-200 px-2 text-sm mt-1"
                value={form.tipo}
                onChange={(e) => {
                  const tipo = e.target.value;
                  setForm({
                    ...form,
                    tipo,
                    es_variante: form.es_variante && puedeSerVariante(tipo),
                  });
                }}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {tipoMeta && <p className="text-xs text-stone-500 mt-1">{tipoMeta.hint}</p>}
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.es_variante}
                  disabled={!varianteOk}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next && !form.es_variante) {
                      const ok = window.confirm(
                        "Al activar stock por opción se crearán combinaciones (variantes) con stock 0 en cada sucursal. No se inventan cantidades: debes cargar el inventario después. Los datos existentes no se borran. ¿Continuar?"
                      );
                      if (!ok) return;
                    }
                    setForm({ ...form, es_variante: next });
                  }}
                />
                <span>
                  <span className="font-medium">Cada opción tiene su propio stock</span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    {varianteOk
                      ? "Márcalo para Talla o Color: Rojo/M y Rojo/L se venden por separado. No lo marques para Material o “incluye estuche”: eso no crea stock extra."
                      : "Solo aplica si el cliente elige una opción (lista o color). Con texto o número no se puede separar el stock."}
                  </span>
                </span>
              </label>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              <span>
                <span className="font-medium">Disponible para usar</span>
                <span className="block text-xs text-stone-500">
                  Si lo desmarcas, no aparecerá al asignarlo a productos nuevos.
                </span>
              </span>
            </label>
            <Button type="submit" disabled={saveMut.isPending}>
              Guardar
            </Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600"
                onClick={() => delMut.mutate(editing.id_atributo)}
              >
                <Trash2 className="size-3.5 mr-1" />
                Eliminar
              </Button>
            )}
          </form>

          {current && (
            <div className="px-4 pb-6 space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Opciones que verá el cliente</p>
              <p className="text-xs text-stone-500">
                {isColor
                  ? "Ej. Rojo, Negro, Beige. Elige también el color de la muestra."
                  : "Ej. S, M, L, XL. Guarda la característica primero si aún no tiene opciones."}
              </p>
              <ul className="space-y-1">
                {current.valores.map((v) => (
                  <li key={v.id_valor} className="flex items-center gap-2 text-sm">
                    {v.hex && (
                      <span
                        className="size-4 rounded-full border border-stone-200"
                        style={{ backgroundColor: v.hex }}
                      />
                    )}
                    <span className="flex-1">{v.valor}</span>
                    <button
                      type="button"
                      className="text-stone-400 hover:text-red-600"
                      onClick={async () => {
                        await adminDeleteAtributoValor(current.id_atributo, v.id_valor);
                        qc.invalidateQueries({ queryKey: ["ecom-atributos", tid] });
                        const res = await adminListAtributos();
                        const next = (res.data || []).find(
                          (x: Atributo) => x.id_atributo === current.id_atributo
                        );
                        if (next) setEditing(next);
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  placeholder={isColor ? "Ej. Rojo" : "Ej. M"}
                  value={newValor}
                  onChange={(e) => setNewValor(e.target.value)}
                />
                {isColor && (
                  <input
                    type="color"
                    className="size-9 rounded border"
                    value={newHex}
                    onChange={(e) => setNewHex(e.target.value)}
                  />
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (!newValor.trim()) return;
                    await adminAddAtributoValor(current.id_atributo, {
                      valor: newValor.trim(),
                      hex: isColor ? newHex : null,
                    });
                    setNewValor("");
                    qc.invalidateQueries({ queryKey: ["ecom-atributos", tid] });
                    const res = await adminListAtributos();
                    const next = (res.data || []).find(
                      (x: Atributo) => x.id_atributo === current.id_atributo
                    );
                    if (next) setEditing(next);
                  }}
                >
                  Añadir
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(assocId)} onOpenChange={(v) => !v && setAssocId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Productos que usan esto</SheetTitle>
            <SheetDescription>
              Para cambiar las opciones de un producto, ábrelo en Productos.
            </SheetDescription>
          </SheetHeader>
          <ul className="px-4 py-4 space-y-2 text-sm">
            {((assocQ.data?.data || []) as { id_producto: number; nombre: string }[]).map((p) => (
              <li key={p.id_producto}>
                <Link to="/ecommerce-admin/productos" className="hover:underline">
                  {p.nombre}
                </Link>
              </li>
            ))}
            {assocQ.isSuccess && !(assocQ.data?.data || []).length && (
              <li className="text-stone-400">Todavía no está asignado a ningún producto.</li>
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
