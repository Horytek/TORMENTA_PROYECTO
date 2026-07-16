import * as React from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, CardSlots, ItemState } from "./types";
import { sortFieldsByPriority, splitCollapsible, inferState } from "./types";
import { renderField } from "./fieldRenderers";

/**
 * Mapper: `FieldDef[]` + item → nodos React renderizados, en orden
 * de aparición (de arriba a abajo). El `AdaptiveCard` los renderiza
 * directamente en su contenedor, preservando el espaciado exacto del
 * card original (espacio entre secciones via `space-y-1.5`).
 *
 * Estrategia:
 *   1. Ordenar por prioridad (primary → secondary → meta → hidden).
 *   2. Clasificar cada campo visible por `semantic` y asignarlo a una zona:
 *        - primary (title)         → línea 1 (header)
 *        - secondary subtitle      → línea 2 (header)
 *        - secondary chip/badge    → línea 3 (header, chips)
 *        - secondary number/icon-text/text → body
 *        - secondary status-dot    → body
 *        - meta code               → footer
 *        - meta barcode            → footer final con separador
 *   3. Producir nodos React con los field renderers existentes — la
 *      presentación debe ser **idéntica** al card original para
 *      mantener no-regresión en las 4 páginas que ya lo consumen.
 *
 * Esto se llama internamente desde `AdaptiveCard` cuando el consumer
 * no pasa `slots` explícitamente.
 */

export interface AutoMapResult {
  /** Nodos en orden vertical (header → body → footer). */
  nodes: React.ReactNode[];
  /** Slots nombrados equivalentes — útil para variantes futuras. */
  slots: Partial<CardSlots>;
}

export interface AutoMapOptions {
  /** Para `semantic: "kpi"` — thresholds de color por campo. */
  getState?: (field: FieldDef<any>, value: unknown) => ItemState;
  /** Tinte base para el header (compatibilidad con card original). */
  tint?: string;
  /** Clase de Tailwind a aplicar al subtítulo (e.g. "text-blue-600"). */
  subtitleClass?: string;
}

