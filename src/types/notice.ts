export interface Attachment {
  name: string
  url: string
  size?: number
}

export interface Notice {
  _id: string
  nid: number
  title: string
  content: string
  authorName: string
  status: 'DRAFT' | 'PUBLISHED'
  isTop: boolean
  views: number
  attachments: Attachment[] // 🟢 附件列表
  createdAt: string
}

export interface UploadResponse {
  list: {
    name: string
    url: string
    size: number
    mimetype: string
  }[]
}
