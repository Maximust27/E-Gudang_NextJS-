import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Stok Opname" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Stok Opname" description="Hitung dan cocokkan stok fisik dengan catatan sistem." route="/stok-opname" />
    </Suspense>
  )
}
