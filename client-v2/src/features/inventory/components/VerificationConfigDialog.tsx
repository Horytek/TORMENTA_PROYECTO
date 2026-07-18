import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getRoles } from "@/features/roles/api/roles";
import { getVerificationConfig, updateVerificationConfig } from "../api/lotes";

interface VerificationConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerificationConfigDialog({ isOpen, onClose }: VerificationConfigDialogProps) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<"verify" | "approve">("verify");
  const [verifyRoles, setVerifyRoles] = useState<number[]>([]);
  const [approveRoles, setApproveRoles] = useState<number[]>([]);

  const { data: roles = [], isLoading: loadingRoles } = useQuery({ queryKey: ["roles"], queryFn: getRoles, enabled: isOpen });
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["verification-config"], queryFn: getVerificationConfig, enabled: isOpen,
  });

  useEffect(() => {
    if (config) {
      setVerifyRoles(config.verify);
      setApproveRoles(config.approve);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: () => updateVerificationConfig({ verify: verifyRoles, approve: approveRoles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-config"] });
      onClose();
    },
  });

  const toggle = (list: number[], setList: (v: number[]) => void, id: number) => {
    setList(list.includes(id) ? list.filter((r) => r !== id) : [...list, id]);
  };

  const loading = loadingRoles || loadingConfig;
  const activeList = stage === "verify" ? verifyRoles : approveRoles;
  const setActiveList = stage === "verify" ? setVerifyRoles : setApproveRoles;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar roles por etapa</DialogTitle>
          <DialogDescription>Define qué roles pueden verificar y aprobar solicitudes de inventario.</DialogDescription>
        </DialogHeader>

        <Tabs value={stage} onValueChange={(v) => setStage(v as "verify" | "approve")}>
          <TabsList className="w-full">
            <TabsTrigger value="verify" className="flex-1">1. Verificación</TabsTrigger>
            <TabsTrigger value="approve" className="flex-1">2. Aprobación</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-sm text-muted-foreground">
          {stage === "verify"
            ? "Roles que pueden verificar el ingreso inicial (conteo físico)."
            : "Roles que pueden aprobar el ingreso final y mover stock al almacén."}
        </p>

        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {roles.map((rol) => (
              <label
                key={rol.id_rol}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5 hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">{rol.nom_rol}</span>
                <Checkbox
                  checked={activeList.includes(rol.id_rol)}
                  onCheckedChange={() => toggle(activeList, setActiveList, rol.id_rol)}
                />
              </label>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || loading}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
