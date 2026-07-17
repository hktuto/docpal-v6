import { Cell, CellView, Graph } from '@antv/x6'
import type { NodeItem } from './jsonConversion'
import { getTaskItemConfig } from '@packages/workflow/utils/taskItemConfig'

export enum WorkflowElementType {
  StartEvent = 'StartEvent',
  EndEvent = 'EndEvent',
  UserTask = 'UserTask',
  Gateway = 'Gateway',
  ServiceTask = 'ServiceTask',
  HTTPRequestTask = 'HTTPRequestTask',
  TransformTask = 'TransformTask',
  MessageTask = 'MessageTask',
  ConditionTask = 'ConditionTask',
  ValidateTask = 'ValidateTask',
  ScriptTask = 'ScriptTask'
}

Graph.registerNode(
  'invisible-node',
  {
    inherit: 'rect',
    markup: []
  },
  true
)
Graph.registerNode(
  'bpmn-node',
  {
    inherit: 'rect',
    ports: {
      groups: {
        from: {
          position: 'top',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        to: {
          position: 'bottom',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        }
      }
    }
  },
  true
)
Graph.registerNode(
  'custom-polygon',
  {
    inherit: 'polygon',
    width: 66,
    height: 36,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF'
      },
      text: {
        fontSize: 12,
        fill: '#262626'
      }
    },
    ports: {
      groups: {
        from: {
          position: 'top',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        to: {
          position: 'bottom',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        }
      }
    }
  },
  true
)

/**
 * Render Workflow Toolbar Chart Types
 */
export enum CellType {
  userTask = 'UserTask',
  signatureTask = 'SignatureTask',
  exclusiveGateway = 'ExclusiveGateway',
  parallelGateway = 'ParallelGateway',
  inclusiveGateway = 'InclusiveGateway',
  transformTask = 'TransformTask',
  HTTPTask = 'HTTPTask',

  // Service
  conditionTask = 'ConditionTask',
  messageTask = 'MessageTask',
  uploadFile = 'UploadFile',
  subProcess = 'SubProcess',
  validateTask = 'ValidateTask',
  filingDocuments = 'FilingDocuments',
  insertDynamicDatabase = 'InsertDynamicDatabase',
  batchInsertDynamicDatabase = 'BatchInsertDynamicDatabase',
  updateDynamicDatabase = 'UpdateDynamicDatabase',
  batchUpdateDynamicDatabase = 'BatchUpdateDynamicDatabase',
  uniqueIdGenerator = 'UniqueIdGenerator',
  documentGenerationTask = 'DocumentGenerationTask',
  emailTask = 'EmailTask',
  scriptTask = 'ScriptTask',

  jsonEdit = 'JsonEdit'
}

// 組件Map
export enum contextMenuComponentType {
  StartEvent = 'LazyContextStartEvent',
  EndEvent = 'LazyContextEndEvent',
  UserTask = 'LazyContextUserTask',
  signatureTask = 'LazyContextSignature',
  // Gateway
  ExclusiveGateway = 'LazyContextExclusiveGateway',
  ParallelGateway = 'LazyContextParallelGateway',
  InclusiveGateway = 'LazyContextInclusiveGateway',
  // Service
  HTTPTask = 'LazyContextServiceTaskHttpTask',
  ValidateTask = 'LazyContextServiceTaskValidate',
  MessageTask = 'LazyContextServiceTaskMessage',
  UploadFile = 'LazyContextServiceTaskUploadFile',
  SubProcess = 'LazyContextServiceTaskSubProcess',
  DocumentGenerationTask = 'LazyContextServiceTaskDocumentGeneration',
  FilingDocuments = 'LazyContextServiceTaskFilingDocuments',
  UniqueIdGenerator = 'LazyContextServiceTaskUniqueIdGenerator',
  InsertDynamicDatabase = 'LazyContextServiceTaskDynamicDatabaseInsert',
  BatchInsertDynamicDatabase = 'LazyContextServiceTaskDynamicDatabaseBatchInsert',
  UpdateDynamicDatabase = 'LazyContextServiceTaskDynamicDatabaseUpdate',
  BatchUpdateDynamicDatabase = 'LazyContextServiceTaskDynamicDatabaseBatchUpdate',
  EmailTask = 'LazyContextServiceTaskEmail',

