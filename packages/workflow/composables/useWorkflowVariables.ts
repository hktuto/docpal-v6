import type { Graph, Node } from '@antv/x6'
import dayjs from 'dayjs'

/**
 * 動態變量的數據類型
 */
export type VariableItemType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
export const VariableItemDisplayType = {
  string: [
    'text',
    'file'
    // , 'url', 'email', 'phone'
  ],
  number: ['number', 'timestamp'],
  boolean: ['boolean'],
  date: ['date'],
  array: ['dateRange', 'array'],
  object: ['object']
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
          max_length: 255,
          min_length: 1
        },
        component: 'ContextVariableDataTypeString'
      },
      {
        label: 'File',
        type: 'string',
        display_type: 'file',
        validation: {
          max_length: 255,
          min_length: 1
        },
        component: 'ContextVariableDataTypeString'
      },
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
        label: 'Timestamp',
        type: 'number',
        display_type: 'timestamp',
        validation: {
          max_value: 9999999999999,
          min_value: 1000000000000,
          decimal_places: 0
        },
        component: 'ContextVariableDataTypeTimestamp'
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
      },
      {
        label: 'Date Range',
        type: 'array ',
        display_type: 'dateRange',
        validation: {},
        component: 'ContextVariableDataTypeDateRange'
      },
      {
        label: 'Array',
        type: 'array',
        display_type: 'array',
        validation: {},
        component: 'ContextVariableDataTypeArray'
      },
      {
        label: 'Object',
        type: 'object',
        display_type: 'object',
        validation: {},
        component: 'ContextVariableDataTypeObject'
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
  default_value?: string | boolean | number
  validation?: {
    pattern?: string
    max_length?: number
    min_length?: number
    max_value?: number
    min_value?: number
    decimal_places?: number
  }
  minItems?: number
  items?: {
    type: 'object' | 'string' | 'number' | 'boolean' | 'date'
    properties: any
  }
  display_option?: {}
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
  addVariableItem: (node: Node, variableItem: VariableItem) => void
  updateVariableItem: (node: Node, variableItem: VariableItem) => void
  deleteVariableItem: (node: Node, variableItemId: string) => void
  saveStartEventFormFields: (node: Node) => void
  getVariablesByDisplayTypes: (displayTypeList?: string[], status?: boolean) => VariableSelectItem[]
}

/**
 * When submitting data, the data format of formData is forced to be converted according to the data type of form Fields.
 *
 * @param formData formData original data
 * @param formFields form Fields
 */
export function conversionFormDataByVariables(formData: any, formFields: VariableItem[]) {
  try {
    const variableSchema: any = formFields.reduce((acc: Record<string, VariableItem>, item: VariableItem) => {
      acc[item.id] = item
      return acc
    }, {})
    return convertFormDataEntries(formData, variableSchema)
  } catch (e) {
    console.log(e)
  }
}

function convertFormDataEntries(formData: any, variableSchema: any) {
  const formattedVariables: Record<string, any> = {}

  for (const key in formData) {
    const value = formData[key]
    const definition: VariableItem = variableSchema[key]
    formattedVariables[key] = definition ? convertValueByDefinition(value, definition) : value
  }
  return formattedVariables
}

function convertValueByDefinition(value: any, definition: VariableItem): any {
  switch (definition.display_type) {
    case 'dateRange':
      return value.map((item: string) => dayjs(item).format(definition?.items?.properties?.start?.validation?.pattern))
    case 'array':
      return conversionSubData(value, definition)
    case 'object':
      return conversionSubData(value, definition)
    default:
      return convertScalarValue(value, definition)
  }
}

function conversionSubData(formData: any, definition: VariableItem) {
  if (definition.items?.type !== 'object') return

  try {
    if (typeof formData === 'string') {
      return JSON.parse(formData)
    } else if (Array.isArray(formData)) {
      return formData.map((item) => {
        return convertFormDataEntries(item, definition.items?.properties)
      })
    } else {
      return convertFormDataEntries(formData, definition.items?.properties)
    }
  } catch (e) {
    console.log('conversionSubData', e)
    return formData
  }
}

function convertScalarValue(value: any, definition: VariableItem): any {
  switch (definition.display_type) {
    case 'timestamp':
      return dayjs(value).valueOf()
    case 'number': {
      const num = Number(value)
      return isNaN(num) ? 0 : num
    }
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value.toLowerCase() === 'y'
      }
      return Boolean(value)
    case 'text':
      return value !== null ? String(value) : ''
    case 'date':
      return dayjs(value).format(definition?.validation?.pattern)
    default:
      return value
  }
}

