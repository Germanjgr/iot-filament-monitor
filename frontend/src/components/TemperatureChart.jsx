import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

function formatHora(timestamp) {
  return new Date(timestamp).toLocaleTimeString("es-MX", {
    hour:   "2-digit",
    minute: "2-digit",
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background:   "#1e293b",
      border:       "1px solid #334155",
      borderRadius: 10,
      padding:      "10px 14px",
      fontSize:     12,
    }}>
      <div style={{ color: "#64748b", marginBottom: 6 }}>
        {formatHora(label)}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <b>{p.value}°C</b>
        </div>
      ))}
    </div>
  )
}

function TemperatureChart({ data }) {
  const chartData = [...data]
    .reverse()
    .slice(-24)
    .map((r) => ({
      ts:           r.timestamp,
      Temperatura:  r.temperature,
    }))

  return (
    <div style={{
      background:   "#0f172a",
      border:       "1px solid #1e293b",
      borderRadius: 14,
      padding:      "18px 20px",
    }}>
      <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 14 }}>
        🌡️ Historial de Temperatura — últimas 24h
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />

          <XAxis
            dataKey="ts"
            tickFormatter={formatHora}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickLine={false}
          />

          <YAxis
            domain={[15, 35]}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="Temperatura"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TemperatureChart