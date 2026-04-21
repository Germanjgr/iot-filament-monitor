function StatCard({ title, value, unit, sub, color, icon }) {
  return (
    <div style={{
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 14,
      padding: "16px 18px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            color: "#64748b",
            fontSize: 15,
            marginBottom: 4,
          }}>
            {title}
          </div>

          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: color,
            lineHeight: 1,
          }}>
            {value}
            <span style={{
              fontSize: 13,
              marginLeft: 3,
              color: "#94a3b8",
            }}>
              {unit}
            </span>
          </div>

          {sub && (
            <div style={{
              color: "#475569",
              fontSize: 15,
              marginTop: 5,
            }}>
              {sub}
            </div>
          )}
        </div>

        <span style={{ fontSize: 22, opacity: 0.7 }}>
          {icon}
        </span>
      </div>
    </div>
  )
}

export default StatCard