import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Laporan" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Laporan" description="Tinjau riwayat dan ringkasan pergerakan stok." route="/laporan" />
    </Suspense>
  )
}
