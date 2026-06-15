import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Tasks() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_habit', false)
      .order('created_at', { ascending: false })

    if (!error) setItems(data)
    setLoading(false)
  }

  async function toggleComplete(item) {
    const { error } = await supabase
      .from('items')
      .update({ completed: !item.completed })
      .eq('id', item.id)

    if (!error) fetchItems()
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  return (
    <div className="tasks">
      {items.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No tasks yet. Tap + to add one.</p>
      )}
      {items.map(item => (
        <div key={item.id} className={`task-card ${item.completed ? 'completed' : ''}`}>
          <div className="task-check" onClick={() => toggleComplete(item)}>
            {item.completed ? '✓' : ''}
          </div>
          <div className="task-content">
            <div className="task-title">{item.title}</div>
            <div className="task-meta">
              <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
              {item.is_recurring && <span className="task-badge">🔁 {item.recurrence}</span>}
              {item.due_date && <span className="task-badge">📅 {item.due_date}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}