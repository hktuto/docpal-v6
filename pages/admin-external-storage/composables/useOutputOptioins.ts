import { clientApi } from 'api'

export const useOutputOptioins = () => {
  const documentTypeOpts = useState('documentTypeOpts', () => [{ label: 'File', value: 'File' }])
  const outputFormatOpts = useState('outputFormatOpts', () => [
    { label: 'PDF', value: 'PDF' },
    { label: 'Image', value: 'Image' },
    { label: 'Text', value: 'Text' },
    { label: 'Word', value: 'Word' },
    { label: 'Original File', value: 'originalFile' }
  ])
  const fileTypeOpts = useState('fileTypeOpts', () => [
    { label: 'TIFF', value: 'TIFF' },
    { label: 'JPEG', value: 'JPEG' }
    // { label: 'PNG', value: 'PNG' }
  ])
  const resolutionOpts = useState('resolutionOpts', () => [
    { label: 'Original', value: 1 },
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 }
  ])
  const colorOpts = useState('colorOpts', () => [
    { label: 'Original', value: 'original' },
    { label: 'Black & White', value: 'blackWhite' },
    { label: 'Gray Scale', value: 'grayScale' }
  ])
  const destinationOpts = useState('destinationOpts', () => [
    { label: 'External Storage Profile', value: 'external' },
    { label: 'DocPal', value: 'docPal' },
    { label: 'Workflow', value: 'workflow' }
  ])
  const externalStorageProfileOpts = useState('externalStorageProfileOpts', () => [])
  const duplicateNameStrategyOpts = useState('duplicateNameStrategyOpts', () => [
    { label: 'Replace', value: 'replace' },
    { label: 'Rename', value: 'rename' },
    { label: 'Skip', value: 'skip' }
  ])

  const pathVOpts = useState('pathVOpts', () => [
    { label: 'Batch_id', value: '${Batch_id}' },
    { label: 'Profile_id', value: '${Profile_id}' },
    { label: 'File_name', value: '${File_name}' },
    { label: 'Original_path', value: '${Original_path}' },
    { label: 'Capture_date(yyyy)', value: '${Capture_date(yyyy)}' },
    { label: 'Capture_date(mm)', value: '${Capture_date(mm)}' },
    { label: 'Capture_date(yyyy-mm-dd)', value: '${Capture_date(yyyy-mm-dd)}' },
    { label: 'Capture_date(yyyy-mm-ddTHH:mm:ss)', value: '${Capture_date(yyyy-mm-ddTHH:mm:ss)}' }
  ])
  const fileNameVOpts = useState('fileNameVOpts', () => [
    { label: 'Profile_id', value: '${Profile_id}' },
    { label: 'File_name', value: '${File_name}' },
    { label: 'Capture_date(yyyy-mm-dd)', value: '${Capture_date(yyyy-mm-dd)}' },
    { label: 'Capture_date(yyyy-mm-ddTHH:mm:ss)', value: '${Capture_date(yyyy-mm-ddTHH:mm:ss)}' }
  ])
  const workflowOpts = useState('workflowOpts', () => [])
  const workflowVOpts = useState('workflowVOpts', () => [
    { label: 'Profile_id', value: 'profile_id' },
    { label: 'File_name', value: 'file_name' },
    { label: 'File', value: 'file' },
    { label: 'Original_path', value: 'original_path' },
    { label: 'Capture_date(yyyy)', value: 'capture_date(yyyy)' },
    { label: 'Capture_date(mm)', value: 'capture_date(mm)' },
    { label: 'Capture_date(yyyy-mm-dd)', value: 'capture_date(yyyy-mm-dd)' }
  ])

  // @ts-ignore
  async function initExternalStorageProfileOpts() {
    try {
      const data = await clientApi.admin.getAdminext3rdstorageList({} as any).then((res: any) => res.data)
      externalStorageProfileOpts.value = data.map((item: any) => ({
        label: item.name,
        value: item.id
      }))
    } catch (error: any) {
      console.error(error)
    }
  }

  async function getMetaOpts() {
    try {
      const { data }: any = await clientApi.admin.getAdmindmsDocpalTypeDocumenttypeMetadata('GlobalFile')
      const optionList = data.keywords.map((item: any) => ({
        ...item,
        label: item.name,
        value: item.name
      }))
      // metaOpts.value = optionList
    } catch (error: any) {
      console.error(error)
    }
  }

  function setDocumentTypeOpts(opts: any) {
    documentTypeOpts.value = [{ label: 'File', value: 'File' }, ...opts]
  }

  async function initWorkflowOpts() {
    const data = await clientApi.admin.getAdmindmsEasyFormProcessDefinitions().then((res: any) => res.data)
    workflowOpts.value = data.map((item: any) => ({
      label: item.label,
      value: item.key
    }))
  }

  onMounted(async () => {
    initExternalStorageProfileOpts()
    // getMetaOpts()
    initWorkflowOpts()
  })

  return {
    documentTypeOpts,
    outputFormatOpts,
    fileTypeOpts,
    resolutionOpts,
    colorOpts,
    destinationOpts,
    externalStorageProfileOpts,
    duplicateNameStrategyOpts,
    pathVOpts,
    fileNameVOpts,
    workflowOpts,
    setDocumentTypeOpts,
    workflowVOpts
  }
}
