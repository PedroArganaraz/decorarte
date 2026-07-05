"use client"

import { useState, useEffect } from "react"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Categoria } from "@prisma/client"

interface InsumoEnForm {
  insumoId: number
  nombre: string
  precioUnitario: number
  cantidadDisponible: number
  unidad: string
  cantidadUsada: number
}

interface Props {
  categorias: Categoria[]
  accionesExtra?: React.ReactNode
  insumosIniciales?: InsumoEnForm[]
  producto?: {
    id: string
    nombre: string
    descripcion: string | null
    precio: number
    precioAnterior: number | null
    costo: number | null
    precioMinimo: number | null
    stock: number
    activo: boolean
    destacado: boolean
    material: string | null
    talle: string | null
    color: string | null
    categoriaId: string
    creadoEn?: string
  }
}

export default function FormularioProducto({ categorias, accionesExtra, producto, insumosIniciales }: Props) {
  const router = useRouter()
  const esEdicion = !!producto

  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto?.precio?.toString() ?? "",
    precioAnterior: producto?.precioAnterior?.toString() ?? "",
    costo: producto?.costo?.toString() ?? "",
    precioMinimo: producto?.precioMinimo?.toString() ?? "",
    stock: producto?.stock?.toString() ?? "0",
    activo: producto?.activo ?? true,
    destacado: producto?.destacado ?? false,
    material: producto?.material ?? "",
    talle: producto?.talle ?? "",
    color: producto?.color ?? "",
    categoriaId: producto?.categoriaId ?? "",
    creadoEn: producto?.creadoEn ?? new Date().toISOString().split("T")[0],
  })

  const [cargando, setCargando] = useState(false)
  const [materialesDisponibles, setMaterialesDisponibles] = useState<string[]>([])
  const [campoFocus, setCampoFocus] = useState<string | null>(null)

  // Insumos
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<InsumoEnForm[]>(insumosIniciales ?? [])
  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoEnForm[]>([])
  const [mostrarAgregarInsumo, setMostrarAgregarInsumo] = useState(false)
  const [insumoParaAgregar, setInsumoParaAgregar] = useState({ insumoId: "", cantidad: "" })
  const [costoManual, setCostoManual] = useState(false)

  const { esMobile } = useTamanioPantalla()

  const esAnillos = categorias.find(
    (c) => c.id === form.categoriaId
  )?.nombre === "Anillos"

  useEffect(() => {
    if (!form.categoriaId) {
      setMaterialesDisponibles([])
      return
    }
    fetch(`/api/materiales?categoriaId=${form.categoriaId}`)
      .then((res) => res.json())
      .then((data) => setMaterialesDisponibles((data.datos ?? []).map((m: { nombre: string }) => m.nombre)))
  }, [form.categoriaId])

  useEffect(() => {
    fetch("/api/insumos")
      .then((r) => r.json())
      .then((d) => {
        setInsumosDisponibles((d.datos ?? []).map((i: { id: number; nombre: string; precioUnitario: number; cantidadDisponible: number; unidad: string }) => ({
          insumoId: i.id,
          nombre: i.nombre,
          precioUnitario: i.precioUnitario,
          cantidadDisponible: i.cantidadDisponible,
          unidad: i.unidad,
          cantidadUsada: 0,
        })))
      })
      .catch(() => {})
  }, [])

  // Actualizar costo automáticamente cuando cambian los insumos (salvo que sea manual)
  useEffect(() => {
    if (costoManual) return
    if (insumosSeleccionados.length === 0) return
    const costoCalculado = insumosSeleccionados.reduce(
      (sum, i) => sum + i.precioUnitario * i.cantidadUsada,
      0
    )
    setForm((prev) => {
      const precioMinimo = costoCalculado > 0 ? String(Math.round(costoCalculado * 3)) : prev.precioMinimo
      return { ...prev, costo: String(Math.round(costoCalculado * 100) / 100), precioMinimo }
    })
  }, [insumosSeleccionados, costoManual])

  const actualizar = (campo: string, valor: string | boolean) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const actualizarCosto = (valor: string) => {
    setCostoManual(true)
    setForm((prev) => {
      const costoNum = parseFloat(valor)
      const precioMinimo = !isNaN(costoNum) && costoNum > 0
        ? String(Math.round(costoNum * 3))
        : prev.precioMinimo
      return { ...prev, costo: valor, precioMinimo }
    })
  }

  const agregarInsumo = () => {
    const insumo = insumosDisponibles.find((i) => i.insumoId === parseInt(insumoParaAgregar.insumoId))
    if (!insumo) return
    const cantidad = parseFloat(insumoParaAgregar.cantidad)
    if (isNaN(cantidad) || cantidad <= 0) return

    // Para edición: disponible real = cantidadDisponible + lo que ya tenía asignado este producto
    const yaAsignado = insumosIniciales?.find((ii) => ii.insumoId === insumo.insumoId)?.cantidadUsada ?? 0
    const disponibleReal = insumo.cantidadDisponible + yaAsignado
    if (cantidad > disponibleReal) return

    setInsumosSeleccionados((prev) => {
      const existe = prev.find((i) => i.insumoId === insumo.insumoId)
      if (existe) {
        return prev.map((i) => i.insumoId === insumo.insumoId ? { ...i, cantidadUsada: cantidad } : i)
      }
      return [...prev, { ...insumo, cantidadUsada: cantidad }]
    })
    setCostoManual(false)
    setInsumoParaAgregar({ insumoId: "", cantidad: "" })
    setMostrarAgregarInsumo(false)
  }

  const quitarInsumo = (insumoId: number) => {
    setInsumosSeleccionados((prev) => prev.filter((i) => i.insumoId !== insumoId))
    setCostoManual(false)
  }

  const valorDisplay = (campo: string, valor: string) => {
    if (campoFocus === campo || valor === "") return valor
    const num = Number(valor)
    return isNaN(num) ? valor : num.toLocaleString("es-AR")
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      precioAnterior: form.precioAnterior ? parseFloat(form.precioAnterior) : null,
      costo: form.costo ? parseFloat(form.costo) : null,
      precioMinimo: form.precioMinimo ? parseFloat(form.precioMinimo) : null,
      stock: parseInt(form.stock),
      activo: form.activo,
      destacado: form.destacado,
      material: form.material || null,
      talle: form.talle || null,
      color: form.color || null,
      categoriaId: form.categoriaId,
      creadoEn: form.creadoEn ? new Date(form.creadoEn + "T12:00:00.000Z").toISOString() : undefined,
      insumos: insumosSeleccionados.map((i) => ({ insumoId: i.insumoId, cantidadUsada: i.cantidadUsada })),
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
        gridTemplateColumns: esMobile ? "1fr" : "1fr 1fr",
        gap: esMobile ? "16px" : "24px",
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
                actualizar("categoriaId", e.target.value)
                actualizar("material", "")
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
              {materialesDisponibles.length === 0 ? (
                <option disabled value="">Sin materiales cargados</option>
              ) : (
                materialesDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))
              )}
            </select>
          </div>

          {esAnillos && (
            <div>
              <label style={estiloLabel}>Talle (opcional)</label>
              <input
                type="text"
                value={form.talle}
                onChange={(e) => actualizar("talle", e.target.value)}
                placeholder="Ej: 18, 19, Regulable"
                style={estiloInput}
              />
            </div>
          )}

          <div>
            <label style={estiloLabel}>Color (opcional)</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => actualizar("color", e.target.value)}
              placeholder="Ej: Dorado, Plateado, Negro"
              style={estiloInput}
            />
          </div>

          <div>
            <label style={estiloLabel}>Fecha de ingreso</label>
            <input
              type="date"
              value={form.creadoEn}
              onChange={(e) => actualizar("creadoEn", e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              style={{ ...estiloInput, cursor: "pointer" }}
            />
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
                type="text"
                inputMode="decimal"
                value={valorDisplay("precio", form.precio)}
                onChange={(e) => actualizar("precio", e.target.value)}
                onFocus={(e) => { setCampoFocus("precio"); e.target.select() }}
                onBlur={() => setCampoFocus(null)}
                required
                placeholder="0"
                style={estiloInput}
              />
              {form.precio && form.precioMinimo &&
                parseFloat(form.precio) > 0 &&
                parseFloat(form.precioMinimo) > 0 &&
                parseFloat(form.precio) < parseFloat(form.precioMinimo) && (
                <p style={{
                  fontSize: "11px",
                  fontFamily: "'Jost', sans-serif",
                  color: "var(--color-acento)",
                  padding: "7px 10px",
                  border: "0.5px solid var(--color-acento)",
                  backgroundColor: "#fdf5f3",
                  margin: "6px 0 0",
                }}>
                  El precio de venta está por debajo del mínimo rentable.
                </p>
              )}
            </div>

            <div>
              <label style={estiloLabel}>Precio nuevo (opcional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valorDisplay("precioAnterior", form.precioAnterior)}
                onChange={(e) => actualizar("precioAnterior", e.target.value)}
                onFocus={(e) => { setCampoFocus("precioAnterior"); e.target.select() }}
                onBlur={() => setCampoFocus(null)}
                placeholder="0"
                style={estiloInput}
              />
            </div>

            <div>
              <label style={estiloLabel}>Stock</label>
              <input
                type="text"
                inputMode="numeric"
                value={valorDisplay("stock", form.stock)}
                onChange={(e) => actualizar("stock", e.target.value)}
                onFocus={(e) => { setCampoFocus("stock"); e.target.select() }}
                onBlur={() => setCampoFocus(null)}
                style={estiloInput}
              />
            </div>

            <div style={{
              borderTop: "0.5px solid var(--color-borde)",
              paddingTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
              <p style={{
                fontSize: "9px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-texto-muted)",
                margin: 0,
              }}>
                Rentabilidad
              </p>

              <div>
                <label style={estiloLabel}>Costo (opcional)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorDisplay("costo", form.costo)}
                  onChange={(e) => actualizarCosto(e.target.value)}
                  onFocus={(e) => { setCampoFocus("costo"); e.target.select() }}
                  onBlur={() => setCampoFocus(null)}
                  placeholder="0"
                  style={estiloInput}
                />
                {form.costo && parseFloat(form.costo) > 0 && (
                  <p style={{
                    fontSize: "10px",
                    fontFamily: "'Jost', sans-serif",
                    color: "var(--color-texto-muted)",
                    margin: "5px 0 0",
                    letterSpacing: "0.03em",
                  }}>
                    Precio mínimo sugerido: ${Math.round(parseFloat(form.costo) * 3).toLocaleString("es-AR")}
                  </p>
                )}
              </div>

              <div>
                <label style={estiloLabel}>Precio mínimo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorDisplay("precioMinimo", form.precioMinimo)}
                  onChange={(e) => actualizar("precioMinimo", e.target.value)}
                  onFocus={(e) => { setCampoFocus("precioMinimo"); e.target.select() }}
                  onBlur={() => setCampoFocus(null)}
                  placeholder="0"
                  style={estiloInput}
                />
              </div>
            </div>
          </div>

          {/* INSUMOS */}
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 400, color: "var(--color-texto)", marginBottom: "4px" }}>
              Insumos utilizados
            </h2>

            {insumosSeleccionados.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {insumosSeleccionados.map((ins) => {
                  const costoParcial = ins.precioUnitario * ins.cantidadUsada
                  return (
                    <div key={ins.insumoId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", backgroundColor: "var(--color-fondo)", border: "0.5px solid var(--color-borde)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", display: "block" }}>{ins.nombre}</span>
                        <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.04em" }}>
                          {ins.cantidadUsada} {ins.unidad} · ${costoParcial.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <button type="button" onClick={() => quitarInsumo(ins.insumoId)} style={{ padding: "3px 8px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: "pointer", borderRadius: 0, flexShrink: 0 }}>
                        ✕
                      </button>
                    </div>
                  )
                })}
                <p style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", margin: "4px 0 0", letterSpacing: "0.04em" }}>
                  Costo total insumos: <strong style={{ color: "var(--color-texto)" }}>${insumosSeleccionados.reduce((s, i) => s + i.precioUnitario * i.cantidadUsada, 0).toLocaleString("es-AR")}</strong>
                </p>
              </div>
            )}

            {mostrarAgregarInsumo ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", backgroundColor: "var(--color-fondo)", border: "0.5px solid var(--color-borde)" }}>
                <select
                  value={insumoParaAgregar.insumoId}
                  onChange={(e) => setInsumoParaAgregar((p) => ({ ...p, insumoId: e.target.value }))}
                  style={{ ...estiloInput, fontSize: "13px", border: "0.5px solid var(--color-texto)" }}
                >
                  <option value="">Seleccioná un insumo</option>
                  {insumosDisponibles
                    .filter((i) => !insumosSeleccionados.some((s) => s.insumoId === i.insumoId))
                    .map((i) => {
                      const yaAsignado = insumosIniciales?.find((ii) => ii.insumoId === i.insumoId)?.cantidadUsada ?? 0
                      const disponibleReal = i.cantidadDisponible + yaAsignado
                      return (
                        <option key={i.insumoId} value={i.insumoId} disabled={disponibleReal <= 0}>
                          {i.nombre} — disponible: {disponibleReal} {i.unidad}
                        </option>
                      )
                    })}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={insumoParaAgregar.cantidad}
                    onChange={(e) => setInsumoParaAgregar((p) => ({ ...p, cantidad: e.target.value }))}
                    placeholder="Cantidad"
                    style={{ ...estiloInput, fontSize: "13px", width: "140px", border: "0.5px solid var(--color-texto)", appearance: "textfield" } as React.CSSProperties}
                  />
                  <button type="button" onClick={agregarInsumo} style={{ padding: "8px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", backgroundColor: "var(--color-texto)", color: "var(--color-fondo)", cursor: "pointer", borderRadius: 0 }}>
                    Agregar
                  </button>
                  <button type="button" onClick={() => { setMostrarAgregarInsumo(false); setInsumoParaAgregar({ insumoId: "", cantidad: "" }) }} style={{ padding: "8px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: "pointer", borderRadius: 0 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setMostrarAgregarInsumo(true)} style={{ padding: "8px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: "pointer", borderRadius: 0, alignSelf: "flex-start" }}>
                + Agregar insumo
              </button>
            )}
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
