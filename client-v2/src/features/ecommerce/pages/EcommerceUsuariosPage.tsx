import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search, UserRound, X } from "lucide-react";
import {
  adminCreateUsuario,
  adminListRoles,
  adminListSucursales,
  adminListUsuarios,
  adminUpdateUsuario,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Usuario = {
  id_usuario: number;
  usua: string;
  email: string;
  nombre: string | null;
  estado: boolean;
  id_rol: number | null;
  rol_nombre: string | null;
  acceso_global: boolean;
  sucursales: number[];
};

const empty = {
  usua: "",
  email: "",
  nombre: "",
  password: "",
  id_rol: "" as string,
  acceso_global: false,
  sucursales: [] as number[],
};

export default function EcommerceUsuariosPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [q, setQ] = useState("");

  const usersQ = useQuery({
    queryKey: ["ecom-usuarios", tid],
    queryFn: adminListUsuarios,
    enabled: Boolean(tid),
  });
  const rolesQ = useQuery({
    queryKey: ["ecom-roles", tid],
    queryFn: adminListRoles,
    enabled: Boolean(tid),
  });
  const sucQ = useQuery({
    queryKey: ["ecom-sucursales-admin", tid],
    queryFn: () => adminListSucursales(),
    enabled: Boolean(tid),
  });

  const usuarios = (usersQ.data?.data || []) as Usuario[];
  const roles = (rolesQ.data?.data?.roles || []) as { id_rol: number; nombre: string }[];
  const sucursales = (sucQ.data?.data || []) as { id_sucursal: number; nombre: string }[];

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) => {
      const blob = `${u.nombre || ""} ${u.usua} ${u.email} ${u.rol_nombre || ""}`.toLowerCase();
      return blob.includes(term);
    });
  }, [usuarios, q]);

  const nombreSucursal = (id: number) =>
    sucursales.find((s) => s.id_sucursal === id)?.nombre || `Sucursal ${id}`;

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setSheetOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u.id_usuario);
    setForm({
      usua: u.usua,
      email: u.email,
      nombre: u.nombre || "",
      password: "",
      id_rol: u.id_rol ? String(u.id_rol) : "",
      acceso_global: u.acceso_global,
      sucursales: u.sucursales || [],
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setForm(empty);
  };

  const toggleSucursal = (id: number) => {
    setForm((f) => ({
      ...f,
      sucursales: f.sucursales.includes(id)
        ? f.sucursales.filter((x) => x !== id)
        : [...f.sucursales, id],
    }));
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        usua: form.usua.trim(),
        email: form.email.trim(),
        nombre: form.nombre.trim() || form.usua.trim(),
        password: form.password || undefined,
        id_rol: form.id_rol ? Number(form.id_rol) : null,
        acceso_global: form.acceso_global,
        sucursales: form.sucursales,
      };
      return editing ? adminUpdateUsuario(editing, body) : adminCreateUsuario(body);
    },
    onSuccess: () => {
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      closeSheet();
      qc.invalidateQueries({ queryKey: ["ecom-usuarios", tid] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const toggleEstado = async (u: Usuario) => {
    try {
      await adminUpdateUsuario(u.id_usuario, { estado: !u.estado });
      toast.success(u.estado ? "Usuario desactivado" : "Usuario activado");
      qc.invalidateQueries({ queryKey: ["ecom-usuarios", tid] });
    } catch (e) {
      toast.error((e as Error).message || "Error");
    }
  };

  return (
    <div className="space-y-5 max-w-5xl pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-stone-500 text-sm mt-1">
            Quién entra al admin, con qué rol y en qué sucursales.
          </p>
        </div>
        <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={openCreate}>
          <Plus className="size-4 mr-1.5" />
          Nuevo usuario
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <Input
          className="min-h-11 pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, usuario o correo…"
        />
      </div>

      {usersQ.isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <UserRound className="size-8 mx-auto text-stone-300 mb-3" />
          <p className="font-medium">{q ? "Sin coincidencias" : "Aún no hay usuarios"}</p>
          <p className="text-sm text-stone-500 mt-1">
            {q ? "Prueba otro texto de búsqueda." : "Crea el primero para tu equipo."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtrados.map((u) => {
            const sucLabel = u.acceso_global
              ? "Todas las sucursales"
              : (u.sucursales || []).length
                ? (u.sucursales || []).map(nombreSucursal).join(", ")
                : "Sin sucursal";
            return (
              <li
                key={u.id_usuario}
                className={cn(
                  "rounded-xl border bg-white p-3 sm:p-4",
                  u.estado ? "border-stone-200" : "border-stone-200 opacity-70"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="size-11 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                      {(u.nombre || u.usua || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm truncate">{u.nombre || u.usua}</p>
                        {!u.estado && (
                          <span className="text-[10px] uppercase tracking-wide bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        @{u.usua} · {u.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="inline-flex items-center min-h-7 px-2 rounded-full bg-stone-100 text-[11px] text-stone-600">
                          {u.rol_nombre || "Sin rol"}
                        </span>
                        <span className="inline-flex items-center min-h-7 px-2 rounded-full bg-teal-50 text-[11px] text-teal-800 max-w-full truncate">
                          {sucLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="size-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={cn("min-h-11", u.estado ? "text-red-600" : "text-teal-700")}
                      onClick={() => void toggleEstado(u)}
                    >
                      {u.estado ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : closeSheet())}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-4 sm:p-6 gap-0 sm:max-w-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Cambia datos, rol o sucursales. La contraseña solo si quieres resetearla."
                : "Crea una cuenta para alguien de tu equipo."}
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-4 space-y-4 pb-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.usua.trim() || !form.email.trim()) {
                toast.error("Usuario y correo son obligatorios");
                return;
              }
              if (!editing && !form.password) {
                toast.error("Pon una contraseña");
                return;
              }
              saveMut.mutate();
            }}
          >
            <div>
              <Label>Usuario (login)</Label>
              <Input
                className="min-h-11 mt-1"
                value={form.usua}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, usua: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                className="min-h-11 mt-1"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Nombre para mostrar</Label>
              <Input
                className="min-h-11 mt-1"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. María del local Balta"
              />
            </div>
            <div>
              <Label>{editing ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
              <Input
                className="min-h-11 mt-1"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select
                value={form.id_rol || "none"}
                onValueChange={(v) => setForm({ ...form, id_rol: v === "none" ? "" : v })}
              >
                <SelectTrigger className="min-h-11 mt-1 w-full">
                  <SelectValue placeholder="Elegir rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin rol</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id_rol} value={String(r.id_rol)}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3 min-h-11">
              <Switch
                className="mt-0.5"
                checked={form.acceso_global}
                onCheckedChange={(v) => setForm({ ...form, acceso_global: v, sucursales: v ? [] : form.sucursales })}
              />
              <span className="text-sm">
                <span className="font-medium block">Ve todas las sucursales</span>
                <span className="text-stone-500 text-xs">
                  Ideal para admin o gerente. Si lo apagas, elige abajo en cuáles trabaja.
                </span>
              </span>
            </label>

            {!form.acceso_global && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Sucursales</Label>
                  {form.sucursales.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-stone-500 hover:underline min-h-8"
                      onClick={() => setForm({ ...form, sucursales: [] })}
                    >
                      Quitar todas
                    </button>
                  )}
                </div>
                {sucursales.length === 0 ? (
                  <p className="text-sm text-stone-400">No hay sucursales activas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sucursales.map((s) => {
                      const on = form.sucursales.includes(s.id_sucursal);
                      return (
                        <button
                          key={s.id_sucursal}
                          type="button"
                          onClick={() => toggleSucursal(s.id_sucursal)}
                          className={cn(
                            "inline-flex items-center min-h-11 px-3 rounded-full border text-sm touch-manipulation",
                            on
                              ? "border-teal-600 bg-teal-50 text-teal-800"
                              : "border-stone-200 text-stone-600"
                          )}
                        >
                          {s.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sticky bottom-0 bg-white pb-[env(safe-area-inset-bottom)]">
              <Button type="button" variant="ghost" className="min-h-11" onClick={closeSheet}>
                <X className="size-4 mr-1" />
                Cancelar
              </Button>
              <Button type="submit" className="min-h-11 flex-1" disabled={saveMut.isPending}>
                {saveMut.isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
