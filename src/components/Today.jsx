import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import HabitLogModal from './HabitLogModal'
import NewItemModal from './NewItemModal'

export default function Today() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateItems, setDateItems] = useState([])
  const [overdueItems, setOverdueItems] = useState([])
  const [recurringItems, setRecurringItems] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState({})
  const [activeHabit, setActiveHabit] = useState(null)
const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(true)

  const dateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const dayName = selectedDate.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' })
  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  const dayNum = dayMap[dayName]

  const isToday = dateStr === new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

  useEffect(() => {
    fetchAll()
  }, [dateStr])

  function changeDate(offset) {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + offset)
    setSelectedDate(next)
  }

  function getStatusClass(habit, value) {
    if (value === undefined || !habit.goal_value) return ''
    const isGood = habit.goal_direction === 'up'
      ? value >= habit.goal_value
      : value <= habit.goal_value
    return isGood ? 'status-good' : 'status-bad'
  }

  async function fetchAll() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')

    if (!error) {
      const overdue = data.filter(i =>
        !i.is_habit && !i.is_recurring && i.due_date && i.due_date < dateStr && !i.completed
      )
      const tasks = data.filter(i =>
        !i.is_habit && !i.is_recurring && i.due_date === dateStr
      )
      const recurring = data.filter(i =>
        !i.is_habit && i.is_recurring &&
        i.recurrence_days && i.recurrence_days.includes(String(dayNum))
      )
      const habitItems = data.filter(i => i.is_habit)

      setOverdueItems(overdue)
      setDateItems(tasks)
      setRecurringItems(recurring)
      setHabits(habitItems)

      const { data: logData, error: logError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('date', dateStr)

      if (!logError) {
        const logMap = {}
        logData.forEach(log => { logMap[log.item_id] = log.value })
        setHabitLogs(logMap)
      }
    }
    setLoading(false)
  }

  async function toggleComplete(item) {
    const { error } = await supabase
      .from('items')
      .update({ completed: !item.completed })
      .eq('id', item.id)

    if (!error) fetchAll()
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  const hasNothing = dateItems.length === 0 && recurringItems.length === 0 && habits.length === 0 && overdueItems.length === 0

  return (
    <div className="today">
      <div className="date-nav">
  <button onClick={() => changeDate(-1)}>‹</button>
  <span className="date-nav-label">
    {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' })}
  </span>
  <button onClick={() => changeDate(1)}>›</button>
  <button
  className={`jump-today-btn-inline ${isToday ? 'disabled' : ''}`}
  onClick={() => setSelectedDate(new Date())}
>↻</button>
</div>

      {hasNothing && (
        <p style={{ color: 'var(--text-secondary)' }}>Nothing for this day.</p>
      )}

      {overdueItems.length > 0 && (
  <section className="today-section">
    <h3 style={{ color: 'var(--red)' }}>Overdue</h3>
    {overdueItems.map(item => (
      <div key={item.id} className="task-card">
        <div className="task-check" onClick={() => toggleComplete(item)} />
        <div className="task-content" onClick={() => setEditingItem(item)}>
          <div className="task-title">{item.title}</div>
          <div className="task-meta">
            <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
            <span className="task-badge" style={{ color: 'var(--red)' }}>Due {item.due_date}</span>
          </div>
        </div>
      </div>
    ))}
  </section>
)}

      {dateItems.length > 0 && (
  <section className="today-section">
    <h3>Due</h3>
    {dateItems.map(item => (
      <div key={item.id} className={`task-card ${item.completed ? 'completed' : ''}`}>
        <div className="task-check" onClick={() => toggleComplete(item)}>
          {item.completed ? '✓' : ''}
        </div>
        <div className="task-content" onClick={() => setEditingItem(item)}>
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
        <div className="task-content" onClick={() => setEditingItem(item)}>
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
            <div
              key={item.id}
              className={`task-card ${getStatusClass(item, habitLogs[item.id])} ${habitLogs[item.id] !== undefined ? 'completed' : ''}`}
              onClick={() => setActiveHabit(item)}
            >
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
              <div className="task-habit-value">
                {habitLogs[item.id] !== undefined ? habitLogs[item.id] : '—'}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeHabit && (
  <HabitLogModal
    habit={activeHabit}
    existingValue={habitLogs[activeHabit.id]}
    logDate={dateStr}
    onClose={() => setActiveHabit(null)}
    onSaved={() => { setActiveHabit(null); fetchAll() }}
  />
)}

{editingItem && (
  <NewItemModal
    editItem={editingItem}
    onClose={() => setEditingItem(null)}
    onSaved={() => { setEditingItem(null); fetchAll() }}
  />
)}
    </div>
  )
}