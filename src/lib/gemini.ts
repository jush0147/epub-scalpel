function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export async function summarizeText(
  apiKey: string,
  htmlContent: string,
  mode: 'summary' | 'keypoints'
): Promise<string> {
  const text = stripHtml(htmlContent)

  const prompt =
    mode === 'summary'
      ? `請用繁體中文，以3-5句話摘要以下內容：\n\n${text}`
      : `請用繁體中文，條列式整理以下內容的重點（5-8點）：\n\n${text}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key 無效，請檢查您的 Gemini API Key')
    }
    if (response.status === 429) {
      throw new Error('已超過 API 配額限制，請稍後再試')
    }
    throw new Error(`API 請求失敗 (${response.status})`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const result = candidate?.content?.parts?.[0]?.text

  if (!result) {
    throw new Error('未能取得 AI 回應')
  }

  return result
}
