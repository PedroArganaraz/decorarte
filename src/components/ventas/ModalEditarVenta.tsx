"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface ProductoBuscado {
  id: string
  nombre: string
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

interface ItemVenta {
  id: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  producto: { id: string; nombre: string; slug: string }
}

export interface VentaParaEditar {
  id: string
  cliente: string | null
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null
  estado: string
  esRegalo: boolean
  notas: string | null
  items: ItemVenta[]
}

interface Props {
  venta: VentaParaEditar
  onCerrar: () => void
  onGuardada: (actualizada: VentaParaEditar & { items: ItemVenta[] }) => void
}

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
]

const ESTADOS = [
  { value: "PAGADO_Y_ENTREGADO", label: "Pagado y entregado" },
  { value: "PAGADO", label: "Pagado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "PENDIENTE", label: "Pendiente" },
]

const estiloLabel: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-texto-muted)",
  marginBottom: "5px",
  display: "block",
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
}

export default function ModalEditarVenta({ venta, onCerrar, onGuardada }: Props) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() =>
    venta.items.map((i) => ({
      productoId: i.producto.id,
      nombre: i.producto.nombre,
      precio: Number(i.precioUnitario),
      cantidad: i.cantidad,
      stock: 9999,
      imagen: null,
    }))
  )

  const [cliente, setCliente] = useState(venta.cliente ?? "")
  const [metodoPago, setMetodoPago] = useState(venta.metodoPago ?? "")
  const [estado, setEstado] = useState(venta.estado === "REGALO" ? "PAGADO_Y_ENTREGADO" : venta.estado)
  const [esRegalo, setEsRegalo] = useState(venta.esRegalo)
  const [notas, setNotas] = useState(venta.notas ?? "")

  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<ProductoBuscado[]>([])
  const [buscando, setBuscando] = useState(false)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchImagenes = async () => {
      try {
        const res = await fetch(`/api/ventas/${venta.id}`)
        const json = await res.json()
        if (!json.datos) return
        const imagenesPorProducto = new Map<string, string | null>()
        for (const item of json.datos.items) {
          imagenesPorProducto.set(
            item.productoId,
            item.producto.imagenes?.[0]?.urlPublica ?? null
          )
        }
        setCarrito((prev) =>
          prev.map((c) => ({
            ...c,
            imagen: imagenesPorProducto.get(c.productoId) ?? c.imagen,
          }))
        )
      } catch { /* silent */ }
    }
    fetchImagenes()
  }, [venta.id])

  const buscarProductos = useCallback(async (texto: string) => {
    if (!texto.trim()) { setResultados([]); return }
    setBuscando(true)
    try {
      const res = await fetch(`/api/productos?busqueda=${encodeURIComponent(texto)}`)
      const json = await res.json()
      if (json.datos) {
        setResultados(json.datos.map((p: any) => ({
          ...p,
          precio: typeof p.precio === "object" ? Number(p.precio) : p.precio,
        })))
      }
    } catch { /* silent */ } finally {
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
        if (existente.cantidad >= producto.stock) return prev
        return prev.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + 1, stock: producto.stock }
            : i
        )
      }
      const imagen =
        producto.imagenes.find((img) => img.esPrincipal)?.urlPublica ??
        producto.imagenes[0]?.urlPublica ?? null
      return [...prev, {
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        stock: producto.stock,
        imagen,
      }]
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

  const guardar = async () => {
    if (carrito.length === 0) { setError("Agregá al menos un producto."); return }
    if (!metodoPago) { setError("Seleccioná el método de pago."); return }

    setError(null)
    setGuardando(true)
    try {
      const res = await fetch(`/api/ventas/${venta.id}`, {
        method: "PATCH",
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
      if (!res.ok) throw new Error(json.error ?? "Error al guardar")
      onGuardada(json.datos)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onCerrar}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(44, 44, 42, 0.4)",
          zIndex: 200,
          cursor: "pointer",
        }}
      />

      {/* MODAL */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 201,
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        width: "min(920px, 95vw)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px",
          borderBottom: "0.5px solid var(--color-borde)",
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            Editar venta
          </h2>
          <button
            onClick={onCerrar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              color: "var(--color-texto-muted)",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "0",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}>
          {/* COLUMNA IZQUIERDA: búsqueda + carrito */}
          <div style={{
            padding: "24px 28px",
            borderRight: "0.5px solid var(--color-borde)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}>
            {/* Buscador */}
            <div>
              <label style={estiloLabel}>Agregar producto</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={busqueda}
                  onChange={(e) => onCambioBusqueda(e.target.value)}
                  style={estiloInput}
                />
                {buscando && (
                  <span style={{
                    position: "absolute",
                    right: "10px",
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
                  border: "0.5px solid var(--color-borde)",
                  borderTop: "none",
                  backgroundColor: "var(--color-card)",
                  maxHeight: "240px",
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
                          gap: "10px",
                          width: "100%",
                          padding: "8px 12px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderBottom: "0.5px solid var(--color-borde)",
                          cursor: sinStock ? "not-allowed" : "pointer",
                          textAlign: "left",
                          opacity: sinStock ? 0.45 : 1,
                        }}
                      >
                        {imagen ? (
                          <img src={imagen} alt={producto.nombre} style={{ width: "36px", height: "36px", objectFit: "cover", flexShrink: 0, backgroundColor: "var(--color-superficie)" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", backgroundColor: "var(--color-superficie)", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: 0 }}>
                            {producto.nombre}
                          </p>
                          <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", margin: 0 }}>
                            ${producto.precio.toLocaleString("es-AR")} · {sinStock ? <span style={{ color: "var(--color-acento)" }}>Sin stock</span> : `Stock: ${producto.stock}`}
                          </p>
                        </div>
                        {!sinStock && <span style={{ fontSize: "16px", color: "var(--color-texto-sutil)" }}>+</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {busqueda && !buscando && resultados.length === 0 && (
                <p style={{ marginTop: "6px", fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)" }}>
                  Sin resultados para "{busqueda}"
                </p>
              )}
            </div>

            {/* Carrito */}
            <div>
              <p style={{ ...estiloLabel, marginBottom: "12px" }}>Productos</p>

              {carrito.length === 0 ? (
                <p style={{ fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", padding: "8px 0" }}>
                  Sin productos en el carrito.
                </p>
              ) : (
                <>
                  {carrito.map((item) => (
                    <div key={item.productoId} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      borderBottom: "0.5px solid var(--color-borde)",
                    }}>
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} style={{ width: "40px", height: "40px", objectFit: "cover", flexShrink: 0, backgroundColor: "var(--color-superficie)" }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", backgroundColor: "var(--color-superficie)", flexShrink: 0 }} />
                      )}

                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: 0 }}>
                          {item.nombre}
                        </p>
                        <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", margin: "2px 0 0" }}>
                          ${item.precio.toLocaleString("es-AR")} c/u
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          onClick={() => cambiarCantidad(item.productoId, -1)}
                          style={{ width: "26px", height: "26px", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", cursor: "pointer", fontSize: "14px", color: "var(--color-texto)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif" }}
                        >−</button>
                        <span style={{ minWidth: "24px", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)" }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.productoId, 1)}
                          disabled={item.cantidad >= item.stock}
                          style={{ width: "26px", height: "26px", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", cursor: item.cantidad >= item.stock ? "not-allowed" : "pointer", fontSize: "14px", color: item.cantidad >= item.stock ? "var(--color-texto-sutil)" : "var(--color-texto)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", opacity: item.cantidad >= item.stock ? 0.4 : 1 }}
                        >+</button>
                      </div>

                      <div style={{ minWidth: "64px", textAlign: "right", fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)" }}>
                        ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                      </div>

                      <button
                        onClick={() => eliminarDelCarrito(item.productoId)}
                        style={{ width: "22px", height: "22px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--color-texto-sutil)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}
                      >×</button>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "4px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", fontFamily: "'Jost', sans-serif" }}>
                      Total
                    </span>
                    <span style={{ fontSize: "20px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: "var(--color-texto)" }}>
                      {esRegalo ? "$0" : `$${totalCarrito.toLocaleString("es-AR")}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: datos de la venta */}
          <div style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={estiloLabel}>Cliente (opcional)</label>
              <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" style={estiloInput} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={estiloLabel}>Método de pago *</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={estiloInput}>
                <option value="">Seleccioná...</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={estiloLabel}>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={estiloInput}>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="editEsRegalo"
                checked={esRegalo}
                onChange={(e) => setEsRegalo(e.target.checked)}
                style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--color-texto)" }}
              />
              <label htmlFor="editEsRegalo" style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", cursor: "pointer", userSelect: "none" }}>
                Es regalo (total muestra $0)
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={estiloLabel}>Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones internas..."
                rows={4}
                style={{ ...estiloInput, resize: "vertical", fontFamily: "'Jost', sans-serif" }}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          borderTop: "0.5px solid var(--color-borde)",
          padding: "16px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexShrink: 0,
        }}>
          {error && (
            <p style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-acento)",
              padding: "8px 12px",
              border: "0.5px solid var(--color-acento)",
              backgroundColor: "#fdf5f3",
              margin: 0,
            }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onCerrar}
              disabled={guardando}
              style={{
                flex: 1,
                padding: "11px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: "var(--color-texto)",
                border: "0.5px solid var(--color-texto)",
                borderRadius: 0,
                cursor: guardando ? "not-allowed" : "pointer",
                opacity: guardando ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                flex: 1,
                padding: "11px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: guardando ? "var(--color-texto-muted)" : "var(--color-texto)",
                color: "var(--color-card)",
                border: "none",
                borderRadius: 0,
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
