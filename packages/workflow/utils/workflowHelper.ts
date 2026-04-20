import { CellType } from '#imports'

export async function getButtonAdditionalElement(metadata: any) {
  let signatureSetting: any = {}
  let buttonSetting: any

  // Check Task is Signature
  if (metadata.type === CellType.signatureTask) {
    signatureSetting.templateId = metadata.signature.documentTemplateId
    // signatureSetting.templateVariables = metadata.templateVariables
    // signatureSetting.workflowKeyToStoreSignature = metadata.workflowKeyToStoreSignature
    // signatureSetting.workflowToTemplateMapping = metadata.workflowToTemplateMapping
    // signatureSetting.templateDetail = metadata.templateDetail
  }
  buttonSetting = metadata.buttonSetting

  return {
    buttonSetting,
    signatureSetting
  }
}

export async function getWorkflowList() {
  let workflowList: any[] = []
  try {
    workflowList = await $api.get(`/oniflow/api/v1/workflow/definitions?published=true`).then((r) => r.data)
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
