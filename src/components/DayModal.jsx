import { useState } from 'react'
import { supabase } from '../lib/supabase'
import TemplateLibrary from './TemplateLibrary'

export default function DayModal({ dateStr, items, onClose, onSaved }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const displayDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  async function handleAddQuick() {
    if (!title.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('items')
      .insert({
        title: title.trim(),
        tag: 'personal',
        type: 'task',
        is_recurring: false,
        is_habit: false,
        due_date: dateStr,
        completed: false,
        archived: false,
      })
    setSaving(false)
    if (!error) {
      setTitle('')
      onSaved()
    }
  }

  async function handlePlaceTemplate(template) {
    const { error } = await supabase
      .from('items')
      .insert({
        title: template.title,
        tag: template.tag,
        type: 'task',
        is_recurring: false,
        is_habit: false,
        due_date: dateStr,
        completed: false,
        archived: false,
      })
    if (!error) {
      setShowLibrary(false)
      onSaved()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{displayDate}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {items.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Nothing planned for this day yet.
            </p>
          )}
          {items.map(item => (
            <div key={item.id} className={`planner-day-item-row ${item.completed ? 'completed' : ''}`}>
              <span className={`task-tag tag-${item.tag}`}>{item.tag}</span>
              <span className="planner-item-title">{item.title}</span>
            </div>
          ))}

          <div className="field">
            <label>Quick add</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Add a task for this day..."
              onKeyDown={e => e.key === 'Enter' && handleAddQuick()}
            />
          </div>

          <button
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setShowLibrary(true)}
          >
            📚 Place from library
          </button>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAddQuick} disabled={saving || !title.trim()}>
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {showLibrary && (
        <TemplateLibrary
          onClose={() => setShowLibrary(false)}
          onPlace={handlePlaceTemplate}
        />
      )}
    </div>
  )
}