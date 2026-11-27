export type MasterRow = {
  id: number
  updatedAt: string
  name: string
  secondary?: string
  cells: string[]
  isActive: boolean
  values: Record<string, string>
}

export type CategoryOption = { id: number; name: string; isActive: boolean; defaultMethod: "FIFO" | "FEFO" }
export type MasterList = { rows: MasterRow[]; total: number; page: number; pages: number }
export type GeneralValues = { nearExpiryDays: string; deadStockDays: string; nearVersion: string | null; deadVersion: string | null }
