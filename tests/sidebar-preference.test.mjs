import assert from "node:assert/strict"
import { test } from "node:test"
import { parseSidebarPreference, SIDEBAR_COOKIE_MAX_AGE } from "../lib/sidebar-preference.ts"

test("sidebar restores the stored desktop preference", () => {
  assert.equal(parseSidebarPreference("false"), false)
  assert.equal(parseSidebarPreference("true"), true)
})

test("missing or invalid cookie uses the expanded default", () => {
  for (const value of [undefined, "", "invalid", "0", "False"]) {
    assert.equal(parseSidebarPreference(value), true)
  }
  assert.equal(SIDEBAR_COOKIE_MAX_AGE, 7 * 24 * 60 * 60)
})
