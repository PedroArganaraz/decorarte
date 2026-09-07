import { prisma } from "@/lib/prisma"
import NavCategoriasCliente from "./NavCategoriasCliente"

interface Props {
  categoriaActiva?: string
  materialActivo?: string
  todosActivo?: boolean
}

async function getCategoriasConMateriales() {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
    select: {
      id: true,
      nombre: true,
      slug: true,
      materiales: {
        select: { id: true, nombre: true },
      },
    },
  })

  return Promise.all(
    categorias.map(async (cat) => {
      const materialesConProductos = (
        await Promise.all(
          cat.materiales.map(async (mat) => {
            const count = await prisma.producto.count({
              where: {
                activo: true,
                categoriaId: cat.id,
                material: { contains: mat.nombre, mode: "insensitive" },
              },
            })
            return count > 0 ? mat : null
          })
        )
      ).filter((m): m is typeof cat.materiales[number] => m !== null)

      materialesConProductos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      return { ...cat, materiales: materialesConProductos }
    })
  )
}

export default async function NavCategorias({ categoriaActiva, materialActivo, todosActivo }: Props) {
  const categoriasConFiltro = await getCategoriasConMateriales()

  return (
    <NavCategoriasCliente
      categorias={categoriasConFiltro}
      categoriaActiva={categoriaActiva}
      materialActivo={materialActivo}
      todosActivo={todosActivo}
    />
  )
}
