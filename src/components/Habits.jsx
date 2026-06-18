import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import HabitDetail from './HabitDetail'

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeHabit, setActiveHabit] = useState(null)

  useEffect(() => {
    fetchHabits()
  }, [])

  async function fetchHabits() {
    const { data: habitData, error: habitError } = await supabase
      .from('items')
      .select('*')
      .eq('is_habit', true)

    if (!habitError) {
      setHabits(habitData)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

      const { data: log30Data, error: log30Error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', thirtyDaysAgoStr)
        .order('date', { ascending: true })

      if (!log30Error) setAllLogs(log30Data)
    }
    setLoading(false)
  }

  function getHabitLogs(habitId) {
    return allLogs.filter(log => log.item_id === habitId)
  }

function getGoalStatus(habitId) {
  const habit = habits.find(h => h.id === habitId)
  const avg = getAverage(habitId)
  if (avg === null || !habit.goal_value) return null
  const avgNum = parseFloat(avg)
  const isGood = habit.goal_direction === 'up'
    ? avgNum >= habit.goal_value
    : avgNum <= habit.goal_value
  return isGood
}

  function getAverage(habitId) {
    const logs = getHabitLogs(habitId)
    if (logs.length === 0) return null
    const sum = logs.reduce((acc, log) => acc + log.value, 0)
    return (sum / logs.length).toFixed(1)
  }

  function getStreak(habit) {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const logs = getHabitLogs(habit.id)
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

  function renderSparkline(habitId) {
    const logs = getHabitLogs(habitId)
    if (logs.length < 2) return null

    const maxValue = Math.max(...logs.map(l => l.value), 1)
    const width = 100
    const height = 30
    const stepX = width / (logs.length - 1)

    const points = logs.map((log, i) => {
      const x = i * stepX
      const y = height - (log.value / maxValue) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg className="card-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>
    )
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  return (
    <div className="habits">
      {habits.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No habits yet. Tap + to add one.</p>
      )}

      <div className="habit-grid">
        {habits.map(habit => (
          <div
            key={habit.id}
            className="habit-card"
            onClick={() => setActiveHabit(habit)}
          >
            <div className="habit-card-title">{habit.title}</div>
            <div className="habit-card-value">
              {getAverage(habit.id) || '—'}
              <span className="habit-card-unit">{habit.goal_unit}</span>
            </div>
            {habit.goal_value && (
              <div className="habit-card-goal">
                Goal: {habit.goal_value} {habit.goal_unit}
              </div>
            )}
            <div className="habit-card-bottom">
              {getGoalStatus(habit.id) !== null && (
                <span className={`habit-card-status ${getGoalStatus(habit.id) ? 'good' : 'bad'}`}>
                  {getGoalStatus(habit.id) ? '✓' : '✗'}
                </span>
              )}
              <span className="habit-card-streak">🔥 {getStreak(habit)}</span>
              {renderSparkline(habit.id)}
            </div>
          </div>
        ))}
      </div>

      {activeHabit && (
        <HabitDetail
          habit={activeHabit}
          onClose={() => setActiveHabit(null)}
        />
      )}
    </div>
  )
}