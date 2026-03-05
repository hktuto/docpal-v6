import {} from '#imports'
/**
 * 動態變量的數據類型
 */
interface VariableItemType {
  string: 'string'
  number: 'number'
  boolean: 'boolean'
  date: 'date'
  select: 'select'
}

export type VariableItem = {
  id: string
  name: string
  type: string
  required: boolean
  pattern?: string
  format?: string
  minimum?: number
  maximum?: number
}

export const useVariablesProvide = () => {
  const { variables, addVariableItem, updateVariableItem, deleteVariableItem, getVariablesByType } = inject('WorkflowVariablesProvide')
  return {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    getVariablesByType
  }
}

export const useVariables = () => {
  const variables = ref<VariableItem[]>([])

  /**
   * 把workflow Json 中 variables 轉成數組
   * @param variablesObj workflowJson.variables
   */
  function setVariables(variablesObj: any) {
    if (!!variables) {
      variables.value = Object.keys(variablesObj).map((key) => ({
        id: key,
        ...variablesObj[key]
      }))
    }
  }

  /**
   * Add variable to variables and workflowJson variables
   * @param variableItem 變量對象
   */
  function addVariableItem(variableItem: VariableItem) {
    variables.value.push(variableItem)
    // update 回 workflowJson的 variables
    const variablesObj = toWorkflowVariablesObj(variables.value)
  }

  /**
   * Update variable to variables and workflowJson variables
   * @param variableItem 變量對象
   */
  function updateVariableItem(variableItem: VariableItem) {
    const index = variables.value.findIndex((item: VariableItem) => item.id === variableItem.id)
    if (index !== -1) {
      variables.value[index] = variableItem
    }

    // update 回 workflowJson的 variables
    const variablesObj = toWorkflowVariablesObj(variables.value)
  }

  /**
   * Delete variable from variables and workflowJson variables
   * @param variableItemId 變量ID
   */
  function deleteVariableItem(variableItemId: string) {
    const index = variables.value.findIndex((item: VariableItem) => item.id === variableItemId)
    if (index !== -1) {
      variables.value.splice(index, 1)
    }

    // update 回 workflowJson的 variables
    const variablesObj = toWorkflowVariablesObj(variables.value)
  }

  /**
   * 根據數據類型返回對應的數據類型
   * @param type 變量的數據類型
   */
  function getVariablesByType(type?: VariableItemType) {
    return variables.value
      .filter((item: VariableItem) => item.type === type)
      .map((item: VariableItem) => {
        return {
          id: item.id,
          name: item.name,
          type: item.type
        }
      })
  }

  provide('WorkflowVariablesProvide', {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    getVariablesByType
  })

  return {
    setVariables
  }
}

function toWorkflowVariablesObj(variables: VariableItem[]) {
  return variables.reduce((acc: any, curr: VariableItem) => {
    const { id, ...rest } = curr
    acc[id] = rest
    return acc
  }, {})
}
