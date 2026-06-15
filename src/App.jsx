import { useState } from 'react'
import Today from './components/Today'
import Tasks from './components/Tasks'
import Habits from './components/Habits'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('today')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Everyday</h1>
      </header>

      <main className="app-main">
        {activeTab === 'today' && <Today />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'habits' && <Habits />}
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
    </div>
  )
}

export default App