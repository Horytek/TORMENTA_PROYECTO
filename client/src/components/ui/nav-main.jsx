import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/Sidebar"

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {/* Ícono e información del ítem */}
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    {item.url ? (
                      <Link
                        to={item.url}
                        className="flex-1 text-left"
                        onClick={(e) => e.stopPropagation()} // evita que el colapsable se active
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="flex-1 text-left">{item.title}</span>
                    )}

                    {/* Chevron para expandir, dentro del botón */}
                    <ChevronRight
                      onClick={(e) => {
                        e.preventDefault(); // evita navegación
                        e.stopPropagation(); // evita que se active el link
                        const trigger = e.currentTarget.closest('[data-state]');
                        if (trigger) {
                          trigger.click(); // simula clic para colapsar/expandir
                        }
                      }}
                      className="h-4 w-4 ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link to={item.url} className="flex items-center w-full">
                  {item.icon && <item.icon className="mr-2" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
