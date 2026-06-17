"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

interface ProductoOpcion {
  id: string
  nombre: string
  slug: string
  precio: number
  imagenes: { urlPublica: string; altText: string | null; esPrincipal: boolean }[]
  categoria: { nombre: string; slug: string }
  material: string | null
}

interface Props {
  productoId: string
  combinadosIniciales: { id: string; nombre: string; slug: string }[]
}

export default function SelectorCombinados({ productoId, combinadosIniciales }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>(
    combinadosIniciales.map((p) => p.id)
  )
  const [nombresSeleccionados, setNombresSeleccionados] = useState<{ id: string; nombre: string }[]>(
    combinadosIniciales
  )
  const [seleccionTemp, setSeleccionTemp] = useState<string[]>([])
  const [nombresTemp, setNombresTemp] = useState<{ id: string; nombre: string }[]>([])
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [categorias, setCategorias] = useState<{ id: string; nombre: string; slug: string }[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [materialFiltro, setMaterialFiltro] = useState("")
  const [materiales, setMateriales] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((d) => setCategorias(d.datos ?? []))
  }, [])

  useEffect(() => {
    fetch("/api/materiales")
      .then((r) => r.json())
      .then((d) => setMateriales((d.datos ?? []).map((m: { nombre: string }) => m.nombre)))
  }, [])

  const buscarProductos = async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (busqueda) params.set("busqueda", busqueda)
    if (categoriaFiltro) params.set("categoria", categoriaFiltro)
    if (materialFiltro) params.set("material", materialFiltro)

    const res = await fetch(`/api/productos?${params.toString()}`)
    const data = await res.json()
    const todosMenosEste = (data.datos ?? []).filter(
      (p: ProductoOpcion) => p.id !== productoId
    )
    const prods = todosMenosEste.map((p: ProductoOpcion & { precioAnterior?: number }) => ({
      ...p,
      precio: Number(p.precio),
      precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
    }))
    setProductos(prods)
    setCargando(false)
  }

  const abrirModal = () => {
    setSeleccionTemp(seleccionados)
    setNombresTemp(nombresSeleccionados)
    setModalAbierto(true)
  }

  useEffect(() => {
    if (modalAbierto) buscarProductos()
  }, [modalAbierto])

  useEffect(() => {
    if (!modalAbierto) return
    const timer = setTimeout(() => buscarProductos(), 300)
    return () => clearTimeout(timer)
  }, [busqueda]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modalAbierto) return
    buscarProductos()
  }, [categoriaFiltro]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modalAbierto) return
    buscarProductos()
  }, [materialFiltro]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSeleccion = (producto: ProductoOpcion) => {
    setSeleccionTemp((prev) => {
      if (prev.includes(producto.id)) {
        setNombresTemp((n) => n.filter((p) => p.id !== producto.id))
        return prev.filter((id) => id !== producto.id)
      }
      setNombresTemp((n) =>
        n.find((p) => p.id === producto.id)
          ? n
          : [...n, { id: producto.id, nombre: producto.nombre }]
      )
      return [...prev, producto.id]
    })
  }

  const guardar = async () => {
    setGuardando(true)
    const res = await fetch(`/api/productos/${productoId}/combinados`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productoIds: seleccionTemp }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al guardar")
      setGuardando(false)
      return
    }

    setSeleccionados(seleccionTemp)
    setNombresSeleccionados(nombresTemp)
    toast.success("Combinados actualizados")
    setModalAbierto(false)
    setGuardando(false)
  }

  const estiloInput = {
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
  } as React.CSSProperties

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
            Combinalo con
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
            {nombresSeleccionados.length > 0 ? "Editar selección" : "+ Agregar productos"}
          </button>
        </div>

        {nombresSeleccionados.length === 0 ? (
          <p style={{
            fontSize: "12px",
            color: "var(--color-texto-sutil)",
            letterSpacing: "0.03em",
          }}>
            No hay productos seleccionados. Esta sección no se mostrará en el catálogo.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[...new Map(nombresSeleccionados.map(p => [p.id, p])).values()].map((p) => (
              <span key={p.id} style={{
                fontSize: "12px",
                padding: "4px 12px",
                backgroundColor: "var(--color-superficie)",
                border: "0.5px solid var(--color-borde)",
                color: "var(--color-texto)",
              }}>
                {p.nombre}
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
            width: "min(640px, 95vw)",
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
              Seleccionar productos para combinar
            </h2>

            {/* FILTROS */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
                placeholder="Buscar por nombre..."
                style={{ ...estiloInput, minWidth: "140px", flex: "1 1 140px" }}
              />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{ ...estiloInput, minWidth: "140px" }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.nombre}</option>
                ))}
              </select>
              <select
                value={materialFiltro}
                onChange={(e) => setMaterialFiltro(e.target.value)}
                style={{ ...estiloInput, minWidth: "120px" }}
              >
                <option value="">Todos los materiales</option>
                {materiales.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* LISTA DE PRODUCTOS */}
            <div style={{
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              {cargando ? (
                <p style={{ fontSize: "13px", color: "var(--color-texto-muted)", textAlign: "center", padding: "32px" }}>
                  Cargando...
                </p>
              ) : productos.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--color-texto-muted)", textAlign: "center", padding: "32px" }}>
                  No hay productos
                </p>
              ) : (
                productos.map((p) => {
                  const imagen = p.imagenes.find((i) => i.esPrincipal) ?? p.imagenes[0]
                  const estaSeleccionado = seleccionTemp.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSeleccion(p)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        cursor: "pointer",
                        backgroundColor: estaSeleccionado ? "var(--color-superficie)" : "transparent",
                        border: estaSeleccionado ? "0.5px solid var(--color-texto)" : "0.5px solid var(--color-borde)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: "var(--color-superficie)",
                        flexShrink: 0,
                        position: "relative",
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
                        <p style={{
                          fontSize: "11px",
                          color: "var(--color-texto-muted)",
                          letterSpacing: "0.05em",
                        }}>
                          {p.categoria.nombre}
                          {p.material && ` — ${p.material}`}
                        </p>
                      </div>
                      <div style={{
                        width: "18px",
                        height: "18px",
                        border: estaSeleccionado ? "none" : "0.5px solid var(--color-borde)",
                        backgroundColor: estaSeleccionado ? "var(--color-texto)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {estaSeleccionado && (
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

            {/* FOOTER */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "16px",
              borderTop: "0.5px solid var(--color-borde)",
            }}>
              <span style={{
                fontSize: "12px",
                color: "var(--color-texto-muted)",
              }}>
                {seleccionTemp.length} producto{seleccionTemp.length !== 1 ? "s" : ""} seleccionado{seleccionTemp.length !== 1 ? "s" : ""}
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
                  disabled={guardando}
                  style={{
                    padding: "10px 20px",
                    fontSize: "11px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    backgroundColor: guardando ? "var(--color-texto-muted)" : "var(--color-texto)",
                    color: "var(--color-fondo)",
                    border: "none",
                    borderRadius: 0,
                    cursor: guardando ? "not-allowed" : "pointer",
                  }}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
