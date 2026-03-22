import { useState } from 'react'
import { useBookStore } from '../store/bookStore'

export function UploadScreen() {
  const loadBook = useBookStore((s) => s.loadBook)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setLoading(true)
    setError('')
    try {
      await loadBook(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : '無法解析此 EPUB 檔案')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="upload-screen">
      <div
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('epub-input')?.click()}
      >
        <div className="upload-icon">📖</div>
        <p className="upload-text">點擊或拖放 EPUB 檔案</p>
        <input
          id="epub-input"
          type="file"
          accept=".epub"
          onChange={handleChange}
          hidden
        />
        {loading && (
          <div className="upload-progress">
            <p>正在解析 {fileName}...</p>
            <div className="spinner" />
          </div>
        )}
        {error && <p className="upload-error">{error}</p>}
      </div>
    </div>
  )
}