// function conversionSubData(formData: any, properties: any, formFields: VariableItem[]) {
//   if (properties.items.type !== 'object') return
//
//   try {
//     if (typeof formData === 'string') {
//       formData = JSON.parse(formData)
//     } else if (Array.isArray(formData)) {
//     } else {
//       return formData
//     }
//
//     const formattedVariables: any = {}
//
//     for (const key in formData) {
//       const value: any = formData[key]
//       const definition: VariableItem = properties.items.properties[key]
//
//       if (!definition) {
//         formattedVariables[key] = value
//         continue
//       }
//
//       switch (definition.display_type) {
//         case 'timestamp':
//           formattedVariables[key] = dayjs(value).valueOf()
//           break
//         case 'number':
//           const num: number = Number(value)
//           formattedVariables[key] = isNaN(num) ? 0 : num
//           break
//         case 'boolean':
//           if (typeof value === 'string') {
//             formattedVariables[key] = value.toLowerCase() === 'true' || value.toLowerCase() === 'y'
//           } else {
//             formattedVariables[key] = Boolean(value)
//           }
//           break
//         case 'text':
//           formattedVariables[key] = value !== null ? String(value) : ''
//           break
//         case 'date':
//           formattedVariables[key] = dayjs(value).format(definition?.validation?.pattern)
//           break
//         default:
//           formattedVariables[key] = value
//       }
//     }
//     return formattedVariables
//   } catch (e) {
//     console.log('conversionSubData', e)
//     return formData
//   }
// }

export const useVariablesProvide = () => {
  const ctx = inject<WorkflowVariablesProvideContext>('WorkflowVariablesProvide')
  if (!ctx) {
    throw new Error('WorkflowVariablesProvide is not provided')
  }
  const { variables, addVariableItem, updateVariableItem, deleteVariableItem, saveStartEventFormFields, getVariablesByDisplayTypes } = ctx
  return {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    saveStartEventFormFields,
    getVariablesByDisplayTypes
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
   * @param node Node
   */
  function addVariableItem(node: Node, variableItem: VariableItem) {
    variables.value.push(variableItem)
    updateNode(node, toWorkflowVariablesObj(variables.value))
  }

  /**
   * Update variable to variables and workflowJson variables
   * @param variableItem 變量對象
   * @param node node
   */
  function updateVariableItem(node: Node, variableItem: VariableItem) {
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
  function deleteVariableItem(node: Node, variableItemId: string) {
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
  function getVariablesByDisplayTypes(displayTypeList?: string[], status = false): VariableSelectItem[] {
    let list: VariableItem[] = variables.value

    if (displayTypeList?.length) {
      list = variables.value.filter((item: VariableItem) => displayTypeList.includes(item.display_type))
    }

    return list.map((item: VariableItem) => ({
      id: status ? '${' + item.id + '}' : item.id,
      name: item.name,
      type: item.type,
      display_type: item.display_type,
      required: item.required,
      items: item.items
    }))
  }

  function updateNode(node: Node, variables: WorkflowVariablesObj) {
    const data = node.getData()
    const newData = {
      ...data,
      variables,
      version: (data.version || 0) + 1
    }
    node.setData(newData, { overwrite: true, deep: true, silent: false })
  }

  function saveStartEventFormFields(startNode: Node) {
    const formFields = variables.value.filter((item: any) => item.required && !item.id.startsWith('__system__'))
    const data = startNode.getData()
    const newData = {
      ...data,
      config: {
        ...data.config,
        initialise: {
          ...data.config.initialise,
          form_fields: formFields
        }
      },
      version: (data.version || 0) + 1
    }
    startNode.setData(newData, { overwrite: true, deep: true, silent: false })
  }

  provide('WorkflowVariablesProvide', {
    variables,
    addVariableItem,
    updateVariableItem,
    deleteVariableItem,
    saveStartEventFormFields,
    getVariablesByDisplayTypes
  })

  return {
    setVariables
  }
}

export function toWorkflowVariablesObj(variables: VariableItem[]): WorkflowVariablesObj {
  return variables.reduce((acc: WorkflowVariablesObj, curr: VariableItem) => {
    const { id, ...rest } = curr
    acc[id] = rest
    return acc
  }, {})
}
