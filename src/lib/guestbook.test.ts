import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { guestbookPasteContent, guestbookTextLength, loadGuestbookDraft, sanitizeAnnouncementHtml, sanitizeGuestbookHtml, saveGuestbookDraft } from './guestbook'
import { useGuestbookDraft } from './useGuestbookDraft'

describe('guestbook drafts', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('does not restore published content on disposal or a pending save timer', () => {
    const scope = effectScope()
    const draft = scope.run(() => useGuestbookDraft(1, null))!
    draft.content.value = '<p>publish once</p>'
    draft.persist()
    draft.content.value = '<p>publish the latest</p>'
    draft.markPublished()
    scope.stop()
    vi.runAllTimers()
    expect(loadGuestbookDraft(1, null)).toBeNull()
  })

  it('clearing the editor removes previously saved text', () => {
    const scope = effectScope()
    const draft = scope.run(() => useGuestbookDraft(1, null))!
    draft.content.value = '<p>old text</p>'
    vi.advanceTimersByTime(500)
    draft.content.value = '<p></p>'
    vi.advanceTimersByTime(500)
    expect(loadGuestbookDraft(1, null)).toBeNull()
    scope.stop()
  })

  it('keeps account and reply drafts isolated and reuses a retry ID after reopening', () => {
    const scope = effectScope()
    const draft = scope.run(() => useGuestbookDraft(1, 42))!
    draft.content.value = '<p>retry me</p>'
    const id = draft.submissionId.value
    scope.stop()
    const nextScope = effectScope()
    const restored = nextScope.run(() => useGuestbookDraft(1, 42))!
    expect(restored.submissionId.value).toBe(id)
    expect(restored.content.value).toBe('<p>retry me</p>')
    expect(loadGuestbookDraft(2, 42)).toBeNull()
    expect(loadGuestbookDraft(1, null)).toBeNull()
    restored.content.value = '<p>different text</p>'
    expect(restored.submissionId.value).not.toBe(id)
    nextScope.stop()
  })

  it('reports quota failures without throwing during leave or teardown', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
    const scope = effectScope()
    const draft = scope.run(() => useGuestbookDraft(1, null))!
    draft.content.value = '<p>keep this</p>'
    expect(draft.persist()).toBe(false)
    expect(draft.saveState.value).toBe('failed')
    expect(() => scope.stop()).not.toThrow()
  })

  it('ignores invalid saved data and does not reuse invalid submission IDs', () => {
    localStorage.setItem('guestbook:draft:v1:1:root', '{"content":42}')
    expect(loadGuestbookDraft(1, null)).toBeNull()
    saveGuestbookDraft(1, null, { content: 'ok', anonymous: false, updatedAt: '', submissionId: 'invalid' })
    expect(loadGuestbookDraft(1, null)?.submissionId).toBeUndefined()
  })
})

describe('guestbook text', () => {
  it('counts Unicode code points consistently with the server', () => {
    expect(guestbookTextLength(`<p>${'😀'.repeat(500)}</p>`)).toBe(500)
  })
  it('pastes literal markup and preserves line breaks in the actual editor', () => {
    const editor = new Editor({ extensions: [StarterKit], content: '<p></p>' })
    editor.commands.insertContent(guestbookPasteContent('A <strong>B</strong>\nnext\n\nlast'))
    expect(editor.getText()).toBe('A <strong>B</strong>\n\nnext\n\n\n\nlast')
    expect(editor.getHTML()).not.toContain('<strong>')
    expect(editor.getJSON().content).toHaveLength(4)
    editor.destroy()
  })
})

describe('announcement images', () => {
  const imageUrl = '/api/download/123e4567-e89b-12d3-a456-426614174000/'

  it('keeps uploaded images only for announcements', () => {
    expect(sanitizeAnnouncementHtml(`<p>公告</p><img src="${imageUrl}" onerror="alert(1)">`))
      .toContain(`src="${imageUrl}"`)
    expect(sanitizeGuestbookHtml(`<p>留言</p><img src="${imageUrl}">`)).toBe('<p>留言</p>')
  })

  it('removes external, base64, and malformed image sources', () => {
    const content = sanitizeAnnouncementHtml([
      '<p>公告</p>',
      '<img src="https://example.com/a.png">',
      '<img src="data:image/png;base64,abc">',
      '<img src="/api/download/not-a-uuid/">',
    ].join(''))
    expect(content).toBe('<p>公告</p>')
  })
})
