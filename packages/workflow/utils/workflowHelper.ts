import { newClientApi } from 'api'
import { CellType } from '#imports'

export async function getButtonAdditionalElement(nodes: any[], metadata: any, formVariables: any) {
  let signatureSetting: any = {}
  const buttonSetting = metadata.buttonSetting

  // Check Task is Signature
  if (metadata.type === CellType.signatureTask) {
    const documentNode = nodes.find((node: any) => node.id === metadata.signature.documentStepId)
    if (!documentNode) return

    try {
      // Get Document Template
      const documentBody = documentNode.config.body
      signatureSetting.templateId = documentBody.templateId
      signatureSetting.templateVariables = await convertWorkflowVariableToTemplateVariable(formVariables, documentBody.variables)
      signatureSetting.workflowKeyToStoreSignature = documentBody.variables[metadata.signature.signatureValue].replace('${', '').replace('}', '')
      signatureSetting.workflowToTemplateMapping = documentBody.variables

      const documentTemplateData: any = await newClientApi.getDmsTemplateDocumentId(documentBody.templateId).then((r) => r.data)
      if (!documentTemplateData) return

      const data = await newClientApi.postDmsDocumentPreview({ idOrPath: documentTemplateData.documentId })

      signatureSetting.templateDetail = JSON.parse(JSON.stringify(data))
      signatureSetting.signatureVariableSetting = data.variables.find((item: any) => item.id === metadata.signature.signatureValue)

      console.log('signatureSetting', signatureSetting)
    } catch (error) {
      console.log(error)
    }
  }

  return {
    buttonSetting,
    signatureSetting
  }
}

export async function getWorkflowList() {
  let workflowList: any[] = []
  try {
    workflowList = await $api.get(`/oniflow/api/v1/workflow/definitions?published=true`).then((r: any) => r.data)
  } catch (e) {
    console.log(e)
  }
  return {
    workflowList
  }
}

export function convertWorkflowVariableToTemplateVariable(variables: any, mapping: any) {
  return Object.keys(mapping).reduce((prev: any, key: string) => {
    const valueKey = mapping[key].replace('${', '').replace('}', '')
    if (!!valueKey && variables[valueKey]) {
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
