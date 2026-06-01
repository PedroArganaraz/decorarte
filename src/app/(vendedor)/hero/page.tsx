import { prisma } from "@/lib/prisma"
import GestorHero from "@/components/hero/GestorHero"

interface Props {
  searchParams: Promise<{ vista?: string }>
}

export default async function PaginaHero({ searchParams }: Props) {
  const { vista } = await searchParams
  const vistaInicial = vista === "mobile" ? "mobile" : "desktop"

  const [imagenesDesktop, imagenesMobile] = await Promise.all([
    prisma.imagenHero.findMany({
      where: { activa: true, vista: "desktop" },
      orderBy: { orden: "asc" },
    }),
    prisma.imagenHero.findMany({
      where: { activa: true, vista: "mobile" },
      orderBy: { orden: "asc" },
    }),
  ])

  const serializar = (imagenes: typeof imagenesDesktop) =>
    imagenes.map((img) => ({ ...img, creadoEn: img.creadoEn.toISOString() }))

  return (
    <GestorHero
      imagenesDesktopIniciales={serializar(imagenesDesktop)}
      imagenesMobileIniciales={serializar(imagenesMobile)}
      vistaInicial={vistaInicial}
    />
  )
}
