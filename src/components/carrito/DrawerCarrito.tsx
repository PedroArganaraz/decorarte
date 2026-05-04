"use client"

import { useEffect } from "react"
import { usarCarrito } from "@/tiendas/carritoTienda"
import { generarMensajeWhatsapp } from "@/lib/utils"
import Link from "next/link"

interface Props {
  abierto: boolean
  onCerrar: () => void
}

export default function DrawerCarrito({ abierto, onCerrar }: Props) {
  const { items, quitarItem, actualizarCantidad, totalPrecio } = usarCarrito()
  const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ""

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [abierto])

  const manejarWhatsapp = () => {
    const mensaje = generarMensajeWhatsapp(items)
    window.open(`https://wa.me/${numeroWhatsapp}?text=${mensaje}`, "_blank")
    onCerrar()
  }

  if (!abierto) return null

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onCerrar}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(44, 44, 42, 0.4)",
          zIndex: 100,
          cursor: "pointer",
        }}
      />

      {/* PANEL */}
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "380px",
        backgroundColor: "var(--color-card)",
        borderLeft: "0.5px solid var(--color-borde)",
        zIndex: 101,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "0.5px solid var(--color-borde)",
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
          }}>
            Carrito {items.length > 0 && `(${items.length})`}
          </h2>
          <button
            onClick={onCerrar}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--color-texto-muted)",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* CONTENIDO */}
        {items.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            textAlign: "center",
            gap: "16px",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px",
              fontWeight: 300,
              color: "var(--color-texto-muted)",
            }}>
              Tu carrito está vacío
            </p>
            <Link
              href="/catalogo"
              onClick={onCerrar}
              style={{
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-texto)",
                textDecoration: "none",
                borderBottom: "0.5px solid var(--color-texto)",
                paddingBottom: "2px",
              }}
            >
              Ver colección
            </Link>
          </div>
        ) : (
          <>
            {/* ITEMS */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 24px",
            }}>
              {items.map((item) => (
                <div
                  key={item.productoId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: "12px",
                    paddingBottom: "16px",
                    marginBottom: "16px",
                    borderBottom: "0.5px solid var(--color-superficie)",
                  }}
                >
                  <div style={{
                    width: "64px",
                    height: "64px",
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

                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={onCerrar}
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        color: "var(--color-texto)",
                        textDecoration: "none",
                        display: "block",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.nombre}
                    </Link>
                    <span style={{
                      fontSize: "13px",
                      color: "var(--color-texto-muted)",
                      display: "block",
                      marginBottom: "10px",
                    }}>
                      ${item.precio.toLocaleString("es-AR")}
                    </span>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}>
                        <button
                          onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "transparent",
                            border: "0.5px solid var(--color-borde)",
                            borderRadius: 0,
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "var(--color-texto)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          fontSize: "13px",
                          color: "var(--color-texto)",
                          minWidth: "16px",
                          textAlign: "center",
                        }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "transparent",
                            border: "0.5px solid var(--color-borde)",
                            borderRadius: 0,
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "var(--color-texto)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => quitarItem(item.productoId)}
                        style={{
                          fontSize: "10px",
                          fontFamily: "'Jost', sans-serif",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          backgroundColor: "transparent",
                          color: "var(--color-texto-muted)",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div style={{
              padding: "20px 24px",
              borderTop: "0.5px solid var(--color-borde)",
              flexShrink: 0,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
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
                  fontSize: "22px",
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
                  padding: "14px",
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
                  marginBottom: "10px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar pedido por WhatsApp
              </button>

              <Link
                href="/carrito"
                onClick={onCerrar}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px",
                  fontSize: "10px",
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "transparent",
                  color: "var(--color-texto-muted)",
                  border: "0.5px solid var(--color-borde)",
                  textDecoration: "none",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
