import type { MigrateComment, MigrateReply } from '@/types'
import type { Data, TwikooId } from './types'

type RefType = 'Post' | 'SinglePage' | 'Plugin'

function normalizeId(value: TwikooId | null | undefined): string | undefined {
  const id = typeof value === 'string' ? value : value?.$oid
  return id?.trim() || undefined
}

function getCommentId(item: Data): string {
  const id = normalizeId(item.id) ?? normalizeId(item._id)
  if (!id) {
    throw new Error('Twikoo comment is missing an id or _id')
  }
  return id
}

function getRefType(url: string): RefType {
  return url.includes('archives') ? 'Post' : url === '/links' ? 'Plugin' : 'SinglePage'
}

function createComment(comment: Data, refType: RefType): MigrateComment {
  return {
    refType,
    kind: 'Comment',
    apiVersion: 'content.halo.run/v1alpha1',
    spec: {
      raw: comment.comment,
      content: comment.comment,
      owner: {
        kind: 'Email',
        name: comment.mail,
        displayName: comment.nick,
        annotations: { website: comment.link },
      },
      userAgent: comment.ua,
      ipAddress: comment.ip,
      priority: 0,
      top: false,
      allowNotification: true,
      approved: true,
      approvedTime: new Date(comment.created).toISOString(),
      creationTime: new Date(comment.created).toISOString(),
      hidden: false,
      subjectRef: {
        kind: refType,
        group: refType === 'Plugin' ? 'plugin.halo.run' : 'content.halo.run',
        version: 'v1alpha1',
        name: refType === 'Plugin' ? 'PluginLinks' : comment.url,
      },
      lastReadTime: undefined,
    },
    metadata: { name: getCommentId(comment) },
  }
}

function createReply(reply: Data, refType: RefType): MigrateReply {
  const commentName = normalizeId(reply.rid)
  if (!commentName) {
    throw new Error(`Twikoo reply ${getCommentId(reply)} is missing its root comment id`)
  }

  const quoteReply = normalizeId(reply.pid)
  const migrateReply: MigrateReply = {
    refType,
    kind: 'Reply',
    apiVersion: 'content.halo.run/v1alpha1',
    metadata: { name: getCommentId(reply) },
    spec: {
      raw: reply.comment,
      content: reply.comment,
      owner: {
        kind: 'Email',
        name: reply.mail,
        displayName: reply.nick,
        annotations: { website: reply.link },
      },
      userAgent: reply.ua,
      ipAddress: reply.ip,
      priority: 0,
      top: false,
      allowNotification: true,
      approved: true,
      approvedTime: new Date(reply.created).toISOString(),
      creationTime: new Date(reply.created).toISOString(),
      hidden: false,
      commentName,
    },
    status: {},
  }

  if (quoteReply && quoteReply !== commentName) {
    migrateReply.spec.quoteReply = quoteReply
  }
  return migrateReply
}

export function parseTwikooComments(items: Data[]): (MigrateComment | MigrateReply)[] {
  return items.map((item) => {
    const refType = getRefType(item.url)
    return normalizeId(item.rid) ? createReply(item, refType) : createComment(item, refType)
  })
}
