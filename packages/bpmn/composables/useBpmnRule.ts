import { clientApi } from 'api'

const mockRules = [
  {
    id: 'testOyDate',
    name: 'testOyDate',
    validationRule: {
      validationRuleName: 'date',
      dateOrDateTime: 'date',
      format: 'YYYY-MM-DDTHH:mm:ss.000Z',
      defaultValue: 'tomorrow',
      isMultiple: false
    }
  }
]
/**
 * 一个 workflow 只有一个 rule list, 全局通用
 * 一个 workflow 有 多个 workflowTask
 * 一个 workflowTask 可以引用多个 rule list 中的 rule
 * @param ruleId
 */
export const useBpmnRule = ({
                              versionDraftId,
                              version,
                              taskName,
                              draftId,
                              workflowDetail
                            }: {
  versionDraftId: string
  version: number
  taskName: string
  draftId: string
  workflowDetail: any
}) => {
  const bpmnGlobalRules = ref<any>([])
  let isNew = false

  async function getBpmnRules() {
    try {
      const rule = await clientApi.admin.getAdmindocpalValidationRulesVersiondraftid(versionDraftId, {
        headers: {
          noThrowError: 'true'
        }
      })
        .then((res) => res.data)
      if (!rule || !rule.validationRules) {
        isNew = true
        bpmnGlobalRules.value = []
      } else {
        bpmnGlobalRules.value = rule?.validationRules || []
      }
    } catch (error) {
      console.log('error', error)
      isNew = true
    }
  }

  // set bpmn 1
  async function addBpmnRule(rule: any) {
    try {
      bpmnGlobalRules.value.push(...rule)
      const params: any = {
        versionDraftId,
        version,
        nodeName: taskName,
        draftId,
        validationRules: bpmnGlobalRules.value
      }
      const res = await clientApi.admin.postAdmindocpalValidationRules(params)
      isNew = false
    } catch (error) {
      console.log('error', error)
    }
  }

  // set bpmn 2
  async function updateBpmnRule(rules: any, nodes: any) {
    try {
      rules.forEach((rule: any) => {
        const index = bpmnGlobalRules.value.findIndex((item: any) => item.id === rule.id)
        if (index !== -1) {
          bpmnGlobalRules.value[index] = rule
        } else {
          bpmnGlobalRules.value.push(rule)
        }
      })

      const params: any = {
        versionDraftId,
        version,
        nodeName: taskName,
        draftId,
        validationRules: bpmnGlobalRules.value
      }
      const res = await clientApi.admin.putAdmindocpalValidationRulesVersiondraftid(versionDraftId, params)
      if (rules.length > 1) {
        return
      }
      const rule = rules[0]
      const index = bpmnGlobalRules.value.findIndex((item: any) => item.id === rule.id)
      if (index !== -1) {
        let isChanged = false
        nodes.forEach((node: any) => {
          if (node.data?.data?.extensionElements?.['flowable:formProperty']) {
            const formItems = node.data.data.extensionElements['flowable:formProperty']
            const updateFormItem = formItems.find((item: any) => item.attr_id === rule.id)
            if (updateFormItem) {
              if (updateFormItem.attr_name !== rule.name) {
                updateFormItem.attr_name = rule.name
                isChanged = true
              }
              if (updateFormItem.attr_type !== getBpmnRuleType(rule.type)) {
                updateFormItem.attr_type = getBpmnRuleType(rule.type)
                isChanged = true
              }
            }
            if (isChanged) {
              setNodeData(node, formItems)
            }
          }
        })
        if (workflowDetail && isChanged) {
          workflowDetail.saveDraft()
        }
      }
    } catch (error) {
    }
  }

  async function setBpmnRules(newRule: any, nodes: any) {
    let newRules = newRule
    if (!Array.isArray(newRule)) newRules = [newRule]
    const formatRules = newRules.map((item: any) => {
      const rule = {
        id: item.id,
        name: item.name,
        validationRule: {
          ...item
        }
      }
      delete rule.validationRule.id
      delete rule.validationRule.name
      return rule
    })
    console.log(formatRules)
    if (isNew) {
      await addBpmnRule(formatRules)
    } else {
      await updateBpmnRule(formatRules, nodes)
    }
  }

  function getBpmnRuleType(ruleType: string) {
    switch (ruleType) {
      case 'timestamp':
      case 'date':
        return 'date'
      case 'boolean':
        return 'boolean'
      case 'bigint':
      case 'decimal':
      case 'number':
        return 'long'
      default:
        return 'string'
    }
  }

  async function deleteBpmnRule(deleteRule: any, nodes: any) {
    bpmnGlobalRules.value = bpmnGlobalRules.value.filter((item: any) => item.id !== deleteRule.id)
    const params: any = {
      versionDraftId,
      version,
      nodeName: taskName,
      draftId,
      validationRules: bpmnGlobalRules.value
    }
    await clientApi.admin.putAdmindocpalValidationRulesVersiondraftid(versionDraftId, params)
    let isChanged = false
    nodes.forEach((node: any) => {
      if (node.data?.data?.extensionElements?.['flowable:formProperty']) {
        const formItems = node.data.data.extensionElements['flowable:formProperty']
        const newFormItems = formItems.filter((item: any) => item.attr_id !== deleteRule.id)
        if (newFormItems.length !== formItems.length) {
          setNodeData(node, newFormItems)
          isChanged = true
        }
      }
    })
    if (workflowDetail && isChanged) {
      workflowDetail.saveDraft()
    }
  }

  function getTaskFieldRules(taskFields: any[]) {
    if (!taskFields) {
      return JSON.parse(JSON.stringify(bpmnGlobalRules.value))
    }
    return taskFields.map((item: any) => {
      const rule = bpmnGlobalRules.value.find((rule: any) => rule.id === item.attr_id)
      return {
        ...rule
      }
    })
  }

  onMounted(() => {
    getBpmnRules()
  })
  return {
    bpmnGlobalRules,
    getBpmnRules,
    setBpmnRules,
    getBpmnRuleType,
    deleteBpmnRule,
    getTaskFieldRules
  }
}

export function setNodeData(node: any, formPropertys: any) {
  const newData = {
    ...node.data,
    version: (node.data.version || 0) + 1,
    data: {
      ...node.data.data,
      extensionElements: {
        ...node.data.data.extensionElements,
        'flowable:formProperty': JSON.parse(JSON.stringify(formPropertys))
      }
    }
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
}