  // Condition
  ConditionTask = 'LazyContextCondition',
  // Transform
  TransformTask = 'ContextTransform',
  // Script
  ScriptTask = 'LazyContextScriptTask',
  // JSON Node
  JSONEditor = 'LazyContextJsonEditor'
}

const taskTitle: any = {
  StartEvent: 'Start Event',
  EndEvent: 'End Event',
  UserTask: 'User Task',
  SignatureTask: 'Signature Task',
  ExclusiveGateway: 'Exclusive Gateway',
  ParallelGateway: 'Parallel Gateway',
  InclusiveGateway: 'Inclusive Gateway',
  HTTPTask: 'HTTP Task',
  ValidateTask: 'Validate Task',
  MessageTask: 'Message Task',
  UploadFile: 'Upload File',
  SubProcess: 'Sub Process',
  DocumentGenerationTask: 'Document Generation Task',
  FilingDocuments: 'Filing Documents Task',
  UniqueIdGenerator: 'Unique Id Generator',
  InsertDynamicDatabase: 'Insert Dynamic Database',
  BatchInsertDynamicDatabase: 'Batch Insert Dynamic Database',
  UpdateDynamicDatabase: 'Update Dynamic Database',
  BatchUpdateDynamicDatabase: 'Batch Update Dynamic Database',
  EmailTask: 'Email Task',
  ConditionTask: 'Condition Task',
  TransformTask: 'Transform Task',
  ScriptTask: 'Script Task'
}

interface portsItems {
  id: string
  group: string
}

export type CellTypeItem = {
  [key in CellType]: {
    id: string
    label: string
    width: number
    height: number
    shape: string
    attrs: Attrs
    markup: Markup[]
    ports: {
      items: portsItems[]
    }
    data: {
      id: string
      name: string
      type: string
      documentation: string
      inputSchema?: string
      outputSchema?: string
      implementation?: string
      config?: any
      execution?: {
        async: boolean
        timeout_ms: number
        priority: number
      }
      input_mapping?: any
      metadata: {
        type: CellType
        tags: WorkflowElementType
        icon: string
        width?: number
        height?: number
        bgColor?: string
        textColor?: string
        buttonSetting?: any
        rules?: any
        maxOutgoing?: number
        signature?: any
        databaseId?: string
      }
      celCondition?: string
    }
    style?: any
  }
}

export type WorkflowElement = {
  [key in WorkflowElementType]: {
    embed?: boolean
    embeddingValidateRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    connectable?: boolean
    connectRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    toolbar: {
      id: CellType
      label: string
      icon: string
      group: string
      order: number
    }[]
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {}
    clickHandler: (args: { node: Cell; view: Cell }) => void
    contextMenuComponent?: string | Function
  }
}

interface Markup {
  tagName: string
  selector: string
}

interface Attrs {
  text: {
    fontSize: number
    fill: string
    refX: number
    refY: number
    textAnchor: string
    textVerticalAnchor: string
    textWrap: {
      width: number | string
      height: number | string
      ellipsis: boolean
      breakWord: boolean
    }
    text: string
  }
  body: {
    refWidth: number
    refHeight: number
    stroke: string
    strokeWidth: number
    fill: string
    rx: number
    ry: number
    filter: string
  }
  image: {
    'xlink:href': string
    width: number
    height: number
    x: number
    y: number
  }
  title: {
    text: string
    refX: number
    refY: number
    fill: string
    fontSize: number
    fontWeight: string
    textAnchor: string
  }
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface GraphItem {
  id: string
  markup: Markup[]
  attrs: Attrs
  shape: string
  zIndex: number
  visible: boolean
  position: Position
  size: Size
  data: any
  ports: any
  _order: number
}

/**
 * Generate graph styles
 * @param title 標題
 * @param textAnchor 副標題
 * @param icon 圖標
 * @param bgColor 背景色
 * @param textColor 文本顔色
 */
function GenAttrs(title: string, textAnchor: string, icon?: string, bgColor = '#fff', textColor = '#000') {
  return {
    text: {
      fontSize: 12,
      fill: textColor,
      refX: 46,
      refY: 30,
      textAnchor: textAnchor,
      textVerticalAnchor: 'top',
      textWrap: {
        width: -52,
        height: '70%',
        ellipsis: true,
        breakWord: false
      },
      text: textAnchor
    },
    body: {
      refWidth: 1,
      refHeight: 1,
      stroke: '#ddd',
      strokeWidth: 1,
      fill: bgColor,
      rx: 8,
      ry: 8,
      filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.2))'
    },
    image: {
      'xlink:href': icon,
      width: 24,
      height: 24,
      x: 12,
      y: 12
    },
    title: {
      text: title,
      refX: 46,
      refY: 12,
      fill: textColor,
      fontSize: 14,
      fontWeight: 'bold',
      textAnchor: textAnchor
    }
  } as Attrs
}

