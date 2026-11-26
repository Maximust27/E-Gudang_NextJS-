import type { Metadata } from "next"

import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Stok Opname" }

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Stok Opname" description="Hitung dan cocokkan stok fisik dengan catatan sistem." />
      <Card>
        <CardHeader>
          <CardTitle>Dalam pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="type-body text-muted-foreground">
            Layout halaman sudah tersedia. Fitur ini akan diimplementasikan pada fase berikutnya.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
