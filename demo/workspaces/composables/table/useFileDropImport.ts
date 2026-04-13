import { ElMessage } from 'element-plus'

const DEFAULT_VALID_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
]
const DEFAULT_VALID_EXTENSIONS = ['xlsx', 'xls', 'csv']

export interface UseFileDropImportOptions {
  /** 校验通过后回调，由调用方打开导入对话框等 */
  onDrop: (file: File) => void
  validTypes?: string[]
  validExtensions?: string[]
  /** 非 Excel/CSV 时的提示文案 */
  invalidMessage?: string
}

/**
 * Form/State: 文件拖放导入状态与校验逻辑
 * 组件只负责绑定 isDraggingFile 与四个事件到根节点，并传入 onDrop 打开导入对话框
 */
export function useFileDropImport(options: UseFileDropImportOptions) {
  const {
    onDrop,
    validTypes = DEFAULT_VALID_TYPES,
    validExtensions = DEFAULT_VALID_EXTENSIONS,
    invalidMessage = 'Please drop an Excel (.xlsx, .xls) or CSV file'
  } = options

  const isDraggingFile = ref<boolean>(false)
  let dragCounter = 0

  function isValidFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase()
    return validTypes.includes(file.type) || validExtensions.includes(extension || '')
  }

  function handleDragEnter(e: DragEvent) {
    console.log('handleDragEnter', e)
    e.preventDefault()
    dragCounter++
    if (e.dataTransfer?.types.includes('Files')) {
      isDraggingFile.value = true
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    dragCounter--
    if (dragCounter === 0) {
      isDraggingFile.value = false
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDraggingFile.value = false
    dragCounter = 0
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!isValidFile(file)) {
      ElMessage.warning(invalidMessage)
      return
    }
    onDrop(file)
  }

  return {
    isDraggingFile,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
