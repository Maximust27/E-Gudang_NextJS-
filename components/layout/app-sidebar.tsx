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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  getActiveNavigationItem,
  navigationItems,
  type NavigationItem,
} from "./navigation"

function NavigationLink({
  item,
  active,
  onNavigate,
}: {
  item: NavigationItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className="data-[active=true]:font-semibold"
      >
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
        >
          <Icon aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const activeItem = getActiveNavigationItem(pathname)
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileMenu() {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar
      collapsible="icon"
      aria-label="Navigasi E-Gudang"
      mobileCloseAutoFocus={(event) => {
        const trigger = document.getElementById("app-sidebar-trigger")
        if (trigger) {
          event.preventDefault()
          trigger.focus()
        }
      }}
    >
      <SidebarHeader className="h-app-header shrink-0 flex-row items-center justify-between gap-2 border-b border-sidebar-border px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          aria-label="E-Gudang — Dashboard"
          onClick={closeMobileMenu}
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
        >
          <span className="flex size-control pointer-coarse:size-control-touch shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Warehouse className="size-icon-large" aria-hidden="true" />
          </span>
          <span className="truncate type-card-title group-data-[collapsible=icon]:hidden">
            E-Gudang
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

      <SidebarContent className="py-2">
        <nav aria-label="Menu utama">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navigationItems.filter((item) => item.placement !== "footer").map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    active={activeItem?.href === item.href}
                    onNavigate={closeMobileMenu}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <nav aria-label="Administrasi">
          <SidebarMenu className="gap-1">
            {navigationItems.filter((item) => item.placement === "footer").map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={activeItem?.href === item.href}
                onNavigate={closeMobileMenu}
              />
            ))}
          </SidebarMenu>
        </nav>
        <p className="px-2 py-1 type-caption text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
          Mode pengembangan
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
