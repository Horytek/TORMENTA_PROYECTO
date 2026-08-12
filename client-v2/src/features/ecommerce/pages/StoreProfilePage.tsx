import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { buyerChangePassword, buyerUpdateProfile } from "../api/ecommerce";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StoreProfilePage() {
  const { slug = "" } = useParams();
  const user = useStorefrontAuthStore((s) => s.user);
  const setSession = useStorefrontAuthStore((s) => s.setSession);
  const token = useStorefrontAuthStore((s) => s.token);

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");

  const profileMut = useMutation({
    mutationFn: () => buyerUpdateProfile(slug, { nombre: nombre.trim(), telefono: telefono.trim() || null }),
    onSuccess: (res) => {
      if (res.success && token) {
        setSession(token, res.data.user, slug);
        toast.success("Perfil actualizado");
      }
    },
    onError: () => toast.error("Error al guardar"),
  });

  const passMut = useMutation({
    mutationFn: () =>
      buyerChangePassword(slug, { password_actual: passActual, password_nueva: passNueva }),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setPassActual("");
      setPassNueva("");
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "Error");
    },
  });

  return (
    <div className="space-y-8 max-w-md">
      <form
        className="space-y-4 vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]"
        onSubmit={(e) => {
          e.preventDefault();
          profileMut.mutate();
        }}
      >
        <h3 className="font-semibold">Datos personales</h3>
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="mt-1 bg-black/5" />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1" />
        </div>
        <Button type="submit" disabled={profileMut.isPending}>
          Guardar cambios
        </Button>
      </form>

      <form
        className="space-y-4 vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]"
        onSubmit={(e) => {
          e.preventDefault();
          passMut.mutate();
        }}
      >
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <div>
          <Label>Contraseña actual</Label>
          <Input
            type="password"
            value={passActual}
            onChange={(e) => setPassActual(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Nueva contraseña</Label>
          <Input
            type="password"
            value={passNueva}
            onChange={(e) => setPassNueva(e.target.value)}
            required
            minLength={6}
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="outline" disabled={passMut.isPending}>
          Actualizar contraseña
        </Button>
      </form>
    </div>
  );
}
