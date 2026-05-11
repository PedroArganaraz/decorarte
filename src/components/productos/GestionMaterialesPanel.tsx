"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"

interface Categoria {
  id: string
  nombre: string
}

interface Material {
  id: string
  nombre: string
  categorias: { id: string; nombre: string }[]
  _count: { productos: number }
}

interface Props {
  categorias: Categoria[]
  materialesIniciales: Material[]
}

export default function GestionMaterialesPanel({ categorias, materialesIniciales }: Props) {
  const [materiales, setMateriales] = useState<Material[]>(materialesIniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Material | null>(null)
  const [nombre, setNombre] = useState("")
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const router = useRouter()
  const { esMobile } = useTamanioPantalla()

  const abrirCrear = () => {
    setEditando(null)
    setNombre("")
    setCategoriasSeleccionadas([])
    setModalAbierto(true)
  }

  const abrirEditar = (material: Material) => {
    setEditando(material)
    setNombre(material.nombre)
    setCategoriasSeleccionadas(material.categorias.map((c) => c.id))
    setModalAbierto(true)
  }

  const toggleCategoria = (id: string) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const url = editando ? `/api/materiales/${editando.id}` : "/api/materiales"
    const metodo = editando ? "PUT" : "POST"

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, categoriaIds: categoriasSeleccionadas }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al guardar")
      setCargando(false)
      return
    }

    if (editando) {
      setMateriales((prev) =>
        prev.map((m) => (m.id === editando.id ? data.datos : m))
      )
      toast.success("Material actualizado")
    } else {
      setMateriales((prev) => [...prev, data.datos].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      toast.success("Material creado")
    }

    setModalAbierto(false)
    setCargando(false)
    router.refresh()
  }

  const eliminar = async (id: string) => {
    setEliminando(id)
    const res = await fetch(`/api/materiales/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al eliminar")
      setEliminando(null)
      setConfirmando(null)
      return
    }

    setMateriales((prev) => prev.filter((m) => m.id !== id))
    toast.success("Material eliminado")
    setEliminando(null)
    setConfirmando(null)
  }

  const estiloInput = {
    padding: "10px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    width: "100%",
  } as React.CSSProperties

  const estiloLabel = {
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--color-texto-muted)",
    display: "block",
    marginBottom: "6px",
  }

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
          Materiales
        </h1>
        <button
          onClick={abrirCrear}
          style={{
            padding: "10px 20px",
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
          + Nuevo material
        </button>
      </div>

      {/* LISTA / TABLA */}
      {materiales.length === 0 ? (
        <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "48px", textAlign: "center", fontSize: "13px", color: "var(--color-texto-muted)" }}>
          No hay materiales cargados todavía
        </div>
      ) : esMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {materiales.map((mat) => {
            const esConfirmando = confirmando === mat.id
            const estiloBoton: React.CSSProperties = { padding: "6px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 0, cursor: "pointer", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)" }
            return (
              <div key={mat.id} style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontSize: "15px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)" }}>{mat.nombre}</span>
                  <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)" }}>{mat._count.productos} prod.</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                  {mat.categorias.length === 0 ? (
                    <span style={{ fontSize: "11px", color: "var(--color-texto-sutil)" }}>Sin categoría</span>
                  ) : mat.categorias.map((cat) => (
                    <span key={cat.id} style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", backgroundColor: "var(--color-superficie)", color: "var(--color-texto-muted)", border: "0.5px solid var(--color-borde)" }}>{cat.nombre}</span>
                  ))}
                </div>
                {esConfirmando ? (
                  <div style={{ borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", margin: "0 0 8px" }}>¿Eliminar este material?</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => eliminar(mat.id)} disabled={eliminando === mat.id} style={{ ...estiloBoton, backgroundColor: "#A32D2D", color: "#FFFFFF", border: "none" }}>
                        {eliminando === mat.id ? "..." : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmando(null)} style={estiloBoton}>No</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <button onClick={() => abrirEditar(mat)} style={{ ...estiloBoton, border: "0.5px solid var(--color-texto)", color: "var(--color-texto)" }}>Editar</button>
                    <button onClick={() => setConfirmando(mat.id)} style={estiloBoton}>Eliminar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Nombre", "Categorías", "Productos", ""].map((col) => (
                  <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-texto-muted)" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materiales.map((mat) => (
                <tr key={mat.id} style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "var(--color-texto)" }}>{mat.nombre}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {mat.categorias.length === 0 ? (
                        <span style={{ fontSize: "12px", color: "var(--color-texto-sutil)" }}>Sin categoría</span>
                      ) : mat.categorias.map((cat) => (
                        <span key={cat.id} style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", backgroundColor: "var(--color-superficie)", color: "var(--color-texto-muted)", border: "0.5px solid var(--color-borde)" }}>{cat.nombre}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--color-texto-muted)" }}>{mat._count.productos}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      <button onClick={() => abrirEditar(mat)} style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", backgroundColor: "transparent", color: "var(--color-texto)", border: "0.5px solid var(--color-texto)", borderRadius: 0, cursor: "pointer" }}>Editar</button>
                      {confirmando === mat.id ? (
                        <>
                          <button onClick={() => eliminar(mat.id)} disabled={eliminando === mat.id} style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", backgroundColor: "#A32D2D", color: "#FFFFFF", border: "none", borderRadius: 0, cursor: "pointer" }}>{eliminando === mat.id ? "..." : "Confirmar"}</button>
                          <button onClick={() => setConfirmando(null)} style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", backgroundColor: "transparent", color: "var(--color-texto-muted)", border: "0.5px solid var(--color-borde)", borderRadius: 0, cursor: "pointer" }}>No</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmando(mat.id)} style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", backgroundColor: "transparent", color: "var(--color-texto-muted)", border: "0.5px solid var(--color-borde)", borderRadius: 0, cursor: "pointer" }}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <>
          <div
            onClick={() => setModalAbierto(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(44, 44, 42, 0.3)",
              zIndex: 100,
              cursor: "pointer",
            }}
          />
          <div style={{
            position: "fixed",
            top: esMobile ? "0" : "50%",
            left: esMobile ? "0" : "50%",
            right: esMobile ? "0" : undefined,
            bottom: esMobile ? "0" : undefined,
            transform: esMobile ? "none" : "translate(-50%, -50%)",
            zIndex: 101,
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: esMobile ? "24px 16px" : "32px",
            width: esMobile ? "100%" : "400px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "var(--color-texto)",
              marginBottom: "24px",
            }}>
              {editando ? "Editar material" : "Nuevo material"}
            </h2>

            <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={estiloLabel}>Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Acero dorado"
                  style={estiloInput}
                />
              </div>

              <div>
                <label style={estiloLabel}>Categorías</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {categorias.map((cat) => (
                    <label
                      key={cat.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "var(--color-texto)",
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: 300,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={categoriasSeleccionadas.includes(cat.id)}
                        onChange={() => toggleCategoria(cat.id)}
                        style={{ width: "14px", height: "14px", accentColor: "var(--color-texto)" }}
                      />
                      {cat.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={cargando}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "11px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 400,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    backgroundColor: cargando ? "var(--color-texto-muted)" : "var(--color-texto)",
                    color: "var(--color-fondo)",
                    border: "none",
                    borderRadius: 0,
                    cursor: cargando ? "not-allowed" : "pointer",
                  }}
                >
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "11px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 400,
                    letterSpacing: "0.12em",
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
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
