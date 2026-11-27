import assert from "node:assert/strict"
import { test } from "node:test"
import { can } from "../lib/permissions.ts"

test("both roles can perform normal warehouse operations", () => {
  for (const role of ["ADMIN", "OPERATOR"]) {
    for (const permission of ["dashboard:view", "products:view", "inbound:post", "outbound:post", "opname:count", "reports:view"]) {
      assert.equal(can(role, permission), true)
    }
  }
})

test("only Admin can manage, approve, export, reverse or adjust", () => {
  for (const permission of ["products:manage", "products:import", "opname:approve", "inventory:adjust", "transactions:reverse", "reports:export", "settings:manage", "users:manage", "audit:view"]) {
    assert.equal(can("ADMIN", permission), true)
    assert.equal(can("OPERATOR", permission), false)
  }
  assert.equal(can("UNKNOWN", "dashboard:view"), false)
  assert.equal(can("ADMIN", "unknown"), false)
})
