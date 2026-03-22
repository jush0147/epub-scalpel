import { useBookStore } from '../store/bookStore'

export function TOCTree() {
  const book = useBookStore((s) => s.book)
  const selectedIds = useBookStore((s) => s.selectedChapterIds)
  const currentChapterId = useBookStore((s) => s.currentChapterId)
  const toggleChapterSelection = useBookStore((s) => s.toggleChapterSelection)
  const selectAll = useBookStore((s) => s.selectAll)
  const clearSelection = useBookStore((s) => s.clearSelection)
  const selectChapter = useBookStore((s) => s.selectChapter)

  if (!book) return null

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <span className="toc-count">已選 {selectedIds.size} 章</span>
        <div className="toc-actions">
          <button className="btn-sm" onClick={selectAll}>
            全選
          </button>
          <button className="btn-sm" onClick={clearSelection}>
            清除
          </button>
        </div>
      </div>
      <ul className="toc-list">
        {book.chapters.map((ch) => (
          <li
            key={ch.id}
            className={`toc-item ${currentChapterId === ch.id ? 'active' : ''}`}
          >
            <label className="toc-checkbox" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(ch.id)}
                onChange={() => toggleChapterSelection(ch.id)}
              />
            </label>
            <span className="toc-title" onClick={() => selectChapter(ch.id)}>
              {ch.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
