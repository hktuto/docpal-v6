import { adminApi, clientApi } from 'api'
import { Download, Loading } from '@element-plus/icons-vue'
import { ElNotification, ElMessage } from 'element-plus'
import * as mime from 'mime-types'

export function downloadHandler(doc: any) {
  if (!doc.isFolder) downloadFileHandler(doc)
  else downloadFolderHandler(doc)
}

export async function downloadFolderHandler(doc: any) {
  const noti = ElNotification({
    title: '',
    dangerouslyUseHTMLString: true,
    icon: Loading,
    message: `downloading ~ ${doc.name}`,
    showClose: false,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const blob = await adminApi.api.postNuxeoFolderstructureExport(
      {
        idOrPath: doc.id
      },
      {
        format: 'blob',
        timeout: 0,
        headers: { white: 'true' }
      }
    )
    downloadBlob(blob, doc.name + '.zip', 'application/zip')
  } catch (error: any) {
    console.error(error)
  } finally {
    noti.close()
  }
}

export function canCollaboraEdit(mimeType: string) {
  // is mimeType is .doc or .docx file
  // check is doc or docx
  const excelType = [
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/msexcel',
    'application/x-msexcel',
    'application/x-ms-excel',
    'application/x-excel',
    'application/x-dos_ms_excel',
    'application/xls',
    'application/x-xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  if (excelType.includes(mimeType)) return true
  const wordType = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word.template.macroEnabled.12'
  ]
  if (wordType.includes(mimeType)) return true
  const pptType = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  if (pptType.includes(mimeType)) return true

  if (mimeType.includes('application/vnd.collabora') || mimeType.includes('application/vnd.collabora-project')) return true
  return false
}

export function getMimeTypeFromDocument(doc: any): string | undefined {
  console.log('getMimeTypeFromDocument', doc)
  if (!doc.properties) return undefined
  const properties = doc.properties as any
  const mimeType: string = properties['file_content'] && properties['file_content']['mime-type'] ? properties['file_content']['mime-type'] : ''
  if (!mimeType) return undefined
  return mimeType
}

export const formatFileSize = (size: number) => {
  if (!size) return ''
  if (size < 1024) {
    return size.toFixed(1) + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(1) + ' MB'
  } else {
    return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  }
}

export const mimeTypeToIcon = (mimeType: string) => {
  // if mimetype is image, return image src
  if (mimeType?.startsWith('image')) {
    return `/icons/doc/image.svg`
  }

  // if mimetype is video, return video src
  if (mimeType?.startsWith('video')) {
    return `/icons/doc/video.svg`
  }
  // if mimetype is audio, return audio src
  if (mimeType?.startsWith('audio')) {
    return `/icons/doc/audio.svg`
  }

  // if mimetype is pdf, return pdf src
  if (mimeType?.startsWith('application/pdf')) {
    return `/icons/doc/pdf.svg`
  }
  // if mimetype is text, return text src
  if (mimeType?.startsWith('text')) {
    return `/icons/doc/text.svg`
  }
  // if mimetype is zip, return zip src
  if (mimeType?.startsWith('application/zip')) {
    return `/icons/doc/zip.svg`
  }
  // if mimetype is .xls or xlsx return  excel src
  if (mimeType?.startsWith('application/vnd.ms-excel') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    return `/icons/doc/excel.svg`
  }
  // if mimetype is word, return word src
  if (mimeType?.startsWith('application/msword') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return `/icons/doc/word.svg`
  }
  // if mimetype is ppt, return ppt src
  if (
    mimeType?.startsWith('application/vnd.ms-powerpoint') ||
    mimeType?.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')
  ) {
    return `/icons/doc/ppt.svg`
  }

  // if mimetype is unknown, return unknown src
  return `/icons/doc/file.svg`
}

export function mimeTypeToExtension(mimeType: string) {
  // if mimetype is image, return image src
  return mime.extension(mimeType) || '-'
}

export function toBrowseItem(path: string) {
  return {
    id: 'client-browse',
    name: path,
    icon: 'dp-icon:browse-outline',
    hoverIcon: 'dp-icon:browse-fill',
    label: path,
    component: 'LazyBrowsePage',
    props: {
      idOrPath: path
    }
  }
}

export const getUniqueName = async (file: any) => {
  try {
    const fileName = file.fileName || file.name
    // TODO: check if deprecated
    const res = await clientApi.api.postDmsDocumentIsduplicatename({
        path: file.goPath,
        titles: [fileName]
      }).then((res: any) => res.data)
    console.log('getUniqueName', res)
    // TODO : the uniqueName has bug, will return same name
    const name = res[fileName]?.uniqueName || fileName
    return name
  } catch (error) {
    return file.fileName || file.name
  }
}

export const getDocDetail = async (idOrPath: string, userId: string) => {
  try {
    const promise = []
    promise.push(clientApi.api.postDmsDocumentFetch({ idOrPath }))
    let [{ data: doc }, permission] = await Promise.all(promise)
    return {
      doc,
      permission
    }
  } catch (err) {
    throw err
  }
}

export const getPermission = async (idOrPath: string, userId: string): Promise<any> => {
  try {
    if (!idOrPath || !userId) {
      return {}
    }
    const data = await clientApi.api.getDmsDocumentDocumentidUserPermissionUserid(
      { docId: idOrPath, userId },
      {
        headers: { noThrowError: 'true' }
      }
    ).then(r => r.data)
    if (!data) {
      throw new Error('no permission found')
    }
    return {
      ...data,
      hold: data.hold || {}
    }
  } catch (error) {
    return {
      print: false,
      permissionList: [],
      permission: 'Everything',
      retention: null,
      hold: null
    }
  }
}

async function DownloadDocApi(idOrPath: string, cb?: Function) {
  return clientApi.api.postDmsDocumentDownload(
    { idOrPath },
    {
      format: 'blob',
      timeout: 0,
      onDownloadProgress: function (progressEvent) {
        if (cb) cb(progressEvent)
      }
    }
  )
}

export async function downloadFileHandler(doc: any) {
  // const { t } = useI18n() // 会报错SyntaxError: Must be called at the top of a `setup` function
  // exportFolderStructureApi
  const id = new Date().valueOf() + doc.name
  const notification = ElNotification({
    title: '',
    icon: Download,
    dangerouslyUseHTMLString: true,
    message: `<span id="${id}">0%</span> ${doc.name}`,
    showClose: false,
    customClass: 'download-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const blob = await DownloadDocApi(doc.id, (e: any) => {
      const el = document.getElementById(id)
      if (el) el.innerHTML = Math.round((e.loaded / e.total) * 100) + '%'
    })
    // TODO : add externsion to file name
    await downloadBlob(blob, doc.name)
    // await DownloadDocApi(props.doc.id)
  } catch (error: any) {
    // @ts-ignore
    routerProvider?.message.error($i18n.t('download_noFile') as string)
  }
  setTimeout(() => {
    notification.close()
  }, 3000)
}

