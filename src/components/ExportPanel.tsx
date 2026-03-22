import { useState } from 'react'
import { useBookStore } from '../store/bookStore'
import { exportToMarkdown } from '../lib/exporters/markdown'
import { exportToTxt } from '../lib/exporters/txt'

export function ExportPanel() {
  const book = useBookStore((s) => s.book)
  const zip = useBookStore((s) => s.zip)
  const selectedIds = useBookStore((s) => s.selectedChapterIds)
  const [exporting, setExporting] = useState(false)

  if (!book || !zip) return null

  const handleExport = async (format: 'md' | 'txt') => {
    if (selectedIds.size === 0) return
    setExporting(true)
    try {
      if (format === 'md') {
        await exportToMarkdown(book, selectedIds, zip)
      } else {
        await exportToTxt(book, selectedIds, zip)
      }
    } catch (e) {
      alert(`匯出失敗：${e instanceof Error ? e.message : '未知錯誤'}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="export-panel">
      <p className="export-info">已選取 {selectedIds.size} 個章節</p>
      {selectedIds.size === 0 && (
        <p className="export-hint">請先至目錄頁選取要匯出的章節</p>
      )}
      <div className="export-buttons">
        <button
          className="btn-export"
          disabled={selectedIds.size === 0 || exporting}
          onClick={() => handleExport('md')}
        >
          匯出 Markdown
        </button>
        <button
          className="btn-export"
          disabled={selectedIds.size === 0 || exporting}
          onClick={() => handleExport('txt')}
        >
          匯出 TXT
        </button>
      </div>
      {exporting && (
        <div className="export-progress">
          <div className="spinner" />
          <span>匯出中...</span>
        </div>
      )}
    </div>
  )
}
