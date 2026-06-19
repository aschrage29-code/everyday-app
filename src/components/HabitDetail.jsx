import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import HabitLogModal from './HabitLogModal'

export default function HabitDetail({ habit, onClose, onEdit }) {
  const [logs, setLogs] = useState([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  useEffect(() => {
    fetchLogs()
  }, [calendarDate])

  useEffect(() => {
    if (!loading && recentLogs.length > 0) {
      renderChart()
    }
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [logs, loading])

  async function fetchLogs() {
    setLoading(true)
    const { year, month } = calendarDate
    const startOfMonth = new Date(year, month, 1)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fetchFrom = startOfMonth < thirtyDaysAgo ? startOfMonth : thirtyDaysAgo
    const fetchFromStr = fetchFrom.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('item_id', habit.id)
      .gte('date', fetchFromStr)
      .order('date', { ascending: true })

    if (!error) setLogs(data || [])
    setLoading(false)
  }

  function getAverage() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const recentLogs = logs.filter(l => l.date >= thirtyDaysAgoStr)
    if (recentLogs.length === 0) return null
    const sum = recentLogs.reduce((acc, log) => acc + log.value, 0)
    return (sum / recentLogs.length).toFixed(1)
  }

  function getStreak() {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
    const relevant = sorted.filter(l => l.date !== todayStr)
    let streak = 0
    let cursor = new Date()
    cursor.setDate(cursor.getDate() - 1)
    for (let log of relevant) {
      const cursorStr = cursor.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      if (log.date !== cursorStr) break
      if (habit.goal_direction === 'up' && log.value <= 0) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  function buildChartData() {
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 864e5)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const logMap = {}
    logs.forEach(l => { logMap[l.date] = l.value })

    const dates = []
    const values = []
    const cursor = new Date(Date.now() - 30 * 864e5)

    for (let i = 0; i <= 30; i++) {
      const dateStr = cursor.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      if (dateStr <= todayStr) {
        dates.push(dateStr)
        values.push(logMap[dateStr] !== undefined ? logMap[dateStr] : null)
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return { dates, values }
  }

  function renderChart() {
    if (!chartRef.current) return
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
      chartInstanceRef.current = null
    }

    const { dates, values } = buildChartData()
    const goalValue = habit.goal_value || 0

    const colors = values.map(v => {
      if (v === null) return '#2a2a2a'
      const isGood = habit.goal_direction === 'up' ? v >= goalValue : v <= goalValue
      return isGood ? '#4caf7d' : '#e05c5c'
    })

    const maxVal = Math.max(...values.filter(v => v !== null), goalValue, 1)

    const formatDate = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    chartInstanceRef.current = new window.Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          data: values.map(v => v === null ? 1 : v),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 0,
          borderRadius: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => formatDate(dates[items[0].dataIndex]),
              label: (ctx) => {
                const raw = values[ctx.dataIndex]
                if (raw === null) return 'No log'
                return `${raw} ${habit.goal_unit || ''}`
              }
            }
          }
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            min: 0,
            max: Math.ceil(maxVal * 1.1),
            ticks: {
              color: '#888888',
              font: { size: 10 },
              maxTicksLimit: 4,
            },
            grid: {
  color: 'rgba(255,255,255,0.04)',
},
            border: { display: false }
          }
        }
      }
    })
  }

  function renderCalendar() {
    const { year, month } = calendarDate
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const logMap = {}
    logs.forEach(l => { logMap[l.date] = l.value })

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' })

    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-day empty" />)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isFuture = dateStr > today
      const value = logMap[dateStr]
      const hasLog = value !== undefined

      let status = 'gray'
      if (!isFuture && hasLog) {
        const isGood = habit.goal_direction === 'up'
          ? value >= habit.goal_value
          : value <= habit.goal_value
        status = isGood ? 'good' : 'bad'
      }

      cells.push(
        <div key={dateStr} className={`cal-day ${status}`}>
          <span className="cal-day-num">{d}</span>
          {hasLog && <span className="cal-day-val">{value}</span>}
        </div>
      )
    }

    return (
      <div className="calendar-section">
        <div className="calendar-nav">
          <button onClick={() => setCalendarDate(prev => {
            const d = new Date(prev.year, prev.month - 1, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}>‹</button>
          <span className="calendar-month-label">{monthName} {year}</span>
          <button onClick={() => setCalendarDate(prev => {
            const d = new Date(prev.year, prev.month + 1, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}>›</button>
        </div>
        <div className="calendar-grid">
          {['Su','M','Tu','W','Th','F','Sa'].map(d => (
            <div key={d} className="cal-header">{d}</div>
          ))}
          {cells}
        </div>
      </div>
    )
  }

  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 864e5)
    .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const recentLogs = logs.filter(l => l.date >= thirtyDaysAgoStr)
  const average = getAverage()
  const streak = getStreak()

  return (
    <div className="modal-overlay detail-overlay" onClick={onClose}>
      <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
       <div className="modal-header">
          <h2>{habit.title}</h2>
          <div className="modal-header-actions">
            <button className="modal-edit" onClick={() => onEdit(habit)}>Edit</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body">
          <div className="detail-stats">
            <div className="detail-stat">
              <div className="detail-stat-value">{average || '—'}</div>
              <div className="detail-stat-label">30-day avg</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">🔥 {streak}</div>
              <div className="detail-stat-label">day streak</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">{habit.goal_value}</div>
              <div className="detail-stat-label">goal ({habit.goal_unit})</div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setShowLogModal(true)}>
            Log today
          </button>

          {renderCalendar()}


          <div className="trend-section">
            <div className="trend-label">30-day trend</div>
            <div style={{ position: 'relative', height: '160px' }}>
              <canvas ref={chartRef} />
            </div>
            <div className="trend-dates">
              <span>{new Date(Date.now() - 30 * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span>{new Date(Date.now() - 15 * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {showLogModal && (
        <HabitLogModal
          habit={habit}
          logDate={new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}
          existingValue={(() => {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
            const todayLog = logs.find(l => l.date === todayStr)
            return todayLog ? todayLog.value : undefined
          })()}
          onClose={() => setShowLogModal(false)}
          onSaved={() => {
            setShowLogModal(false)
            fetchLogs()
          }}
        />
      )}
    </div>
  )
}