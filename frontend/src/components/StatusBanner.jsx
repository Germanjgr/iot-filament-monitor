import TrafficLight from "./TrafficLight"

const CONFIG = {
  SAFE: {
    color:   "#22c55e",
    bg:      "#14532d22",
    border:  "#22c55e44",
    label:   "SEGURO",
    emoji:   "🟢",
    mensaje: "Condiciones óptimas para almacenamiento de filamento",
  },
  WARNING: {
    color:   "#eab308",
    bg:      "#71350022",
    border:  "#eab30844",
    label:   "ADVERTENCIA",
    emoji:   "🟡",
    mensaje: "Humedad elevada — considera activar deshumidificador",
  },
  RISK: {
    color:   "#ef4444",
    bg:      "#7f1d1d22",
    border:  "#ef444444",
    label:   "RIESGO ALTO",
    emoji:   "🔴",
    mensaje: "⚠ ALERTA: Riesgo de degradación del filamento",
  },
}

function StatusBanner({ status }) {
  const cfg = CONFIG[status] || CONFIG.SAFE

  return (
    <div style={{
      background:    cfg.bg,
      border:        `1px solid ${cfg.border}`,
      borderRadius:  16,
      padding:       "14px 20px",
      display:       "flex",
      alignItems:    "center",
      justifyContent: "space-between",
      marginBottom:  20,
      transition:    "all 0.4s ease",
    }}>
      <div style={{
        display:    "flex",
        alignItems: "center",
        gap:        16,
      }}>
        <TrafficLight status={status} />

        <div>
          <div style={{
            color:      cfg.color,
            fontSize:   24,
            fontWeight: 800,
          }}>
            {cfg.emoji} {cfg.label}
          </div>

          <div style={{
            color:     "#94a3b8",
            fontSize:  12,
            marginTop: 4,
          }}>
            {cfg.mensaje}
          </div>
        </div>
      </div>

      <div style={{
        textAlign:  "right",
        color:      "#475569",
        fontSize:   10,
        lineHeight: 1.8,
      }}>
        <div>SAFE: &lt; 40%</div>
        <div>WARNING: 40 – 55%</div>
        <div>RISK: &gt; 55%</div>
      </div>
    </div>
  )
}

export default StatusBanner