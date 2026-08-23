"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

interface VarianteVinculada {
  varianteId: number
  id: string
  nombre: string
  slug: string
  color: string | null
  stock: number
}

interface ProductoOpcion {
  id: string
  nombre: string
  slug: string
  color: string | null
  imagenes: { urlPublica: string; altText: string | null; esPrincipal: boolean }[]
  categoria: { nombre: string }
}

interface Props {
  productoId: string
  variantesIniciales: VarianteVinculada[]
}

export default function SelectorVariantesColor({ productoId, variantesIniciales }: Props) {
  const [variantes, setVariantes] = useState<VarianteVinculada[]>(variantesIniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [seleccionTemp, setSeleccionTemp] = useState<string[]>([])
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const idsVinculados = variantes.map((v) => v.id)

  const buscarProductos = async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (busqueda) params.set("busqueda", busqueda)
    const res = await fetch(`/api/productos?${params.toString()}`)
    const data = await res.json()
    const filtrados = (data.datos ?? []).filter(
      (p: ProductoOpcion) => p.id !== productoId && !idsVinculados.includes(p.id)
    )
    setProductos(filtrados)
    setCargando(false)
  }

  const abrirModal = () => {
    setSeleccionTemp([])
    setBusqueda("")
    setModalAbierto(true)
  }

  useEffect(() => {
    if (modalAbierto) buscarProductos()
  }, [modalAbierto]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modalAbierto) return
    const timer = setTimeout(() => buscarProductos(), 300)
    return () => clearTimeout(timer)
  }, [busqueda]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSeleccion = (id: string) => {
    setSeleccionTemp((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const guardar = async () => {
    if (seleccionTemp.length === 0) return
    setGuardando(true)
    const errores: string[] = []
    for (const pId of seleccionTemp) {
      const res = await fetch(`/api/productos/${productoId}/variantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: pId }),
      })
      if (!res.ok) {
        const data = await res.json()
        errores.push(data.error ?? "Error")
      } else {
        const data = await res.json()
        const prod = productos.find((p) => p.id === pId)
        if (prod && data.datos) {
          setVariantes((prev) => [...prev, {
            varianteId: data.datos.id,
            id: prod.id,
            nombre: prod.nombre,
            slug: prod.slug,
            color: prod.color,
            stock: 0,
          }])
        }
      }
    }
    if (errores.length > 0) toast.error(errores[0])
    else toast.success("Variantes vinculadas")
    setGuardando(false)
    setModalAbierto(false)
  }

  const desvincular = async (varianteId: number) => {
    setEliminando(varianteId)
    const res = await fetch(`/api/productos/${productoId}/variantes/${varianteId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setVariantes((prev) => prev.filter((v) => v.varianteId !== varianteId))
      toast.success("Variante desvinculada")
    } else {
      toast.error("Error al desvincular")
    }
    setEliminando(null)
  }

  const estiloInput: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
  }

  return (
    <>
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "24px",
        marginTop: "24px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "18px",
            fontWeight: 400,
            color: "var(--color-texto)",
          }}>
            Variantes de color
          </h2>
          <button
            onClick={abrirModal}
            style={{
              padding: "8px 16px",
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "var(--color-texto)",
              border: "0.5px solid var(--color-texto)",
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            + Vincular producto
          </button>
        </div>

        {variantes.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--color-texto-sutil)", letterSpacing: "0.03em" }}>
            Sin variantes vinculadas. Esta sección no se mostrará en el catálogo.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {variantes.map((v) => (
              <span key={v.varianteId} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "4px 10px 4px 12px",
                backgroundColor: "var(--color-superficie)",
                border: "0.5px solid var(--color-borde)",
                color: "var(--color-texto)",
              }}>
                <span>{v.nombre}</span>
                {v.color && (
                  <span style={{ fontSize: "10px", color: "var(--color-texto-muted)", letterSpacing: "0.04em" }}>
                    ({v.color})
                  </span>
                )}
                <button
                  onClick={() => desvincular(v.varianteId)}
                  disabled={eliminando === v.varianteId}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: eliminando === v.varianteId ? "not-allowed" : "pointer",
                    padding: "0 2px",
                    color: "var(--color-texto-sutil)",
                    fontSize: "14px",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    opacity: eliminando === v.varianteId ? 0.4 : 1,
                  }}
                  title="Desvincular"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <>
          <div
            onClick={() => setModalAbierto(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(44, 44, 42, 0.4)",
              zIndex: 100,
              cursor: "pointer",
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 101,
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "32px",
            width: "min(560px, 95vw)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "var(--color-texto)",
            }}>
              Vincular variante de color
            </h2>

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
              placeholder="Buscar por nombre..."
              style={{ ...estiloInput, width: "100%", boxSizing: "border-box" }}
            />

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              {cargando ? (
                <p style={{ fontSize: "13px", color: "var(--color-texto-muted)", textAlign: "center", padding: "32px" }}>
                  Cargando...
                </p>
              ) : productos.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--color-texto-muted)", textAlign: "center", padding: "32px" }}>
                  No hay productos disponibles
                </p>
              ) : (
                productos.map((p) => {
                  const imagen = p.imagenes.find((i) => i.esPrincipal) ?? p.imagenes[0]
                  const seleccionado = seleccionTemp.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSeleccion(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        cursor: "pointer",
                        backgroundColor: seleccionado ? "var(--color-superficie)" : "transparent",
                        border: seleccionado ? "0.5px solid var(--color-texto)" : "0.5px solid var(--color-borde)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: "var(--color-superficie)",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}>
                        {imagen && (
                          <img
                            src={imagen.urlPublica}
                            alt={imagen.altText || p.nombre}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "14px",
                          fontFamily: "'Cormorant Garamond', serif",
                          color: "var(--color-texto)",
                          marginBottom: "2px",
                        }}>
                          {p.nombre}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--color-texto-muted)", letterSpacing: "0.05em" }}>
                          {p.categoria.nombre}
                          {p.color && ` — ${p.color}`}
                        </p>
                      </div>
                      <div style={{
                        width: "18px",
                        height: "18px",
                        border: seleccionado ? "none" : "0.5px solid var(--color-borde)",
                        backgroundColor: seleccionado ? "var(--color-texto)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {seleccionado && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "16px",
              borderTop: "0.5px solid var(--color-borde)",
            }}>
              <span style={{ fontSize: "12px", color: "var(--color-texto-muted)" }}>
                {seleccionTemp.length} seleccionado{seleccionTemp.length !== 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setModalAbierto(false)}
                  style={{
                    padding: "10px 20px",
                    fontSize: "11px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    backgroundColor: "transparent",
                    color: "var(--color-texto)",
                    border: "0.5px solid var(--color-texto)",
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando || seleccionTemp.length === 0}
                  style={{
                    padding: "10px 20px",
                    fontSize: "11px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    backgroundColor: guardando || seleccionTemp.length === 0 ? "var(--color-texto-muted)" : "var(--color-texto)",
                    color: "var(--color-fondo)",
                    border: "none",
                    borderRadius: 0,
                    cursor: guardando || seleccionTemp.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {guardando ? "Vinculando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
