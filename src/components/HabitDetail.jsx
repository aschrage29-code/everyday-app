import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HabitDetail({ habit, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  useEffect(() => {
    fetchLogs()
  }, [calendarDate])

  async function fetchLogs() {
    setLoading(true)
    const { year, month } = calendarDate

    // Fetch from 30 days ago OR start of calendar month, whichever is earlier
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

  function renderCalendar() {
    const { year, month } = calendarDate
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const logMap = {}
    logs.forEach(l => { logMap[l.date] = l.value })

    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' })

    const cells = []

    // Empty cells for offset
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

  const average = getAverage()
  const streak = getStreak()
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const recentLogs = logs.filter(l => l.date >= thirtyDaysAgoStr)
  const maxValue = Math.max(...recentLogs.map(l => l.value), habit.goal_value || 0)

  return (
    <div className="modal-overlay detail-overlay" onClick={onClose}>
      <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habit.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
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

          {renderCalendar()}

          {recentLogs.length > 0 && (
            <div className="sparkline">
              {recentLogs.map((log, i) => {
                const heightPct = maxValue > 0 ? (log.value / maxValue) * 100 : 0
                const isGood = habit.goal_direction === 'up'
                  ? log.value >= habit.goal_value
                  : log.value <= habit.goal_value
                return (
                  <div
                    key={i}
                    className={`sparkline-bar ${isGood ? 'good' : 'bad'}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${log.date}: ${log.value}`}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}