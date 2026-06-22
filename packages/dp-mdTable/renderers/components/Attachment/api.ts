import { clientApi } from 'api'
import type { AttachmentCellValue } from '../../../types/column-types'
import { normalizeAttachmentValue } from './view'

function getAttachmentPath(dataId: string, attachmentId?: string) {
  const basePath = `/api/dynamic-db/table/data/${encodeURIComponent(dataId)}/attachments`
  return attachmentId ? `${basePath}/${encodeURIComponent(attachmentId)}` : basePath
}

function extractUploadedAttachments(response: any) {
  const payload = response?.data?.data ?? response?.data ?? response
  return normalizeAttachmentValue(payload)
}

export async function uploadTableAttachment(dataId: string, fieldName: string, file: File): Promise<AttachmentCellValue[]> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('field_name', fieldName)
  const response = await clientApi.instance.post(getAttachmentPath(dataId), formData)
  return extractUploadedAttachments(response)
}

export async function deleteTableAttachment(dataId: string, attachmentId: string): Promise<void> {
  await clientApi.instance.delete(getAttachmentPath(dataId, attachmentId))
}
