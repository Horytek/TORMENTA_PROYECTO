import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { buyerListFavoritos, buyerToggleFavorito } from "../../api/erpStore";
import { useStorefrontAuthStore } from "../../store/useStorefrontAuthStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  id_producto: number;
  className?: string;
};

export function FavoriteHeartButton({ id_producto, className }: Props) {
  const { slug = "" } = useParams();
  const token = useStorefrontAuthStore((s) => s.token);
  const [loginOpen, setLoginOpen] = useState(false);
  const qc = useQueryClient();

  const favsQ = useQuery({
    queryKey: ["buyer-favs", slug],
    queryFn: () => buyerListFavoritos(slug),
    enabled: Boolean(token && slug),
  });

  const isFav = Boolean(
    favsQ.data?.data?.some((p: { id_producto: number }) => p.id_producto === id_producto)
  );

  const toggleMut = useMutation({
    mutationFn: () => buyerToggleFavorito(slug, id_producto),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["buyer-favs", slug] });
      toast.success(res.data?.favorito ? "Agregado a favoritos" : "Quitado de favoritos");
    },
    onError: () => toast.error("No se pudo actualizar favorito"),
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      setLoginOpen(true);
      return;
    }
    toggleMut.mutate();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "size-9 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-black/5",
          className
        )}
        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn("size-4", isFav ? "fill-red-500 text-red-500" : "text-stone-600")}
        />
      </button>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión</DialogTitle>
            <DialogDescription>
              Crea una cuenta o inicia sesión para guardar tus productos favoritos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1">
              <Link to={`/s/${slug}/login`}>Iniciar sesión</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/s/${slug}/registro`}>Registrarme</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
