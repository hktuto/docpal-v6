import { clientApi, newClientApi } from 'api'
import { CellType } from '#imports'

const booleanButtonComponent = 'LazyContextFormBooleanButton'

export async function getButtonAdditionalElement(nodes: any[], metadata: any, formVariables: any) {
  let signatureSetting: any = {}
  let buttons: any[] = []
  const buttonSetting = metadata.buttonSetting

  try {
    if (!!metadata.buttonSetting?.booleanButton) {
      console.log(metadata.buttonSetting.booleanButton)
      metadata.buttonSetting.booleanButton.forEach((item: any) => {
        // Add Additional Button Setting
        buttons.push({
          props: item,
          component: booleanButtonComponent
        })
      })
    }

    // Check Task is Signature
    if (metadata.type === CellType.signatureTask) {
      const documentNode = nodes.find((node: any) => node.id === metadata.signature.documentStepId)
      if (!documentNode) return

      // Get Document Template
      const documentBody = documentNode.config.body
      signatureSetting.templateId = documentBody.templateId
      signatureSetting.templateVariables = await convertWorkflowVariableToTemplateVariable(formVariables, documentBody.variables)
      signatureSetting.workflowKeyToStoreSignature = documentBody.variables[metadata.signature.signatureValue].replace('${', '').replace('}', '')
      signatureSetting.workflowToTemplateMapping = documentBody.variables

      const documentTemplateData: any = await newClientApi.getDmsTemplateDocumentId(documentBody.templateId).then((r) => r.data)
      if (!documentTemplateData) return

      const data: any = await newClientApi.postDmsDocumentPreview({ idOrPath: documentTemplateData.documentId })
      signatureSetting.templateDetail = JSON.parse(JSON.stringify(data))
      signatureSetting.signatureVariableSetting = data.variables.find((item: any) => item.id === metadata.signature.signatureValue)
    }
    return {
      buttons,
      buttonSetting,
      signatureSetting
    }
  } catch (e) {
    console.log(e)
  }
}

export async function getWorkflowList() {
  try {
    const userId = useUserId()
    return await clientApi.instance
      .get('v1/dynamic-actions/acl/query', {
        baseURL: '/gateway',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          resourceType: 3,
          userId: userId.value
        }
      })
      .then((r: any) => r.data.data)
  } catch (e) {
    console.log(e)
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
