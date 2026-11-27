import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Pengaturan" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Pengaturan" description="Kelola konfigurasi dan data master gudang." route="/pengaturan" />
    </Suspense>
  )
}
