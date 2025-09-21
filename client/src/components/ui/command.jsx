import React, { useState, useEffect, useRef } from "react";
import { File, Search, X } from "lucide-react";
import { ScrollShadow, Button, Divider } from '@heroui/react';

export function Command({ className = "", children, ...props }) {
  return (
    <div
      className={`command bg-white/95 rounded-2xl border border-blue-100 shadow-2xl p-0 z-[10001] ${className}`}
      style={{ maxWidth: 480, width: "100%" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandInput({ value, onChange, className = "", ...props }) {
  return (
    <div className="relative top-0 z-20 bg-white/95 rounded-t-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
      <input
        className={`w-full pl-10 pr-3 py-3 border-b border-blue-100 outline-none text-base rounded-t-2xl focus:ring-2 focus:ring-blue-100 transition bg-white/95 ${className}`}
        value={value}
        onChange={onChange}
        placeholder="Buscar módulo o sección..."
        autoFocus
        {...props}
      />
    </div>
  );
}

export function CommandList({ className = "", children, ...props }) {
  return (
    <ScrollShadow
      hideScrollBar
      size={30}
      className={`max-h-[340px] bg-white/95 ${className}`}
      {...props}
    >
      <div className="py-2">{children}</div>
    </ScrollShadow>
  );
}

export function CommandEmpty({ children }) {
  return (
    <div className="text-center text-blue-400 py-8 text-base">{children}</div>
  );
}

export function CommandGroup({ heading, children }) {
  return (
    <div className="mb-3">
      {heading && (
        <div className="px-5 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/80 rounded-t">
          {heading}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function CommandItem({ disabled, className = "", children, ...props }) {
  return (
    <Button
      variant="light"
      color="primary"
      className={`flex items-center gap-3 w-full px-5 py-3 text-left rounded-lg transition hover:bg-blue-50/80 focus:bg-blue-100/80 disabled:opacity-50 text-blue-900 font-medium ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

export function CommandSeparator() {
  return <Divider className="my-3 border-blue-100" />;
}

export function CommandShortcut({ children }) {
  return <span className="ml-auto text-xs text-blue-400">{children}</span>;
}

function CommandDemo({ routes, onClose }) {
  const [search, setSearch] = useState("");
  const modalRef = useRef(null);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target)
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Compensar sidebar (usa la variable CSS del layout)
  const sidebarWidth = getComputedStyle(document.documentElement)
    .getPropertyValue("--sidebar-width") || "184px";

  const allLinks = [];
  if (routes?.length) {
    routes.forEach((module) => {
      if (module?.ruta) {
        allLinks.push({
          name: module.nombre,
          path: module.ruta.startsWith("/") ? module.ruta : "/" + module.ruta,
        });
      }
    });
  }

  function normalize(str) {
    return str
      ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";
  }

  const filteredLinks = allLinks.filter((link) =>
    normalize(link.name).includes(normalize(search))
  );

  const shortcuts = [
    { label: "Ir a Dashboard", action: () => (window.location.href = "/inicio"), key: "D" },
    { label: "Ir a Ventas", action: () => (window.location.href = "/ventas"), key: "V" },
    { label: "Ir a Productos", action: () => (window.location.href = "/productos"), key: "P" },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center"
      style={{
        background: "rgba(255,255,255,0.60)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        paddingLeft: sidebarWidth.trim(),
        transition: "background 0.2s"
      }}
      onClick={onClose}
    >
      <div
        className="mt-24 md:mt-32 w-full max-w-lg px-2 md:px-0"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <Command className="relative shadow-2xl border-blue-100">
          <CommandInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CommandList>
            {filteredLinks.length === 0 ? (
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            ) : (
              <CommandGroup heading="Accesos rápidos">
                {filteredLinks.map((link) => (
                  <CommandItem
                    key={link.path}
                    onClick={() => (window.location.href = link.path)}
                  >
                    <File className="w-5 h-5 text-blue-400" />
                    <span>{link.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Atajos">
              {shortcuts.map((s) => (
                <CommandItem key={s.key} onClick={s.action}>
                  <span>{s.label}</span>
                  <CommandShortcut>{s.key}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex justify-end px-5 pb-4 pt-2">
            <Button
              color="default"
              variant="flat"
              onClick={e => { e.stopPropagation(); onClose(); }}
              className="rounded-lg"
            >
              Cerrar
            </Button>
          </div>
        </Command>
      </div>
    </div>
  );
}

export default CommandDemo;