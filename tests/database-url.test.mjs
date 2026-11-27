import assert from "node:assert/strict"
import { test } from "node:test"
import { parseDatabaseUrl } from "../lib/db-client.ts"

test("MariaDB connection uses the CLI URL, decoded credentials and UTC", () => {
  assert.deepEqual(parseDatabaseUrl("mysql://user:p%40ss@localhost:3307/e_gudang_test"), {
    host: "localhost",
    port: 3307,
    user: "user",
    password: "p@ss",
    database: "e_gudang_test",
    timezone: "+00:00",
    connectionLimit: 5,
  })
  assert.equal(parseDatabaseUrl("mysql://root@localhost/e_gudang").port, 3306)
})

test("missing or unsupported database configuration fails explicitly", () => {
  for (const url of [
    undefined,
    "postgresql://user:pass@localhost/db",
    "mysql://localhost/db",
    "mysql://user@localhost/",
    "mysql://user@localhost/db?ssl=true",
    "mysql://user@localhost/db/other",
  ]) {
    assert.throws(() => parseDatabaseUrl(url))
  }
})
