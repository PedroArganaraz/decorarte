import { defineConfig } from "prisma/config"
import * as fs from "fs"

function leerEnvLocal(): Record<string, string> {
  try {
    const contenido = fs.readFileSync(".env.local", "utf8")
    const vars: Record<string, string> = {}
    for (const linea of contenido.split("\n")) {
      const recortada = linea.trim()
      if (!recortada || recortada.startsWith("#")) continue
      const idx = recortada.indexOf("=")
      if (idx === -1) continue
      const clave = recortada.slice(0, idx).trim()
      let valor = recortada.slice(idx + 1).trim()
      valor = valor.replace(/^["']|["']$/g, "")
      vars[clave] = valor
    }
    return vars
  } catch {
    return {}
  }
}

const envVars = leerEnvLocal()

// En Vercel no existe .env.local — caer en las variables de entorno del proceso
const directUrl =
  envVars["DIRECT_URL"] ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  ""

export default defineConfig({
  schema: "./prisma/schema.prisma",
  // Solo sobreescribir el datasource si hay una URL real; si no, Prisma usa la del schema
  ...(directUrl && {
    datasource: {
      url: directUrl,
    },
  }),
})
