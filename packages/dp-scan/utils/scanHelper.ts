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
    field: 'batchNo',
    title: 'Batch Name',
    filterable:true,
    width: 200,
  },
  {
    field: "documentCount",
    title: 'Document Count',
  },
  {
    field: 'status',
    title: 'Status',
    filterable:true,
    type: 'html',
    formatter({ cellValue, row }: any) {
      if (!cellValue) return ''
      const groupStatus = statusToGroupStatus(cellValue)
      if (!groupStatus) return cellValue
      return `<div class="table-status" style="--status-color: ${groupStatus.color}">
        <div class="status-dot" ></div>
        ${cellValue} ${row.lockBy ? '('+ row.lockBy + ')' : ''}
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
    field: 'createdBy',
    title: 'Created By',
    filterable:true,
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

export const statusToGroupStatusKey = (status: any): STATUS_GROUP | null => {
  let result = null
  Object.keys(StatusMap).forEach((groupStatus) => {
    if (StatusMap[groupStatus as keyof typeof StatusMap].status.includes(status)) {
      result = groupStatus
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


export function checkHKID(id: string) {
  const cleanValue = id.replace(/\s/g, '').toUpperCase();
  // HKID format: 1-2 letters followed by 6 digits and 1 check digit (0-9 or A)
  // Examples: A1234563, AB9876543, Y123456A, Z1234567
  const hkidRegex = /^[A-NP-Z]{1,2}\d{6}[0-9A]$/;
  const match = cleanValue.match(hkidRegex);

  if (!match) {

    return {
      result: false,
      message: "Invalid HKID format. Expected: X1234560 or XY123456A",
    };
  }

  // Calculate check digit
  const isValid = validateHKIDCheckDigit(cleanValue);

  if(isValid) {
    return {
          result: true,
      }
  } else {
    return {
      result: false,
      message: "Invalid HKID check digit",
    };
  }

  // Helper function to validate check digit
  function validateHKIDCheckDigit(id:string) {
      /*
   	Check digit algorithm is variation of the ISBN-10 check digit algorithm.
   	For each character: character * weight.
   	Weight from largest to smallest (1).
   	If ID is 8 character long, a space is added to the beginning.
   	Value of space is 36, hence 36 * 9 = 324.
   	*/
   	let weight = id.length;
   	let weightedSum = weight === 8 ? 324 : 0;
   	const identifier = id.slice(0, -1);
   	for (const char of identifier) {
    		const charValue = isCaptialLetter(char) ? _getLetterValue(char) : +char;
    		weightedSum += charValue * weight;
    		weight--;
   	}
   	const remainder = (11 - (weightedSum % 11)) % 11;
              const checkSum =  remainder === 10 ? 'A' : '' + remainder;

   	return id.slice(-1) === checkSum
  }

  function isCaptialLetter(character:string) {
    return /^[A-Z]$/.test(character);
  }

  /**
   * While charCode = { A: 65, B: 66... Z: 90 },
   *           HKID = { A: 10, B: 11... Z: 35 }.
   * Therefore, diff = 55.
   * @ignore
   * @param {string} letter A single character.
   * @returns {number}
   */
  function _getLetterValue(letter:string) {
    return letter.charCodeAt(0) - 55;
  }
}
