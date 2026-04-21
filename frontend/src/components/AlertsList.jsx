function formatFecha(timestamp) {
  return new Date(timestamp).toLocaleString("es-MX", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function AlertsList({ alerts }) {
  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign:    "center",
        padding:      60,
        background:   "#0f172a",
        border:       "1px solid #1e293b",
        borderRadius: 16,
        color:        "#22c55e",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Sin Alertas</div>
        <div style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>
          El filamento está en condiciones seguras
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {alerts.map((alert) => (
        <div key={alert.id} style={{
          background:     "#1c0a0a",
          border:         "1px solid #ef444433",
          borderRadius:   12,
          padding:        "12px 16px",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
        }}>
          <div>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
              🔴 RIESGO — Humedad crítica detectada
            </div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>
              {formatFecha(alert.timestamp)} — {alert.device_id}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700 }}>
              {alert.humidity}%
            </div>
            <div style={{ color: "#64748b", fontSize: 11 }}>
              {alert.temperature}°C
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AlertsList