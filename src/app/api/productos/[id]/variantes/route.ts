import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

const selProducto = {
  id: true,
  nombre: true,
  slug: true,
  color: true,
  stock: true,
} as const

async function autenticar() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await autenticar()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params

    const registros = await prisma.varianteColor.findMany({
      where: { OR: [{ productoAId: id }, { productoBId: id }] },
      include: {
        productoA: { select: selProducto },
        productoB: { select: selProducto },
      },
    })

    const datos = registros.map((r) => {
      const otro = r.productoAId === id ? r.productoB : r.productoA
      return { varianteId: r.id, ...otro }
    })

    return NextResponse.json<RespuestaAPI<typeof datos>>({ datos })
  } catch (error) {
    console.error("Error al obtener variantes de color:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await autenticar()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    const { productoId } = await req.json() as { productoId: string }

    if (!productoId || productoId === id) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "productoId inválido" }, { status: 400 })
    }

    // Verificar que no exista ya en ninguna dirección
    const existe = await prisma.varianteColor.findFirst({
      where: {
        OR: [
          { productoAId: id, productoBId: productoId },
          { productoAId: productoId, productoBId: id },
        ],
      },
    })
    if (existe) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Ya están vinculados" }, { status: 409 })
    }

    const nueva = await prisma.varianteColor.create({
      data: { productoAId: id, productoBId: productoId },
    })

    return NextResponse.json<RespuestaAPI<typeof nueva>>({ datos: nueva }, { status: 201 })
  } catch (error) {
    console.error("Error al vincular variante de color:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error interno" }, { status: 500 })
  }
}
