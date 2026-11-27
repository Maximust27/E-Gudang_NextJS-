"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth/access"
import { getPrisma } from "@/lib/prisma"
import { commitProductImport, previewProductImport } from "./import-service"
import { MasterError } from "./service"
import type { ImportPreview } from "./import-schema"

type Result<T> = { ok: true; data: T } | { ok: false; message: string }
function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof MasterError) return { ok: false, message: error.message }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    return { ok: false, message: "SKU atau barcode sudah digunakan. Seluruh import dibatalkan; periksa ulang preview." }
  }
  return { ok: false, message: "Import belum berhasil. Tidak ada perubahan sebagian; periksa ulang sebelum mencoba lagi." }
}

export async function previewImportAction(input: unknown): Promise<Result<ImportPreview>> {
  await requirePermission("products:import")
  try {
    return { ok: true, data: await previewProductImport(getPrisma(), input) }
  } catch (error) {
    return failure(error)
  }
}

export async function commitImportAction(input: unknown, fingerprint: string): Promise<Result<number>> {
  const actor = await requirePermission("products:import")
  try {
    const count = await commitProductImport(getPrisma(), actor.id, input, fingerprint)
    revalidatePath("/data-barang")
    revalidatePath("/pengaturan")
    return { ok: true, data: count }
  } catch (error) {
    return failure(error)
  }
}
