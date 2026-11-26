"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Settings, UserRound } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getActiveNavigationItem } from "./navigation"
import { MenuSearch } from "./menu-search"
import { ThemeSwitcher } from "./theme-switcher"

export function AppHeader() {
  const pathname = usePathname()
  const activeItem = getActiveNavigationItem(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-app-header shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger id="app-sidebar-trigger" type="button" />
        <Breadcrumb aria-label="Lokasi halaman" className="hidden min-w-0 sm:block">
          <BreadcrumbList className="flex-nowrap gap-2">
            <BreadcrumbItem className="hidden shrink-0 lg:inline-flex">
              E-Gudang
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate type-label">
                {activeItem?.label ?? "Halaman"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <MenuSearch />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Notifikasi">
              <Bell className="size-icon-standard" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
            <p className="type-card-title">Notifikasi</p>
            <p className="type-body text-muted-foreground">
              Peringatan stok dan kedaluwarsa belum terhubung. Fitur ini akan tersedia pada tahap inventaris.
            </p>
          </PopoverContent>
        </Popover>
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Menu akun">
              <Avatar>
                <AvatarFallback><UserRound className="size-icon-inline" aria-hidden="true" /></AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block type-label text-foreground">Mode pengembangan</span>
              <span className="block type-caption text-muted-foreground">Autentikasi belum aktif</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/pengaturan"><Settings aria-hidden="true" /> Pengaturan</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled><UserRound aria-hidden="true" /> Akun belum tersedia</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
