'use client'

import React from 'react'

interface LatexRendererProps {
  latex: string
  display?: boolean
  className?: string
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'math'; content: string; display: boolean }

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeTextSegment(content: string): string {
  return content
    .replace(/\${3,}/g, '')
    .replace(/(^|[\s(])\$(?=[A-Za-z][A-Za-z\s,'-]{5,})/g, '$1')
    .replace(/([A-Za-z0-9)\]}])\$(?=([\s.,;:!?)]|$))/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
}

function isLikelyProse(content: string): boolean {
  const value = content.trim()
  if (!value) return false

  const words = value.match(/[A-Za-z]{2,}/g) || []
  if (words.length >= 10) return true

  const proseHint = /\b(the|and|for|with|find|given|where|which|what|value|sequence|defined|rule|real|constants|question|paper)\b/i
  if (proseHint.test(value) && words.length >= 5) return true

  return false
}

function looksLikeMath(content: string): boolean {
  const value = content.trim()
  if (!value) return false
  if (value.includes('$')) return false

  // Single symbols wrapped in delimiters are still math in exam copy.
  if (/^[A-Za-z]$/.test(value)) return true

  const hasLatexCommand = /\\[a-zA-Z]+/.test(value)
  const hasStrongMathSyntax = /[\\^_{}=+\-*/()[\]0-9]/.test(value) || hasLatexCommand
  if (!hasStrongMathSyntax) return false

  // Count only multi-letter words for prose detection so variables like a_n or x^2
  // are not incorrectly treated as natural language.
  const proseWords = value.match(/[A-Za-z]{2,}/g) || []
  if (!hasLatexCommand && !/[\\^_{}=+\-*/()[\]0-9]/.test(value)) {
    if (proseWords.length >= 5) return false
    if (proseWords.some((word) => word.length >= 10)) return false
  } else if (hasLatexCommand && proseWords.length >= 10) {
    return false
  }

  if (isLikelyProse(value)) return false
  if (/^[A-Za-z][A-Za-z\s,.'-]*$/.test(value)) return false
  if (/\b(the|find|given|which|what|where|sequence|value|function|question|paper)\b/i.test(value) && proseWords.length >= 4) {
    return false
  }
  return true
}

function hasBalancedBraces(value: string): boolean {
  let depth = 0
  for (const ch of value) {
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth < 0) return false
    }
  }
  return depth === 0
}

function repairCommonMathContent(content: string): string {
  return content
    .replace(/\\sqrt\s+([A-Za-z0-9])/g, '\\sqrt{$1}')
    .replace(/\^([A-Za-z0-9])/g, '^{$1}')
    .replace(/_([A-Za-z0-9])/g, '_{$1}')
}

function isClearlyBrokenMath(content: string): boolean {
  const value = content.trim()
  if (!value) return true
  if (/\\[a-zA-Z]+\s*$/.test(value)) return true
  if (!hasBalancedBraces(value)) return true
  return false
}

function shouldRenderWholeAsMath(source: string): boolean {
  const value = source.trim()
  if (!value) return false
  if (value.length > 140) return false
  if (value.includes('\n')) return false

  const words = value.match(/[A-Za-z]+/g) || []
  if (words.length > 8) return false
  if (/\\[a-zA-Z]+\s*$/.test(value)) return false
  if (!hasBalancedBraces(value)) return false

  return looksLikeMath(value)
}

function splitLatexSegments(source: string): Segment[] {
  const segments: Segment[] = []
  let i = 0

  while (i < source.length) {
    if (source.startsWith('$$', i)) {
      const end = source.indexOf('$$', i + 2)
      if (end > i + 1) {
        const content = source.slice(i + 2, end)
        if (looksLikeMath(content) && !content.includes('$')) {
          segments.push({ type: 'math', content, display: true })
          i = end + 2
          continue
        }

        // Treat ambiguous "$$...$$" blocks as plain text and continue scanning.
        segments.push({ type: 'text', content })
        i = end + 2
        continue
      }
      segments.push({ type: 'text', content: '$$' })
      i += 2
      continue
    }

    if (source[i] === '$') {
      const end = source.indexOf('$', i + 1)
      if (end > i + 1) {
        const content = source.slice(i + 1, end)
        const isReasonableInlineSpan = !content.includes('\n') && content.length <= 120
        if (isReasonableInlineSpan && looksLikeMath(content)) {
          segments.push({ type: 'math', content, display: false })
          i = end + 1
          continue
        }

        // Do not consume across prose when delimiters are likely malformed.
        if (!isReasonableInlineSpan || isLikelyProse(content)) {
          segments.push({ type: 'text', content: '$' })
          i += 1
          continue
        } else {
          segments.push({ type: 'text', content })
        }
        i = end + 1
        continue
      }
      segments.push({ type: 'text', content: '$' })
      i += 1
      continue
    }

    let next = source.indexOf('$', i)
    if (next < 0) next = source.length
    if (next === i) {
      segments.push({ type: 'text', content: source[i] })
      i += 1
      continue
    }
    segments.push({ type: 'text', content: source.slice(i, next) })
    i = next
  }

  return segments
}

export default function LatexRenderer({
  latex,
  display = false,
  className = '',
}: LatexRendererProps) {
  const [renderedHtml, setRenderedHtml] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isCancelled = false

    const render = async () => {
      try {
        const katex = (await import('katex')).default
        const normalized = String(latex ?? '')

        const renderMixed = (source: string): string => {
          const segments = splitLatexSegments(source)
          const hasDelimiterMath = segments.some((segment) => segment.type === 'math')

          if (!hasDelimiterMath) {
            if (shouldRenderWholeAsMath(source)) {
              const repaired = repairCommonMathContent(source)
              if (isClearlyBrokenMath(repaired)) {
                return escapeHtml(source).replace(/\n/g, '<br/>')
              }
              const mathHtml = katex.renderToString(repaired, {
                throwOnError: false,
                displayMode: display,
                strict: 'ignore',
                trust: false,
              })
              if (!mathHtml.includes('katex-error')) {
                return mathHtml
              }
            }
            return escapeHtml(normalizeTextSegment(source)).replace(/\n/g, '<br/>')
          }

          return segments
            .map((segment) => {
              if (segment.type === 'text') {
                return escapeHtml(normalizeTextSegment(segment.content)).replace(/\n/g, '<br/>')
              }
              try {
                const repaired = repairCommonMathContent(segment.content)
                if (isClearlyBrokenMath(repaired)) {
                  return escapeHtml(normalizeTextSegment(segment.content)).replace(/\n/g, '<br/>')
                }
                const mathHtml = katex.renderToString(repaired, {
                  throwOnError: false,
                  displayMode: segment.display,
                  strict: 'ignore',
                  trust: false,
                })
                if (!mathHtml.includes('katex-error')) {
                  return mathHtml
                }
                if (segment.content.includes('$')) {
                  return renderMixed(segment.content)
                }
                return escapeHtml(normalizeTextSegment(segment.content)).replace(/\n/g, '<br/>')
              } catch {
                return escapeHtml(normalizeTextSegment(segment.content)).replace(/\n/g, '<br/>')
              }
            })
            .join('')
        }

        const html = renderMixed(normalized)

        if (!isCancelled) setRenderedHtml(html)
      } catch {
        if (!isCancelled) setRenderedHtml(null)
      }
    }

    void render()

    return () => {
      isCancelled = true
    }
  }, [latex, display])

  if (!renderedHtml) {
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {latex}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  )
}
