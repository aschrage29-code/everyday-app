import { useState } from 'react'
import Today from './components/Today'
import Tasks from './components/Tasks'
import Habits from './components/Habits'
import NewItemModal from './components/NewItemModal'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="app">
      <header className="app-header">
  <div className="app-header-title">
    <h1>Everyday</h1>
    <span className="app-version">{__BUILD_TIME__}</span>
  </div>
  <button className="add-btn" onClick={() => setShowModal(true)}>+</button>
</header>

      <main className="app-main">
        {activeTab === 'today' && <Today key={refreshKey} />}
        {activeTab === 'tasks' && <Tasks key={refreshKey} />}
        {activeTab === 'habits' && <Habits key={refreshKey} />}
      </main>

      <nav className="app-nav">
        <button
          className={activeTab === 'today' ? 'active' : ''}
          onClick={() => setActiveTab('today')}
        >
          <span>📅</span>
          <span>Today</span>
        </button>
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          <span>✓</span>
          <span>Tasks</span>
        </button>
        <button
          className={activeTab === 'habits' ? 'active' : ''}
          onClick={() => setActiveTab('habits')}
        >
          <span>🔥</span>
          <span>Habits</span>
        </button>
      </nav>

      {showModal && (
        <NewItemModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default App