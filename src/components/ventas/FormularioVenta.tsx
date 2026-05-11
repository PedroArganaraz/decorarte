"use client"

import { useState, useCallback, useRef } from "react"

interface ProductoBuscado {
  id: string
  nombre: string
  slug: string
  precio: number
  stock: number
  imagenes: { urlPublica: string; esPrincipal: boolean; altText: string | null }[]
}

interface ItemCarrito {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  stock: number
  imagen: string | null
}

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
]

const ESTADOS = [
  { value: "PAGADO_Y_ENTREGADO", label: "Pagado y entregado" },
  { value: "PAGADO",             label: "Pagado" },
  { value: "ENTREGADO",          label: "Entregado" },
  { value: "PENDIENTE",          label: "Pendiente" },
]

export default function FormularioVenta() {
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<ProductoBuscado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])

  const [cliente, setCliente] = useState("")
  const [metodoPago, setMetodoPago] = useState("")
  const [estado, setEstado] = useState("PAGADO_Y_ENTREGADO")
  const [esRegalo, setEsRegalo] = useState(false)
  const [notas, setNotas] = useState("")

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buscarProductos = useCallback(async (texto: string) => {
    if (!texto.trim()) {
      setResultados([])
      return
    }
    setBuscando(true)
    try {
      const res = await fetch(`/api/productos?busqueda=${encodeURIComponent(texto)}`)
      const json = await res.json()
      if (json.datos) {
        setResultados(
          json.datos.map((p: any) => ({
            ...p,
            precio: typeof p.precio === "object" ? Number(p.precio) : p.precio,
          }))
        )
      }
    } catch {
      // silently fail search
    } finally {
      setBuscando(false)
    }
  }, [])

  const onCambioBusqueda = (texto: string) => {
    setBusqueda(texto)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => buscarProductos(texto), 300)
  }

  const agregarAlCarrito = (producto: ProductoBuscado) => {
    if (producto.stock === 0) return
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id)
      if (existente) {
        if (existente.cantidad >= existente.stock) return prev
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      const imagenPrincipal =
        producto.imagenes.find((img) => img.esPrincipal)?.urlPublica ??
        producto.imagenes[0]?.urlPublica ??
        null
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          stock: producto.stock,
          imagen: imagenPrincipal,
        },
      ]
    })
    setBusqueda("")
    setResultados([])
  }

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) => {
          if (i.productoId !== productoId) return i
          const nueva = i.cantidad + delta
          if (nueva < 1) return null as unknown as ItemCarrito
          if (nueva > i.stock) return i
          return { ...i, cantidad: nueva }
        })
        .filter(Boolean)
    )
  }

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const limpiarFormulario = () => {
    setCarrito([])
    setCliente("")
    setMetodoPago("")
    setEstado("PAGADO_Y_ENTREGADO")
    setEsRegalo(false)
    setNotas("")
    setBusqueda("")
    setResultados([])
  }

  const enviar = async () => {
    if (carrito.length === 0) {
      setError("Agregá al menos un producto al carrito.")
      return
    }
    if (!metodoPago) {
      setError("Seleccioná el método de pago.")
      return
    }

    setError(null)
    setEnviando(true)

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: cliente.trim() || undefined,
          metodoPago,
          estado: esRegalo ? "REGALO" : estado,
          esRegalo,
          notas: notas.trim() || undefined,
          items: carrito.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precio,
          })),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "Error al registrar la venta.")
        return
      }

      setExito(true)
      limpiarFormulario()
      setTimeout(() => setExito(false), 4000)
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: "24px",
      alignItems: "start",
    }}>
      {/* COLUMNA IZQUIERDA: búsqueda + carrito */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Buscador de productos */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          padding: "24px",
        }}>
          <p style={{
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-texto-muted)",
            marginBottom: "12px",
          }}>
            Buscar producto
          </p>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Nombre del producto..."
              value={busqueda}
              onChange={(e) => onCambioBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                border: "0.5px solid var(--color-borde)",
                borderRadius: 0,
                backgroundColor: "var(--color-card)",
                color: "var(--color-texto)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {buscando && (
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "11px",
                color: "var(--color-texto-sutil)",
                fontFamily: "'Jost', sans-serif",
              }}>
                Buscando...
              </span>
            )}
          </div>

          {resultados.length > 0 && (
            <div style={{
              marginTop: "4px",
              border: "0.5px solid var(--color-borde)",
              backgroundColor: "var(--color-card)",
              maxHeight: "320px",
              overflowY: "auto",
            }}>
              {resultados.map((producto) => {
                const sinStock = producto.stock === 0
                const imagen =
                  producto.imagenes.find((i) => i.esPrincipal)?.urlPublica ??
                  producto.imagenes[0]?.urlPublica
                return (
                  <button
                    key={producto.id}
                    onClick={() => agregarAlCarrito(producto)}
                    disabled={sinStock}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "0.5px solid var(--color-borde)",
                      cursor: sinStock ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: sinStock ? 0.45 : 1,
                    }}
                  >
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={producto.nombre}
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          flexShrink: 0,
                          backgroundColor: "var(--color-superficie)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "var(--color-superficie)",
                        flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: "13px",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 400,
                        color: "var(--color-texto)",
                        margin: 0,
                      }}>
                        {producto.nombre}
                      </p>
                      <p style={{
                        fontSize: "11px",
                        fontFamily: "'Jost', sans-serif",
                        color: "var(--color-texto-muted)",
                        margin: 0,
                        marginTop: "2px",
                      }}>
                        ${producto.precio.toLocaleString("es-AR")}
                        {" · "}
                        {sinStock ? (
                          <span style={{ color: "var(--color-acento)" }}>Sin stock</span>
                        ) : (
                          <span>Stock: {producto.stock}</span>
                        )}
                      </p>
                    </div>
                    {!sinStock && (
                      <span style={{
                        fontSize: "18px",
                        color: "var(--color-texto-sutil)",
                        lineHeight: 1,
                      }}>+</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {busqueda && !buscando && resultados.length === 0 && (
            <p style={{
              marginTop: "8px",
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto-sutil)",
            }}>
              Sin resultados para "{busqueda}"
            </p>
          )}
        </div>

        {/* Carrito */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          padding: "24px",
        }}>
          <p style={{
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-texto-muted)",
            marginBottom: "16px",
          }}>
            Carrito
          </p>

          {carrito.length === 0 ? (
            <p style={{
              fontSize: "13px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto-sutil)",
              padding: "16px 0",
            }}>
              Buscá productos para agregarlos.
            </p>
          ) : (
            <>
              {carrito.map((item) => (
                <div
                  key={item.productoId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                    borderBottom: "0.5px solid var(--color-borde)",
                  }}
                >
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      style={{
                        width: "44px",
                        height: "44px",
                        objectFit: "cover",
                        flexShrink: 0,
                        backgroundColor: "var(--color-superficie)",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "var(--color-superficie)",
                      flexShrink: 0,
                    }} />
                  )}

                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: "13px",
                      fontFamily: "'Cormorant Garamond', serif",
                      color: "var(--color-texto)",
                      margin: 0,
                    }}>
                      {item.nombre}
                    </p>
                    <p style={{
                      fontSize: "11px",
                      fontFamily: "'Jost', sans-serif",
                      color: "var(--color-texto-muted)",
                      margin: "2px 0 0",
                    }}>
                      ${item.precio.toLocaleString("es-AR")} c/u
                    </p>
                    {item.cantidad >= item.stock && (
                      <p style={{
                        fontSize: "9px",
                        fontFamily: "'Jost', sans-serif",
                        color: "var(--color-acento)",
                        margin: "2px 0 0",
                        letterSpacing: "0.05em",
                      }}>
                        Stock máximo alcanzado
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={() => cambiarCantidad(item.productoId, -1)}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "0.5px solid var(--color-borde)",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "var(--color-texto)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Jost', sans-serif",
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      minWidth: "28px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontFamily: "'Jost', sans-serif",
                      color: "var(--color-texto)",
                    }}>
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => cambiarCantidad(item.productoId, 1)}
                      disabled={item.cantidad >= item.stock}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "0.5px solid var(--color-borde)",
                        backgroundColor: "transparent",
                        cursor: item.cantidad >= item.stock ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        color: item.cantidad >= item.stock ? "var(--color-texto-sutil)" : "var(--color-texto)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Jost', sans-serif",
                        opacity: item.cantidad >= item.stock ? 0.5 : 1,
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{
                    minWidth: "72px",
                    textAlign: "right",
                    fontSize: "13px",
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "var(--color-texto)",
                  }}>
                    ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                  </div>

                  <button
                    onClick={() => eliminarDelCarrito(item.productoId)}
                    title="Eliminar"
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      color: "var(--color-texto-sutil)",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingTop: "8px",
              }}>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-texto-muted)",
                  fontFamily: "'Jost', sans-serif",
                }}>
                  Total
                </span>
                <span style={{
                  fontSize: "22px",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 400,
                  color: "var(--color-texto)",
                }}>
                  {esRegalo ? "$0" : `$${totalCarrito.toLocaleString("es-AR")}`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: formulario */}
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        <p style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
          margin: 0,
        }}>
          Datos de la venta
        </p>

        {/* Cliente */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={estiloLabel}>Cliente (opcional)</label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
            style={estiloInput}
          />
        </div>

        {/* Método de pago */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={estiloLabel}>Método de pago *</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            style={estiloInput}
          >
            <option value="">Seleccioná...</option>
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={estiloLabel}>Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={estiloInput}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Es regalo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            id="esRegalo"
            checked={esRegalo}
            onChange={(e) => setEsRegalo(e.target.checked)}
            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--color-texto)" }}
          />
          <label
            htmlFor="esRegalo"
            style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Es regalo (total muestra $0)
          </label>
        </div>

        {/* Notas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={estiloLabel}>Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones internas..."
            rows={3}
            style={{
              ...estiloInput,
              resize: "vertical",
              fontFamily: "'Jost', sans-serif",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-acento)",
            margin: 0,
            padding: "10px 12px",
            border: "0.5px solid var(--color-acento)",
            backgroundColor: "#fdf5f3",
          }}>
            {error}
          </p>
        )}

        {/* Éxito */}
        {exito && (
          <p style={{
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            color: "#4a7c59",
            margin: 0,
            padding: "10px 12px",
            border: "0.5px solid #4a7c59",
            backgroundColor: "#f2f7f4",
          }}>
            Venta registrada correctamente.
          </p>
        )}

        {/* Submit */}
        <button
          onClick={enviar}
          disabled={enviando}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: enviando ? "var(--color-texto-muted)" : "var(--color-texto)",
            color: "var(--color-card)",
            border: "none",
            borderRadius: 0,
            cursor: enviando ? "not-allowed" : "pointer",
          }}
        >
          {enviando ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
    </div>
  )
}

const estiloLabel: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-texto-muted)",
}

const estiloInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: "13px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 400,
  border: "0.5px solid var(--color-borde)",
  borderRadius: 0,
  backgroundColor: "var(--color-card)",
  color: "var(--color-texto)",
  outline: "none",
  boxSizing: "border-box",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
}