function GenDefPorts() {
  return {
    items: [
      {
        id: 'from',
        group: 'from'
      },
      {
        id: 'to',
        group: 'to'
      },
      {
        id: 'left',
        group: 'left'
      },
      {
        id: 'right',
        group: 'right'
      }
    ]
  }
}

/**
 * 畫布節點通用 rect+image+text markup（workflowJson 轉圖與工具欄模板共用
 * */
const GRAPH_NODE_MARKUP: Markup[] = [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'image', selector: 'image' },
  { tagName: 'text', selector: 'title' },
  { tagName: 'text', selector: 'text' }
]
const PORT_START_OUT = { items: [{ id: 'to', group: 'to' }] }
const PORT_END_IN = { items: [{ id: 'from', group: 'from' }] }

/**
 * 將後端 NodeItem 轉為 X6 用 GraphItem
 */
function graphItemFromWorkflowNode(
  workflowNodeItem: NodeItem,
  options?: {
    ports?: { items: portsItems[] }
    dataExtra?: Record<string, unknown>
  }
): GraphItem {
  const metadata = workflowNodeItem.metadata
  const dw = metadata.width || 120
  const dh = metadata.height || 64
  const bgColor = metadata.bgColor || '#fff'
  const textColor = metadata.textColor || '#000'
  const title: string = taskTitle[workflowNodeItem.metadata.type as string] || workflowNodeItem.metadata.type

  return {
    id: workflowNodeItem.id,
    markup: GRAPH_NODE_MARKUP,
    attrs: GenAttrs(title, workflowNodeItem.name, metadata.icon, bgColor, textColor),
    shape: 'bpmn-node',
    zIndex: 1,
    visible: true,
    position: {
      x: metadata.x || 60,
      y: metadata.y || 60
    },
    size: {
      width: dw,
      height: dh
    },
    data: options?.dataExtra ? { ...workflowNodeItem, ...options.dataExtra } : { ...workflowNodeItem },
    ports: options?.ports ?? GenDefPorts(),
    _order: 0
  }
}

/**
 * Node => workflowElement
 * Cell => Element Item
 */
