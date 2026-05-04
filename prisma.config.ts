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
const directUrl = envVars["DIRECT_URL"] ?? ""

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: directUrl,
  },
})
