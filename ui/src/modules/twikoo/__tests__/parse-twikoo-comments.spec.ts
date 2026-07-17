import { describe, expect, it } from 'vitest'
import { parseTwikooComments } from '../parse-twikoo-comments'
import type { Data } from '../types'

const baseComment: Omit<Data, 'id' | '_id'> = {
  nick: 'Visitor',
  mail: 'visitor@example.com',
  link: '',
  ua: 'Test Agent',
  ip: '127.0.0.1',
  url: '/archives/hello',
  comment: 'Hello',
  created: '2026-06-28T08:00:00.000Z',
  updated: '2026-06-28T08:00:00.000Z',
}

describe('parseTwikooComments', () => {
  it('uses the _id field from a standard Twikoo export', () => {
    const comments = parseTwikooComments([
      { ...baseComment, _id: 'root-id' },
      { ...baseComment, _id: 'reply-id', rid: 'root-id', pid: 'root-id' },
    ])

    expect(comments[0].metadata.name).toBe('root-id')
    expect(comments[1].metadata.name).toBe('reply-id')
    expect(comments[1].spec).toMatchObject({ commentName: 'root-id' })
    expect(comments[1].spec).not.toHaveProperty('quoteReply')
  })

  it('supports legacy id fields, nested replies, and MongoDB object ids', () => {
    const [reply] = parseTwikooComments([
      {
        ...baseComment,
        id: 'nested-reply-id',
        rid: { $oid: 'root-id' },
        pid: { $oid: 'parent-reply-id' },
      },
    ])

    expect(reply.metadata.name).toBe('nested-reply-id')
    expect(reply.spec).toMatchObject({
      commentName: 'root-id',
      quoteReply: 'parent-reply-id',
    })
  })

  it('rejects records without an id before sending them to Halo', () => {
    expect(() => parseTwikooComments([{ ...baseComment }])).toThrow(
      'Twikoo comment is missing an id or _id',
    )
  })
})
