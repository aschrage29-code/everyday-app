import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HabitDetail({ habit, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('item_id', habit.id)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true })

    if (!error) setLogs(data)
    setLoading(false)
  }

  function getAverage() {
    if (logs.length === 0) return null
    const sum = logs.reduce((acc, log) => acc + log.value, 0)
    return (sum / logs.length).toFixed(1)
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
  if (log.value <= 0) break
  streak++
  cursor.setDate(cursor.getDate() - 1)
}

    return streak
  }

  if (loading) return null

  const average = getAverage()
  const streak = getStreak()
  const maxValue = Math.max(...logs.map(l => l.value), habit.goal_value || 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
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

          <div className="sparkline">
            {logs.map((log, i) => {
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
        </div>
      </div>
    </div>
  )
}