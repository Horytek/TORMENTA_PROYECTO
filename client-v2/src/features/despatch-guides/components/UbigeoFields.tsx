import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GuideUbigeo } from "../types";

export interface UbigeoSelection {
  departamento: string;
  provincia: string;
  distrito: string;
}

export const emptyUbigeoSelection: UbigeoSelection = { departamento: "", provincia: "", distrito: "" };

/** Índice derivado de la lista plana de ubigeos, para resolver cascadas y el id final en O(1). */
export function useUbigeoIndex(ubigeos: GuideUbigeo[]) {
  return useMemo(() => {
    const departamentos = new Set<string>();
    const provinciasByDep: Record<string, Set<string>> = {};
    const distritosByDepProv: Record<string, Set<string>> = {};
    const idIndex: Record<string, number> = {};

    for (const u of ubigeos) {
      departamentos.add(u.departamento);
      (provinciasByDep[u.departamento] ??= new Set()).add(u.provincia);
      const key = `${u.departamento}__${u.provincia}`;
      (distritosByDepProv[key] ??= new Set()).add(u.distrito);
      idIndex[`${u.departamento}__${u.provincia}__${u.distrito}`] = u.id;
    }

    return {
      departamentos: Array.from(departamentos).sort(),
      getProvincias: (dep: string) => Array.from(provinciasByDep[dep] ?? []).sort(),
      getDistritos: (dep: string, prov: string) => Array.from(distritosByDepProv[`${dep}__${prov}`] ?? []).sort(),
      resolveId: (sel: UbigeoSelection) => idIndex[`${sel.departamento}__${sel.provincia}__${sel.distrito}`] ?? null,
    };
  }, [ubigeos]);
}

interface UbigeoFieldGroupProps {
  label: string;
  value: UbigeoSelection;
  onChange: (value: UbigeoSelection) => void;
  index: ReturnType<typeof useUbigeoIndex>;
}

export function UbigeoFieldGroup({ label, value, onChange, index }: UbigeoFieldGroupProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-3 text-xs font-medium text-muted-foreground">{label}</div>
      <Select
        value={value.departamento || undefined}
        onValueChange={(v) => onChange({ departamento: v, provincia: "", distrito: "" })}
      >
        <SelectTrigger className="h-9"><SelectValue placeholder="Departamento" /></SelectTrigger>
        <SelectContent>
          {index.departamentos.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.provincia || undefined}
        onValueChange={(v) => onChange({ ...value, provincia: v, distrito: "" })}
        disabled={!value.departamento}
      >
        <SelectTrigger className="h-9"><SelectValue placeholder="Provincia" /></SelectTrigger>
        <SelectContent>
          {index.getProvincias(value.departamento).map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.distrito || undefined}
        onValueChange={(v) => onChange({ ...value, distrito: v })}
        disabled={!value.provincia}
      >
        <SelectTrigger className="h-9"><SelectValue placeholder="Distrito" /></SelectTrigger>
        <SelectContent>
          {index.getDistritos(value.departamento, value.provincia).map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