export function allowFeature(f: string) {
  // if(f == 'WORKFLOW') return false
  // if(f == 'DAM_FILE_CONVERTION') return false
  // if(f=== 'AUDIT')return false
  if (f === 'BULK_IMPORT') return false // 暂时隐藏BULK_IMPORT
  const features = useFeature().value
  if (features && features[f]) return features[f]
  return false
}

/**
 *
 * @param idOrPath parent id or path
 * @param list list of files to check for duplicates
 * @returns {isDuplicate: boolean, list: any[]}
 */
export const duplicateNameFilter = async (idOrPath: string, list: any) => {
  try {
    let result = false
    const titleList = []
    const titles = list.reduce((prev: any, item: any) => {
      prev.push(item.fileName || item.name)
      return prev
    }, [])
    const res = await clientApi.api.postDmsDocumentIsduplicatename({
      path: idOrPath,
      titles
    }).then(r => r.data)
    if (!res) return { isDuplicate: false }
    if (!res.hasDuplicateTitle) return { isDuplicate: false }
    list.forEach((doc: any) => {
      const name = doc.fileName || doc.name
      if (res && res.titles[name]) {
        result = true
        doc.goPath = idOrPath
        doc.isDuplicate = true
        doc.originalPath = res.titles[name].idOrPath
        doc.uniqueName = res.titles[name].uniqueName
        titleList.push({ name: name, newName: res.titles[name].uniqueName })
      }
    })
    return {
      isDuplicate: result,
      list,
      titleList
    }
  } catch (error) {
    console.log(error)
    return {
      isDuplicate: true,
      list: [],
      titleList: []
    }
  }
}
