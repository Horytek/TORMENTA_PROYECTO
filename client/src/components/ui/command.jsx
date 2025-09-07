import React, { useState } from "react";
import { File, Search } from "lucide-react";
import { ScrollShadow } from '@heroui/react';

export function Command({ className = "", children, ...props }) {
  return (
    <div
      className={`command bg-white rounded-xl border border-gray-200 shadow-2xl p-0 z-50 ${className}`}
      style={{ maxWidth: 480, width: "100%" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandInput({ value, onChange, className = "", ...props }) {
  return (
    <div className="relative sticky top-0 z-20 bg-white rounded-t-xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        className={`w-full pl-10 pr-3 py-3 border-b border-gray-100 outline-none text-base rounded-t-xl focus:ring-2 focus:ring-blue-100 transition ${className}`}
        value={value}
        onChange={onChange}
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
      className={`max-h-[340px] ${className}`}
      {...props}
    >
      <div className="py-2">{children}</div>
    </ScrollShadow>
  );
}

export function CommandEmpty({ children }) {
  return (
    <div className="text-center text-gray-400 py-8 text-lg">{children}</div>
  );
}

export function CommandGroup({ heading, children }) {
  return (
    <div className="mb-3">
      {heading && (
        <div className="px-5 py-1 text-xs font-bold text-blue-500 uppercase tracking-wider bg-blue-50 rounded-t">
          {heading}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function CommandItem({ disabled, className = "", children, ...props }) {
  return (
    <button
      className={`flex items-center gap-3 w-full px-5 py-3 text-left rounded-lg transition hover:bg-blue-50 focus:bg-blue-100 disabled:opacity-50 text-gray-700 font-medium ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function CommandSeparator() {
  return <hr className="my-3 border-gray-200" />;
}

export function CommandShortcut({ children }) {
  return <span className="ml-auto text-xs text-gray-400">{children}</span>;
}

function CommandDemo({ routes }) {
  const [search, setSearch] = useState("");

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

  return (
<div className="relative z-[999] flex justify-center items-start w-full">
  <Command className="relative md:min-w-[400px] max-w-full z-[999]">
    <CommandInput
      placeholder="Buscar módulo o sección..."
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
    </CommandList>
  </Command>
</div>

  );
}

export default CommandDemo;
