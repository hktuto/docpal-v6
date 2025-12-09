import { clientApi } from 'api'
import { bpmnStringToJson } from '#imports'

const generateDocumentComponent = 'LazyBpmnButtonGenerateDocument'
const booleanButtonComponent = 'LazyBpmnButtonBoolean'
import { generateData, replaceVariables } from 'docpal-document-editor/src/utils'

export async function getBpmnAdditionalElement(xml: any, taskDefinitionKey: string, taskDetail: any, formData: any) {
  const xmlJson = bpmnStringToJson(xml)
  const currentTask = xmlJson.flatObj[taskDefinitionKey]
  let signatureSetting: any = null
  let buttonSetting: any
  // check generate document button
  let buttons: any[] = []
  let components: any[] = []
  if (!currentTask || !currentTask.extensionElements) return { buttons, components }
  const generateDocumentComponent = 'LazyBpmnButtonGenerateDocument'
  if (currentTask.extensionElements && currentTask.extensionElements['docpal:previewDocumentButton']) {
    if (Array.isArray(currentTask.extensionElements['docpal:previewDocumentButton'])) {
      currentTask.extensionElements['docpal:previewDocumentButton'].forEach((item: any) => {
        buttons.push({
          props: {
            ...item,
            xml,
            formData,
            taskDetail
          },
          component: generateDocumentComponent
        })
      })
    } else {
      buttons.push({
        props: {
          ...currentTask.extensionElements['docpal:previewDocumentButton'],
          xml,
          formData,
          taskDetail
        },
        component: generateDocumentComponent
      })
    }
  }
  if (currentTask.extensionElements && currentTask.extensionElements['docpal:booleanButton']) {
    if (Array.isArray(currentTask.extensionElements['docpal:booleanButton'])) {
      currentTask.extensionElements['docpal:booleanButton'].forEach((item: any) => {
        buttons.push({
          props: {
            ...item,
            xml,
            formData,
            taskDetail
          },
          component: booleanButtonComponent
        })
      })
    } else {
      buttons.push({
        props: {
          ...currentTask.extensionElements['docpal:booleanButton'],
          xml,
          formData,
          taskDetail
        },
        component: booleanButtonComponent
      })
    }
  }
  // TODO : get buttonSetting
  if (currentTask.extensionElements && currentTask.extensionElements['docpal:buttonSetting']) {
    const buttonSettingFromTask = currentTask.extensionElements['docpal:buttonSetting']
    buttonSetting = Object.keys(buttonSettingFromTask).reduce((prev: any, key: string) => {
      if(!buttonSettingFromTask[key]) {
        return prev
      }
      const value = buttonSettingFromTask[key]
      if(typeof value === 'object') {
        // something the bpmn will convert the value to a cdata, so we need to check it
        if(value["__cdata"]) {
          prev[key] = value["__cdata"]
        } else {
          prev[key] = JSON.parse(JSON.stringify(value))
        }
      } else {
        prev[key] = value
      }
      return prev
    }, {})
  }
  if (currentTask.extensionElements && currentTask.extensionElements['docpal:signatureSetting']) {
    // if docpal:signatureSetting' is in current Task , that mean it is a signature task
    // step 1 , get signature setting from task
    const signatureSettingFromTask = currentTask.extensionElements['docpal:signatureSetting']
    // step 2, get target template setting from workflow xml
    const signatureTask = xmlJson.flatObj[signatureSettingFromTask.attr_documentStepId]
    // step 3, we only store template step id into docpal:signatureSetting, so need to get the template id from template task
    const templateId = signatureTask.extensionElements['flowable:field'].find((item: any) => item.attr_name === 'templateId')?.['flowable:expression'].__cdata
    // step 4, get all variable from template task and convert to workflow to template mapping
    const defaultField: any = ['parentPath', 'storeValue', 'documentName', 'documentType', 'templateId']
    const workflowToTemplateMapping: any = (signatureTask.extensionElements['flowable:field'] || []).filter((item: any) => !defaultField.includes(item.attr_name))
      .reduce((curr:any, item: any) => {
        curr[item.attr_name]= item['flowable:expression'].__cdata.replace('${variables:get(', '').replace(')}', '')
        return curr
      },{})
    // step 5, get which workflow information to store signature
    const workflowKeyToStoreSignature = workflowToTemplateMapping[signatureSettingFromTask.attr_signature] || ''

    // step 6, get template detail and setting json
    const { data: detail } = await clientApi.api.getNuxeoTemplateTemplateid(templateId)
    let json = await clientApi.api.postNuxeoDocumentPreview({ idOrPath: detail.documentId }, {
      format: 'blob'
    }).then(async (res) => {
      const t = await res.text()
      return JSON.parse(t)
    })

    // replace signature variable
    // convert workflow variable to template variable
    const templateVariables = convertWorkflowVariableToTemplateVariable(formData, workflowToTemplateMapping)
    // get current user detail
    if(signatureSettingFromTask.attr_signature) {
      const currenUserDetail = useUserState()
      const userSignatureInfo = {
        ...currenUserDetail.value,
        role: currenUserDetail.value?.aclUserDetail?.roleName,
        signature: '',
        signDate: Date.now()
      }
      const signatureVariableSetting = json.variables.find((item: any) => item.id === signatureSettingFromTask.attr_signature)
      templateVariables[signatureSettingFromTask.attr_signature] = userSignatureInfo
      if(!signatureSetting) {
        signatureSetting = {}
      }
      signatureSetting.signatureVariableSetting = signatureVariableSetting
    }
    const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(json)))
    let templateDetail = JSON.parse(JSON.stringify(json))
    const content = templateDetail.json.content.content
    templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
    // const json.json.content = replaceVariables(json.json.content, newVariables)
    // finally, store signature setting
    if(!signatureSetting){
      signatureSetting = {}
    }
    signatureSetting.templateVariables = templateVariables
    signatureSetting.workflowKeyToStoreSignature = workflowKeyToStoreSignature
    signatureSetting.workflowToTemplateMapping = workflowToTemplateMapping
    signatureSetting.templateId = templateId
    signatureSetting.templateDetail = templateDetail
    signatureSetting.templateVariables = templateVariables
    console.log('signatureSetting', signatureSetting)
    // get
  }
  return {
    buttonSetting,
    buttons,
    components,
    signatureSetting
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
        if(typeof json === 'number') {
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
