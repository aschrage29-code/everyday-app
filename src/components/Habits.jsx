import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import HabitLogModal from './HabitLogModal'

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeHabit, setActiveHabit] = useState(null)

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

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

      const { data: logData, error: logError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('date', todayStr)

      if (!logError) {
        const logMap = {}
        logData.forEach(log => {
          logMap[log.item_id] = log.value
        })
        setLogs(logMap)
      }
    }
    setLoading(false)
  }

  function getStatusClass(habit, value) {
    if (value === undefined || !habit.goal_value) return ''
    const isGood = habit.goal_direction === 'up'
      ? value >= habit.goal_value
      : value <= habit.goal_value
    return isGood ? 'status-good' : 'status-bad'
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  return (
    <div className="habits">
      {habits.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No habits yet. Tap + to add one.</p>
      )}

      <div className="habit-grid">
        {habits.map(habit => {
          const todayValue = logs[habit.id]
          return (
            <div
              key={habit.id}
              className={`habit-card ${getStatusClass(habit, todayValue)}`}
              onClick={() => setActiveHabit(habit)}
            >
              <div className="habit-card-title">{habit.title}</div>
              <div className="habit-card-value">
                {todayValue !== undefined ? todayValue : '—'}
                <span className="habit-card-unit">{habit.goal_unit}</span>
              </div>
              {habit.goal_value && (
                <div className="habit-card-goal">
                  Goal: {habit.goal_value} {habit.goal_unit}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activeHabit && (
        <HabitLogModal
          habit={activeHabit}
          existingValue={logs[activeHabit.id]}
          onClose={() => setActiveHabit(null)}
          onSaved={() => { setActiveHabit(null); fetchHabits() }}
        />
      )}
    </div>
  )
}