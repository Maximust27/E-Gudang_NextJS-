import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Barang Masuk" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Barang Masuk" description="Catat penerimaan barang dan batch." route="/barang-masuk" />
    </Suspense>
  )
}
