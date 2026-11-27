"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth/access"
import { getPrisma } from "@/lib/prisma"
import { masterSchema } from "./schema"
import { MasterError, saveMaster } from "./service"

export async function saveMasterAction(input: unknown): Promise<{ ok: boolean; message: string }> {
  const parsed = masterSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid." }
  const kind = parsed.data.kind
  const actor = await requirePermission(kind === "product" ? "products:manage" : kind === "user" ? "users:manage" : "settings:manage")
  try {
    await saveMaster(getPrisma(), actor.id, input)
  } catch (error) {
    if (error instanceof MasterError) return { ok: false, message: error.message }
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2002") return { ok: false, message: "Kode, SKU, barcode, nama kategori atau email sudah digunakan." }
      if (error.code === "P2034") return { ok: false, message: "Data sedang diubah. Muat ulang lalu coba lagi." }
    }
    return { ok: false, message: "Data belum disimpan. Periksa koneksi lalu coba lagi." }
  }
  revalidatePath("/data-barang")
  revalidatePath("/data-barang/[id]", "page")
  revalidatePath("/pengaturan")
  return { ok: true, message: "Data berhasil disimpan." }
}
