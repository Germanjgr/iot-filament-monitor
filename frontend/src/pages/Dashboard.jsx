import { useState, useEffect, useCallback } from "react"
import { api } from "../services/api"
import StatCard      from "../components/StatCard"
import StatusBanner  from "../components/StatusBanner"
import HumidityChart from "../components/HumidityChart"
import TemperatureChart from "../components/TemperatureChart"
import AlertsList    from "../components/AlertsList"
import HistoryTable  from "../components/HistoryTable"

function getRisk(humidity) {
  if (humidity < 40)  return "SAFE"
  if (humidity <= 55) return "WARNING"
  return "RISK"
}

const TABS = ["Dashboard", "Historial", "Alertas"]

function Dashboard() {
  const [history,    setHistory]    = useState([])
  const [alerts,     setAlerts]     = useState([])
  const [activeTab,  setActiveTab]  = useState("Dashboard")
  const [lastUpdate, setLastUpdate] = useState(null)
  const [apiStatus,  setApiStatus]  = useState("connecting")

  const loadData = useCallback(async () => {
    try {
      const [historyData, alertsData] = await Promise.all([
        api.getSensorHistory({ limit: 100, hours: 24 }),
        api.getAlerts({ limit: 50 }),
      ])
      setHistory(historyData)
      setAlerts(alertsData)
      setLastUpdate(new Date())
      setApiStatus("connected")
    } catch (error) {
      console.error("Error cargando datos:", error)
      setApiStatus("error")
    }
  }, [])

  useEffect(() => {
    loadData()
    const intervalo = setInterval(loadData, 30000)
    return () => clearInterval(intervalo)
  }, [loadData])

  const latest = history[0] || {}
  const risk   = getRisk(latest.humidity || 0)

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#e2e8f0" }}>

      {/* Header */}
      <header style={{
        background:    "#0a0f1e",
        borderBottom:  "1px solid #1e293b",
        padding:       "0 24px",
        display:       "flex",
        alignItems:    "center",
        justifyContent: "space-between",
        height:        56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🧵</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>FILAMENT MONITOR</span>
          <span style={{ color: "#475569", fontSize: 11 }}>ESP32-FILAMENT-01</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <div style={{
              width:      7,
              height:     7,
              borderRadius: "50%",
              background: apiStatus === "connected" ? "#22c55e" : "#ef4444",
              boxShadow:  apiStatus === "connected" ? "0 0 8px #22c55e" : "none",
            }} />
            <span style={{ color: "#64748b" }}>
              {apiStatus === "connected" ? "API Conectada" : "Conectando..."}
            </span>
          </div>
          {lastUpdate && (
            <span style={{ color: "#334155", fontSize: 11 }}>
              Actualizado {lastUpdate.toLocaleTimeString("es-MX")}
            </span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav style={{
        display:       "flex",
        gap:           4,
        padding:       "12px 24px",
        borderBottom:  "1px solid #1e293b",
        background:    "#070d1a",
      }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding:     "6px 16px",
            borderRadius: 8,
            border:      "none",
            cursor:      "pointer",
            fontSize:    12,
            fontFamily:  "inherit",
            background:  activeTab === tab ? "#1e293b" : "transparent",
            color:       activeTab === tab ? "#e2e8f0" : "#64748b",
            transition:  "all 0.2s",
          }}>
            {tab}
            {tab === "Alertas" && alerts.length > 0 && (
              <span style={{
                background:   "#ef4444",
                color:        "white",
                fontSize:     10,
                fontWeight:   700,
                padding:      "1px 5px",
                borderRadius: 8,
                marginLeft:   6,
              }}>
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>

        {activeTab === "Dashboard" && (
          <div>
            <StatusBanner status={risk} />

            <div style={{
              display:               "grid",
              gridTemplateColumns:   "repeat(auto-fit, minmax(200px, 1fr))",
              gap:                   16,
              marginBottom:          24,
            }}>
              <StatCard
                title="Temperatura"
                value={latest.temperature ?? "--"}
                unit="°C"
                sub="Lectura más reciente"
                color="#38bdf8"
                icon="🌡️"
              />
              <StatCard
                title="Humedad"
                value={latest.humidity ?? "--"}
                unit="%"
                sub="Humedad relativa"
                color={risk === "SAFE" ? "#22c55e" : risk === "WARNING" ? "#eab308" : "#ef4444"}
                icon="💧"
              />
              <StatCard
                title="Estado"
                value={risk}
                unit=""
                sub={`${alerts.length} alertas en 24h`}
                color={risk === "SAFE" ? "#22c55e" : risk === "WARNING" ? "#eab308" : "#ef4444"}
                icon={risk === "SAFE" ? "🟢" : risk === "WARNING" ? "🟡" : "🔴"}
              />
              <StatCard
                title="Lecturas"
                value={history.length}
                unit=""
                sub="Últimas 24 horas"
                color="#a78bfa"
                icon="📊"
              />
            </div>

            <HumidityChart    data={history} />
            <TemperatureChart data={history} />
          </div>
        )}

        {activeTab === "Historial" && (
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 12 }}>
              {history.length} lecturas en las últimas 24 horas
            </div>
            <HistoryTable data={history} />
          </div>
        )}

        {activeTab === "Alertas" && (
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 12 }}>
              {alerts.length === 0 ? "Sin alertas activas" : `${alerts.length} alertas de riesgo alto`}
            </div>
            <AlertsList alerts={alerts} />
          </div>
        )}

      </main>
    </div>
  )
}

export default Dashboard