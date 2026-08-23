import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import FormularioProducto from "@/components/productos/FormularioProducto"
import SubidorImagenes from "@/components/productos/SubidorImagenes"
import EliminarProducto from "@/components/productos/EliminarProducto"
import SelectorCombinados from "@/components/productos/SelectorCombinados"
import SelectorVariantesColor from "@/components/productos/SelectorVariantesColor"

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
      combinadoCon: {
        select: { id: true, nombre: true, slug: true },
      },
      insumos: {
        include: { insumo: { select: { id: true, nombre: true, precioUnitario: true, cantidadDisponible: true, unidad: true } } },
      },
      variantesComoA: { include: { productoB: { select: { id: true, nombre: true, slug: true, color: true, stock: true } } } },
      variantesComoB: { include: { productoA: { select: { id: true, nombre: true, slug: true, color: true, stock: true } } } },
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
    costo: producto.costo != null ? Number(producto.costo) : null,
    precioMinimo: producto.precioMinimo != null ? Number(producto.precioMinimo) : null,
    stock: producto.stock,
    activo: producto.activo,
    destacado: producto.destacado,
    material: producto.material,
    talle: producto.talle,
    color: producto.color,
    categoriaId: producto.categoriaId,
    creadoEn: producto.creadoEn.toISOString().split("T")[0],
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

      <FormularioProducto
        categorias={categorias}
        producto={productoParaForm}
        insumosIniciales={producto.insumos.map((ip) => ({
          insumoId: ip.insumo.id,
          nombre: ip.insumo.nombre,
          precioUnitario: ip.insumo.precioUnitario,
          cantidadDisponible: ip.insumo.cantidadDisponible,
          unidad: ip.insumo.unidad,
          cantidadUsada: ip.cantidadUsada,
        }))}
      />

      <div style={{ marginTop: "40px" }}>
        <SubidorImagenes
          productoId={producto.id}
          imagenesActuales={producto.imagenes}
        />
      </div>

      <div style={{ marginTop: "24px" }}>
        <SelectorCombinados
          productoId={producto.id}
          combinadosIniciales={producto.combinadoCon}
        />
      </div>

      <div style={{ marginTop: "24px" }}>
        <SelectorVariantesColor
          productoId={producto.id}
          colorActual={producto.color}
          variantesIniciales={[
            ...producto.variantesComoA.map((v) => ({
              varianteId: v.id,
              id: v.productoB.id,
              nombre: v.productoB.nombre,
              slug: v.productoB.slug,
              color: v.productoB.color,
              stock: v.productoB.stock,
            })),
            ...producto.variantesComoB.map((v) => ({
              varianteId: v.id,
              id: v.productoA.id,
              nombre: v.productoA.nombre,
              slug: v.productoA.slug,
              color: v.productoA.color,
              stock: v.productoA.stock,
            })),
          ]}
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
            padding: "14px 40px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 500,
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
