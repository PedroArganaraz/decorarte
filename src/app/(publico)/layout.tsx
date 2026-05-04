import { prisma } from "@/lib/prisma"
import Encabezado from "@/components/layout/Encabezado"
import PiePagina from "@/components/layout/PiePagina"

export default async function LayoutPublico({
  children,
}: {
  children: React.ReactNode
}) {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  return (
    <>
      <Encabezado categorias={categorias} />
      <main style={{ minHeight: "70vh" }}>
        {children}
      </main>
      <PiePagina />
    </>
  )
}
