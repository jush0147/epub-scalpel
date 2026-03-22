import { useBookStore } from '../store/bookStore'
import { summarizeText } from '../lib/gemini'

export function ContentViewer() {
  const book = useBookStore((s) => s.book)
  const currentChapterId = useBookStore((s) => s.currentChapterId)
  const currentChapterHtml = useBookStore((s) => s.currentChapterHtml)
  const geminiApiKey = useBookStore((s) => s.geminiApiKey)
  const geminiResult = useBookStore((s) => s.geminiResult)
  const geminiLoading = useBookStore((s) => s.geminiLoading)
  const setGeminiResult = useBookStore((s) => s.setGeminiResult)
  const setGeminiLoading = useBookStore((s) => s.setGeminiLoading)

  if (!book) return null

  const chapter = book.chapters.find((c) => c.id === currentChapterId)

  if (!chapter) {
    return (
      <div className="content-empty">
        <p>請從目錄選擇章節閱讀</p>
      </div>
    )
  }

  const handleSummarize = async (mode: 'summary' | 'keypoints') => {
    if (!currentChapterHtml || !geminiApiKey) return
    setGeminiLoading(true)
    setGeminiResult(null)
    try {
      const result = await summarizeText(geminiApiKey, currentChapterHtml, mode)
      setGeminiResult(result)
    } catch (e) {
      setGeminiResult(
        `錯誤：${e instanceof Error ? e.message : '未知錯誤'}`
      )
    } finally {
      setGeminiLoading(false)
    }
  }

  const copyResult = () => {
    if (geminiResult) {
      navigator.clipboard.writeText(geminiResult)
    }
  }

  return (
    <div className="content-viewer">
      <h2 className="content-chapter-title">{chapter.title}</h2>
      {currentChapterHtml === null ? (
        <div className="content-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: currentChapterHtml }}
        />
      )}

      <div className="content-actions">
        {!geminiApiKey ? (
          <span className="content-hint">請設定 Gemini API Key</span>
        ) : (
          <>
            <button
              className="btn-action"
              disabled={geminiLoading || !currentChapterHtml}
              onClick={() => handleSummarize('summary')}
            >
              摘要
            </button>
            <button
              className="btn-action"
              disabled={geminiLoading || !currentChapterHtml}
              onClick={() => handleSummarize('keypoints')}
            >
              重點整理
            </button>
          </>
        )}
      </div>

      {(geminiResult || geminiLoading) && (
        <div className="bottom-sheet-overlay" onClick={() => setGeminiResult(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <span>AI 分析結果</span>
              <button className="btn-sm" onClick={() => setGeminiResult(null)}>
                關閉
              </button>
            </div>
            <div className="bottom-sheet-body">
              {geminiLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  <pre className="gemini-result">{geminiResult}</pre>
                  <button className="btn-action" onClick={copyResult}>
                    複製
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
