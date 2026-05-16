import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "16px 20px" }}>
      <div className="skeleton-block" style={{ height: "10px", width: "55%", marginBottom: "12px" }} />
      <div className="skeleton-block" style={{ height: "28px", width: "70%" }} />
    </div>
  )
}

export function SkeletonTable({ cols, filas = 5 }: { cols: number[]; filas?: number }) {
  return (
    <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Array.from({ length: filas }).map((_, i) => (
            <tr key={i} style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
              {cols.map((w, j) => (
                <td key={j} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                  {w > 0 && <div className="skeleton-block" style={{ height: "14px", width: `${w}%` }} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonCardMobile() {
  return (
    <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <div className="skeleton-block" style={{ height: "12px", width: "38%" }} />
        <div className="skeleton-block" style={{ height: "18px", width: "22%" }} />
      </div>
      <div className="skeleton-block" style={{ height: "14px", width: "75%", marginBottom: "8px" }} />
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <div className="skeleton-block" style={{ height: "10px", width: "22%" }} />
        <div className="skeleton-block" style={{ height: "10px", width: "18%" }} />
      </div>
      <div style={{ borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px", display: "flex", gap: "8px" }}>
        <div className="skeleton-block" style={{ height: "28px", width: "60px" }} />
        <div className="skeleton-block" style={{ height: "28px", width: "60px" }} />
      </div>
    </div>
  )
}

export { Skeleton }
