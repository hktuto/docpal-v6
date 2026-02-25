import { newAdminApi } from 'api'

export async function saveWorkflowFormToNewVersion(xml: string, processKey: string, oldVersion: string, newVersion: string) {
  if (!xml) {
    throw new Error('Graph is not found')
  }

  // convert xml to json
  const allForm = await getAllFormFromXML(xml, processKey, oldVersion)
  await batchSaveForm(allForm, processKey, newVersion, oldVersion)
  getBpmnRuleAndSave(oldVersion, newVersion)
}

export async function getBpmnRuleAndSave(oldVersion: string, newVersion: string) {
  const oldVersions = oldVersion.split(':')
  const oldVersionNum = oldVersions[0]
  const version = oldVersionNum + 1
  const draftId = oldVersions[1]
  const newVersions = newVersion.split(':')
  const newVersionNum = newVersions[0]
  try {
    const rule: any = await newAdminApi.getDocpalValidationRulesVersiondraftid(oldVersion, {
      headers: {
        noThrowError: 'true'
      }
    }).then((res) => res.data)
    const params: any = {
      versionDraftId: newVersionNum + draftId,
      version: newVersionNum,
      nodeName: 'global',
      draftId,
      validationRules: rule?.validationRules || []
    }
    await newAdminApi.postDocpalValidationRules(params).then(r => r.data)
  } catch (error) {
    console.log('error', error)
  }
}

type BatchForms = { formId: string; json: string }[]

export async function getAllFormFromXML(xml: string, processKey: string, version: string): Promise<BatchForms> {
  const allFormsID: string[] = []
  // convert xml to json
  const { json } = bpmnStringToJson(xml)
  const result: BatchForms = []

  json.definitions.process.startEvent.forEach((startEvent: any) => {
    allFormsID.push(startEvent.attr_id)
  })
  json.definitions.process.userTask.forEach((userTask: any) => {
    allFormsID.push(userTask.attr_id)
  })
  json.definitions.process.endEvent.forEach((endEvent: any) => {
    allFormsID.push(endEvent.attr_id)
  })
  for await (const formId of allFormsID) {
    const response = await newAdminApi.getDmsFormPropertiesQuery({
      processKey: processKey,
      userTaskId: formId,
      versionId: version
    })
    let json = ''
    if (!response || !response.data || response.data.length === 0) {
      json = '{}'
    } else {
      json = response.data[0].jsonValue || ''
    }
    result.push({
      formId,
      json
    })
  }
  // allFormsID.forEach(async(formId) => {
  //     const response = await newAdminApi.getRelationQuery({
  //         processKey: processKey,
  //         userTaskId: formId,
  //         versionId: version
  //     });
  //     let json = "";
  //     if(!response || !response.data || response.data.length === 0){
  //         json = "{}"
  //     }else{
  //         json = response.data[0].jsonValue || ""
  //     }
  //     result.push({
  //         formId,
  //         json
  //     })
  // })
  console.log('result', result.length, result)
  return result
}

export async function batchSaveForm(forms: BatchForms, processKey: string, version: string, oldVersion: string) {
  console.log('batchSaveForm', forms, processKey, version)
  for (const form of forms) {
    const res = await newAdminApi.postDmsFormPropertiesSave({
      processKey: processKey,
      userTaskId: form.formId,
      jsonValue: form.json,
      versionId: version,
      // @ts-ignore
      oldVersion: oldVersion
    })
    console.log('forms', form.formId, processKey, version, res)
  }
}
