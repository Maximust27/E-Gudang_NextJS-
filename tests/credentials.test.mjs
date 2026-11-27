import assert from "node:assert/strict"
import { test } from "node:test"
import { credentialsSchema, newUserSchema } from "../lib/auth/credentials.ts"
import { hash, compare } from "bcryptjs"

test("credentials normalize email but preserve the password exactly", () => {
  assert.deepEqual(credentialsSchema.parse({ email: "  ADMIN@EXAMPLE.COM  ", password: " pass " }), { email: "admin@example.com", password: " pass " })
  for (const password of ["", "a".repeat(73), "😀".repeat(19)]) {
    assert.equal(credentialsSchema.safeParse({ email: "a@example.com", password }).success, false)
  }
})

test("new accounts require a strong-length password and a valid role", () => {
  const data = { email: "a@example.com", name: "Admin", role: "ADMIN", password: "a-long-passphrase" }
  assert.equal(newUserSchema.safeParse(data).success, true)
  assert.equal(newUserSchema.safeParse({ ...data, password: "short" }).success, false)
  assert.equal(newUserSchema.safeParse({ ...data, role: "OWNER" }).success, false)
})

test("bcrypt hashes and verifies without silently truncating validated passwords", async () => {
  const password = "a-long-passphrase"
  const encoded = await hash(password, 12)
  assert.notEqual(encoded, password)
  assert.equal(await compare(password, encoded), true)
  assert.equal(await compare(password + "!", encoded), false)
})
