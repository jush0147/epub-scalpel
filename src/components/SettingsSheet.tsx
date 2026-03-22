import { useState } from 'react'
import { useBookStore } from '../store/bookStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsSheet({ open, onClose }: Props) {
  const geminiApiKey = useBookStore((s) => s.geminiApiKey)
  const setApiKey = useBookStore((s) => s.setApiKey)
  const clearApiKey = useBookStore((s) => s.clearApiKey)
  const [input, setInput] = useState('')
  const [showKey, setShowKey] = useState(false)

  if (!open) return null

  const maskedKey = geminiApiKey
    ? `●●●●...${geminiApiKey.slice(-4)}`
    : ''

  const handleSave = () => {
    if (input.trim()) {
      setApiKey(input.trim())
      setInput('')
    }
  }

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <span>設定</span>
          <button className="btn-sm" onClick={onClose}>
            關閉
          </button>
        </div>
        <div className="bottom-sheet-body">
          <label className="settings-label">Gemini API Key</label>
          {geminiApiKey ? (
            <div className="settings-key-display">
              <span>已儲存 {showKey ? geminiApiKey : maskedKey}</span>
              <button
                className="btn-sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? '隱藏' : '顯示'}
              </button>
              <button className="btn-sm btn-danger" onClick={clearApiKey}>
                清除
              </button>
            </div>
          ) : (
            <div className="settings-key-input">
              <input
                type="password"
                placeholder="輸入 API Key"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button className="btn-action" onClick={handleSave}>
                儲存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
