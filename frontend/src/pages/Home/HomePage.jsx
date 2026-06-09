import { useEffect, useState } from 'react'
import { ordersApi } from '../../api/ordersApi'
import { locationsApi } from '../../api/locations.api'
import { couriersApi } from '../../api/couriers.api'
import { auth } from '../../utils/auth'
import './homePage.css'

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
const MetricCard = ({ label, value, loading, sub, accent }) => (
  <div className="metric-card" style={{ '--accent': accent }}>
    <div className="metric-top">
      <span className="metric-dot" />
      <span className="metric-label">{label}</span>
    </div>
    {loading ? (
      <div className="metric-value loading-pulse" />
    ) : (
      <div className="metric-value">{value.toLocaleString()}</div>
    )}
    {sub && <div className="metric-sub">{sub}</div>}
  </div>
)

// Helper to generate the last 12 months buckets
const generateLast12Months = () => {
  const months = []
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  const today = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      label: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      value: 0
    })
  }
  return months
}

// ── Page ─────────────────────────────────────────────────────────────────────
export const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    activeCouriers: 0,
    deliveriesToday: 0
  })
  const [orderTrend, setOrderTrend] = useState([])

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      const session = auth.getSession()
      const myCompanyId = session?.companyId

      try {
        // 1. Fetch total orders count
        const totalOrdersRes = await ordersApi.list({
          page: 1,
          pageSize: 1,
          companyId: myCompanyId
        })
        const totalOrders = totalOrdersRes.total

        // 2. Fetch deliveries today
        const todayStr = new Date().toISOString().split('T')[0]
        const deliveriesTodayRes = await ordersApi.list({
          status: 'DELIVERED',
          dateFrom: todayStr,
          page: 1,
          pageSize: 1,
          companyId: myCompanyId
        })
        const deliveriesToday = deliveriesTodayRes.total

        // 3. Fetch active couriers
        let activeCouriers = 0
        try {
          if (myCompanyId) {
            const companyCouriers = await couriersApi.list({
              companyId: myCompanyId,
              page: 1,
              pageSize: 1000
            })
            activeCouriers = (companyCouriers.items || []).filter(c =>
              c.canTakeOrders && c.employmentStatus === 'ACTIVE'
            ).length
          } else {
            const online = await locationsApi.findNearby({
              lat: 43.238,
              lng: 76.889,
              radiusMeters: 500000,
              limit: 1000
            })
            activeCouriers = (online || []).length
          }
        } catch (err) {
          console.error('Error fetching online couriers:', err)
        }

        // 4. Fetch last 1000 orders to aggregate the monthly trend
        let trendData = generateLast12Months()
        try {
          const ordersRes = await ordersApi.list({
            page: 1,
            pageSize: 1000,
            companyId: myCompanyId
          })
          const orders = ordersRes.items || []
          
          orders.forEach(o => {
            if (!o.createdAt) return
            const d = new Date(o.createdAt)
            const m = d.getMonth()
            const y = d.getFullYear()
            const bucket = trendData.find(b => b.monthNum === m && b.year === y)
            if (bucket) {
              bucket.value += 1
            }
          })
        } catch (err) {
          console.error('Error loading order trend:', err)
        }

        if (active) {
          setMetrics({
            totalOrders,
            activeCouriers,
            deliveriesToday
          })
          setOrderTrend(trendData)
        }
      } catch (err) {
        console.error('Error loading dashboard metrics:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

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
          value={metrics.totalOrders}
          loading={loading}
          sub="за всё время"
          accent="#cd5e3d"
        />
        <MetricCard
          label="Активных курьеров"
          value={metrics.activeCouriers}
          loading={loading}
          sub="сейчас в сети"
          accent="#3b82f6"
        />
        <MetricCard
          label="Доставок сегодня"
          value={metrics.deliveriesToday}
          loading={loading}
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
          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc' }}>
              Загрузка графика...
            </div>
          ) : orderTrend.length > 0 ? (
            <LineChart data={orderTrend} />
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Нет данных для отображения
            </div>
          )}
        </div>
      </div>
    </div>
  )
}