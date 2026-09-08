import type { Review } from '@/types/courseReview'

export type ReviewReply = Review['reply'][number]
export type ReviewReplyNode = { reply: ReviewReply; children: ReviewReplyNode[] }

export function buildReviewReplyThread(replies: ReviewReply[], newestFirst = false) {
  const byId = new Map<number, ReviewReplyNode>()
  for (const reply of replies) byId.set(reply.id, { reply, children: [] })
  const roots: ReviewReplyNode[] = []
  const parents = new Map<number, number>()
  for (const node of byId.values()) {
    const parent = byId.get(node.reply.parent)
    let ancestor = parent?.reply.id
    const visited = new Set([node.reply.id])
    while (ancestor !== undefined && !visited.has(ancestor)) {
      visited.add(ancestor)
      ancestor = parents.get(ancestor)
    }
    // Missing parents and malformed cycles stay visible as standalone branches.
    if (!parent || ancestor !== undefined) roots.push(node)
    else {
      parent.children.push(node)
      parents.set(node.reply.id, parent.reply.id)
    }
  }
  const chronological = (a: ReviewReplyNode, b: ReviewReplyNode) =>
    Date.parse(a.reply.created_time) - Date.parse(b.reply.created_time) || a.reply.id - b.reply.id
  roots.sort((a, b) => newestFirst ? chronological(b, a) : chronological(a, b))
  for (const node of byId.values()) node.children.sort(chronological)
  return { roots, byId, parents }
}
