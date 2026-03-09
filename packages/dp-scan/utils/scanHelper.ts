export const StatusMap: {
  [key: string]: STATUS_GROUP
} = {
  processing: {
    color: '#67C23A',
    key: 'processing,proces ',
    status: ['processing', 'uploaded', 'classification', 'page-split', 'ratio-resize', 'ocr', 'exporting', 'combine-document']
  },
  verification: {
    color: '#E6A23C',
    key: 'verification',
    status: ['draft', 'processed', 'verifying', 'verified']
  },
  exportReady: {
    color: '#5DC9D3',
    key: 'exportReady, export',
    status: ['exportReady']
  },
  completed: {
    color: '#15D5B9',
    key: 'completed, complete',
    status: ['completed']
  },
  failed: {
    color: '#F56C6C',
    key: 'failed, fail',
    status: ['failed-to-process', 'failed-to-export']
  },
  cancelled: {
    color: '#909399',
    key: 'cancelled, cancel',
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
    width: 200
  },

  {
    field: 'formId',
    title: 'Form'
  },
  {
    field: 'status',
    title: 'Status',
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
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  },
  {
    field: 'updatedAt',
    title: 'Updated At',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  }
]

type STATUS_GROUP = {
  color: string
  key: string
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

export const createNewBatchPageTab = (projectId: string) => {
  return {
    id: 'client-scan-new',
    name: 'client-scan-new',
    label: 'New Batch',
    icon: 'lucide:file-plus',
    hoverIcon: 'lucide:file-plus',
    component: 'LazyBatchNewPage',
    feature: 'CORE',
    props: {
      projectId
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
