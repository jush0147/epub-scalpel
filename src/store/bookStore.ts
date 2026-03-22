import { create } from 'zustand'
import JSZip from 'jszip'
import type { EpubBook } from '../lib/epub-parser'
import { parseEpub, loadChapterContent } from '../lib/epub-parser'

interface BookState {
  zip: JSZip | null
  book: EpubBook | null
  currentChapterId: string | null
  currentChapterHtml: string | null
  selectedChapterIds: Set<string>
  geminiApiKey: string
  geminiResult: string | null
  geminiLoading: boolean

  loadBook: (file: File) => Promise<void>
  selectChapter: (id: string) => Promise<void>
  toggleChapterSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setApiKey: (key: string) => void
  clearApiKey: () => void
  setGeminiResult: (result: string | null) => void
  setGeminiLoading: (loading: boolean) => void
}

export const useBookStore = create<BookState>((set, get) => ({
  zip: null,
  book: null,
  currentChapterId: null,
  currentChapterHtml: null,
  selectedChapterIds: new Set(),
  geminiApiKey: localStorage.getItem('gemini_api_key') || '',
  geminiResult: null,
  geminiLoading: false,

  loadBook: async (file: File) => {
    const { book, zip } = await parseEpub(file)
    set({
      book,
      zip,
      currentChapterId: null,
      currentChapterHtml: null,
      selectedChapterIds: new Set(),
      geminiResult: null,
    })
  },

  selectChapter: async (id: string) => {
    const { zip, book } = get()
    if (!zip || !book) return
    const chapter = book.chapters.find((c) => c.id === id)
    if (!chapter) return
    set({ currentChapterId: id, currentChapterHtml: null, geminiResult: null })
    const html = await loadChapterContent(zip, chapter)
    set({ currentChapterHtml: html })
  },

  toggleChapterSelection: (id: string) => {
    const next = new Set(get().selectedChapterIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    set({ selectedChapterIds: next })
  },

  selectAll: () => {
    const { book } = get()
    if (!book) return
    set({ selectedChapterIds: new Set(book.chapters.map((c) => c.id)) })
  },

  clearSelection: () => {
    set({ selectedChapterIds: new Set() })
  },

  setApiKey: (key: string) => {
    localStorage.setItem('gemini_api_key', key)
    set({ geminiApiKey: key })
  },

  clearApiKey: () => {
    localStorage.removeItem('gemini_api_key')
    set({ geminiApiKey: '' })
  },

  setGeminiResult: (result: string | null) => {
    set({ geminiResult: result })
  },

  setGeminiLoading: (loading: boolean) => {
    set({ geminiLoading: loading })
  },
}))
