const COLORES = {
  SAFE:    "#22c55e",
  WARNING: "#eab308",
  RISK:    "#ef4444",
}

function TrafficLight({ status }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "12px 10px",
      background: "#0f172a",
      borderRadius: 20,
      border: "1px solid #1e293b",
    }}>
      {["RISK", "WARNING", "SAFE"].map((nivel) => {
        const esActivo = status === nivel
        const color    = COLORES[nivel]

        return (
          <div
            key={nivel}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: esActivo ? color : "#1e293b",
              boxShadow: esActivo ? `0 0 14px 4px ${color}88` : "none",
              transition: "all 0.4s ease",
            }}
          />
        )
      })}
    </div>
  )
}

export default TrafficLight