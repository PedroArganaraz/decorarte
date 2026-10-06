// OJO: en la base los nombres de los campos de precio son engañosos.
//
//   precio         -> precio ORIGINAL (el que se muestra tachado cuando hay descuento)
//   precioAnterior -> precio CON DESCUENTO (en el formulario es "Precio nuevo (opcional)")
//
// El precio efectivo (el que paga el cliente) es precioAnterior si hay descuento
// y precio si no. Todo orden, filtro o cálculo de venta debe usar este helper.
// No hay fechas de vigencia: el descuento existe mientras precioAnterior tenga valor.

type ValorPrecio = number | string | { toString(): string } | null | undefined

export interface CamposPrecio {
  precio: ValorPrecio
  precioAnterior?: ValorPrecio
}

export function precioEfectivo({ precio, precioAnterior }: CamposPrecio): number {
  const conDescuento = precioAnterior == null ? NaN : Number(precioAnterior)
  if (Number.isFinite(conDescuento) && conDescuento > 0) return conDescuento
  return Number(precio)
}

interface ItemOrdenable extends CamposPrecio {
  id: string
  creadoEn: Date
}

// Ordena por precio efectivo. Desempate estable: creadoEn descendente y después id.
export function ordenarPorPrecioEfectivo<T extends ItemOrdenable>(
  items: T[],
  direccion: "asc" | "desc"
): T[] {
  const signo = direccion === "asc" ? 1 : -1
  return items
    .map((item) => ({ item, efectivo: precioEfectivo(item) }))
    .sort((a, b) => {
      if (a.efectivo !== b.efectivo) return (a.efectivo - b.efectivo) * signo
      const porFecha = b.item.creadoEn.getTime() - a.item.creadoEn.getTime()
      if (porFecha !== 0) return porFecha
      return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0
    })
    .map(({ item }) => item)
}
