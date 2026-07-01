import { newClientApi, newAdminApi } from 'api'


type UserGroupList = {
  key: string,
  name: string,
}

type UserRoleList = {
  id: string,
  name: string,
}

type FormExportData = {
  processKey: string,
  userTaskId: string,
  versionId: string,
  form: any, // form json
}

type CaseExportData = {
  id: string,
  name: string,
  xml: string,
  styleJson: any,
  dashboard: any[]
  form: FormExportData[],
  caseIdDigit: string,
  caseIdPrefix: string,
  startNumber: string
}

type WorkflowExportData = {
  id: string,
  name: string,
  xml: string,
  styleJson: any,
  form: FormExportData[]
}

type DocumentTemplateExportData = {
  id: string,
  fileType: string,
  name: string,
  blob: Blob,
}

type EmailTemplateExportData = {
  id: string,
  label: string,
  subject: string,
  bcc: string,
  body: string,
  cc: string,
  display: string,
  emailLayoutName: string,
  emailTemplateJson: string,
  emailTemplateVariable: string,
  from: string | null,
  to: string,
}

type FolderCabinetExportData = {
  id: string,
  label: string,
}

type MasterTableExportData = {
  id: string,
  name: string,
  fields: any[],
  acls: [
    {
      create: boolean,
      edit: boolean,
      read: boolean,
      enable: boolean,
      masterTableId: string,
      userId: string,
    }
  ]
}

type ExportCaseInfo = {
  userGroupList: UserGroupList[],
  userRoleList: UserRoleList[]
  cases: CaseExportData[]
  workflow: WorkflowExportData[]
  documentTemplate: DocumentTemplateExportData[]
  emailTemplate: EmailTemplateExportData[]
  folderCabinet: FolderCabinetExportData[]
  masterTable: MasterTableExportData[]
}

const useAllCaseList = () => useState<any[]>('all-case-list', () => [])
const useAllWorkflowList = () => useState<any[]>('all-workflow-list', () => [])

async function getAllCaseList() {
  const allCaseList = useAllCaseList()
  const res = await newAdminApi.postCaseTypesPage({ pageNum: 0, pageSize: 1000 })
  if (!res.data || !res.data.entryList) {
    throw new Error('Failed to get all case list')
  }
  allCaseList.value = res.data?.entryList.filter((item: any) => item.productionVersion) || []
}


async function getAllWorkflowList() {
  const allWorkflowList = useAllWorkflowList()
  const res = await newClientApi.postDsbWorkflowProcessList({ pageNum: 0, pageSize: 1000 })
  if (!res.data || !res.data.length) {
    throw new Error('Failed to get all workflow list')
  }
  allWorkflowList.value = res.data || []
}

export async function getCaseExportData(caseId: string) {
  const allCaseList = useAllCaseList()
  const allWorkflowList = useAllWorkflowList()
  if (allWorkflowList.value.length === 0) {
    await getAllWorkflowList()
  }
  let result = {
    id: caseId
  } as CaseExportData
  if (allCaseList.value.length === 0) {
    await getAllCaseList()
  }
  const selectedCaseData = allCaseList.value.find((item) => item.id === caseId)
  if (!selectedCaseData) {
    throw new Error('Case not found')
  }
  result.id = selectedCaseData.id
  result.name = selectedCaseData.name

  const caseDetails = await newAdminApi.getCaseTypesCasetypeid(selectedCaseData.id).then(r => r.data)
  result.caseIdDigit = caseDetails.caseIdDigit
  result.caseIdPrefix = caseDetails.caseIdPrefix
  result.startNumber = caseDetails.startNumber

  let caseStyleJson = await newAdminApi.getCaseTypesIdStylejson(selectedCaseData.id, { versionNumber: selectedCaseData?.latestVersion }).then(r => r.data)
  caseStyleJson = caseStyleJson ? JSON.parse(caseStyleJson) : null
  const blob = await newAdminApi.geCaseTypesIdDownloadXml(selectedCaseData.id, { versionNumber: selectedCaseData?.latestVersion }, {
    format: 'blob',
    timeout: 0
  }) as any
  const cmmnString = await blob.text()
  result.xml = cmmnString
  result.styleJson = caseStyleJson
  const caseDashboard = await newAdminApi.postCaseDashboardPage({
    caseTypeId: selectedCaseData.id,
    pageNum: 0,
    pageSize: 1000
  })
  result.dashboard = (caseDashboard.data?.entryList || [])

  // get case form
  let relatedWorkflowList: any[] = []
  if (caseStyleJson) {
    const steps = caseStyleJson?.cells?.reduce((prev: any, item: any) => {
      if (item.data.type === 'humanTask') {
        prev.humanTask.push(item.data)
      } else if (item.data.type === 'processTask') {
        prev.processTask.push(item.data)
      }
      return prev
    }, {
      humanTask: [],
      processTask: []
    })

    for (let i = 0; i < steps.processTask.length; i++) {
      const item = steps.processTask[i]
      const caseId = item.data.processRefExpression.__cdata
      if (caseId) {
        relatedWorkflowList.push(caseId)
      }
    }
    for (let i = 0; i < steps.humanTask.length; i++) {
      const item = steps.humanTask[i]
      console.log('try to get form', item)
      if (!item.data.attr_id) continue
      const form = await newAdminApi.getDmsFormPropertiesQuery({
        processKey: selectedCaseData.name,
        userTaskId: item.data.attr_id,
        versionId: selectedCaseData?.latestVersion
      })
      if (form && form.data && form.data.length > 0 && form.data[0].jsonValue) {
        result.form.push({
          processKey: selectedCaseData.name,
          userTaskId: item.attr_id,
          versionId: selectedCaseData?.latestVersion,
          form: JSON.parse(form.data[0].jsonValue)
        })
      }
    }
  }
  return {
    case: result,
    workflow: relatedWorkflowList
  }
}
