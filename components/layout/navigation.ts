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
import { can, type Permission, type Role } from "../../lib/permissions.ts"

export type NavigationItem = {
  href: string
  label: string
  icon: LucideIcon
  permission: Permission
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
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/data-barang", label: "Data Barang", icon: Package, permission: "products:view" },
      { href: "/barang-masuk", label: "Barang Masuk", icon: ArrowDownToLine, permission: "inbound:post" },
      { href: "/barang-keluar", label: "Barang Keluar", icon: ArrowUpFromLine, permission: "outbound:post" },
      { href: "/stok-opname", label: "Stok Opname", icon: ClipboardCheck, permission: "opname:count" },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { href: "/laporan", label: "Laporan", icon: ChartColumn, permission: "reports:view" },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, permission: "settings:manage", placement: "footer" },
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
    .map((group) => ({ ...group, items: group.items.filter((item) => can(role, item.permission)) }))
    .filter((group) => group.items.length > 0)
}
