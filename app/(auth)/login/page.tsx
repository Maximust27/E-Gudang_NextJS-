import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Warehouse } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/access"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ThemeSwitcher } from "@/components/layout/theme-switcher"

export const metadata: Metadata = { title: "Login" }

async function LoginContent() {
  if (await getCurrentUser()) redirect("/dashboard")

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-control items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Warehouse className="size-icon-large" aria-hidden="true" />
            </span>
            <span className="type-card-title">E-Gudang</span>
          </div>
          <ThemeSwitcher />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="type-page-title">Masuk ke akun</h1>
          <p className="type-body text-muted-foreground">Masukkan email dan password untuk mengakses sistem gudang.</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm />
        <p className="type-caption text-muted-foreground">Akun dikelola oleh Admin. Hubungi Admin jika mengalami masalah akses.</p>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="type-caption text-center text-muted-foreground">Memuat...</p>}>
      <LoginContent />
    </Suspense>
  )
}
