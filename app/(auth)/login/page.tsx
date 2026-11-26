import type { Metadata } from "next"
import Link from "next/link"
import { Warehouse } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = { title: "Login" }

export default function Page() {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-control items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Warehouse className="size-icon-large" aria-hidden="true" />
          </span>
          <span className="type-card-title">E-Gudang</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="type-page-title">Login</h1>
          <p className="type-body text-muted-foreground">
            Autentikasi belum diimplementasikan. Halaman ini hanya menyiapkan layout login.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Kembali ke dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