export const workflowElement: WorkflowElement = {
  StartEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) =>
      graphItemFromWorkflowNode(workflowNodeItem, {
        ports: PORT_START_OUT,
        dataExtra: { version: 0 }
      }),
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextStartEvent'
  },
  EndEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) =>
      graphItemFromWorkflowNode(workflowNodeItem, {
        ports: PORT_END_IN,
        dataExtra: { version: 0 }
      }),
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextEndEvent'
  },
  UserTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.userTask,
        icon: 'lucide:file-pen-line',
        label: 'User Form',
        group: '',
        order: 0
      },
      {
        id: CellType.signatureTask,
        label: 'User Signature Task',
        icon: 'lucide:user-round-pen',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.type === CellType.signatureTask) {
        return contextMenuComponentType.signatureTask
      }
      return contextMenuComponentType.UserTask
    }
  },
  Gateway: {
    embed: false,
    toolbar: [
      // {
      //   id: CellType.exclusiveGateway,
      //   icon: 'mdi:call-split',
      //   label: 'Exclusive',
      //   group: 'Gateway',
      //   order: 0
      // },
      // {
      //   id: CellType.parallelGateway,
      //   icon: 'mdi:axis-arrow',
      //   label: 'Parallel',
      //   group: 'Gateway',
      //   order: 0
      // },
      // {
      //   id: CellType.inclusiveGateway,
      //   icon: 'mdi:axis-arrow',
      //   label: 'Inclusive',
      //   group: 'Gateway',
      //   order: 0
      // }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: () => {}
  },
  ConditionTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.conditionTask,
        icon: 'material-symbols:call-split',
        label: 'Condition Task',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return contextMenuComponentType.ConditionTask
    }
  },
  TransformTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.transformTask,
        icon: 'tabler:transform',
        label: 'Transform Task',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return contextMenuComponentType.TransformTask
    }
  },
  ValidateTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.validateTask,
        icon: 'material-symbols:list-alt-check-outline',
        label: 'Validate Task',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return 'LazyContextServiceTask'
    }
  },
  ServiceTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.subProcess,
        icon: 'pixelarticons:forwardburger',
        label: 'Sub Process',
        group: '',
        order: 0
      },
      {
        id: CellType.uploadFile,
        icon: 'material-symbols:upload-file-outline',
        label: 'Upload File',
        group: '',
        order: 0
      },
      {
        id: CellType.documentGenerationTask,
        icon: 'mdi:file-pdf',
        label: 'Document Generation Task',
        group: '',
        order: 0
      },
      {
        id: CellType.filingDocuments,
        icon: 'lucide-lab:cabinet-filing',
        label: 'Filing Documents Task',
        group: '',
        order: 0
      },
      {
        id: CellType.emailTask,
        icon: 'ic:outline-email',
        label: 'Email Task',
        group: '',
        order: 0
      },
      {
        id: CellType.HTTPTask,
        icon: 'mdi:web',
        label: 'HTTP Task',
        group: '',
        order: 0
      },
      {
        id: CellType.uniqueIdGenerator,
        icon: 'mdi:numeric',
        label: 'Unique Id Generator',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return 'LazyContextServiceTask'
    }
  },
  MessageTask: {
    embed: false,
    toolbar: [
      // {
      //   id: CellType.messageTask,
      //   icon: 'material-symbols:chat-outline',
      //   label: 'Message Task',
      //   group: '',
      //   order: 0
      // },
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return 'LazyContextServiceTask'
    }
  },
  HTTPRequestTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.insertDynamicDatabase,
        icon: 'mdi:database-arrow-left',
        label: 'Insert Dynamic Database',
        group: '',
        order: 0
      },
      {
        id: CellType.batchInsertDynamicDatabase,
        icon: 'mdi:database-arrow-left',
        label: 'Batch Insert Dynamic Database',
        group: '',
        order: 0
      },
      {
        id: CellType.updateDynamicDatabase,
        icon: 'mdi:database-edit',
        label: 'Update Dynamic Database',
        group: '',
        order: 0
      },
      {
        id: CellType.batchUpdateDynamicDatabase,
        icon: 'mdi:database-edit',
        label: 'Batch Update Dynamic Database',
        group: '',
        order: 0
      },
      {
        id: CellType.jsonEdit,
        icon: 'streamline-sharp:script-1',
        label: 'Http JSON Edit',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.type in contextMenuComponentType) {
        return contextMenuComponentType[workflowNodeItem.metadata.type as keyof typeof contextMenuComponentType]
      } else {
        return contextMenuComponentType['JSONEditor' as keyof typeof contextMenuComponentType]
      }
    }
  },
  ScriptTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.scriptTask,
        icon: 'streamline-sharp:script-1',
        label: 'Script Task',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.type in contextMenuComponentType) {
        return contextMenuComponentType[workflowNodeItem.metadata.type as keyof typeof contextMenuComponentType]
      } else {
        return contextMenuComponentType['JSONEditor' as keyof typeof contextMenuComponentType]
      }
    }
  }
}

const DEFAULT_TASK_EXECUTION = { async: false, timeout_ms: 5000, priority: 0 }
const LONG_RUNNING_EXECUTION = { async: false, timeout_ms: 12960000, priority: 1 }

