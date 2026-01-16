import { globalApi, clientApi,adminApi } from 'api'

export const conditionType = [
  { label: 'authors', value: 'authors' },
  { label: 'authorGroups', value: 'authorGroups' },
  { label: 'creatorGroups', value: 'creatorGroups' },
  { label: 'creators', value: 'creators' },
  { label: 'keyword', value: 'keyword' },
  { label: 'metadata', value: 'metadata' },
  { label: 'documentTypes', value: 'documentTypes' },
  { label: 'mimeTypes', value: 'mimeTypes' },
  { label: 'collections', value: 'collections' },
  { label: 'tags', value: 'tags' },
  { label: 'size', value: 'size' },
  { label: 'createdDate', value: 'createdDate' },
  { label: 'modified', value: 'modified' },
  { label: 'path', value: 'path' }
]
export const languages = [
  { label: 'chi_sim', value: 'chi_sim' },
  { label: 'chi_tra', value: 'chi_tra' },
  { label: 'eng', value: 'eng' },
  { label: 'ind', value: 'ind' },
  { label: 'jpn', value: 'jpn' },
  { label: 'kor', value: 'kor' },
  { label: 'tha', value: 'tha' },
  { label: 'vie', value: 'vie' }
]
export const sizes = [
  { label: 'searchType.100', value: '100' },
  { label: 'searchType.1000', value: '1000' },
  { label: 'searchType.10000', value: '10000' },
  { label: 'searchType.100000', value: '100000' },
  { label: 'searchType.1000000', value: '1000000' }
]

export const mimeTypes = [
  {
    label: 'Images',
    value: 'images',
    options: [
      { label: 'All Image', value: 'image/*' },
      { label: 'JPG', value: 'image/jpeg' },
      { label: 'PNG', value: 'image/png' },
      { label: 'GIF', value: 'image/gif' },
      { label: 'SVG', value: 'image/svg+xml' },
      { label: 'TIFF', value: 'image/tiff' },
      { label: 'WEBP', value: 'image/webp' },
      { label: 'BMP', value: 'image/bmp' }
    ]
  },
  {
    label: 'Documents',
    value: 'Documents',
    options: [
      { label: 'All Document', value: 'application/*' },
      { label: 'PDF', value: 'application/pdf' },
      { label: 'DOC', value: 'application/msword' },
      { label: 'DOCX', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { label: 'XLS', value: 'application/vnd.ms-excel' },
      { label: 'XLSX', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { label: 'PPT', value: 'application/vnd.ms-powerpoint' },
      { label: 'PPTX', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    ]
  },
  {
    label: 'Videos',
    value: 'Videos',
    options: [
      { label: 'All Video', value: 'video/*' },
      { label: 'MP4', value: 'video/mp4' },
      { label: 'AVI', value: 'video/x-msvideo' },
      { label: 'WMV', value: 'video/x-ms-wmv' },
      { label: 'FLV', value: 'video/x-flv' },
      { label: 'MKV', value: 'video/x-matroska' }
    ]
  },
  {
    label: 'Audios',
    value: 'Audios',
    options: [
      { label: 'All Audio', value: 'audio/*' },
      { label: 'MP3', value: 'audio/mpeg' },
      { label: 'WAV', value: 'audio/wav' },
      { label: 'OGG', value: 'audio/ogg' },
      { label: 'FLAC', value: 'audio/flac' },
      { label: 'AAC', value: 'audio/aac' }
    ]
  }
]
export function sortListWithI18n(list: any, prefix = '') {
  list = JSON.parse(JSON.stringify(list))
  // @ts-ignore
  const t = window.$t
  const _list = list.map((item: any) => {
    item.label = t(prefix + item.label)
    return item
  })
  return _list.sort((a: any, b: any) => a.label.localeCompare(b.label))
}
export const getMetadataOptions = async () => {
  try {
    let metadataOpts
    const platform = window.location.pathname.includes('admin') ? 'admin' : 'client'
    if (platform === 'admin') {
      metadataOpts = await clientApi.admin.getAdmindmsDocpalTypeCache().then((res: any) => res.data)
    } else {
      metadataOpts = await clientApi.api.getTypesMetadataV2QueryCache().then((res: any) => res.data)
    }
    const optionList = metadataOpts.map((item: any) => ({
      ...item,
      label: item.name,
      value: item.name
    }))
    return optionList
  } catch (error) {
    return []
  }
}

export const getGroupList = async () => {
  const { data } = (await globalApi.api.postNuxeoIdentityGroups()) as any
  const optionList = data.map((item: any) => ({
    ...item,
    label: item.name,
    value: item.id
  }))
  return optionList
}
