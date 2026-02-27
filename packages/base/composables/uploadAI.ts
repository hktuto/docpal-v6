import { newClientApi } from 'api'

export type uploadRequest = {
  doc: any
  startDate: Date
  docList: any[]
  finishCount: number
  uploadFinish: boolean
  uploadAiId: string
  aiFinish: boolean
}
export const useUploadAIStore = () => {
  const userId = useUserId()
  const uploadState = useState('uploadAIState', () => ({
    uploadRequestList: <uploadRequest[]>[]
  }))

  async function createUploadRequest(doc: any, files: any[]) {
    const docList = getUploadFiles(files)
    //doc.path 是 id 的 path 要用 breadcrumb
    const breadcrumbList: any = await newClientApi.postDmsDocumentBreadcrumb({ idOrPath: doc.path }).then(r => r.data)
    const path = breadcrumbList.reduce((prev: any, item: any) => {
      if (prev !== '/') prev += '/'
      prev += item.name
      return prev
    }, '/')
    const uploadAiId = await newClientApi.postDmsUploadBatch({
      userId: userId.value,
      filesCount: docList.length,
      uploadPath: path,
      nuxeoPath: doc.path
    }).then(r => r.data)
    if (!uploadAiId) return false
    uploadState.value.uploadRequestList.push({
      doc,
      startDate: new Date(),
      docList,
      finishCount: 0,
      uploadFinish: false,
      uploadAiId,
      aiFinish: false
    })
    const curRequest = uploadState.value.uploadRequestList[uploadState.value.uploadRequestList.length - 1]
    curRequest.docList.forEach((docItem: any) => {
      docItem.uploadId = uploadAiId
      handleCreateDocument(docItem, doc.path, curRequest)
    })
    return uploadState.value
  }

  function getUploadFiles(files: any[]) {
    const treeData: any = []
    const treeMap: any = {}
    files.forEach((item: any) => {
      if (item.name.charAt(0) === '.' || item.path.includes('/.')) return
      if (item.path && !treeMap[item.path]) {
        const names = item.path.split('/')
        if (names.length === 0) return
        let _namePaths: string[] = []
        names.forEach((_name: string) => {
          _namePaths.push(_name)
          if (_namePaths.length < 2) return
          const _path = _namePaths.join('/')
          if (!treeMap[_path]) {
            const __namePaths = structuredClone(_namePaths)
            treeMap[_path] = {
              id: _path,
              isFolder: true,
              name: __namePaths.pop(),
              parentId: __namePaths.join('/'),
              documentType: 'Folder',
              children: [],
              status: 'loading'
            }
          }
        })
      }
      treeMap[item.path + '/' + item.name] = {
        id: item.path + '/' + item.name,
        isFolder: false,
        name: item.name,
        parentId: item.path,
        documentType: 'File',
        file: item.file,
        progress: 0,
        status: 'loading'
      }
    })
    Object.keys(treeMap).forEach((key: any) => {
      const item = treeMap[key]
      treeData.push(item)
    })
    return treeData
  }

  function getFileName(name, isFolder: boolean = false) {
    if (isFolder) return name
    const names = name.split('.')
    if (names.length > 1) names.pop()
    return names.join('.')
  }

  async function handleCreateDocument(doc: any, parentPath: string, uploadRequestItem: uploadRequest) {
    let result
    let _document = {
      fileName: doc.name,
      fileType: doc.documentType,
      fileAbsolutePath: parentPath + doc.id,
      fileRelativePath: doc.id,
      uploadId: doc.uploadId,
      userId: userId.value
    }
    try {
      console.log('doc', doc)

      if (doc.isFolder) {
        result = await newClientApi.postDmsUploadTmpFolder(_document)
      } else {
        _document.fileModifiedTimestamp = doc.file.lastModified
        const formData = new FormData()
        formData.append('file', doc.file)
        formData.append('uploadTempFileRequestStr', JSON.stringify(_document))
        const result = await newClientApi.postDmsUploadTmpFile(formData).then((res) => res.data)
      }
      doc.status = 'success'
    } catch (error) {
      result = false
      doc.status = 'exception'
    }
    uploadRequestItem.finishCount++
    if (uploadRequestItem.finishCount === uploadRequestItem.docList.length) {
      uploadRequestItem.uploadFinish = true
    }
    return result
  }

  function getUploadRequestList() {
    return uploadState.value.uploadRequestList
  }

  function arrayToTree(arr: any[], idKey: string = 'id') {
    // 空数组
    const map: any = {}
    const result: any = []
    if (!Array.isArray(arr)) return result // 判断不是数组  直接返回
    arr.forEach((item) => {
      delete item.children
    }) // 清空children
    arr.forEach((item) => {
      map[item[idKey]] = item
    })
    arr.forEach((item) => {
      const parent = map[item.parentId]
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(item)
      } else {
        result.push(item)
      }
    })
    return result
  }

  return {
    createUploadRequest,
    getUploadFiles,
    getUploadRequestList,
    uploadState,
    arrayToTree,
    getFileName
  }
}
