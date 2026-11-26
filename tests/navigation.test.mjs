import assert from "node:assert/strict"
import { test } from "node:test"
import { getActiveNavigationItem, navigationGroups, navigationItems } from "../components/layout/navigation.ts"

const routes = [
  "/dashboard",
  "/data-barang",
  "/barang-masuk",
  "/barang-keluar",
  "/stok-opname",
  "/laporan",
  "/pengaturan",
]

test("navigation contains exactly the seven PRD routes without duplicates", () => {
  assert.deepEqual(navigationItems.map((item) => item.href), routes)
  assert.equal(new Set(navigationItems.map((item) => item.href)).size, routes.length)
  assert.deepEqual(navigationGroups.flatMap((group) => group.items), navigationItems)
  assert.deepEqual(navigationItems.filter((item) => item.placement === "footer").map((item) => item.href), ["/pengaturan"])
})

test("exact and nested routes resolve to the same navigation item", () => {
  for (const href of routes) {
    assert.equal(getActiveNavigationItem(href)?.href, href)
    assert.equal(getActiveNavigationItem(href + "/detail")?.href, href)
  }
})

test("unknown and lookalike paths do not activate a menu", () => {
  for (const path of [null, "", "/", "/login", "/dashboard-old", "/data-barang-lama", "/pengaturan2"]) {
    assert.equal(getActiveNavigationItem(path), undefined)
  }
})
