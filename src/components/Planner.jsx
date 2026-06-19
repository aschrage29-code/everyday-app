import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import DayModal from './DayModal'

export default function Planner() {
  const [items, setItems] = useState([])
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const start = new Date(now)
    start.setDate(now.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    return start
  })
  const [selectedDay, setSelectedDay] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [templateCategories, setTemplateCategories] = useState([])

  useEffect(() => {
    fetchItems()
    fetchTemplateCategories()
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

  async function fetchTemplateCategories() {
    const { data, error } = await supabase
      .from('templates')
      .select('category')
      .eq('archived', false)
    if (!error) {
      const unique = [...new Set(data.map(t => t.category))]
      setTemplateCategories(unique)
    }
  }

  function getWeekDays() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }

  function getItemsForDay(dateStr) {
    return items.filter(item => {
      if (item.due_date !== dateStr) return false
      if (activeFilter === 'all') return true
      return item.tag === activeFilter
    })
  }

  function getCountsForDay(dateStr) {
    const dayItems = items.filter(i => i.due_date === dateStr)
    const counts = {}
    dayItems.forEach(item => {
      const key = item.tag || 'other'
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }

  function formatWeekRange() {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startLabel} — ${endLabel}`
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const tagColors = {
    personal: { bg: '#E6F1FB', dot: '#378ADD', text: '#0C447C' },
    work: { bg: '#FAEEDA', dot: '#BA7517', text: '#633806' },
    other: { bg: '#F1EFE8', dot: '#5F5E5A', text: '#444441' },
  }

  const filters = ['all', 'personal', 'work', 'other', ...templateCategories]

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

      <div className="tag-picker" style={{ marginBottom: '4px' }}>
        {filters.map(f => (
          <button
            key={f}
            className={`tag-btn ${activeFilter === f ? 'active tag-personal' : ''}`}
            onClick={() => setActiveFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="planner-list">
        {getWeekDays().map((day, i) => {
          const dateStr = day.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
          const isToday = dateStr === todayStr
          const counts = getCountsForDay(dateStr)
          const hasItems = Object.keys(counts).length > 0

          return (
            <div
              key={dateStr}
              className={`planner-day-row ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDay(dateStr)}
            >
              <div className="planner-day-label">
                <span className="planner-day-name">{days[i]}</span>
                <span className={`planner-day-num ${isToday ? 'today' : ''}`}>
                  {day.getDate()}
                </span>
              </div>

              <div className="planner-day-counts">
                {hasItems ? (
                  Object.entries(counts).map(([tag, count]) => {
                    const colors = tagColors[tag] || { bg: '#F1EFE8', dot: '#5F5E5A', text: '#444441' }
                    return (
                      <div
                        key={tag}
                        className="planner-count-badge"
                        style={{ background: colors.bg }}
                      >
                        <div className="planner-count-dot" style={{ background: colors.dot }} />
                        <span style={{ color: colors.text }}>
                          {count} {tag}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <span className="planner-empty-label">Nothing planned</span>
                )}
              </div>

              {!hasItems && <span className="planner-add-hint">+</span>}
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