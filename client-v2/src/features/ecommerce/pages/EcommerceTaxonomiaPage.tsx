import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateTaxonomia,
  adminDeleteTaxonomia,
  adminListTaxonomia,
  adminUpdateTaxonomia,
  type TaxonomiaTipo,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS: { tipo: TaxonomiaTipo; label: string; hint: string; placeholder: string }[] = [
  {
    tipo: "marca",
    label: "Marcas",
    hint: "Nike, Levi's, local… El cliente las ve en la ficha.",
    placeholder: "Nueva marca",
  },
  {
    tipo: "categoria",
    label: "Categorías",
    hint: "Agrupan la vitrina: Polos, Jeans, Abrigos…",
    placeholder: "Nueva categoría",
  },
  {
    tipo: "tag",
    label: "Tags",
    hint: "Etiquetas sueltas: nuevo, oferta, verano…",
    placeholder: "Nuevo tag",
  },
];

type Termino = {
  id_termino: number;
  tipo: TaxonomiaTipo;
  nombre: string;
  activo: boolean;
};

export default function EcommerceTaxonomiaPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [tipo, setTipo] = useState<TaxonomiaTipo>("marca");
  const [nuevo, setNuevo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const tab = TABS.find((t) => t.tipo === tipo)!;
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-taxonomia", tid, tipo],
    queryFn: () => adminListTaxonomia({ tipo }),
    enabled: Boolean(tid),
  });
  const terminos = (data?.data || []) as Termino[];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ecom-taxonomia", tid] });

  const createMut = useMutation({
    mutationFn: (nombre: string) => adminCreateTaxonomia({ tipo, nombre }),
    onSuccess: () => {
      toast.success("Agregado");
      setNuevo("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      adminUpdateTaxonomia(id, { nombre }),
    onSuccess: () => {
      toast.success("Actualizado. Los productos con ese nombre también se actualizan.");
      setEditingId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => adminDeleteTaxonomia(id),
    onSuccess: () => {
      toast.success("Eliminado del catálogo (los productos no se tocan)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const toggleActivo = async (t: Termino) => {
    try {
      await adminUpdateTaxonomia(t.id_termino, { activo: !t.activo });
      invalidate();
    } catch (e) {
      toast.error((e as Error).message || "Error");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marcas, categorías y tags</h1>
        <p className="text-stone-500 text-sm mt-1 max-w-xl">
          Valores que eliges al crear un producto. Edítalos aquí para que no se escriban a mano
          cada vez. Se asignan en{" "}
          <Link to="/ecommerce-admin/productos" className="text-teal-700 hover:underline">
            Productos
          </Link>
          .
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.tipo}
            type="button"
            className={cn(
              "flex-1 min-h-11 rounded-lg text-sm font-medium touch-manipulation",
              tipo === t.tipo ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
            )}
            onClick={() => {
              setTipo(t.tipo);
              setEditingId(null);
              setNuevo("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-stone-500">{tab.hint}</p>

      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const nombre = nuevo.trim();
          if (!nombre) return;
          createMut.mutate(nombre);
        }}
      >
        <Input
          className="min-h-11"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder={tab.placeholder}
        />
        <Button type="submit" className="min-h-11" disabled={createMut.isPending}>
          <Plus className="size-4 mr-1" />
          Agregar
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : terminos.length === 0 ? (
        <p className="text-sm text-stone-400 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
          Todavía no hay {tab.label.toLowerCase()}. Agrégalos aquí o créalos al elegirlos en un
          producto.
        </p>
      ) : (
        <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {terminos.map((t) => (
            <li key={t.id_termino} className="flex items-center gap-2 px-3 py-2">
              {editingId === t.id_termino ? (
                <>
                  <Input
                    className="min-h-11"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      const nombre = editingName.trim();
                      if (!nombre) return;
                      updateMut.mutate({ id: t.id_termino, nombre });
                    }}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-11 min-w-11"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className={cn("flex-1 text-sm", !t.activo && "text-stone-400 line-through")}>
                    {t.nombre}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-11 text-xs"
                    onClick={() => void toggleActivo(t)}
                  >
                    {t.activo ? "Ocultar" : "Activar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 min-w-11"
                    onClick={() => {
                      setEditingId(t.id_termino);
                      setEditingName(t.nombre);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 min-h-11 min-w-11"
                    onClick={() => delMut.mutate(t.id_termino)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
