import { describe, expect, it } from 'vitest'
import { buildReviewReplyThread, type ReviewReply, type ReviewReplyNode } from './reviewReplyThread'

const reply = (id: number, parent = 0): ReviewReply => ({
  id, parent, floor_number: id, content: `回复 ${id}`, created_time: `2026-09-08T00:00:${String(id).padStart(2, '0')}Z`,
  created_by: { id: 2, name: '同学', avatar: '' }, like: { like: 0, dislike: 0, user_option: 0 }, is_deleted: false,
})

describe('course review reply tree', () => {
  it('groups unordered replies by parent, sorting roots independently from conversations', () => {
    const replies = [reply(5, 1), reply(4), reply(3, 2), reply(2, 1), reply(1)]
    const tree = buildReviewReplyThread(replies, true)
    expect(tree.roots.map((node) => node.reply.id)).toEqual([4, 1])
    expect(tree.byId.get(1)?.children.map((node) => node.reply.id)).toEqual([2, 5])
    expect(tree.byId.get(2)?.children[0].reply.id).toBe(3)
    expect(replies.map((item) => item.id)).toEqual([5, 4, 3, 2, 1])
  })

  it('retains deleted parents and their descendants', () => {
    const tree = buildReviewReplyThread([{ ...reply(1), is_deleted: true }, reply(2, 1)])
    expect(tree.roots[0].reply.is_deleted).toBe(true)
    expect(tree.roots[0].children[0].reply.id).toBe(2)
  })

  it('keeps orphaned and cyclic legacy replies visible exactly once', () => {
    const tree = buildReviewReplyThread([reply(1, 2), reply(2, 1), reply(3, 99), reply(4, 4)])
    const flatten = (nodes: ReviewReplyNode[]): number[] => nodes.flatMap((node) => [node.reply.id, ...flatten(node.children)])
    expect(flatten(tree.roots).sort()).toEqual([1, 2, 3, 4])
  })
})
