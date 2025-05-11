import React, { createContext, useContext } from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

const CommandContext = createContext()

export function Command({ className = "", children, ...props }) {
  return (
    <div className={`command ${className}`} {...props}>
      <CommandContext.Provider value={{}}>
        {children}
      </CommandContext.Provider>
    </div>
  )
}

export function CommandInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 border-b outline-none ${className}`}
      {...props}
    />
  )
}

export function CommandList({ className = "", children, ...props }) {
  return (
    <div className={`py-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CommandEmpty({ children }) {
  return (
    <div className="text-center text-gray-400 py-4">{children}</div>
  )
}

export function CommandGroup({ heading, children }) {
  return (
    <div className="mb-2">
      {heading && <div className="px-3 py-1 text-xs font-semibold text-gray-500">{heading}</div>}
      <div>{children}</div>
    </div>
  )
}

export function CommandItem({ disabled, className = "", children, ...props }) {
  return (
    <button
      className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded hover:bg-gray-100 disabled:opacity-50 ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function CommandSeparator() {
  return <hr className="my-2 border-gray-200" />
}

export function CommandShortcut({ children }) {
  return (
    <span className="ml-auto text-xs text-gray-400">{children}</span>
  )
}

function CommandDemo() {
  return (
    <Command className="rounded-lg border shadow-md md:min-w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Links">
          <CommandItem>
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem disabled>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export default CommandDemo
