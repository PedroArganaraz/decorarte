"use client"

import Link from "next/link"

interface Props {
  producto: {
    id: string
    nombre: string
    slug: string
    precio: number
    precioAnterior: number | null
    stock: number
    activo: boolean
    destacado: boolean
    imagenes: { urlPublica: string; altText: string | null; esPrincipal: boolean }[]
    categoria: { nombre: string; slug: string }
  }
}

export default function TarjetaProducto({ producto }: Props) {
  const imagenPrincipal = producto.imagenes.find((img) => img.esPrincipal)
    ?? producto.imagenes[0]

  return (
    <Link href={`/producto/${producto.slug}`} style={{ textDecoration: "none" }}>
      <article style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        cursor: "pointer",
      }}>
        <div style={{
          position: "relative",
          aspectRatio: "1",
          backgroundColor: "var(--color-superficie)",
          overflow: "hidden",
        }}>
          {imagenPrincipal ? (
            <img
              src={imagenPrincipal.urlPublica}
              alt={imagenPrincipal.altText || producto.nombre}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLImageElement).style.transform = "scale(1.03)"
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLImageElement).style.transform = "scale(1)"
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "var(--color-texto-sutil)",
            }}>
              Sin imagen
            </div>
          )}

          {producto.destacado && (
            <span style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              fontSize: "8px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              backgroundColor: "var(--color-acento)",
              color: "#FFFFFF",
              padding: "3px 8px",
            }}>
              Destacado
            </span>
          )}

          {producto.precioAnterior && (
            <span style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "8px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              backgroundColor: "var(--color-texto)",
              color: "var(--color-fondo)",
              padding: "3px 8px",
            }}>
              Oferta
            </span>
          )}
        </div>

        <div style={{ padding: "14px 16px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}>
            <span style={{
              fontSize: "9px",
              fontWeight: 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
            }}>
              {producto.categoria.nombre}
            </span>
          </div>

          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "16px",
            fontWeight: 400,
            color: "var(--color-texto)",
            marginBottom: "8px",
            lineHeight: 1.3,
          }}>
            {producto.nombre}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "var(--color-texto)",
              letterSpacing: "0.03em",
            }}>
              ${Number(producto.precio).toLocaleString("es-AR")}
            </span>
            {producto.precioAnterior && (
              <span style={{
                fontSize: "12px",
                color: "var(--color-texto-sutil)",
                textDecoration: "line-through",
              }}>
                ${Number(producto.precioAnterior).toLocaleString("es-AR")}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
