import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/Sidebar";

export function TeamSwitcher({ teams, nameClassName = "" }) {
  const { isMobile, state } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const collapsed = state === "collapsed";

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`
                ${collapsed ? "sidebar-icon-btn" : ""}
                data-[state=open]:bg-blue-50/80 data-[state=open]:text-blue-900
                hover:bg-blue-50/60 transition-all duration-150
                px-2 py-2 rounded-xl
                flex items-center gap-3
                shadow-none border border-gray-100
                bg-white/80
              `}
              style={{
                minHeight: collapsed ? "40px" : "48px",
                minWidth: collapsed ? "40px" : 0,
                width: collapsed ? "40px" : undefined,
                boxShadow: "0 1px 4px 0 rgba(59,130,246,0.04)",
              }}
            >
              <div className={`flex aspect-square items-center justify-center rounded-lg shadow-sm border border-blue-100/60 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 ${collapsed ? "size-7" : "size-8"}`}>
                {typeof activeTeam.logo === "string"
                  ? (
                    <img
                      src={activeTeam.logo}
                      alt={activeTeam.name}
                      className="h-7 w-7 object-contain"
                      loading="lazy"
                    />
                  )
                  : (
                    <activeTeam.logo className={collapsed ? "size-4" : "size-5"} />
                  )
                }
              </div>
              {!collapsed && (
                <div className="grid flex-1 text-left text-[15px] leading-tight">
                  <span className={`truncate font-semibold text-blue-900 ${nameClassName}`}>{activeTeam.name}</span>
                  <span className="truncate text-xs text-blue-500">{activeTeam.plan}</span>
                </div>
              )}
              {!collapsed && (
                <ChevronsUpDown className="ml-auto size-4 text-blue-400" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="z-[9999] bg-white/95 text-blue-900 shadow-xl border border-blue-100/60 min-w-56 rounded-xl p-1"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-blue-400 px-2 py-1">Equipos</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className={`
                  gap-2 p-2 rounded-lg transition-colors
                  hover:bg-blue-50/80 focus:bg-blue-100/80
                  text-blue-900
                `}
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-blue-100/60 bg-blue-50/60">
                  {typeof team.logo === "string"
                    ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-5 w-5 object-contain"
                        loading="lazy"
                      />
                    )
                    : (
                      <team.logo className="size-4 shrink-0 text-blue-500" />
                    )
                  }
                </div>
                <span className="flex-1">{team.name}</span>
                <DropdownMenuShortcut className="text-xs text-blue-400">⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 rounded-lg hover:bg-blue-50/80 focus:bg-blue-100/80 text-blue-900">
              <div className="flex size-6 items-center justify-center rounded-md border border-blue-100/60 bg-blue-50/60">
                <Plus className="size-4 text-blue-400" />
              </div>
              <div className="font-medium text-blue-400">Agregar equipo</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}