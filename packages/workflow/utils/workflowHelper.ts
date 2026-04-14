import { CellType } from '#imports'

export async function getBpmnAdditionalElement(metadata: any) {
  let signatureSetting: any = {}
  let buttonSetting: any
  let buttons: any[] = []
  let components: any[] = []

  // Check Task is Signature
  if (metadata.tags === CellType.signatureTask) {
    // signatureSetting.templateVariables = metadata.templateVariables
    // signatureSetting.workflowKeyToStoreSignature = metadata.workflowKeyToStoreSignature
    // signatureSetting.workflowToTemplateMapping = metadata.workflowToTemplateMapping
    // signatureSetting.templateId = metadata.templateId
    // signatureSetting.templateDetail = metadata.templateDetail
    // signatureSetting.templateVariables = metadata.templateVariables
  }

  buttonSetting = metadata.buttonSetting

  return {
    buttonSetting,
    buttons,
    components,
    signatureSetting
  }
}

export async function getWorkflowList() {
  let workflowList: any[] = []
  try {
    workflowList = await $api.get(`https://132.148.160.191:8001/api/v1/workflow/definitions?published=true`).then((r) => r.data)
  } catch (e) {
    console.log(e)
  }
  return {
    workflowList
  }
}

export function convertWorkflowVariableToTemplateVariable(variables: any, mapping: any) {
  return Object.keys(mapping).reduce((prev: any, key: string) => {
    const valueKey = mapping[key]
    if (valueKey && variables[valueKey]) {
      // variables[valueKey] may be can convert yto json, so we need to convert it to json
      try {
        const json = JSON.parse(variables[valueKey])
        // REMARK : number will not throw error in JSON.parse, so we need to check it manually
        if (typeof json === 'number') {
          prev[key] = json.toString()
        } else {
          prev[key] = json
        }
      } catch (e) {
        prev[key] = variables[valueKey]
      }
    }
    return prev
  }, {})
}
