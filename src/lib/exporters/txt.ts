import JSZip from 'jszip'
import type { EpubBook } from '../epub-parser'
import { loadChapterContent } from '../epub-parser'

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export async function exportToTxt(
  book: EpubBook,
  selectedIds: Set<string>,
  zip: JSZip
): Promise<void> {
  const parts: string[] = [book.title, '']

  const selectedChapters = book.chapters.filter((ch) => selectedIds.has(ch.id))

  for (const chapter of selectedChapters) {
    const html = await loadChapterContent(zip, chapter)
    const text = htmlToText(html)
    parts.push(`=== ${chapter.title} ===`, '', text, '', '---', '')
  }

  const content = parts.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.title}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
