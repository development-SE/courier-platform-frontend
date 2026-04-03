import { useMemo } from 'react'
import './homePage.css'

// ── Mock data ────────────────────────────────────────────────────────────────
const METRICS = {
  totalOrders: 1284,
  activeCouriers: 37,
  deliveriesToday: 142,
}

const ORDER_TREND = [
  { label: 'Mar', value: 620 },
  { label: 'Apr', value: 780 },
  { label: 'May', value: 710 },
  { label: 'Jun', value: 920 },
  { label: 'Jul', value: 860 },
  { label: 'Aug', value: 1050 },
  { label: 'Sep', value: 980 },
  { label: 'Oct', value: 1120 },
  { label: 'Nov', value: 1060 },
  { label: 'Dec', value: 1200 },
  { label: 'Jan', value: 1140 },
  { label: 'Feb', value: 1284 },
]

// ── Tiny SVG line chart ───────────────────────────────────────────────────────
const LineChart = ({ data }) => {
  const W = 700
  const H = 220
  const PAD = { top: 20, right: 24, bottom: 36, left: 48 }

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toX = (i) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right)
  const toY = (v) => PAD.top + (1 - (v - min) / range) * (H - PAD.top - PAD.bottom)

  const points = data.map((d, i) => [toX(i), toY(d.value)])
  const polyline = points.map(p => p.join(',')).join(' ')

  // filled area path
  const areaPath = [
    `M ${points[0][0]},${H - PAD.bottom}`,
    ...points.map(p => `L ${p[0]},${p[1]}`),
    `L ${points[points.length - 1][0]},${H - PAD.bottom}`,
    'Z',
  ].join(' ')

  // y-axis tick values
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round(min + (range / ticks) * i)
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cd5e3d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#cd5e3d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = toY(tick)
        return (
          <g key={i}>
            <line
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              stroke="#e6eef8" strokeWidth="1"
            />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="chart-label">
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#cd5e3d"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots + x-labels */}
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#fff" stroke="#cd5e3d" strokeWidth="2.5" />
          <text x={x} y={H - PAD.bottom + 18} textAnchor="middle" className="chart-label">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, accent }) => (
  <div className="metric-card" style={{ '--accent': accent }}>
    <div className="metric-top">
      <span className="metric-dot" />
      <span className="metric-label">{label}</span>
    </div>
    <div className="metric-value">{value.toLocaleString()}</div>
    {sub && <div className="metric-sub">{sub}</div>}
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────
export const HomePage = () => {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Главная</h1>
        <span className="home-period">Последние 12 месяцев</span>
      </div>

      {/* Metrics row */}
      <div className="metrics-row">
        <MetricCard
          label="Всего заказов"
          value={METRICS.totalOrders}
          sub="за всё время"
          accent="#cd5e3d"
        />
        <MetricCard
          label="Активных курьеров"
          value={METRICS.activeCouriers}
          sub="сейчас в сети"
          accent="#3b82f6"
        />
        <MetricCard
          label="Доставок сегодня"
          value={METRICS.deliveriesToday}
          sub="выполнено за день"
          accent="#10b981"
        />
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-title">Заказы по месяцам</span>
        </div>
        <div className="chart-body">
          <LineChart data={ORDER_TREND} />
        </div>
      </div>
    </div>
  )
}