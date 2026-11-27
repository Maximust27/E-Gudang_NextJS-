import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Dashboard" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Dashboard" description="Ringkasan operasional gudang." permission="dashboard:view" />
    </Suspense>
  )
}
