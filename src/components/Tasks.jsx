import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewItemModal from './NewItemModal'

export default function Tasks() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')
  const [tagFilter, setTagFilter] = useState('all')
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_habit', false)

  if (!error) {
    const sorted = [...data].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return b.created_at.localeCompare(a.created_at)
    })
    setItems(sorted)
  }
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

 const filteredItems = items.filter(item => {
  const statusMatch = filter === 'upcoming' ? !item.completed : item.completed
  const tagMatch = tagFilter === 'all' || item.tag === tagFilter
  return statusMatch && tagMatch
})

return (
  <div className="tasks">
    <div className="seg-control task-filter">
      <button
        className={filter === 'upcoming' ? 'active' : ''}
        onClick={() => setFilter('upcoming')}
      >Upcoming</button>
      <button
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilter('completed')}
      >Completed</button>
    </div>

    <div className="tag-picker tag-filter">
      {['all', 'personal', 'work', 'other'].map(t => (
        <button
          key={t}
          className={`tag-btn tag-${t} ${tagFilter === t ? 'active' : ''}`}
          onClick={() => setTagFilter(t)}
        >
          {t}
        </button>
      ))}
    </div>

    {filteredItems.length === 0 && (
      <p style={{ color: 'var(--text-secondary)' }}>
        {filter === 'upcoming' ? 'No upcoming tasks.' : 'No completed tasks yet.'}
      </p>
    )}
    {filteredItems.map(item => (
  <div key={item.id} className={`task-card ${item.completed ? 'completed' : ''}`}>
    <div className="task-check" onClick={() => toggleComplete(item)}>
      {item.completed ? '✓' : ''}
    </div>
    <div className="task-content" onClick={() => setEditingItem(item)}>
      <div className="task-title">{item.title}</div>
      <div className="task-meta">
        <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
        {item.is_recurring && <span className="task-badge">🔁 {item.recurrence}</span>}
        {item.due_date && <span className="task-badge">📅 {item.due_date}</span>}
      </div>
    </div>
  </div>
))}

      {editingItem && (
        <NewItemModal
          editItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); fetchItems() }}
        />
      )}
    </div>
  )
}