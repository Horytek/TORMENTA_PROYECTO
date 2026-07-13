import { useQueryState, parseAsString } from "nuqs";
import { Ruler, Palette } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TallasPanel from "../components/TallasPanel";
import TonalidadesPanel from "../components/TonalidadesPanel";

export default function ContentPage() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("tallas"));

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gestor de contenidos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Catálogos base para las variantes: tallas y tonalidades.
            </p>
          </div>
          <TabsList className="h-11 w-full rounded-lg bg-muted p-1 md:w-auto">
            <TabsTrigger value="tallas" className="flex items-center gap-1.5 rounded-lg text-xs font-semibold">
              <Ruler className="h-3.5 w-3.5" /> Tallas
            </TabsTrigger>
            <TabsTrigger value="tonalidades" className="flex items-center gap-1.5 rounded-lg text-xs font-semibold">
              <Palette className="h-3.5 w-3.5" /> Tonalidades
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tallas" className="focus-visible:outline-none">
          <TallasPanel />
        </TabsContent>
        <TabsContent value="tonalidades" className="focus-visible:outline-none">
          <TonalidadesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
