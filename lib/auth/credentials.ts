import { z } from "zod"

export const passwordCost = 12

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())
export const passwordSchema = z.string().min(1).refine(
  (value) => new TextEncoder().encode(value).length <= 72,
  "Password maksimal 72 byte UTF-8."
)

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const newUserSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(120),
  role: z.enum(["ADMIN", "OPERATOR"]),
  password: passwordSchema.refine((value) => [...value].length >= 15, "Password minimal 15 karakter."),
})
