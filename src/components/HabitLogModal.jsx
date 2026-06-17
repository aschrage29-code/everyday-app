import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HabitLogModal({ habit, existingValue, logDate, onClose, onSaved }) {
  const [value, setValue] = useState(existingValue !== undefined ? existingValue : '')
  const [saving, setSaving] = useState(false)

  const todayStr = logDate || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  async function handleSave() {
    if (value === '') return
    setSaving(true)

    const { data: existing } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('item_id', habit.id)
      .eq('date', todayStr)
      .maybeSingle()

    let error
    if (existing) {
      const { error: updateError } = await supabase
        .from('habit_logs')
        .update({ value: parseFloat(value) })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('habit_logs')
        .insert({ item_id: habit.id, date: todayStr, value: parseFloat(value) })
      error = insertError
    }

    setSaving(false)
    if (!error) {
      onSaved()
    } else {
      alert('Error saving: ' + error.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habit.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Today's value {habit.goal_unit ? `(${habit.goal_unit})` : ''}</label>
            <input
              autoFocus
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={habit.goal_value ? `Goal: ${habit.goal_value}` : '0'}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}