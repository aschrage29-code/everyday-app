import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewItemModal({ onClose, onSaved, editItem }) {
  const [title, setTitle] = useState(editItem?.title || '')
  const [tag, setTag] = useState(editItem?.tag || 'personal')
  const [isRecurring, setIsRecurring] = useState(editItem?.is_recurring || false)
  const [isHabit, setIsHabit] = useState(editItem?.is_habit || false)
  const [recurrence, setRecurrence] = useState(editItem?.recurrence || 'daily')
  const [selectedDays, setSelectedDays] = useState(editItem?.recurrence_days?.map(Number) || [])
  const [goalValue, setGoalValue] = useState(editItem?.goal_value || '')
  const [goalUnit, setGoalUnit] = useState(editItem?.goal_unit || '')
  const [goalDirection, setGoalDirection] = useState(editItem?.goal_direction || 'up')
  const [goalCadence, setGoalCadence] = useState(editItem?.goal_cadence || 'daily')
  const [dueDate, setDueDate] = useState(editItem?.due_date || '')
  const [saving, setSaving] = useState(false)

  function toggleDay(i) {
  setSelectedDays(prev =>
    prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
  )
}
  async function handleSave() {
  if (!title.trim()) return
  setSaving(true)

  const payload = {
    title: title.trim(),
    tag,
    type: isHabit ? 'habit' : 'task',
    is_recurring: isHabit ? true : isRecurring,
    recurrence: isRecurring || isHabit ? 'custom' : null,
    recurrence_days: isRecurring || isHabit ? selectedDays.map(String) : null,
    is_habit: isHabit,
    goal_value: isHabit && goalValue ? parseFloat(goalValue) : null,
    goal_unit: isHabit ? goalUnit : null,
    goal_direction: isHabit ? goalDirection : null,
    goal_cadence: isHabit ? goalCadence : null,
    due_date: !isRecurring && !isHabit && dueDate ? dueDate : null,
  }

  const { error } = editItem
    ? await supabase.from('items').update(payload).eq('id', editItem.id)
    : await supabase.from('items').insert(payload)

  setSaving(false)
  if (!error) {
    onSaved()
    onClose()
  } else {
    alert('Error saving: ' + error.message)
  }
}

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
  <h2>{editItem ? 'Edit Item' : 'New Item'}</h2>
  <button className="modal-close" onClick={onClose}>✕</button>
</div>

        <div className="modal-body">
          <div className="field">
            <label>Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What do you need to do?"
            />
          </div>

          <div className="field">
            <label>Tag</label>
            <div className="tag-picker">
              {['personal', 'work', 'other'].map(t => (
                <button
                  key={t}
                  className={`tag-btn tag-${t} ${tag === t ? 'active' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field toggles">
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Recurring</div>
                <div className="toggle-sub">Repeats on a schedule</div>
              </div>
              <div
                className={`toggle ${isRecurring ? 'on' : ''}`}
                onClick={() => { setIsRecurring(!isRecurring); if (isHabit) setIsHabit(false) }}
              />
            </div>
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Habit</div>
                <div className="toggle-sub">Track progress and streaks</div>
              </div>
              <div
                className={`toggle ${isHabit ? 'on' : ''}`}
                onClick={() => { setIsHabit(!isHabit); if (isRecurring) setIsRecurring(false) }}
              />
            </div>
          </div>

          {(isRecurring || isHabit) && (
            <div className="field">
                <label>Repeat on</label>
                <div className="day-picker">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                    <button
                    key={i}
                    className={`day-btn ${selectedDays.includes(i) ? 'active' : ''}`}
                    onClick={() => toggleDay(i)}
                    >
                    {day}
                    </button>
                ))}
                </div>
            </div>
            )}

          {isHabit && (
            <>
              <div className="field">
                <label>Goal</label>
                <div className="goal-row">
                  <input
                    type="number"
                    placeholder="30"
                    value={goalValue}
                    onChange={e => setGoalValue(e.target.value)}
                  />
                  <input
                    placeholder="min, drinks, steps..."
                    value={goalUnit}
                    onChange={e => setGoalUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Direction</label>
                <div className="seg-control">
                  <button
                    className={goalDirection === 'up' ? 'active' : ''}
                    onClick={() => setGoalDirection('up')}
                  >↑ Higher is better</button>
                  <button
                    className={goalDirection === 'down' ? 'active' : ''}
                    onClick={() => setGoalDirection('down')}
                  >↓ Lower is better</button>
                </div>
              </div>
              <div className="field">
                <label>Track by</label>
                <div className="seg-control">
                  {['daily', 'weekly'].map(c => (
                    <button
                      key={c}
                      className={goalCadence === c ? 'active' : ''}
                      onClick={() => setGoalCadence(c)}
                    >{c}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!isRecurring && !isHabit && (
            <div className="field">
              <label>Due date <span style={{color:'var(--text-secondary)'}}>optional</span></label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          )}
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