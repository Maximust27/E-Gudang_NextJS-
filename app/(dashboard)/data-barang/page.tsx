import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Data Barang" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Data Barang" description="Kelola informasi SKU dan inventaris gudang." route="/data-barang" />
    </Suspense>
  )
}