export function mapFieldsToSlots<T extends Record<string, unknown>>(
  fields: FieldDef<T>[],
  item: T,
  index: number,
  options: AutoMapOptions = {}
): AutoMapResult {
  const sorted = sortFieldsByPriority(fields);
  const { visible: visibleWithAvatar } = splitCollapsible(sorted);

  // Un campo `semantic: "avatar"` se saca del flujo header/body normal y
  // se ofrece como `slots.media` — lo usan variantes como `split-row`.
  const avatarField = visibleWithAvatar.find(f => f.semantic === "avatar");
  const visible = avatarField ? visibleWithAvatar.filter(f => f !== avatarField) : visibleWithAvatar;

  // ── Clasificación ─────────────────────────────────────────────
  const primary = visible.filter(f => f.priority === "primary");
  const secondary = visible.filter(f => f.priority === "secondary");
  const meta = visible.filter(f => f.priority === "meta");

  const primaryField = primary[0] ?? sorted[0];
  const subtitleField =
    secondary.find(f => f.semantic === "subtitle") ??
    secondary.find(f => String(f.key).includes("nom_subcat") || String(f.key).includes("categoria"));
  const chipFields = secondary.filter(f => f.semantic === "chip" || f.semantic === "badge");
  const statusField = secondary.find(f => f.semantic === "status-dot");
  const iconTextFields = secondary.filter(f => f.semantic === "icon-text");
  const textFields = secondary.filter(f => f.semantic === "text");
  const numberField = secondary.find(f => f.semantic === "number");
  const codeFields = meta.filter(f => f.semantic === "code");
  const barcodeField = meta.find(f => f.semantic === "barcode" || f.key === "cod_barras");

  // ── HEADER ────────────────────────────────────────────────────
  const headerNodes: React.ReactNode[] = [];

  if (primaryField) {
    const value = item[(primaryField.key as keyof T)];
    const node = (value != null || primaryField.render) ? renderField(primaryField, value, item, index) : (
      <span className="text-muted-foreground/40 italic">Sin nombre</span>
    );
    headerNodes.push(
      <p key="primary" className="truncate text-sm font-medium tracking-tight text-foreground/90">
        {node}
      </p>
    );
  }

  if (subtitleField) {
    const raw = item[(subtitleField.key as keyof T)];
    const empty = (raw == null || raw === "" || String(raw).trim() === "—") && !subtitleField.render;
    if (!empty) {
      headerNodes.push(
        <p
          key="subtitle"
          className={cn(
            "truncate text-xs font-medium",
            // Compatibilidad con el card original: tint explícito (e.g. text-blue-600)
            // cuando hay rhythm con color; en su defecto, golden-node-text procedural.
            options.subtitleClass ?? "golden-node-text"
          )}
        >
          {renderField(subtitleField, raw, item, index)}
        </p>
      );
    }
  }

  if (chipFields.length > 0) {
    const visibleChips = chipFields
      .map(f => {
        const v = item[(f.key as keyof T)];
        if (v == null || v === "" || String(v).trim() === "—") return null;
        return <span key={String(f.key)}>{renderField(f, v, item, index)}</span>;
      })
      .filter(Boolean);
    if (visibleChips.length > 0) {
      headerNodes.push(
        <div key="chips" className="flex flex-wrap gap-1.5">
          {visibleChips}
        </div>
      );
    }
  }

  // ── BODY ──────────────────────────────────────────────────────
  const bodyNodes: React.ReactNode[] = [];

  if (numberField) {
    const raw = item[(numberField.key as keyof T)];
    const num = Number(raw);
    const isZero = !isNaN(num) && num === 0;
    const isEmpty = raw == null || raw === "" || isZero;
    if (!isEmpty) {
      bodyNodes.push(
        <div key="number" className="flex items-center gap-1.5 text-xs text-muted-foreground num tabular-nums">
          {numberField.label ? <span className="text-muted-foreground/60">{numberField.label}:</span> : null}
          <span className="font-medium text-foreground/80">
            {renderField(numberField, raw, item, index)}
          </span>
        </div>
      );
    }
  }

  if (statusField) {
    bodyNodes.push(
      <div key="status">
        {renderField(statusField, item[(statusField.key as keyof T)], item, index)}
      </div>
    );
  }

  // icon-text (teléfono, email, vendedor) — render filtra vacíos
  const visibleIconText = iconTextFields
    .filter(f => {
      if (f.render) return true;
      const v = item[(f.key as keyof T)];
      return v != null && v !== "" && String(v).trim() !== "" && String(v).trim() !== "—";
    })
    .slice(0, 3);
  if (visibleIconText.length > 0) {
    bodyNodes.push(
      <div key="icon-text" className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {visibleIconText.map(f => (
          <div key={String(f.key)} className="min-w-0 truncate">
            {renderField(f, item[(f.key as keyof T)], item, index)}
          </div>
        ))}
      </div>
    );
  }

  // text genéricos (dirección, etc.)
  const visibleText = textFields
    .filter(f => {
      if (f.render) return true;
      const v = item[(f.key as keyof T)];
      return v != null && v !== "" && String(v).trim() !== "" && String(v).trim() !== "—";
    })
    .slice(0, 2);
  if (visibleText.length > 0) {
    bodyNodes.push(
      <div key="text" className="flex flex-col gap-0.5 pt-1 border-t border-border/30">
        {visibleText.map(f => {
          // Si el campo tiene render personalizado, usar div para evitar
          // nesting inválido (<p> no puede contener block elements como <div>)
          const Wrapper = f.render ? "div" : "p";
          return (
            <Wrapper key={String(f.key)} className={f.render ? "min-w-0" : "truncate text-xs text-muted-foreground"}>
              {renderField(f, item[(f.key as keyof T)], item, index)}
            </Wrapper>
          );
        })}
      </div>
    );
  }

  // ── FOOTER ────────────────────────────────────────────────────
  const footerNodes: React.ReactNode[] = [];

  if (codeFields.length > 0) {
    const visibleCodes = codeFields
      .filter(f => {
        if (f.render) return true;
        const v = item[(f.key as keyof T)];
        return v != null && v !== "" && String(v).trim() !== "" && String(v).trim() !== "—";
      })
      .slice(0, 3);
    if (visibleCodes.length > 0) {
      footerNodes.push(
        <div key="codes" className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          {visibleCodes.map(f => (
            <span key={String(f.key)} className="flex items-center gap-1">
              {f.label ? (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{f.label}</span>
              ) : null}
              <span className="num text-[10px] font-mono font-medium text-muted-foreground/70">
                {renderField(f, item[(f.key as keyof T)], item, index)}
              </span>
            </span>
          ))}
        </div>
      );
    }
  }

  // ── ASSEMBLE ──────────────────────────────────────────────────
  // Devolvemos los nodos en orden plano. El AdaptiveCard los renderiza
  // directamente dentro del contenedor con `space-y-1.5`, preservando el
  // espaciado original entre secciones (igual que el card antiguo).
  const flatNodes: React.ReactNode[] = [
    ...headerNodes,
    ...bodyNodes,
    ...footerNodes,
  ];

  // Slots nombrados para consumidores que quieran consumir por slot
  // (e.g. variantes avanzadas: media-cover, stat-tile, etc.).
  const slots: Partial<CardSlots> = {};
  if (headerNodes.length > 0) slots.header = <>{headerNodes}</>;
  if (bodyNodes.length > 0) slots.body = <>{bodyNodes}</>;
  if (footerNodes.length > 0) slots.footer = <>{footerNodes}</>;

  if (avatarField) {
    const raw = item[(avatarField.key as keyof T)];
    const name = avatarField.initialsFrom ? String(item[avatarField.initialsFrom] ?? "") : String(raw ?? "");
    const src = typeof raw === "string" ? raw : undefined;
    slots.media = { kind: "avatar", name, src };
  }

  if (barcodeField) {
    const raw = item[(barcodeField.key as keyof T)];
    if (raw != null && String(raw).trim() !== "" && String(raw).trim() !== "—") {
      flatNodes.push(
        <div key="barcode" className="mt-2.5 pt-2 border-t border-border/30 flex justify-center w-full">
          {renderField(barcodeField, raw, item, index)}
        </div>
      );
    }
  }

  void options.getState;
  return { nodes: flatNodes, slots };
}

// ─────────────────────────────────────────────────────────────────
// Util: estado global del item a partir de cualquier campo "status"
// ─────────────────────────────────────────────────────────────────
export function deriveItemState<T extends Record<string, unknown>>(
  fields: FieldDef<T>[],
  item: T
): ItemState {
  // Prioridad: status-dot field > badge field con valor "1"/"0" > estado_X
  for (const f of fields) {
    if (f.semantic === "status-dot" || f.semantic === "badge") {
      const raw = item[f.key as keyof T];
      const s = inferState(raw, "status");
      if (s !== "neutral") return s;
    }
    const k = String(f.key).toLowerCase();
    if (k.startsWith("estado") || k.endsWith("estado")) {
      const raw = item[f.key as keyof T];
      const s = inferState(raw, "status");
      if (s !== "neutral") return s;
    }
  }
  return "neutral";
}
