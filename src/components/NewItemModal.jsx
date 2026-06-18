import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMOJI_KEYWORDS = [
  { keywords: ['bike', 'biking', 'cycle', 'cycling'], emoji: '🚴' },
  { keywords: ['run', 'running', 'jog'], emoji: '🏃' },
  { keywords: ['walk', 'walking', 'steps'], emoji: '🚶' },
  { keywords: ['water', 'hydrate', 'hydration'], emoji: '💧' },
  { keywords: ['drink', 'drinks', 'alcohol', 'beer', 'wine'], emoji: '🍺' },
  { keywords: ['sleep', 'wake', 'nap'], emoji: '😴' },
  { keywords: ['read', 'reading', 'book'], emoji: '📖' },
  { keywords: ['meditat', 'mindful', 'breathe'], emoji: '🧘' },
  { keywords: ['gym', 'workout', 'exercise', 'lift', 'weights'], emoji: '🏋️' },
  { keywords: ['floss', 'teeth', 'dental'], emoji: '🦷' },
  { keywords: ['mood', 'feeling', 'happy'], emoji: '😊' },
  { keywords: ['journal', 'write', 'writing'], emoji: '📝' },
  { keywords: ['stretch', 'yoga'], emoji: '🤸' },
  { keywords: ['eat', 'food', 'meal', 'diet'], emoji: '🍽️' },
  { keywords: ['vitamin', 'pill', 'medication', 'medicine'], emoji: '💊' },
  { keywords: ['smoke', 'smoking', 'cigarette'], emoji: '🚬' },
  { keywords: ['screen', 'phone', 'social media'], emoji: '📱' },
  { keywords: ['save', 'money', 'budget', 'spend'], emoji: '💰' },
]

function suggestEmoji(title) {
  const lower = title.toLowerCase()
  for (const entry of EMOJI_KEYWORDS) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.emoji
    }
  }
  return ''
}

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
  const [emoji, setEmoji] = useState(editItem?.emoji || '')
  const [emojiTouched, setEmojiTouched] = useState(!!editItem?.emoji)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isHabit && !emojiTouched) {
      setEmoji(suggestEmoji(title))
    }
  }, [title, isHabit])

  function toggleDay(i) {
    setSelectedDays(prev =>
      prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
    )
  }

  function handleEmojiChange(value) {
    setEmojiTouched(true)
    setEmoji(value)
  }

  async function handleRestore() {
    if (!editItem) return
    setSaving(true)
    const { error } = await supabase
      .from('items')
      .update({ archived: false })
      .eq('id', editItem.id)

    setSaving(false)
    if (!error) {
      onSaved()
      onClose()
    } else {
      alert('Error restoring: ' + error.message)
    }
  }

  async function handleArchive() {
    if (!editItem) return
    const confirmed = window.confirm(`Delete "${editItem.title}"? You can restore it later from the archive.`)
    if (!confirmed) return

    setSaving(true)
    const { error } = await supabase
      .from('items')
      .update({ archived: true })
      .eq('id', editItem.id)

    setSaving(false)
    if (!error) {
      onSaved()
      onClose()
    } else {
      alert('Error deleting: ' + error.message)
    }
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
      emoji: isHabit ? (emoji || null) : null,
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
                <label>Emoji <span style={{color:'var(--text-secondary)'}}>optional</span></label>
                <div className="emoji-row">
                  <input
                    className="emoji-input"
                    value={emoji}
                    onChange={e => handleEmojiChange(e.target.value)}
                    placeholder="Tap to choose"
                    maxLength={4}
                  />
                  {emoji && (
                    <button
                      type="button"
                      className="emoji-clear"
                      onClick={() => handleEmojiChange('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

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
          {editItem && !editItem.archived && (
            <button className="btn-danger" onClick={handleArchive} disabled={saving}>
              Delete
            </button>
          )}
          {editItem && editItem.archived && (
            <button className="btn-danger" onClick={handleRestore} disabled={saving}>
              Restore
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}