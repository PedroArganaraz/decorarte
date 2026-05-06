import { prisma } from "@/lib/prisma"
import Link from "next/link"
import FormularioProducto from "@/components/productos/FormularioProducto"

export default async function PaginaNuevoProducto() {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
        }}>
          Nuevo producto
        </h1>
      </div>
      <FormularioProducto categorias={categorias} />

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
          Crear producto
        </button>
      </div>
    </div>
  )
}
