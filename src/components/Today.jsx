import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Today() {
  const [todayItems, setTodayItems] = useState([])
  const [recurringItems, setRecurringItems] = useState([])
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const todayDayName = today.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' })
  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  const todayDay = dayMap[todayDayName]

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('completed', false)

    if (!error) {
      const tasks = data.filter(i =>
        !i.is_habit && !i.is_recurring && i.due_date === todayStr
      )
      const recurring = data.filter(i =>
        !i.is_habit && i.is_recurring &&
        i.recurrence_days && i.recurrence_days.includes(String(todayDay))
      )
      const habitItems = data.filter(i => i.is_habit)

      setTodayItems(tasks)
      setRecurringItems(recurring)
      setHabits(habitItems)
    }
    setLoading(false)
  }

  async function toggleComplete(item) {
    const { error } = await supabase
      .from('items')
      .update({ completed: true })
      .eq('id', item.id)

    if (!error) fetchAll()
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  const hasNothing = todayItems.length === 0 && recurringItems.length === 0 && habits.length === 0

  return (
    <div className="today">
      <p className="today-date">{today.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' })}</p>

      {hasNothing && (
        <p style={{ color: 'var(--text-secondary)' }}>Nothing for today. Enjoy the day!</p>
      )}

      {todayItems.length > 0 && (
        <section className="today-section">
          <h3>Due Today</h3>
          {todayItems.map(item => (
            <div key={item.id} className="task-card">
              <div className="task-check" onClick={() => toggleComplete(item)} />
              <div className="task-content">
                <div className="task-title">{item.title}</div>
                <div className="task-meta">
                  <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {recurringItems.length > 0 && (
        <section className="today-section">
          <h3>Recurring</h3>
          {recurringItems.map(item => (
            <div key={item.id} className="task-card">
              <div className="task-check" onClick={() => toggleComplete(item)} />
              <div className="task-content">
                <div className="task-title">{item.title}</div>
                <div className="task-meta">
                  <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
                  <span className="task-badge">🔁</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {habits.length > 0 && (
        <section className="today-section">
          <h3>Habits</h3>
          {habits.map(item => (
            <div key={item.id} className="task-card">
              <div className="task-content">
                <div className="task-title">{item.title}</div>
                <div className="task-meta">
                  <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
                  {item.goal_value && (
                    <span className="task-badge">
                      Goal: {item.goal_value} {item.goal_unit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}