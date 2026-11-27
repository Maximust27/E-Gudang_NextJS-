import { requirePermission } from "@/lib/auth/access"
import { routePermissions, type WarehouseRoute } from "@/lib/permissions"
import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Temporary placeholder only. Real feature pages must authorize their own data access.
export async function FeaturePlaceholder({ title, description, route }: {
  title: string
  description: string
  route: WarehouseRoute
}) {
  await requirePermission(routePermissions[route])

  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader><CardTitle>Dalam pengembangan</CardTitle></CardHeader>
        <CardContent>
          <p className="type-body text-muted-foreground">
            Layout halaman sudah tersedia. Fitur ini akan diimplementasikan pada fase berikutnya.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
