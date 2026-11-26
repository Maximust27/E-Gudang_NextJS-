"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Warehouse, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getActiveNavigationItem, navigationGroups } from "./navigation"

export function AppSidebar() {
  const pathname = usePathname()
  const activeItem = getActiveNavigationItem(pathname)
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileMenu() {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" aria-label="Navigasi E-Gudang">
      <SidebarHeader className="h-app-header shrink-0 flex-row items-center justify-between gap-2 border-b border-sidebar-border px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          aria-label="E-Gudang — Dashboard"
          onClick={closeMobileMenu}
          className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
        >
          <span className="flex size-control shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Warehouse className="size-icon-large" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="type-card-title">E-Gudang</span>
            <span className="type-caption text-sidebar-foreground/80">Manajemen gudang</span>
          </span>
        </Link>

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Tutup navigasi"
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring"
            onClick={() => setOpenMobile(false)}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-2 py-2">
        <nav aria-label="Menu utama" className="flex flex-col gap-2">
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const active = activeItem?.href === item.href
                    const Icon = item.icon

                    return (
                      <SidebarMenuItem
                        key={item.href}
                        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                      >
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            aria-current={active ? "page" : undefined}
                            onClick={closeMobileMenu}
                          >
                            <Icon aria-hidden="true" />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:hidden">
        <p className="type-caption text-sidebar-foreground/80">Mode pengembangan</p>
      </SidebarFooter>
    </Sidebar>
  )
}
