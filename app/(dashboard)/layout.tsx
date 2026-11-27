import { Suspense, type ReactNode } from "react"
import { cookies } from "next/headers"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUser } from "@/lib/auth/access"
import { parseSidebarPreference, SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-preference"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  )
}

function DashboardShellFallback() {
  // Never render an expanded sidebar while the request preference is unknown.
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center" role="status">
      <span className="type-caption text-muted-foreground">Memuat aplikasi...</span>
    </div>
  )
}

async function DashboardShell({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const cookieStore = await cookies()
  const defaultOpen = parseSidebarPreference(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Lewati ke konten utama
      </a>
      <AppSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <SidebarInset id="main-content" tabIndex={-1} className="scroll-mt-app-header">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
