import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import FormularioNota from "@/components/notas/FormularioNota"
import EliminarNota from "@/components/notas/EliminarNota"

export default async function PaginaEditarNota({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const idNum = parseInt(id)

  if (isNaN(idNum)) notFound()

  const nota = await prisma.nota.findUnique({
    where: { id: idNum },
  })

  if (!nota) notFound()

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
        gap: "16px",
        flexWrap: "wrap",
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
            {nota.titulo}
          </h1>
          <p style={{
            fontSize: "11px",
            color: "var(--color-texto-muted)",
            letterSpacing: "0.05em",
          }}>
            Editando nota
          </p>
        </div>
        <EliminarNota id={nota.id} titulo={nota.titulo} />
      </div>

      <FormularioNota nota={{
        id: nota.id,
        titulo: nota.titulo,
        descripcion: nota.descripcion,
      }} />

      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        justifyContent: "flex-end",
      }}>
        <Link
          href="/panel/notas"
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
          form="formulario-nota"
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
