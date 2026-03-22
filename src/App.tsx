import { useState } from 'react'
import { useBookStore } from './store/bookStore'
import { UploadScreen } from './components/UploadScreen'
import { TOCTree } from './components/TOCTree'
import { ContentViewer } from './components/ContentViewer'
import { ExportPanel } from './components/ExportPanel'
import { SettingsSheet } from './components/SettingsSheet'
import './App.css'

type Tab = 'toc' | 'read' | 'export'

function App() {
  const book = useBookStore((s) => s.book)
  const [tab, setTab] = useState<Tab>('toc')
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (!book) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">EPUB 閱讀器</h1>
          <button className="btn-icon" onClick={() => setSettingsOpen(true)}>
            ⚙
          </button>
        </header>
        <UploadScreen />
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">{book.title}</h1>
        <button className="btn-icon" onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
      </header>

      <main className="app-main">
        {tab === 'toc' && <TOCTree />}
        {tab === 'read' && <ContentViewer />}
        {tab === 'export' && <ExportPanel />}
      </main>

      <nav className="tab-bar">
        <button
          className={`tab-btn ${tab === 'toc' ? 'active' : ''}`}
          onClick={() => setTab('toc')}
        >
          目錄
        </button>
        <button
          className={`tab-btn ${tab === 'read' ? 'active' : ''}`}
          onClick={() => setTab('read')}
        >
          閱讀
        </button>
        <button
          className={`tab-btn ${tab === 'export' ? 'active' : ''}`}
          onClick={() => setTab('export')}
        >
          匯出
        </button>
      </nav>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App
