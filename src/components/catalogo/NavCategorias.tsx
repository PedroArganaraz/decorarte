import { Prisma } from "@prisma/client"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import NavCategoriasCliente from "./NavCategoriasCliente"

interface Props {
  categoriaActiva?: string
  materialActivo?: string
  todosActivo?: boolean
}

const getCategoriasConMateriales = unstable_cache(
  async () => {
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

    // Los productos usan el campo string `material` (no materialId), así que
    // verificamos si hay ≥1 producto activo en esa categoría cuyo campo string
    // material coincide con el nombre del material (case-insensitive).
    return Promise.all(
      categorias.map(async (cat) => {
        const materialesFiltrados = (
          await Promise.all(
            cat.materiales.map(async (mat) => {
              const count = await prisma.producto.count({
                where: {
                  activo: true,
                  categoriaId: cat.id,
                  material: { contains: mat.nombre, mode: Prisma.QueryMode.insensitive },
                },
              })
              return count > 0 ? mat : null
            })
          )
        ).filter((m): m is typeof cat.materiales[number] => m !== null)

        materialesFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        return { ...cat, materiales: materialesFiltrados }
      })
    )
  },
  ["categorias-con-materiales"],
  { revalidate: 60 }
)

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
