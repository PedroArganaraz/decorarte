import { prisma } from "@/lib/prisma"
import Link from "next/link"
import EliminarNotaCard from "@/components/notas/EliminarNotaCard"

function fechaRelativa(fecha: Date): string {
  const diff = Date.now() - fecha.getTime()
  const minutos = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)

  if (minutos < 1) return "ahora"
  if (minutos < 60) return `hace ${minutos} min`
  if (horas < 24) return `hace ${horas} h`
  if (dias === 1) return "ayer"
  if (dias < 30) return `hace ${dias} días`
  return fecha.toLocaleDateString("es-AR")
}

export default async function PaginaNotas() {
  const notas = await prisma.nota.findMany({
    orderBy: { actualizado_en: "desc" },
  })

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "32px",
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
        }}>
          Notas
        </h1>
        <Link
          href="/panel/notas/nueva"
          style={{
            padding: "10px 20px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + Nueva nota
        </Link>
      </div>

      {notas.length === 0 ? (
        <div style={{
          padding: "64px 24px",
          textAlign: "center",
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontWeight: 300,
            color: "var(--color-texto-muted)",
            marginBottom: "12px",
          }}>
            No hay notas aún
          </p>
          <Link
            href="/panel/notas/nueva"
            style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-texto)",
              textDecoration: "underline",
            }}
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}>
          {notas.map((nota) => (
            <Link
              key={nota.id}
              href={`/panel/notas/${nota.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{
                backgroundColor: "var(--color-card)",
                border: "0.5px solid var(--color-borde)",
                padding: "20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                transition: "border-color 0.15s ease",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "17px",
                    fontWeight: 400,
                    color: "var(--color-texto)",
                    lineHeight: 1.3,
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {nota.titulo}
                  </h2>
                  <EliminarNotaCard id={nota.id} titulo={nota.titulo} />
                </div>

                {nota.descripcion && (
                  <p style={{
                    fontSize: "13px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 300,
                    color: "var(--color-texto-muted)",
                    lineHeight: 1.5,
                    flex: 1,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {nota.descripcion}
                  </p>
                )}

                <p style={{
                  fontSize: "10px",
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: "0.06em",
                  color: "var(--color-texto-sutil)",
                  marginTop: "auto",
                  paddingTop: "8px",
                  borderTop: "0.5px solid var(--color-superficie)",
                }}>
                  {fechaRelativa(nota.actualizado_en)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