function createNodeShell(
  id: string,
  title: string,
  paletteLabel: string,
  icon: string,
  width?: number,
  height?: number,
  bgColor: string = '#fff',
  textColor: string = '#000'
) {
  return {
    id: `${id}_${Date.now()}`,
    label: paletteLabel,
    width: width || 200,
    height: height || 64,
    shape: 'bpmn-node',
    attrs: GenAttrs(title, title, icon, bgColor, textColor),
    markup: GRAPH_NODE_MARKUP,
    ports: GenDefPorts()
  }
}

/**
 * Default graph element template.
 */
const workflowCellElementTemplate: CellTypeItem = {
  UserTask: {
    ...createNodeShell('New_UserTask', 'User Task', 'New User Task', '/workflowIcons/form.svg'),
    data: {
      id: '',
      name: 'New User Task',
      documentation: '',
      type: CellType.userTask,
      config: getTaskItemConfig[CellType.userTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.userTask,
        tags: WorkflowElementType.UserTask,
        icon: '/workflowIcons/form.svg',
        buttonSetting: {
          showSubmitButton: true,
          submitButtonLabel: 'Submit',
          showSaveDraft: false,
          saveDraftLabel: 'Save Draft',
          booleanButton: []
        }
      }
    }
  },
  SignatureTask: {
    ...createNodeShell('New_SignatureTask', 'Signature Task', 'New Signature Task', '/workflowIcons/signature.svg'),
    data: {
      id: '',
      name: 'New Signature Task',
      documentation: '',
      type: CellType.userTask,
      config: getTaskItemConfig[CellType.userTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.signatureTask,
        tags: WorkflowElementType.UserTask,
        icon: '/workflowIcons/signature.svg',
        buttonSetting: {
          showSubmitButton: true,
          submitButtonLabel: 'Submit',
          showSaveDraft: false,
          saveDraftLabel: 'Save Draft',
          booleanButton: []
        },
        signature: {
          documentTemplateId: '',
          signatureValue: ''
        }
      }
    }
  },
  ExclusiveGateway: {
    ...createNodeShell('New_ExclusiveGateway', 'Exclusive Gateway', 'New Exclusive Gateway', '/workflowIcons/condition.svg', 260, 64, '#ff8f31', '#fff'),
    data: {
      id: '',
      name: 'New Exclusive Gateway',
      documentation: '',
      type: CellType.exclusiveGateway,
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.exclusiveGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/workflowIcons/condition.svg',
        width: 250,
        bgColor: '#ff8f31',
        textColor: '#fff',
        maxOutgoing: 2
      }
    }
  },
  ParallelGateway: {
    ...createNodeShell('New_ParallelGateway', 'Parallel Gateway', 'New Parallel Gateway', '/workflowIcons/condition.svg', 260, 64, '#ff8f31', '#fff'),
    data: {
      id: '',
      name: 'New Parallel Gateway',
      documentation: '',
      type: CellType.parallelGateway,
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.parallelGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/workflowIcons/condition.svg',
        width: 250,
        bgColor: '#ff8f31',
        textColor: '#fff',
        maxOutgoing: 50
      }
    }
  },
  InclusiveGateway: {
    ...createNodeShell('New_InclusiveGateway', 'Inclusive Gateway', 'New Inclusive Gateway', '/workflowIcons/condition.svg', 260, 64, '#ff8f31', '#fff'),
    data: {
      id: '',
      name: 'New Inclusive Gateway',
      documentation: '',
      type: CellType.inclusiveGateway,
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.inclusiveGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/workflowIcons/condition.svg',
        width: 250,
        bgColor: '#ff8f31',
        textColor: '#fff',
        maxOutgoing: 50
      }
    }
  },
  ConditionTask: {
    ...createNodeShell('New_ConditionTask', 'Condition Task', 'New Condition Task', '/workflowIcons/condition.svg', 200, 64, '#0F2037', '#fff'),
    data: {
      id: '',
      name: 'New Condition Task',
      documentation: '',
      type: CellType.conditionTask,
      config: getTaskItemConfig[CellType.conditionTask],
      metadata: {
        type: CellType.conditionTask,
        tags: WorkflowElementType.ConditionTask,
        icon: '/workflowIcons/condition.svg',
        maxOutgoing: 2,
        width: 200,
        bgColor: '#0F2037',
        textColor: '#fff'
      }
    }
  },
  SubProcess: {
    ...createNodeShell('New_SubProcess', 'Sub Process', 'New Sub Process', '/workflowIcons/forwardburger.svg'),
    data: {
      id: '',
      name: 'New Sub Process',
      documentation: '',
      type: CellType.subProcess,
      config: getTaskItemConfig[CellType.subProcess],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.subProcess,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/forwardburger.svg'
      }
    }
  },
  ValidateTask: {
    ...createNodeShell('New_ValidateTask', 'Validate Task', 'Validate Task', '/workflowIcons/list-alt-check-outline.svg'),
    data: {
      id: '',
      name: 'New Validate Task',
      documentation: '',
      type: CellType.validateTask,
      config: getTaskItemConfig[CellType.validateTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.validateTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/list-alt-check-outline.svg'
      }
    }
  },
  TransformTask: {
    ...createNodeShell('New_TransformTask', 'Transform Task', 'New Transform Task', '/workflowIcons/transform.svg'),
    data: {
      id: '',
      name: 'New Transform Task',
      documentation: '',
      type: CellType.transformTask,
      config: getTaskItemConfig[CellType.transformTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.transformTask,
        tags: WorkflowElementType.TransformTask,
        icon: '/workflowIcons/transform.svg'
      }
    }
  },
  MessageTask: {
    ...createNodeShell('New_MessageTask', 'Message Task', 'New Message Task', '/workflowIcons/message.svg'),
    data: {
      id: '',
      name: 'New Message Task',
      documentation: '',
      type: CellType.messageTask,
      config: getTaskItemConfig[CellType.messageTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.messageTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/message.svg'
      }
    }
  },
  // Service Task
  UniqueIdGenerator: {
    ...createNodeShell('New_UniqueIdGenerator', 'Unique Id Generator', 'New Unique Id Generator', '/workflowIcons/numeric.svg'),
    data: {
      id: '',
      name: 'New Unique Id Generator',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      execution: { ...LONG_RUNNING_EXECUTION },
      config: getTaskItemConfig[CellType.uniqueIdGenerator],
      metadata: {
        type: CellType.uniqueIdGenerator,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/numeric.svg'
      }
    }
  },
  UploadFile: {
    ...createNodeShell('New_UploadFileTask', 'Upload File', 'New Upload File', '/workflowIcons/uploadFile.svg'),
    data: {
      id: '',
      name: 'New Upload File',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.uploadFile],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.uploadFile,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/uploadFile.svg'
      }
    }
  },
  DocumentGenerationTask: {
    ...createNodeShell('New_DocumentGenerationTask', 'Document Generation Task', 'New Document Generation Task', '/workflowIcons/document.svg', 260),
    data: {
      id: '',
      name: 'New Document Generation Task',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.documentGenerationTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.documentGenerationTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/document.svg',
        width: 250
      }
    }
  },
  FilingDocuments: {
    ...createNodeShell('New_FilingDocuments', 'Filing Documents Task', 'New Filing Documents Task', '/workflowIcons/cabinet-filing.svg', 260),
    data: {
      id: '',
      name: 'New Filing Documents Task',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.filingDocuments],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.filingDocuments,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/cabinet-filing.svg',
        width: 260
      }
    }
  },
  HTTPTask: {
    ...createNodeShell('New_HTTPTask', 'HTTP Task', 'New HTTP Task', '/workflowIcons/http-task.svg'),
    data: {
      id: '',
      name: 'New HTTP Task',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      execution: { ...LONG_RUNNING_EXECUTION },
      config: getTaskItemConfig[CellType.HTTPTask],
      metadata: {
        type: CellType.HTTPTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/http-task.svg'
      }
    }
  },
  InsertDynamicDatabase: {
    ...createNodeShell('New_InsertDynamicDatabase', 'Insert Dynamic Database', 'New Insert Dynamic Database', '/workflowIcons/insertDatabase.svg', 260),
    data: {
      id: '',
      name: 'New Insert Dynamic Database',
      documentation: '',
      execution: { ...LONG_RUNNING_EXECUTION },
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.insertDynamicDatabase],
      metadata: {
        type: CellType.insertDynamicDatabase,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/workflowIcons/insertDatabase.svg',
        width: 260,
        databaseId: ''
      }
    }
  },
  BatchInsertDynamicDatabase: {
    ...createNodeShell(
      'New_BatchInsertDynamicDatabase',
      'Batch Insert Dynamic Database',
      'New Batch Insert Dynamic Database',
      '/workflowIcons/insertDatabase.svg',
      280
    ),
    data: {
      id: '',
      name: 'New Batch Insert Dynamic Database',
      documentation: '',
      execution: { ...LONG_RUNNING_EXECUTION },
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.batchInsertDynamicDatabase],
      metadata: {
        type: CellType.batchInsertDynamicDatabase,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/workflowIcons/insertDatabase.svg',
        width: 280,
        databaseId: ''
      }
    }
  },
  UpdateDynamicDatabase: {
    ...createNodeShell('New_UpdateDynamicDatabase', 'Update Dynamic Database', 'New Update Dynamic Database', '/workflowIcons/updateDatabase.svg', 260),
    data: {
      id: '',
      name: 'New Update Dynamic Database',
      documentation: '',
      execution: { ...LONG_RUNNING_EXECUTION },
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.updateDynamicDatabase],
      metadata: {
        type: CellType.updateDynamicDatabase,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/workflowIcons/updateDatabase.svg',
        width: 260,
        databaseId: ''
      }
    }
  },
  BatchUpdateDynamicDatabase: {
    ...createNodeShell(
      'New_BatchUpdateDynamicDatabase',
      'Batch Update Dynamic Database',
      'New Batch Update Dynamic Database',
      '/workflowIcons/updateDatabase.svg',
      280
    ),
    data: {
      id: '',
      name: 'New Batch Update Dynamic Database',
      documentation: '',
      execution: { ...LONG_RUNNING_EXECUTION },
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.batchUpdateDynamicDatabase],
      metadata: {
        type: CellType.batchUpdateDynamicDatabase,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/workflowIcons/updateDatabase.svg',
        width: 280,
        databaseId: ''
      }
    }
  },
  EmailTask: {
    ...createNodeShell('New_EmailTask', 'Email Task', 'New Email Task', '/workflowIcons/email.svg'),
    data: {
      id: '',
      name: 'New Email Task',
      documentation: '',
      type: WorkflowElementType.ServiceTask,
      config: getTaskItemConfig[CellType.emailTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.emailTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/workflowIcons/email.svg'
      }
    }
  },
  ScriptTask: {
    ...createNodeShell('New_ScriptTask', 'Script Task', 'New Script Task', '/workflowIcons/script.svg'),
    data: {
      id: '',
      name: 'New Script Task',
      documentation: '',
      type: WorkflowElementType.ScriptTask,
      config: getTaskItemConfig[CellType.scriptTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.scriptTask,
        tags: WorkflowElementType.ScriptTask,
        icon: '/workflowIcons/script.svg'
      }
    }
  },
  JsonEdit: {
    ...createNodeShell('New_Http_Service', 'Http Service Task', 'New Http Service Task', '/workflowIcons/script.svg'),
    data: {
      id: '',
      name: 'New Http Service Task',
      documentation: '',
      type: WorkflowElementType.HTTPRequestTask,
      config: {},
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.jsonEdit,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/workflowIcons/script.svg'
      }
    }
  }
}

/**
 * Get the Workflow component.
 * 根據組件模板生成一個新的graph
 */
export const workflowCellElement = {
  getCellItem<K extends CellType>(key: K): CellTypeItem[K] {
    const id = `New_${key}_${Date.now()}`
    return {
      ...workflowCellElementTemplate[key],
      id: id,
      data: {
        ...workflowCellElementTemplate[key].data,
        id: id
      }
    } as CellTypeItem[K]
  }
}
