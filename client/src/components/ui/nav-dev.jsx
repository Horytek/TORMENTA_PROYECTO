import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

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

export function NavDesarrollador({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Desarrollador</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon className="mr-2" />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto" />
              </SidebarMenuButton>
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
            </SidebarMenuItem>
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
