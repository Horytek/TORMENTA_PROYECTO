import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { ShieldAlert, Loader2, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction, RhythmConfig } from "@/components/shared/AdaptiveCollection";
import UserForm from "../components/UserForm";
import { getUsuarios, deleteUsuario } from "../api/users";
import type { Usuario } from "../types";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);

  const { data = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ["usuarios", page, searchTerm],
    queryFn: () => getUsuarios(),
  });

  const filtered = searchTerm.trim()
    ? data.filter(u =>
        u.usua.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.nom_rol ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setIsDeleteOpen(false);
      setDeletingUser(null);
    },
  });

  // ── Fields ─────────────────────────────────────────────────────
  const fields: FieldDef<Usuario>[] = [
    {
      key: "usua", priority: "primary", semantic: "title",
      label: "Usuario",
      className: "font-medium",
    },
    {
      key: "nom_rol", priority: "secondary", semantic: "chip",
      label: "Rol",
      format: (v) => (v as string) || "Sin rol",
      className: "text-xs",
    },
    {
      key: "estado_usuario", priority: "secondary", semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
    {
      key: "plan_pago_1", priority: "meta", semantic: "subtitle",
      label: "Plan",
      format: (v) => (v as string) || "—",
    },
    {
      key: "id_usuario", priority: "hidden",
    },
    {
      key: "id_rol", priority: "hidden",
    },
    {
      key: "id_empresa", priority: "hidden",
    },
  ];

  // ── Rhythm ────────────────────────────────────────────────────
  const getRhythm = (u: Usuario): RhythmConfig => ({
    type: "dot",
    color: Number(u.estado_usuario) === 0 ? "rose" : "emerald",
  });

  // ── Actions ────────────────────────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "edit", label: "Editar",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: (item) => { setEditingUser(item as Usuario); setIsFormOpen(true); },
      variant: "secondary",
    },
    {
      id: "delete", label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => { setDeletingUser(item as Usuario); setIsDeleteOpen(true); },
      variant: "destructive",
    },
  ];

  // ── CSV Export ────────────────────────────────────────────────
  const exportToCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["ID", "Usuario", "Rol", "Estado", "Plan"];
    const rows = filtered.map((u) => [
      u.id_usuario,
      `"${(u.usua || "").replace(/"/g, '""')}"`,
      u.nom_rol || "",
      Number(u.estado_usuario) === 1 ? "Activo" : "Inactivo",
      u.plan_pago_1 || "",
    ]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AdaptiveCollection<Usuario>
        title="Usuarios"
        items={filtered}
        fields={fields}
        actions={actions}
        layout="auto"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por usuario o rol…"
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        empty={{
          title: "No se encontraron usuarios",
          description: searchTerm
            ? `Ningún usuario coincide con "${searchTerm}"`
            : "No hay cuentas de acceso registradas.",
        }}
        getItemId={(u) => u.id_usuario}
        getRhythm={getRhythm}
        page={page}
        totalPages={Math.max(Math.ceil(filtered.length / LIMIT), 1)}
        onPageChange={setPage}
        serverSide={false}
        totalCount={filtered.length}
        globalActions={[{
          id: "export", label: "Exportar CSV",
          icon: <Download className="h-4 w-4" />,
          onClick: () => exportToCSV(),
        }]}
      />

      {/* Create / Edit form */}
      {isFormOpen && (
        <UserForm
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingUser(null); }}
          initialData={editingUser}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={(o) => !o && setIsDeleteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive/80" />
              ¿Confirmar eliminación?
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              ¿Eliminar permanentemente la cuenta de <strong>"{deletingUser?.usua}"</strong>? No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id_usuario)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
