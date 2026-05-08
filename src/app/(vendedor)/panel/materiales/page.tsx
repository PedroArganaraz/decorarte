import { prisma } from "@/lib/prisma"
import GestionMaterialesPanel from "@/components/productos/GestionMaterialesPanel"

export default async function PaginaMateriales() {
  const [materiales, categorias] = await Promise.all([
    prisma.material.findMany({
      orderBy: { nombre: "asc" },
      include: {
        categorias: { select: { id: true, nombre: true } },
      },
    }),
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
  ])

  const materialesConConteo = await Promise.all(
    materiales.map(async (mat) => {
      const total = await prisma.producto.count({
        where: {
          OR: [
            { materialId: mat.id },
            { material: mat.nombre },
          ],
        },
      })
      return { ...mat, _count: { productos: total } }
    })
  )

  return (
    <div>
      <GestionMaterialesPanel
        categorias={categorias}
        materialesIniciales={materialesConConteo}
      />
    </div>
  )
}
