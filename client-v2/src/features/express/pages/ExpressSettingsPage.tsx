import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Users, KeyRound, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getExpressMe, expressLogout, updateExpressPasswordRequest } from "../api/express";

export default function ExpressSettingsPage() {
  const navigate = useNavigate();
  const [passOpen, setPassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data: me, isLoading } = useQuery({
    queryKey: ["express-me"],
    queryFn: getExpressMe,
  });

  const changePassword = useMutation({
    mutationFn: () => updateExpressPasswordRequest(newPassword),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setPassOpen(false);
      setNewPassword("");
    },
    onError: () => toast.error("No se pudo actualizar la contraseña"),
  });

  const handleLogout = async () => {
    await expressLogout();
    navigate("/login", { replace: true });
  };

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const isAdmin = me.role === "admin";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-lg font-bold text-amber-500">
            {me.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{me.name}</p>
            <p className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : "Vendedor"}</p>
            {me.email && <p className="truncate text-xs text-muted-foreground">{me.email}</p>}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">General</p>
          <SettingsLink icon={CreditCard} label="Suscripción" onClick={() => navigate("/express-pos/subscription")} />
          <SettingsLink icon={Users} label="Equipo" onClick={() => navigate("/express-pos/users")} />
        </div>
      )}

      <div className="space-y-2">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sesión y seguridad</p>
        <SettingsLink icon={KeyRound} label="Cambiar contraseña" onClick={() => setPassOpen(true)} />
        <SettingsLink icon={LogOut} label="Cerrar sesión" onClick={handleLogout} destructive />
      </div>

      <Dialog open={passOpen} onOpenChange={setPassOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassOpen(false)}>Cancelar</Button>
            <Button
              disabled={newPassword.length < 6 || changePassword.isPending}
              onClick={() => changePassword.mutate()}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsLink({
  icon: Icon, label, onClick, destructive,
}: { icon: typeof CreditCard; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      <span className="flex items-center gap-2.5 text-sm font-medium">
        <Icon className="h-4 w-4" /> {label}
      </span>
      {!destructive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
