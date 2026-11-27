export type SearchParams = Record<string, string | string[] | undefined>
export const pageSize = 20

const scalar = (value: SearchParams[string]) => typeof value === "string" ? value : ""
export function positiveId(value: string) {
  if (!/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null
}

export const settingsTabs = [
  { key: "category", label: "Kategori" },
  { key: "supplier", label: "Supplier" },
  { key: "location", label: "Lokasi Rak" },
  { key: "user", label: "Pengguna" },
  { key: "general", label: "Umum" },
  { key: "audit", label: "Audit Log" },
] as const
export type SettingsTab = (typeof settingsTabs)[number]["key"]

export type ListQuery = {
  q: string
  status: "all" | "active" | "inactive"
  method: "all" | "FIFO" | "FEFO"
  categoryId: number | null
  sort: "name-asc" | "name-desc" | "code-asc" | "newest"
  page: number
  tab: SettingsTab
}

export function parseListQuery(params: SearchParams): ListQuery {
  const status = scalar(params.status)
  const method = scalar(params.method)
  const sort = scalar(params.sort)
  const tab = scalar(params.tab)
  return {
    q: scalar(params.q).trim().slice(0, 100),
    status: status === "active" || status === "inactive" ? status : "all",
    method: method === "FIFO" || method === "FEFO" ? method : "all",
    categoryId: positiveId(scalar(params.category)),
    sort: sort === "name-desc" || sort === "code-asc" || sort === "newest" ? sort : "name-asc",
    page: positiveId(scalar(params.page)) ?? 1,
    tab: settingsTabs.find((item) => item.key === tab)?.key ?? "category",
  }
}

export function listHref(path: string, query: ListQuery, page: number, tab?: SettingsTab) {
  const params = new URLSearchParams()
  if (tab) params.set("tab", tab)
  if (query.q) params.set("q", query.q)
  if (query.status !== "all") params.set("status", query.status)
  if (query.method !== "all") params.set("method", query.method)
  if (query.categoryId) params.set("category", String(query.categoryId))
  if (query.sort !== "name-asc") params.set("sort", query.sort)
  if (page > 1) params.set("page", String(page))
  return path + (params.size ? "?" + params : "")
}
export function pageWindow(total: number, requested: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(pages, Math.max(1, requested))
  return { total, pages, page, skip: (page - 1) * pageSize, take: pageSize }
}

// Prisma MySQL contains maps to LIKE. Escape wildcard characters for literal search.
export function literalSearch(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}
