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

type NavigationItem = {
  href: string
  label: string
  icon: LucideIcon
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

// Single source for sidebar, breadcrumb and menu search.
// Role filtering will be added when real authentication is implemented.
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
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
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
