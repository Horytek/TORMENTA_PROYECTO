import React, { createContext, useContext } from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
} from "lucide-react"
import { Input } from "@heroui/react"
import { ScrollShadow } from "@heroui/react"; // Asegúrate de importar ScrollShadow


const CommandContext = createContext()

export function Command({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden ${className}`}
      {...props}
    >
      <CommandContext.Provider value={{}}>
        {children}
      </CommandContext.Provider>
    </div>
  )
}

// 👇 Aquí usamos Input de NextUI con ícono
export function CommandInput({ className = "", ...props }) {
  return (
    <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-transparent">
      <Input
        isClearable
        radius="full"
        size="lg"
        placeholder="Buscar comandos o elementos..."
        startContent={<Search className="text-default-400 h-5 w-5" />}
        classNames={{
          input: "text-base text-zinc-700 dark:text-zinc-200",
          innerWrapper: "bg-transparent",
          inputWrapper:
            "bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-full px-4 py-2",
        }}
        {...props}
      />
    </div>
  )
}

export function CommandList({ className = "", children, ...props }) {
  return (
    <ScrollShadow
      hideScrollBar
      className={`py-3 max-h-[350px] overflow-y-auto rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {children}
    </ScrollShadow>
  );
}

export function CommandEmpty({ children }) {
  return (
    <div className="text-center text-zinc-400 py-6 text-base">{children}</div>
  )
}

export function CommandGroup({ heading, children }) {
  return (
    <div className="mb-4">
      {heading && (
        <div className="px-5 py-2 text-sm font-bold text-zinc-500 uppercase tracking-wide">
          {heading}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export function CommandItem({ disabled, className = "", children, ...props }) {
  return (
    <button
      className={`flex items-center gap-3 w-full px-5 py-3 text-base text-left rounded-xl transition-colors ${
        disabled
          ? "text-zinc-400 cursor-not-allowed"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function CommandSeparator() {
  return <hr className="my-3 border-t border-zinc-200 dark:border-zinc-700" />
}

export function CommandShortcut({ children }) {
  return (
    <span className="ml-auto text-sm text-zinc-400">{children}</span>
  )
}

function CommandDemo() {
  return (
    <Command className="w-full max-w-xl mx-auto mt-12">
      <CommandInput />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        <CommandGroup heading="Enlaces">
          <CommandItem>
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Calendario</span>
          </CommandItem>
          <CommandItem>
            <Smile className="h-5 w-5 text-yellow-500" />
            <span>Buscar Emoji</span>
          </CommandItem>
          <CommandItem disabled>
            <Calculator className="h-5 w-5" />
            <span>Calculadora</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Configuración">
          <CommandItem>
            <User className="h-5 w-5 text-purple-500" />
            <span>Perfil</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="h-5 w-5 text-green-500" />
            <span>Facturación</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="h-5 w-5 text-gray-500" />
            <span>Ajustes</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export default CommandDemo
