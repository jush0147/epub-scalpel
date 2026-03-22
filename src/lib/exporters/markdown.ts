import JSZip from 'jszip'
import TurndownService from 'turndown'
import type { EpubBook } from '../epub-parser'
import { loadChapterContent } from '../epub-parser'

export async function exportToMarkdown(
  book: EpubBook,
  selectedIds: Set<string>,
  zip: JSZip
): Promise<void> {
  const turndown = new TurndownService({ headingStyle: 'atx' })
  const parts: string[] = [`# ${book.title}\n`]

  const selectedChapters = book.chapters.filter((ch) => selectedIds.has(ch.id))

  for (const chapter of selectedChapters) {
    const html = await loadChapterContent(zip, chapter)
    const md = turndown.turndown(html)
    parts.push(`## ${chapter.title}\n\n${md}\n\n---\n`)
  }

  const content = parts.join('\n')
  downloadFile(content, `${book.title}.md`, 'text/markdown')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
