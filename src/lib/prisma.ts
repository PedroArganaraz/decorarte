import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function crearPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

export const prisma = globalParaPrisma.prisma ?? crearPrismaClient()

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma
