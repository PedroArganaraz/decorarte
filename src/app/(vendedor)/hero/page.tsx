import { prisma } from "@/lib/prisma"
import GestorHero from "@/components/hero/GestorHero"

export default async function PaginaHero() {
  const imagenes = await prisma.imagenHero.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  const imagenesSerializadas = imagenes.map((img) => ({
    ...img,
    creadoEn: img.creadoEn.toISOString(),
  }))

  return <GestorHero imagenesIniciales={imagenesSerializadas} />
}
