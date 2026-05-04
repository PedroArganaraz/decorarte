"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Categoria } from "@prisma/client"

interface Props {
  categorias: Categoria[]
  accionesExtra?: React.ReactNode
  producto?: {
    id: string
    nombre: string
    descripcion: string | null
    precio: number
    precioAnterior: number | null
    stock: number
    activo: boolean
    destacado: boolean
    material: string | null
    categoriaId: string
  }
}

const MATERIALES_POR_CATEGORIA: Record<string, string[]> = {
  "Aros": ["Acero dorado", "Acero blanco"],
  "Collares": ["Chokers", "Piedras", "Cadenas"],
  "Pulseras": ["Acero dorado", "Acero blanco", "Eco-cuero"],
  "Anillos": ["Piedras + Dorado", "Acero blanco", "Piedras + Plateado"],
}

const MATERIALES_DEFAULT = ["Acero dorado", "Acero blanco", "Otro"]

export default function FormularioProducto({ categorias, accionesExtra, producto }: Props) {
  const router = useRouter()
  const esEdicion = !!producto

  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto?.precio?.toString() ?? "",
    precioAnterior: producto?.precioAnterior?.toString() ?? "",
    stock: producto?.stock?.toString() ?? "0",
    activo: producto?.activo ?? true,
    destacado: producto?.destacado ?? false,
    material: producto?.material ?? "",
    categoriaId: producto?.categoriaId ?? "",
  })

  const [cargando, setCargando] = useState(false)

  const categoriaNombre = categorias.find(
    (c) => c.id === form.categoriaId
  )?.nombre ?? ""

  const materialesDisponibles =
    MATERIALES_POR_CATEGORIA[categoriaNombre] ?? MATERIALES_DEFAULT

  const actualizar = (campo: string, valor: string | boolean) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      precioAnterior: form.precioAnterior ? parseFloat(form.precioAnterior) : null,
      stock: parseInt(form.stock),
      activo: form.activo,
      destacado: form.destacado,
      material: form.material || null,
      categoriaId: form.categoriaId,
    }

    const url = esEdicion ? `/api/productos/${producto.id}` : "/api/productos"
    const metodo = esEdicion ? "PUT" : "POST"

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al guardar el producto")
      setCargando(false)
      return
    }

    toast.success(esEdicion ? "Producto actualizado" : "Producto creado")
    router.push("/panel/productos")
    router.refresh()
  }

  const estiloLabel = {
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-texto-muted)",
    display: "block",
    marginBottom: "6px",
  } as React.CSSProperties

  const estiloInput = {
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    width: "100%",
  } as React.CSSProperties

  return (
    <form id="formulario-producto" onSubmit={manejarEnvio}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "18px",
            fontWeight: 400,
            color: "var(--color-texto)",
            marginBottom: "4px",
          }}>
            Información general
          </h2>

          <div>
            <label style={estiloLabel}>Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
              required
              placeholder="Ej: Aros Tetra"
              style={estiloInput}
            />
          </div>

          <div>
            <label style={estiloLabel}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)}
              rows={4}
              placeholder="Descripción del producto..."
              style={{ ...estiloInput, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={estiloLabel}>Categoría *</label>
            <select
              value={form.categoriaId}
              onChange={(e) => {
                const nuevaCategoria = e.target.value
                const nombreNuevaCategoria = categorias.find(
                  (c) => c.id === nuevaCategoria
                )?.nombre ?? ""
                const nuevosMateriales =
                  MATERIALES_POR_CATEGORIA[nombreNuevaCategoria] ?? MATERIALES_DEFAULT
                actualizar("categoriaId", nuevaCategoria)
                if (!nuevosMateriales.includes(form.material as string)) {
                  actualizar("material", "")
                }
              }}
              required
              style={estiloInput}
            >
              <option value="">Seleccioná una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={estiloLabel}>Material</label>
            <select
              value={form.material}
              onChange={(e) => actualizar("material", e.target.value)}
              style={estiloInput}
            >
              <option value="">Sin especificar</option>
              {materialesDisponibles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 400,
              color: "var(--color-texto)",
              marginBottom: "4px",
            }}>
              Precio y stock
            </h2>

            <div>
              <label style={estiloLabel}>Precio *</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => actualizar("precio", e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="0"
                style={estiloInput}
              />
            </div>

            <div>
              <label style={estiloLabel}>Precio anterior (opcional)</label>
              <input
                type="number"
                value={form.precioAnterior}
                onChange={(e) => actualizar("precioAnterior", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                style={estiloInput}
              />
            </div>

            <div>
              <label style={estiloLabel}>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => actualizar("stock", e.target.value)}
                min="0"
                step="1"
                style={estiloInput}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 400,
              color: "var(--color-texto)",
              marginBottom: "4px",
            }}>
              Visibilidad
            </h2>

            {[
              { campo: "activo", label: "Producto activo (visible en el catálogo)" },
              { campo: "destacado", label: "Producto destacado (aparece en el home)" },
            ].map(({ campo, label }) => (
              <label
                key={campo}
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
                  checked={form[campo as keyof typeof form] as boolean}
                  onChange={(e) => actualizar(campo, e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "var(--color-texto)" }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {accionesExtra}
    </form>
  )
}
