export const StatusMap: {
  [key: string]: STATUS_GROUP
} = {
  processing: {
    color: '#67C23A',
    key: 'processing',
    status: ['processing', 'uploaded', 'classification', 'page-split', 'ratio-resize', 'ocr', 'exporting', 'combine-document']
  },
  verification: {
    color: '#E6A23C',
    key: 'verification',
    status: ['draft', 'processed', 'verifying', 'verified']
  },
  exportReady: {
    color: '#5DC9D3',
    key: 'exportReady',
    status: ['exportReady']
  },
  completed: {
    color: '#15D5B9',
    key: 'completed',
    status: ['completed']
  },
  failed: {
    color: '#F56C6C',
    key: 'failed',
    status: ['failed-to-process', 'failed-to-export']
  },
  cancelled: {
    color: '#909399',
    key: 'cancelled',
    status: ['cancelled']
  }
}

export const ScanTableColumns: any[] = [
  {
    field: 'batchNo',
    title: 'batchNo',
    fixed: 'left',
    width: 200
  },
  {
    field: 'projectName',
    title: 'projectName'
  },
  {
    field: 'formId',
    title: 'formId'
  },
  {
    field: 'status',
    title: 'status',
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
    title: 'createdAt',
    formatter({ cellValue }: any) {
      return formatDate(cellValue)
    }
  },
  {
    field: 'updatedAt',
    title: 'updatedAt',
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
