"use client"

import { usarCarrito } from "@/tiendas/carritoTienda"
import { generarMensajeWhatsapp } from "@/lib/utils"
import Link from "next/link"

export default function PaginaCarrito() {
  const { items, quitarItem, actualizarCantidad, totalPrecio, vaciarCarrito } = usarCarrito()

  const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ""

  const manejarWhatsapp = () => {
    const mensaje = generarMensajeWhatsapp(items)
    window.open(`https://wa.me/${numeroWhatsapp}?text=${mensaje}`, "_blank")
  }

  if (items.length === 0) {
    return (
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "80px 24px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "36px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
          marginBottom: "16px",
        }}>
          Tu carrito está vacío
        </h1>
        <p style={{
          fontSize: "13px",
          fontWeight: 300,
          color: "var(--color-texto-muted)",
          letterSpacing: "0.05em",
          marginBottom: "32px",
        }}>
          Explorá nuestra colección y encontrá tu próxima pieza favorita.
        </p>
        <Link
          href="/catalogo"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            textDecoration: "none",
          }}
        >
          Ver colección
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "36px",
        fontWeight: 300,
        letterSpacing: "0.05em",
        color: "var(--color-texto)",
        marginBottom: "40px",
      }}>
        Tu carrito ({items.length})
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: "40px",
        alignItems: "start",
      }}>
        {/* ITEMS */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
        }}>
          {items.map((item, index) => (
            <div
              key={item.productoId}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: "16px",
                padding: "20px",
                alignItems: "center",
                borderBottom: index < items.length - 1
                  ? "0.5px solid var(--color-superficie)"
                  : "none",
              }}
            >
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "var(--color-superficie)",
                overflow: "hidden",
                flexShrink: 0,
              }}>
                {item.imagenUrl && (
                  <img
                    src={item.imagenUrl}
                    alt={item.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </div>

              <div>
                <Link
                  href={`/producto/${item.slug}`}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "18px",
                    fontWeight: 400,
                    color: "var(--color-texto)",
                    textDecoration: "none",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {item.nombre}
                </Link>
                <span style={{
                  fontSize: "13px",
                  color: "var(--color-texto-muted)",
                }}>
                  ${item.precio.toLocaleString("es-AR")} c/u
                </span>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "12px",
                }}>
                  <button
                    onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "transparent",
                      border: "0.5px solid var(--color-borde)",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "var(--color-texto)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "var(--color-texto)",
                    minWidth: "20px",
                    textAlign: "center",
                  }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "transparent",
                      border: "0.5px solid var(--color-borde)",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "var(--color-texto)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "12px",
              }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--color-texto)",
                }}>
                  ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                </span>
                <button
                  onClick={() => quitarItem(item.productoId)}
                  style={{
                    fontSize: "10px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    backgroundColor: "transparent",
                    color: "var(--color-texto-sutil)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RESUMEN */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          padding: "24px",
          position: "sticky",
          top: "100px",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "0.5px solid var(--color-borde)",
          }}>
            Resumen
          </h2>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}>
            {items.map((item) => (
              <div
                key={item.productoId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "var(--color-texto-muted)",
                }}
              >
                <span>{item.nombre} × {item.cantidad}</span>
                <span>${(item.precio * item.cantidad).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            borderTop: "0.5px solid var(--color-borde)",
            marginBottom: "24px",
          }}>
            <span style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
            }}>
              Total
            </span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              fontWeight: 300,
              color: "var(--color-texto)",
            }}>
              ${totalPrecio().toLocaleString("es-AR")}
            </span>
          </div>

          <button
            onClick={manejarWhatsapp}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              backgroundColor: "var(--color-texto)",
              color: "var(--color-fondo)",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar pedido por WhatsApp
          </button>

          <button
            onClick={vaciarCarrito}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "10px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "var(--color-texto-sutil)",
              border: "0.5px solid var(--color-borde)",
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            Vaciar carrito
          </button>
        </div>
      </div>
    </div>
  )
}
