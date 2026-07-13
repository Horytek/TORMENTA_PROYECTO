import { Loader2 } from "lucide-react";

/** Fallback de Suspense para páginas cargadas de forma diferida (lazy). */
export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  );
}
