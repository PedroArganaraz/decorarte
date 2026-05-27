import { prisma } from "@/lib/prisma"
import NavCategoriasCliente from "./NavCategoriasCliente"

interface Props {
  categoriaActiva?: string
  materialActivo?: string
  todosActivo?: boolean
}

export default async function NavCategorias({ categoriaActiva, materialActivo, todosActivo }: Props) {
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

  return (
    <NavCategoriasCliente
      categorias={categorias}
      categoriaActiva={categoriaActiva}
      materialActivo={materialActivo}
      todosActivo={todosActivo}
    />
  )
}
