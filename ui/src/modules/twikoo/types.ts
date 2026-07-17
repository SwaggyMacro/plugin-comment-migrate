export interface Data {
  nick: string
  mail: string
  link: string
  ua: string
  ip: string
  url: string
  comment: string
  pid?: TwikooId
  rid?: TwikooId
  created: string
  updated: string
  id?: TwikooId
  _id?: TwikooId
}

export type TwikooId = string | { $oid: string }
