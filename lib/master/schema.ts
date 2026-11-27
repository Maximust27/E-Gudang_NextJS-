import { z } from "zod"
import { emailSchema, newUserSchema } from "../auth/credentials.ts"

export const masterKinds = ["category", "supplier", "location", "user", "product", "general"] as const
export type MasterKind = (typeof masterKinds)[number]
const maxInt = 2147483647
const text = (length: number) => z.string().trim().min(1, "Wajib diisi.").max(length)
const numberText = z.string().regex(/^\d+$/, "Masukkan bilangan bulat.").transform(Number).pipe(z.number().int().min(0).max(maxInt))
const positiveText = numberText.pipe(z.number().positive())
const status = z.enum(["active", "inactive"]).transform((value) => value === "active")
const method = z.enum(["FIFO", "FEFO"])
const identity = {
  id: z.number().int().positive().max(maxInt).nullable(),
  updatedAt: z.iso.datetime().nullable(),
}
const base = { ...identity, isActive: status }

const category = z.object({ kind: z.literal("category"), ...base, name: text(120), defaultMethod: method })
const supplier = z.object({ kind: z.literal("supplier"), ...base, name: text(180), code: z.string().trim().max(64).transform((value) => value || null) })
const location = z.object({ kind: z.literal("location"), ...base, name: text(120), code: text(64) })
const product = z.object({
  kind: z.literal("product"), ...base,
  sku: text(64),
  name: text(180),
  cartonBarcode: text(128).refine((value) => !/^LOT-/i.test(value), "Prefix LOT- khusus barcode batch."),
  categoryId: positiveText,
  methodOverride: z.enum(["DEFAULT", "FIFO", "FEFO"]).transform((value) => value === "DEFAULT" ? null : value),
  piecesPerCarton: z.union([z.literal("").transform(() => null), positiveText]),
  minStock: numberText,
})
const user = z.object({
  kind: z.literal("user"), ...base,
  email: emailSchema,
  name: newUserSchema.shape.name,
  role: newUserSchema.shape.role,
  password: z.union([z.literal(""), newUserSchema.shape.password]),
})
const general = z.object({
  kind: z.literal("general"),
  nearExpiryDays: positiveText,
  deadStockDays: positiveText,
  nearVersion: z.iso.datetime().nullable(),
  deadVersion: z.iso.datetime().nullable(),
})
export const masterSchema = z.discriminatedUnion("kind", [category, supplier, location, product, user, general]).superRefine((data, ctx) => {
  if (data.kind === "general") return
  if ((data.id === null) !== (data.updatedAt === null)) {
    ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "Data sudah berubah. Muat ulang halaman." })
  }
  if (data.kind === "user" && data.id === null && !data.password) {
    ctx.addIssue({ code: "custom", path: ["password"], message: "Password wajib untuk pengguna baru." })
  }
})
export type MasterCommand = z.output<typeof masterSchema>

export function effectiveMethod(defaultMethod: "FIFO" | "FEFO", override: "FIFO" | "FEFO" | null) {
  return override ?? defaultMethod
}

export function businessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value)
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")))
}

export const settingKeys = { nearExpiryDays: "near_expiry_days", deadStockDays: "dead_stock_days" } as const
