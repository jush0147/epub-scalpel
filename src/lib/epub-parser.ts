import JSZip from 'jszip'

export interface Chapter {
  id: string
  title: string
  order: number
  filePath: string
}

export interface EpubBook {
  title: string
  author: string
  chapters: Chapter[]
}

function resolveHref(base: string, href: string): string {
  const baseParts = base.split('/')
  baseParts.pop()
  const hrefParts = href.split('/')
  for (const part of hrefParts) {
    if (part === '..') {
      baseParts.pop()
    } else if (part !== '.') {
      baseParts.push(part)
    }
  }
  return baseParts.join('/')
}

function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml')
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path)
  if (!file) throw new Error(`File not found in EPUB: ${path}`)
  return file.async('text')
}

async function getOpfPath(zip: JSZip): Promise<string> {
  const containerXml = await readZipText(zip, 'META-INF/container.xml')
  const doc = parseXml(containerXml)
  const rootfile = doc.querySelector('rootfile')
  const path = rootfile?.getAttribute('full-path')
  if (!path) throw new Error('Cannot find OPF path in container.xml')
  return path
}

function parseMetadata(opfDoc: Document): { title: string; author: string } {
  const ns = 'http://purl.org/dc/elements/1.1/'
  const title =
    opfDoc.getElementsByTagNameNS(ns, 'title')[0]?.textContent?.trim() ||
    'Untitled'
  const author =
    opfDoc.getElementsByTagNameNS(ns, 'creator')[0]?.textContent?.trim() ||
    'Unknown'
  return { title, author }
}

function buildManifestMap(
  opfDoc: Document
): Map<string, { href: string; mediaType: string; properties?: string }> {
  const map = new Map<
    string,
    { href: string; mediaType: string; properties?: string }
  >()
  const items = opfDoc.querySelectorAll('manifest > item')
  items.forEach((item) => {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    const mediaType = item.getAttribute('media-type') || ''
    const properties = item.getAttribute('properties') || undefined
    if (id && href) {
      map.set(id, { href, mediaType, properties })
    }
  })
  return map
}

function getSpineOrder(opfDoc: Document): string[] {
  const refs = opfDoc.querySelectorAll('spine > itemref')
  return Array.from(refs).map((ref) => ref.getAttribute('idref') || '')
}

async function parseNav(
  zip: JSZip,
  navPath: string
): Promise<{ title: string; href: string }[]> {
  const navText = await readZipText(zip, navPath)
  const doc = parseXml(navText)
  const navEl =
    doc.querySelector('nav[*|type="toc"]') || doc.querySelector('nav')
  if (!navEl) return []

  const links = navEl.querySelectorAll('a')
  const results: { title: string; href: string }[] = []
  links.forEach((a) => {
    const href = a.getAttribute('href')
    const title = a.textContent?.trim()
    if (href && title) {
      results.push({ title, href: href.split('#')[0] })
    }
  })
  return results
}

async function parseNcx(
  zip: JSZip,
  ncxPath: string
): Promise<{ title: string; href: string }[]> {
  const ncxText = await readZipText(zip, ncxPath)
  const doc = parseXml(ncxText)
  const navPoints = doc.querySelectorAll('navPoint')
  const results: { title: string; href: string }[] = []
  navPoints.forEach((np) => {
    const title = np.querySelector('navLabel > text')?.textContent?.trim()
    const src = np.querySelector('content')?.getAttribute('src')
    if (title && src) {
      results.push({ title, href: src.split('#')[0] })
    }
  })
  return results
}

export async function parseEpub(file: File): Promise<{
  book: EpubBook
  zip: JSZip
}> {
  const zip = await JSZip.loadAsync(file)
  const opfPath = await getOpfPath(zip)
  const opfText = await readZipText(zip, opfPath)
  const opfDoc = parseXml(opfText)

  const { title, author } = parseMetadata(opfDoc)
  const manifest = buildManifestMap(opfDoc)
  const spineIds = getSpineOrder(opfDoc)

  // Build a map from resolved href to manifest item id
  const hrefToSpineIndex = new Map<string, number>()
  const spineIdToHref = new Map<string, string>()
  spineIds.forEach((id, index) => {
    const item = manifest.get(id)
    if (item) {
      const resolved = resolveHref(opfPath, item.href)
      hrefToSpineIndex.set(resolved, index)
      spineIdToHref.set(id, resolved)
    }
  })

  // Try EPUB3 nav first
  let navItemId: string | undefined
  for (const [id, item] of manifest) {
    if (item.properties?.includes('nav')) {
      navItemId = id
      break
    }
  }

  let tocEntries: { title: string; href: string }[] = []

  if (navItemId) {
    const navItem = manifest.get(navItemId)!
    const navPath = resolveHref(opfPath, navItem.href)
    tocEntries = await parseNav(zip, navPath)
    // Resolve hrefs relative to nav file
    tocEntries = tocEntries.map((e) => ({
      ...e,
      href: resolveHref(navPath, e.href),
    }))
  }

  // Fallback to NCX
  if (tocEntries.length === 0) {
    let ncxItemId: string | undefined
    for (const [id, item] of manifest) {
      if (item.mediaType === 'application/x-dtbncx+xml') {
        ncxItemId = id
        break
      }
    }
    if (ncxItemId) {
      const ncxItem = manifest.get(ncxItemId)!
      const ncxPath = resolveHref(opfPath, ncxItem.href)
      tocEntries = await parseNcx(zip, ncxPath)
      tocEntries = tocEntries.map((e) => ({
        ...e,
        href: resolveHref(ncxPath, e.href),
      }))
    }
  }

  // If still no TOC, fallback to spine order
  let chapters: Chapter[]
  if (tocEntries.length === 0) {
    chapters = spineIds
      .map((id, index) => {
        const filePath = spineIdToHref.get(id)
        if (!filePath) return null
        return {
          id,
          title: `Chapter ${index + 1}`,
          order: index,
          filePath,
        }
      })
      .filter((c): c is Chapter => c !== null)
  } else {
    // Deduplicate by href while preserving order
    const seen = new Set<string>()
    chapters = []
    for (const entry of tocEntries) {
      if (seen.has(entry.href)) continue
      seen.add(entry.href)
      const order = hrefToSpineIndex.get(entry.href) ?? chapters.length
      chapters.push({
        id: `ch-${chapters.length}`,
        title: entry.title,
        order,
        filePath: entry.href,
      })
    }
    chapters.sort((a, b) => a.order - b.order)
  }

  return {
    book: { title, author, chapters },
    zip,
  }
}

export async function loadChapterContent(
  zip: JSZip,
  chapter: Chapter
): Promise<string> {
  const html = await readZipText(zip, chapter.filePath)
  const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml')

  // Remove scripts and stylesheets
  doc.querySelectorAll('script, link[rel="stylesheet"], style').forEach((el) =>
    el.remove()
  )

  // Return body content
  const body = doc.querySelector('body')
  return body ? body.innerHTML : doc.documentElement.innerHTML
}
