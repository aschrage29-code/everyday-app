import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import DayModal from './DayModal'

export default function Planner() {
  const [items, setItems] = useState([])
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    start.setHours(0, 0, 0, 0)
    return start
  })
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [weekStart])

  async function fetchItems() {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const startStr = weekStart.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const endStr = weekEnd.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('archived', false)
      .eq('is_habit', false)
      .gte('due_date', startStr)
      .lte('due_date', endStr)
      .order('due_date', { ascending: true })

    if (!error) setItems(data || [])
  }

  function getWeekDays() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }

  function getItemsForDay(dateStr) {
    return items.filter(item => item.due_date === dateStr)
  }

  function formatWeekRange() {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startLabel} — ${endLabel}`
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="planner">
      <div className="planner-nav">
        <button onClick={() => {
          const prev = new Date(weekStart)
          prev.setDate(weekStart.getDate() - 7)
          setWeekStart(prev)
        }}>‹</button>
        <span className="planner-week-label">{formatWeekRange()}</span>
        <button onClick={() => {
          const next = new Date(weekStart)
          next.setDate(weekStart.getDate() + 7)
          setWeekStart(next)
        }}>›</button>
      </div>

      <div className="planner-week">
        {getWeekDays().map((day, i) => {
          const dateStr = day.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
          const dayItems = getItemsForDay(dateStr)
          const isToday = dateStr === todayStr

          return (
            <div
              key={dateStr}
              className={`planner-day ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDay(dateStr)}
            >
              <div className="planner-day-header">
                <span className="planner-day-name">{days[i]}</span>
                <span className={`planner-day-num ${isToday ? 'today' : ''}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="planner-day-items">
                {dayItems.map(item => (
                  <div
                    key={item.id}
                    className={`planner-item tag-${item.tag} ${item.completed ? 'completed' : ''}`}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length === 0 && (
                  <div className="planner-day-empty">+</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <DayModal
          dateStr={selectedDay}
          items={getItemsForDay(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onSaved={() => {
            fetchItems()
            setSelectedDay(null)
          }}
        />
      )}
    </div>
  )
}