import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import type { Mode } from "../data/landing.data";

const STORAGE_KEY = "horytek-landing-product";

const PRODUCT_IDS = new Set(HORYTEK_PRODUCTS.map((p) => p.id));

function modeToProductId(mode: string | null): string | null {
  if (mode === "pocket") return "pocket";
  if (mode === "ecommerce") return "ecommerce";
  if (mode === "standard" || mode === "erp") return "erp";
  return null;
}

function productIdToLegacyMode(productId: string): Mode | null {
  if (productId === "erp") return "standard";
  if (productId === "pocket") return "pocket";
  if (productId === "ecommerce") return "ecommerce";
  return null;
}

function readStored(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && PRODUCT_IDS.has(stored)) return stored;
    // Migrar clave antigua de mode
    const old = sessionStorage.getItem("horytek-landing-mode");
    const mapped = modeToProductId(old);
    if (mapped) return mapped;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Producto activo de la landing (`?product=` + compat `?mode=`).
 */
export function useLandingProduct() {
  const [search, setSearch] = useSearchParams();

  const productId = useMemo(() => {
    const fromProduct = search.get("product");
    if (fromProduct && PRODUCT_IDS.has(fromProduct)) return fromProduct;
    const fromMode = modeToProductId(search.get("mode"));
    if (fromMode) return fromMode;
    return readStored() ?? "erp";
  }, [search]);

  const setProductId = useCallback(
    (next: string) => {
      if (!PRODUCT_IDS.has(next)) return;
      try {
        sessionStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      const updated = new URLSearchParams(search);
      updated.delete("mode");
      if (next === "erp") {
        updated.delete("product");
      } else {
        updated.set("product", next);
      }
      // Compat: mantener mode para Pocket/Ecommerce (deep links viejos / Pricing legacy)
      if (next === "pocket") updated.set("mode", "pocket");
      if (next === "ecommerce") updated.set("mode", "ecommerce");
      setSearch(updated, { replace: true });
    },
    [search, setSearch],
  );

  const legacyMode = productIdToLegacyMode(productId);
  const isLegacy = legacyMode != null;

  return {
    productId,
    setProductId,
    legacyMode: legacyMode ?? ("standard" as Mode),
    isLegacy,
  };
}

/** Bridge para componentes que aún esperan Mode + setMode. */
export function useMode() {
  const { productId, setProductId, legacyMode, isLegacy } = useLandingProduct();
  const setMode = useCallback(
    (next: Mode) => {
      if (next === "standard") setProductId("erp");
      else if (next === "pocket") setProductId("pocket");
      else setProductId("ecommerce");
    },
    [setProductId],
  );
  return {
    mode: isLegacy ? legacyMode : ("standard" as Mode),
    setMode,
    productId,
    setProductId,
    isLegacy,
    toggle: () => {
      const order: Mode[] = ["standard", "pocket", "ecommerce"];
      const i = order.indexOf(isLegacy ? legacyMode : "standard");
      setMode(order[(i + 1) % order.length]);
    },
  };
}
