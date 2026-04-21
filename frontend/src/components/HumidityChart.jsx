import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
          {p.name}: <b>{p.value}%</b>
        </div>
      ))}
    </div>
  )
}

function HumidityChart({ data }) {
  const chartData = [...data]
    .reverse()
    .slice(-24)
    .map((r) => ({
      ts:       r.timestamp,
      Humedad:  r.humidity,
    }))

  return (
    <div style={{
      background:   "#0f172a",
      border:       "1px solid #1e293b",
      borderRadius: 14,
      padding:      "18px 20px",
      marginBottom: 16,
    }}>
      <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 14 }}>
        📈 Historial de Humedad — últimas 24h
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />

          <XAxis
            dataKey="ts"
            tickFormatter={formatHora}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickLine={false}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="Humedad"
            stroke="#38bdf8"
            fill="url(#humGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HumidityChart