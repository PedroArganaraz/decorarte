import type { Prisma } from "@prisma/client"

// Tolerancia para que errores de redondeo en Float (0.1 + 0.2) no dejen un insumo "abierto" con ~0.
const EPSILON = 1e-9

// Descuenta stock y, si queda en 0 o menos, cierra el insumo en la misma transacción.
export async function descontarInsumo(
  tx: Prisma.TransactionClient,
  insumoId: number,
  cantidad: number
) {
  const actualizado = await tx.insumo.update({
    where: { id: insumoId },
    data: { cantidadDisponible: { decrement: Number(cantidad) } },
  })
  if (Number(actualizado.cantidadDisponible) <= EPSILON) {
    await tx.insumo.update({ where: { id: insumoId }, data: { cerrado: true } })
  }
}

// Devuelve stock solo si el insumo sigue abierto. Los cerrados no se reabren ni se les suma stock.
export async function restaurarInsumo(
  tx: Prisma.TransactionClient,
  insumoId: number,
  cantidad: number
) {
  await tx.insumo.updateMany({
    where: { id: insumoId, cerrado: false },
    data: { cantidadDisponible: { increment: Number(cantidad) } },
  })
}
