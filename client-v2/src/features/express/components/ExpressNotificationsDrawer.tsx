import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getExpressNotifications, markExpressNotificationsRead } from "../api/express";

interface ExpressNotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpressNotificationsDrawer({ open, onOpenChange }: ExpressNotificationsDrawerProps) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["express-notifications"],
    queryFn: getExpressNotifications,
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => markExpressNotificationsRead("all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["express-notifications"] }),
  });

  const notifications = data?.notifications ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notificaciones</SheetTitle>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todo leído
            </Button>
          )}
        </SheetHeader>
        <div className="mt-2 flex flex-col gap-2 overflow-y-auto px-4 pb-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border border-border p-3 text-sm ${n.read_status ? "opacity-60" : "bg-amber-500/5"}`}
              >
                <p className="text-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("es-PE")}</p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
