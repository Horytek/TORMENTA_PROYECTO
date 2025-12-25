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

  // Sincroniza el equipo activo cuando cambian los teams (por ejemplo, tras carga asíncrona)
  React.useEffect(() => {
    if (teams.length > 0) {
      setActiveTeam(teams[0]);
    }
  }, [teams]);

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
                data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-zinc-800
                hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all duration-200
                px-2 py-2 rounded-xl
                flex items-center gap-3
                shadow-sm border border-slate-200 dark:border-zinc-800
                bg-white dark:bg-zinc-900
              `}
              style={{
                minHeight: collapsed ? "40px" : "48px",
                minWidth: collapsed ? "40px" : 0,
                width: collapsed ? "40px" : undefined,
                boxShadow: "none",
              }}
            >
              <div className={`flex aspect-square items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ${collapsed ? "size-7" : "size-8"}`}>
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
                <div className="grid flex-1 text-left text-[14px] leading-tight">
                  <span className={`truncate font-bold text-slate-800 dark:text-white ${nameClassName}`}>{activeTeam.name}</span>
                  <span className="truncate text-xs font-medium text-slate-500">{activeTeam.plan}</span>
                </div>
              )}
              {!collapsed && (
                <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="z-[9999] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl min-w-56 rounded-xl p-2"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1.5">Equipos</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className={`
                  gap-3 p-2 rounded-lg transition-colors cursor-pointer
                  hover:bg-slate-50 dark:hover:bg-zinc-800
                  text-slate-700 dark:text-slate-300
                `}
              >
                <div className="flex size-8 items-center justify-center rounded-lg border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
                      <team.logo className="size-4 shrink-0 text-slate-500" />
                    )
                  }
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{team.name}</span>
                  <span className="text-[10px] text-slate-400">{team.plan}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800 my-1" />
            <DropdownMenuItem className="gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-600 dark:text-slate-400">
              <div className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-sm">Agregar equipo</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}