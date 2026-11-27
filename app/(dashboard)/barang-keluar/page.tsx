import type { Metadata } from "next"
import { Suspense } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"

export const metadata: Metadata = { title: "Barang Keluar" }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FeaturePlaceholder title="Barang Keluar" description="Kelola pengeluaran barang berdasarkan FIFO dan FEFO." route="/barang-keluar" />
    </Suspense>
  )
}
