import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import FormularioProducto from "@/components/productos/FormularioProducto"
import SubidorImagenes from "@/components/productos/SubidorImagenes"
import EliminarProducto from "@/components/productos/EliminarProducto"

export default async function PaginaEditarProducto({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      categoria: true,
    },
  })

  if (!producto) notFound()

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  const productoParaForm = {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: Number(producto.precio),
    precioAnterior: producto.precioAnterior ? Number(producto.precioAnterior) : null,
    stock: producto.stock,
    activo: producto.activo,
    destacado: producto.destacado,
    material: producto.material,
    categoriaId: producto.categoriaId,
  }

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            marginBottom: "4px",
          }}>
            {producto.nombre}
          </h1>
          <p style={{
            fontSize: "11px",
            color: "var(--color-texto-muted)",
            letterSpacing: "0.05em",
          }}>
            Editando producto
          </p>
        </div>
        <EliminarProducto id={producto.id} nombre={producto.nombre} />
      </div>

      <FormularioProducto categorias={categorias} producto={productoParaForm} />

      <div style={{ marginTop: "40px" }}>
        <SubidorImagenes
          productoId={producto.id}
          imagenesActuales={producto.imagenes}
        />
      </div>

      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        justifyContent: "flex-end",
      }}>
        <Link
          href="/panel/productos"
          style={{
            padding: "12px 24px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            border: "0.5px solid var(--color-texto)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          form="formulario-producto"
          style={{
            padding: "12px 32px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
