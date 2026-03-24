import type { Graph } from '@antv/x6'

/**
 * 動態變量的數據類型
 */
export type VariableItemType = 'string' | 'number' | 'boolean' | 'date'

export const VariableTypeOptions = [
  {
    group: 'DATA',
    options: [
      {
        label: 'Text',
        type: 'string',
        validation: {
          maxLength: 255
        },
        component: 'DataTypeText'
      },
      {
        label: 'Number',
        type: 'number',
        validation: {
          minimum: -999999,
          maximum: 999999,
          multipleOf: 0
        },
        component: 'DataTypeNumber'
      },
      {
        label: 'Boolean',
        type: 'boolean',
        validation: {},
        component: 'DataTypeBoolean'
      },
      {
        label: 'Date',
        type: 'date',
        validation: {
          dateOrDateTime: 'date',
          format: 'YYYY-MM-DD',
          isMultiple: false
        },
        component: 'DataTypeDate'
      }
    ]
  }
]

export type VariableItem = {
  id: string
  name: string
  type: string
  required: boolean
  maxLength?: number
  pattern?: string
  format?: string
  minimum?: number
  maximum?: number
}

export type VariableSelectItem = {
  id: string
  name: string
  type: string
}

export type WorkflowVariablesObj = Record<string, Omit<VariableItem, 'id'>>

export type WorkflowVariablesProvideContext = {
  variables: ReturnType<typeof ref<VariableItem[]>>
  addVariableItem: (node: any, variableItem: VariableItem) => void
  updateVariableItem: (node: any, variableItem: VariableItem) => void
  deleteVariableItem: (node: any, variableItemId: string) => void
  getVariablesByType: (typeList?: VariableItemType[]) => VariableSelectItem[]
}

export const useVariablesProvide = () => {
  const ctx = inject<WorkflowVariablesProvideContext>('WorkflowVariablesProvide')
  if (!ctx) {
    throw new Error('WorkflowVariablesProvide is not provided')
  }
  const { variables, addVariableItem, updateVariableItem, deleteVariableItem, getVariablesByType } = ctx
  return {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    getVariablesByType
  }
}

export const useVariables = (graphRef?: Ref<Graph | undefined>) => {
  const variables = ref<VariableItem[]>([])

  /**
   * 把workflow Json 中 variables 轉成數組
   * @param variablesObj workflowJson.variables
   */
  function setVariables(variablesObj: any) {
    if (!!variablesObj) {
      variables.value = Object.keys(variablesObj).map((key) => ({
        id: key,
        ...variablesObj[key]
      }))
    }
  }

  /**
   * Add variable to variables and workflowJson variables
   * @param variableItem 變量對象
   * @param node node
   */
  function addVariableItem(node: any, variableItem: VariableItem) {
    variables.value.push(variableItem)
    updateNode(node, toWorkflowVariablesObj(variables.value))
  }

  /**
   * Update variable to variables and workflowJson variables
   * @param variableItem 變量對象
   * @param node node
   */
  function updateVariableItem(node: any, variableItem: VariableItem) {
    const index = variables.value.findIndex((item: VariableItem) => item.id === variableItem.id)
    if (index !== -1) {
      variables.value[index] = variableItem
    }
    updateNode(node, toWorkflowVariablesObj(variables.value))
  }

  /**
   * Delete variable from variables and workflowJson variables
   * @param variableItemId 變量ID
   * @param node node
   */
  function deleteVariableItem(node: any, variableItemId: string) {
    const index = variables.value.findIndex((item: VariableItem) => item.id === variableItemId)
    if (index !== -1) {
      variables.value.splice(index, 1)
    }
    updateNode(node, toWorkflowVariablesObj(variables.value))
  }

  /**
   * 根據數據類型返回對應的數據類型
   * @param typeList 變量的數據類型
   */
  function getVariablesByType(typeList?: VariableItemType[]): VariableSelectItem[] {
    let list
    if (!typeList) {
      list = variables.value
    } else if (typeList.length > 0) {
      list = variables.value.filter((item: VariableItem) => typeList.includes(item.type))
    }

    return list.map((item: VariableItem) => ({
      id: item.id,
      name: item.name,
      type: item.type
    }))
  }

  function updateNode(node: any, variables: WorkflowVariablesObj) {
    const data = node.getData()
    const newData = {
      ...data,
      variables,
      version: (data.version || 0) + 1
    }
    node.setData(newData, { overwrite: true, deep: true, silent: false })
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

function toWorkflowVariablesObj(variables: VariableItem[]): WorkflowVariablesObj {
  return variables.reduce((acc: WorkflowVariablesObj, curr: VariableItem) => {
    const { id, ...rest } = curr
    acc[id] = rest
    return acc
  }, {})
}
