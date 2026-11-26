import "dotenv/config"
import { createPrismaClient } from "../lib/db-client.ts"

const prisma = createPrismaClient()

try {
  // Reference data only. Existing settings and categories are never overwritten.
  await prisma.$transaction([
    prisma.category.upsert({
      where: { name: "Makanan dan minuman" },
      create: { name: "Makanan dan minuman", defaultMethod: "FEFO" },
      update: {},
    }),
    prisma.category.upsert({
      where: { name: "Barang umum" },
      create: { name: "Barang umum", defaultMethod: "FIFO" },
      update: {},
    }),
    prisma.setting.upsert({
      where: { key: "near_expiry_days" },
      create: { key: "near_expiry_days", value: 30 },
      update: {},
    }),
    prisma.setting.upsert({
      where: { key: "dead_stock_days" },
      create: { key: "dead_stock_days", value: 60 },
      update: {},
    }),
  ])
  console.log("Reference data ready. No users or stock were created.")
} finally {
  await prisma.$disconnect()
}
