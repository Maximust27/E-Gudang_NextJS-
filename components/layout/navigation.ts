import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartColumn,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { can, routePermissions, type WarehouseRoute, type Role } from "../../lib/permissions.ts"

export type NavigationItem = {
  href: WarehouseRoute
  label: string
  icon: LucideIcon
  placement?: "footer"
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

// Single source for sidebar, breadcrumb and menu search.
// Permissions are shared with the secure server-side access checks.
export const navigationGroups: NavigationGroup[] = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/data-barang", label: "Data Barang", icon: Package },
      { href: "/barang-masuk", label: "Barang Masuk", icon: ArrowDownToLine },
      { href: "/barang-keluar", label: "Barang Keluar", icon: ArrowUpFromLine },
      { href: "/stok-opname", label: "Stok Opname", icon: ClipboardCheck },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { href: "/laporan", label: "Laporan", icon: ChartColumn },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, placement: "footer" },
    ],
  },
]

export const navigationItems = navigationGroups.flatMap((group) => group.items)

export function getActiveNavigationItem(pathname: string | null) {
  if (!pathname) return undefined

  return navigationItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )
}

export function getVisibleNavigationGroups(role: Role) {
  return navigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => can(role, routePermissions[item.href])) }))
    .filter((group) => group.items.length > 0)
}
