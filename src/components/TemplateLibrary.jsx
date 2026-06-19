import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TemplateLibrary({ onClose, onPlace }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('personal')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('archived', false)
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (!error) setTemplates(data || [])
    setLoading(false)
  }

  async function handleAddTemplate() {
    if (!newTitle.trim() || !newCategory.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('templates')
      .insert({
        title: newTitle.trim(),
        category: newCategory.trim().toLowerCase(),
        tag: newTag,
        notes: newNotes.trim() || null,
      })
    setSaving(false)
    if (!error) {
      setNewTitle('')
      setNewCategory('')
      setNewTag('personal')
      setNewNotes('')
      setShowAddForm(false)
      fetchTemplates()
    }
  }

  const categories = ['all', ...new Set(templates.map(t => t.category))]
  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Library</h2>
          <div className="modal-header-actions">
            <button className="modal-edit" onClick={() => setShowAddForm(!showAddForm)}>
              + New
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          {showAddForm && (
            <div className="library-add-form">
              <div className="field">
                <label>Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Spaghetti Bolognese"
                />
              </div>
              <div className="field">
                <label>Category</label>
                <input
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. meals, chores, errands"
                />
              </div>
              <div className="field">
                <label>Tag</label>
                <div className="tag-picker">
                  {['personal', 'work', 'other'].map(t => (
                    <button
                      key={t}
                      className={`tag-btn tag-${t} ${newTag === t ? 'active' : ''}`}
                      onClick={() => setNewTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Notes <span style={{ color: 'var(--text-secondary)' }}>optional</span></label>
                <input
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. needs chicken, 30 min prep"
                />
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleAddTemplate}
                disabled={saving || !newTitle.trim() || !newCategory.trim()}
              >
                {saving ? 'Saving...' : 'Save to library'}
              </button>
            </div>
          )}

          <div className="tag-picker" style={{ marginBottom: '12px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`tag-btn ${activeCategory === cat ? 'active tag-personal' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}

          {!loading && filtered.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No templates yet. Tap "+ New" to add one.
            </p>
          )}

          {filtered.map(template => (
            <div key={template.id} className="template-row">
              <div className="template-info">
                <span className="template-title">{template.title}</span>
                {template.notes && (
                  <span className="template-notes">{template.notes}</span>
                )}
              </div>
              <button
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => onPlace(template)}
              >
                Place
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}