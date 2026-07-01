import { newClientApi, newAdminApi } from "api"

type FormExportData = {
  processKey: string,
  userTaskId: string,
  versionId: string,
  form: any, // form json
}

type WorkflowExportData = {
  id: string,
  name: string,
  xml: string,
  styleJson: any,
  form: any[],
  fields: any[]
}

const useAllWorkflowList = () => useState<any[]>('all-workflow-list', () => [])
async function getAllWorkflowList() {
  const allWorkflowList = useAllWorkflowList()
  const res = await newClientApi.postDsbWorkflowProcessList({ pageNum: 0, pageSize: 1000 })
  if(!res.data || !res.data.length) {
    throw new Error('Failed to get all workflow list')
  }
  allWorkflowList.value = res.data || []
}
export async function getWorkflowExportData(workflowKey:string) {
  if(!workflowKey) {
    console.error('Workflow key is required')
    throw new Error('Workflow key is required')
  }
  const allWorkflowList = useAllWorkflowList()
  console.log("getWorkflowExportData", workflowKey)
  
  if(allWorkflowList.value.length === 0) {
    await getAllWorkflowList()
  }
  
  const selectedWorkflowData = allWorkflowList.value.find((item) => item.key === workflowKey)
  if(!selectedWorkflowData) {
    console.error('Workflow not found', workflowKey)
    throw new Error('Workflow not found :' + workflowKey)
  }
  try{
    let result = {
      id: selectedWorkflowData.id,
      key: selectedWorkflowData.key,
      name: selectedWorkflowData.name,
      xml: "",
      styleJson: "",
      form: [],
      fields: []
    } as WorkflowExportData
    console.log("try to get workflow export data", selectedWorkflowData)
  
    // get workflow bpmn and styleJson
    const blob = await newAdminApi.getDocpalWorkflowVersionBpmnxml(
      { draftId: selectedWorkflowData.draftId, versionNumber: selectedWorkflowData.versionNumber },
      {
        format: 'blob',
        timeout: 0
      }
    )
    const json = await newAdminApi.getDocpalWorkflowVersionJson({ draftId: selectedWorkflowData.draftId, versionNumber: selectedWorkflowData.versionNumber }, {})
    // @ts-ignore
    const file = await blob.text()
    const xmlJson = bpmnStringToJson(file)
    result.xml = file
    result.styleJson = json
    // get form from xmlJson
    const allForms = await getAllFormFromXML(file, selectedWorkflowData.key, selectedWorkflowData.versionId)
    console.log("allForms", allForms)
    result.form = allForms
    // get field List
    const fieldData:any = await newAdminApi.getDocpalValidationRulesVersiondraftid(selectedWorkflowData.versionId).then(r => r.data)
    console.log("fieldData", fieldData)
    result.fields = fieldData.validationRules
    // get all services task from xmlJson
    let relatedCase = new Set<string>()
    let relatedDocumentTemplate = new Set<string>()
    let relatedFolderCabinet = new Set<string>()
    let relatedMasterTable = new Set<string>()
    let relatedIdGenerator = new Set<string>()
    let relatedEmailTemplate = new Set<string>()
    xmlJson?.json?.definitions?.process?.serviceTask?.forEach((serviceTask: any) => {
      
      const delegate = serviceTask['attr_flowable:delegateExpression']
      console.log("delegate", delegate)
      switch(delegate){
        
        case '${generateDocumentDelegate}':
          const data = serviceTask.extensionElements['flowable:field'].find((field:any) => field.attr_name === "templateId")
          if(data){
            relatedDocumentTemplate.add(data['flowable:expression']['__cdata'])
          }
          break
        case '${documentFolderCabinetDelegate}':
          const folderCabinetRoot = serviceTask.extensionElements['flowable:folderCabinetMapping'][0]
          if(folderCabinetRoot){
            relatedFolderCabinet.add(folderCabinetRoot['attr_id'])
          }
          break
        case '${startCaseInstanceDelegate}':
          const caseData = serviceTask.extensionElements['flowable:newCase']?.attr_caseTypeId
          console.log("caseData", caseData, serviceTask)
          if(caseData){
            relatedCase.add(caseData)
          }
          break
        case '${updateCaseInstanceInfoDelegate}':
          const updateCaseData = serviceTask.extensionElements['flowable:newCase']?.attr_caseTypeId
          if(updateCaseData){
            relatedCase.add(updateCaseData)
          }
          break
        case '${idGeneratorDelegate}':
          const idTemplatedata = serviceTask.extensionElements['flowable:field'].find((field:any) => field.attr_name === "templateId")
          if(idTemplatedata){
            relatedIdGenerator.add(idTemplatedata['flowable:expression']['__cdata'])
          }
          break
        case '${masterTableRecordDelegate}':
          const masterTableData = serviceTask.extensionElements['flowable:mastertableRecord']?.attr_masterTableId
          console.log("masterTableData", masterTableData, serviceTask)
          if(masterTableData){
            relatedMasterTable.add(masterTableData)
          }
          break
        case '${sendNotificationDelegate}':
          const emailTemplateData = serviceTask.extensionElements['flowable:field'].find((field:any) => field.attr_name === "notificationType")
          if(emailTemplateData){
            relatedEmailTemplate.add(emailTemplateData['flowable:string']['__cdata'])
          }
          break
        default:
          break
      }

      // "${updateCaseInstanceInfoDelegate}" "${documentFolderCabinetDelegate}" "${startCaseInstanceDelegate}"
    })
    console.log("relatedCase", relatedCase)
    console.log("relatedDocumentTemplate", relatedDocumentTemplate)
    console.log("relatedFolderCabinet", relatedFolderCabinet)
    console.log("relatedMasterTable", relatedMasterTable)
    console.log("relatedIdGenerator", relatedIdGenerator)
    console.log("relatedEmailTemplate", relatedEmailTemplate)
    return {
      workflowData: result,
      relatedDocumentTemplate: Array.from(relatedDocumentTemplate),
      relatedFolderCabinet: Array.from(relatedFolderCabinet),
      relatedMasterTable: Array.from(relatedMasterTable),
      relatedIdGenerator: Array.from(relatedIdGenerator),
      relatedCase: Array.from(relatedCase),
      relatedEmailTemplate: Array.from(relatedEmailTemplate),
    }
  }catch(err:any){
    console.error(err)
    throw new Error('Failed to get workflow export data')
  }
  
}
