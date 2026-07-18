import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserPlan } from "../api/developer";
import type { Empresa, PlatformUser } from "../types";

const PLAN_TO_ID: Record<string, number> = { enterprise: 1, pro: 2, basic: 3 };

interface EditUserPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: PlatformUser | null;
  empresas: Empresa[];
}

export function EditUserPlanDialog({ isOpen, onClose, user, empresas }: EditUserPlanDialogProps) {
  const queryClient = useQueryClient();
  const [idEmpresa, setIdEmpresa] = useState("");
  const [plan, setPlan] = useState("basic");
  const [estado, setEstado] = useState("0");
  const [fechaPago, setFechaPago] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIdEmpresa(user.id_empresa ? String(user.id_empresa) : "");
      setPlan(user.plan_pago || "basic");
      setEstado(String(user.estado_usuario_1 ?? 0));
      setFechaPago(user.fecha_pago ? user.fecha_pago.slice(0, 10) : "");
      setError(null);
    }
  }, [isOpen, user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateUserPlan(user!.id_usuario, {
        id_empresa: idEmpresa,
        plan_pago: PLAN_TO_ID[plan] ?? 3,
        estado_usuario: estado,
        fecha_pago: fechaPago || null,
      }),
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo actualizar el usuario."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-platform-users"] });
      onClose();
    },
    onError: () => setError("No se pudo actualizar el usuario."),
  });

  if (!user) return null;

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={`Editar usuario: ${user.usua}`}
      onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate(); }}
      submitLabel="Guardar cambios"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Empresa" htmlFor="id_empresa">
        <Select value={idEmpresa || undefined} onValueChange={setIdEmpresa}>
          <SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger>
          <SelectContent>
            {empresas.map((e) => (
              <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.razonSocial}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Plan" htmlFor="plan">
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Plan Básico</SelectItem>
              <SelectItem value="pro">Plan Pro</SelectItem>
              <SelectItem value="enterprise">Plan Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Estado" htmlFor="estado">
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Activo</SelectItem>
              <SelectItem value="0">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <FormField label="Fecha de pago" htmlFor="fecha_pago">
        <Input id="fecha_pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
