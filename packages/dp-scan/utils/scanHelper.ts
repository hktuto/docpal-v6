export const StatusMap: {
  [key: string]: STATUS_GROUP
} = {
  processing: {
    color: '#67C23A',
    key: 'processing,proces',
    label: 'Processing',
    status: ['processing', 'uploaded', 'classification', 'page-split', 'ratio-resize', 'ocr', 'exporting', 'combine-document']
  },
  verification: {
    color: '#E6A23C',
    key: 'verification',
    label: 'Verification',
    status: ['draft', 'processed', 'verifying', 'verified']
  },
  exportReady: {
    color: '#5DC9D3',
    key: 'exportReady,export,export-ready',
    label: 'Export Ready',
    status: ['exportReady', 'export-ready']
  },
  completed: {
    color: '#15D5B9',
    key: 'completed,complete',
    label: 'Completed',
    status: ['completed']
  },
  failed: {
    color: '#F56C6C',
    key: 'failed,fail',
    label: 'Failed',
    status: ['failed-to-process', 'failed-to-export', 'upload-fail']
  },
  cancelled: {
    color: '#909399',
    key: 'cancelled,cancel',
    label: 'Cancelled',
    status: ['cancelled']
  }
}

export const ScanTableColumns: any[] = [
  {
    field: 'projectName',
    title: 'Project',
    fixed: 'left'
  },
  {
    field: 'batchNo',
    title: 'Batch Name',
    width: 200,
  },
  {
    field: 'status',
    title: 'Status',
    filterable:true,
    type: 'html',
    formatter({ cellValue }: any) {
      if (!cellValue) return ''
      const groupStatus = statusToGroupStatus(cellValue)
      if (!groupStatus) return cellValue
      return `<div class="table-status" style="--status-color: ${groupStatus.color}">
        <div class="status-dot" ></div>
        ${cellValue}
      </div>`
    }
  },
  {
    field: 'createdAt',
    title: 'Created At',
    filterable:true,
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  },
  {
    field: 'updatedAt',
    title: 'Updated At',
    filterable:true,
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  }, {
    field: 'updatedBy',
    title: 'Updated By',
    filterable: true,
    formatter: ({cellValue}) => cellValue || 'System'
  }
]

type STATUS_GROUP = {
  color: string
  key: string
  label: string
  status: string[]
}

export const statusToGroupStatus = (status: any): STATUS_GROUP | null => {
  let result = null
  Object.keys(StatusMap).forEach((groupStatus) => {
    if (StatusMap[groupStatus as keyof typeof StatusMap].status.includes(status)) {
      result = StatusMap[groupStatus as keyof typeof StatusMap]
    }
  })
  return result
}

export const groupStatusToStatus = (groupStatus: string) => StatusMap[groupStatus as keyof typeof StatusMap]?.status || []

export const createBatchListPageTab = () => {
  return {
    id: 'client-scan',
    name: 'client-scan',
    label: 'Batch List',
    icon: 'lucide:file',
    hoverIcon: 'lucide:file',
    component: 'LazyClientScanPage',
    feature: 'CORE',
    props: {}
  }
}

export const createBatchDetailPageTab = (batchId: string) => {
  return {
    id: 'client-scan-detail',
    name: 'client-scan-detail',
    label: 'Batch Detail',
    icon: 'lucide:file-text',
    hoverIcon: 'lucide:file-text',
    component: 'LazyBatchDetailPage',
    feature: 'CORE',
    props: {
      batchId
    }
  }
}

export type DraftBatch = {
  projectId: string,
  id: string,
  projectName: string,
  status: string,
  formName: string,
}
export const createNewBatchPageTab = (draftBatch:DraftBatch) => {
  return {
    id: 'client-scan-new',
    name: 'client-scan-new',
    label: 'New Batch',
    icon: 'lucide:file-plus',
    hoverIcon: 'lucide:file-plus',
    component: 'LazyBatchNewPage',
    feature: 'CORE',
    props: {
      ...draftBatch
    }
  }
}

export const createProjectTableTab = () => {
  return {
    id: 'admin-scan',
    name: 'admin-scan',
    label: 'Project List',
    icon: 'lucide:scan-text',
    hoverIcon: 'lucide:scan-text',
    component: 'LazyScanProjectPage',
    feature: 'CORE',
    props: {}
  }
}

export const createScanDetailPageTab = (projectId: string) => {
  return {
    id: 'scan-detail',
    name: 'scan-detail',
    label: 'Scan Detail',
    icon: 'lucide:file-text',
    hoverIcon: 'lucide:file-text',
    component: 'LazyScanProjectDetail',
    feature: 'CORE',
    props: {
      projectId
    }
  }
}

export const createScanFormDetailPageTab = (formId: string) => {
  return {
    id: 'scan-form-detail',
    name: 'scan-form-detail',
    label: 'Scan Form Detail',
    icon: 'lucide:file-text',
    hoverIcon: 'lucide:file-text',
    component: 'LazyScanFormDetail',
    feature: 'CORE',
    props: {
      formId
    }
  }
}

export const createScanTestFormPageTab = (params: { formName: string, ocrResult:string, splitInfo:any }) => {
  return {
    id: 'scan-test-form',
    name: 'scan-test-form',
    label: 'Scan Test Form',
    icon: 'lucide:file-text',
    hoverIcon: 'lucide:file-text',
    component: 'LazyScanProjectTestResult',
    feature: 'CORE',
    props: {
      ...params
    }
  }
}
