const RISK_CONFIG = {
  SAFE:    { color: "#22c55e", bg: "#14532d22", border: "#22c55e44" },
  WARNING: { color: "#eab308", bg: "#71350022", border: "#eab30844" },
  RISK:    { color: "#ef4444", bg: "#7f1d1d22", border: "#ef444444" },
}

function formatFecha(timestamp) {
  return new Date(timestamp).toLocaleString("es-MX", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function HistoryTable({ data }) {
  return (
    <div style={{
      background:   "#0f172a",
      border:       "1px solid #1e293b",
      borderRadius: 14,
      overflow:     "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#070d1a" }}>
            {["Timestamp", "Temperatura", "Humedad", "Nivel de Riesgo"].map((h) => (
              <th key={h} style={{
                padding:       "12px 16px",
                textAlign:     "left",
                color:         "#64748b",
                borderBottom:  "1px solid #1e293b",
                fontWeight:    500,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => {
            const cfg = RISK_CONFIG[r.risk_level]
            return (
              <tr key={r.id} style={{
                borderBottom: "1px solid #0f1629",
                background:   i % 2 === 0 ? "transparent" : "#0a1020",
              }}>
                <td style={{ padding: "10px 16px", color: "#64748b" }}>
                  {formatFecha(r.timestamp)}
                </td>
                <td style={{ padding: "10px 16px", color: "#38bdf8" }}>
                  {r.temperature}°C
                </td>
                <td style={{ padding: "10px 16px", color: "#e2e8f0" }}>
                  {r.humidity}%
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{
                    color:        cfg.color,
                    background:   cfg.bg,
                    border:       `1px solid ${cfg.border}`,
                    padding:      "2px 10px",
                    borderRadius: 6,
                    fontSize:     11,
                  }}>
                    {r.risk_level}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default HistoryTable