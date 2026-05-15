import type { Graph } from '@antv/x6'

/**
 * 動態變量的數據類型
 */
export type VariableItemType = 'string' | 'number' | 'boolean' | 'date'
export const VariableItemDisplayType = {
  string: [
    'text',
    'file_id'
    // , 'url', 'email', 'phone'
  ],
  number: ['number'],
  boolean: ['boolean'],
  date: ['date']
}

export const VariableTypeOptions = [
  {
    group: 'DATA',
    options: [
      {
        label: 'Text',
        type: 'string',
        display_type: 'text',
        validation: {
          max_length: 255
        },
        component: 'ContextVariableDataTypeString'
      },
      {
        label: 'File',
        type: 'string',
        display_type: 'file',
        validation: {
        },
        component: 'ContextVariableDataTypeString'
      },
      // {
      //   label: 'URL',
      //   type: 'string',
      //   display_type: 'url',
      //   validation: {
      //     pattern: '^https?://(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$',
      //     max_length: 255
      //   },
      //   component: 'ContextVariableDataTypeUrl'
      // },
      // {
      //   label: 'Email',
      //   type: 'string',
      //   display_type: 'email',
      //   validation: {
      //     pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      //     max_length: 255
      //   },
      //   component: 'ContextVariableDataTypeEmail'
      // },
      // {
      //   label: 'Phone',
      //   type: 'string',
      //   display_type: 'phone',
      //   validation: {
      //     country_code: 86,
      //     length: 11
      //   },
      //   component: 'ContextVariableDataTypePhone'
      // },
      {
        label: 'Number',
        type: 'number',
        display_type: 'number',
        validation: {
          max_value: 100,
          min_value: 1,
          decimal_places: 0
        },
        component: 'ContextVariableDataTypeNumber'
      },
      {
        label: 'Boolean',
        type: 'boolean',
        display_type: 'boolean',
        validation: {},
        component: 'ContextVariableDataTypeBoolean'
      },
      {
        label: 'Date',
        type: 'date',
        display_type: 'date',
        validation: {
          pattern: 'YYYY-MM-DD hh:mm:ss'
        },
        component: 'ContextVariableDataTypeDate'
      }
    ]
  }
]

export type VariableItem = {
  id: string
  name: string
  description: string
  type: VariableItemType
  display_type: string
  required: boolean
  default_value: string
  validation: {
    pattern?: string
    max_length?: number
    min_length?: number
    max_value?: number
    min_value?: number
    decimal_places?: number
  }
  display_option: {}
}

export type VariableSelectItem = {
  id: string
  name: string
  type: VariableItemType
  display_type: string
  required: boolean
}

export type WorkflowVariablesObj = Record<string, Omit<VariableItem, 'id'>>

export type WorkflowVariablesProvideContext = {
  variables: ReturnType<typeof ref<VariableItem[]>>
  addVariableItem: (node: any, variableItem: VariableItem) => void
  updateVariableItem: (node: any, variableItem: VariableItem) => void
  deleteVariableItem: (node: any, variableItemId: string) => void
  getVariablesByTags: (tagList?: string[], status?: boolean) => VariableSelectItem[]
}

/**
 * When submitting data, the data format of formData is forced to be converted according to the data type of Variables.
 *
 * @param formData formData original data
 * @param variables variables object
 */
export function conversionFormDataByVariables(formData: any, variables: any) {
  try {
    const variableSchema = Object.entries(variables).reduce((acc: any, [key, value]) => {
      acc[key] = { type: value?.type }
      return acc
    }, {})

    const formattedVariables: any = {}

    for (const key in formData) {
      const value = formData[key]
      const definition = variableSchema[key]

      if (!definition) {
        formattedVariables[key] = value
        continue
      }

      switch (definition.type) {
        case 'number':
          const num = Number(value)
          formattedVariables[key] = isNaN(num) ? 0 : num
          break
        case 'boolean':
          if (typeof value === 'string') {
            formattedVariables[key] = value.toLowerCase() === 'true'
          } else {
            formattedVariables[key] = Boolean(value)
          }
          break
        case 'string':
          formattedVariables[key] = value !== null ? String(value) : ''
          break
        default:
          formattedVariables[key] = value
      }
    }
    return formattedVariables
  } catch (e) {
    console.log(e)
  }
}

export const useVariablesProvide = () => {
  const ctx = inject<WorkflowVariablesProvideContext>('WorkflowVariablesProvide')
  if (!ctx) {
    throw new Error('WorkflowVariablesProvide is not provided')
  }
  const { variables, addVariableItem, updateVariableItem, deleteVariableItem, getVariablesByTags } = ctx
  return {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    getVariablesByTags
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
   * @param displayTypeList 變量的數據類型 VariableItemDisplayType 的子類型
   * @param status 是否是變量
   */
  function getVariablesByTags(displayTypeList?: string[], status = false): VariableSelectItem[] {
    let list: VariableItem[] = variables.value

    if (displayTypeList?.length) {
      list = variables.value.filter((item: VariableItem) => displayTypeList.includes(item.display_type))
    }

    return list.map((item: VariableItem) => ({
      id: status ? '${' + item.id + '}' : item.id,
      name: item.name,
      type: item.type,
      display_type: item.display_type,
      required: item.required
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
    getVariablesByTags
  })

  return {
    setVariables
  }
}

async function updateStartEventNodeFormFields() {}

function toWorkflowVariablesObj(variables: VariableItem[]): WorkflowVariablesObj {
  return variables.reduce((acc: WorkflowVariablesObj, curr: VariableItem) => {
    const { id, ...rest } = curr
    acc[id] = rest
    return acc
  }, {})
}
