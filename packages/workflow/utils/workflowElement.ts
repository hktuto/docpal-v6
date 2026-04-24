import { Cell, CellView, Graph } from '@antv/x6'
import type { NodeItem } from './jsonConversion'
import { getServiceTaskItemConfig } from '@packages/workflow/utils/serviceTaskItemConfig'

export enum WorkflowElementType {
  StartEvent = 'StartEvent',
  EndEvent = 'EndEvent',
  UserTask = 'UserTask',
  Gateway = 'Gateway',
  ServiceTask = 'ServiceTask',
  HTTPRequestTask = 'HTTPRequestTask'
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
  uniqueIdGenerator = 'UniqueIdGenerator',
  documentGenerationTask = 'DocumentGenerationTask',

  // Service
  conditionTask = 'ConditionTask',
  serviceTask = 'ServiceTask',
  messageTask = 'MessageTask',
  uploadFile = 'UploadFile',
  subProcess = 'SubProcess',
  validateTask = 'ValidateTask',
  filingDocuments = 'FilingDocuments'
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
  // Http Task
  HTTPTask = 'LazyContextHttpTask',
  TransformTask = 'LazyContextTransformTask',
  UniqueIdGenerator = 'LazyContextUniqueIdGenerator',
  // Service
  ConditionTask = 'LazyContextServiceTaskCondition',
  ValidateTask = 'LazyContextServiceTaskValidate',
  MessageTask = 'LazyContextServiceTaskMessage',
  UploadFile = 'LazyContextServiceTaskUploadFile',
  SubProcess = 'LazyContextServiceTaskSubProcess',
  DocumentGenerationTask = 'LazyContextServiceTaskDocumentGeneration',
  FilingDocuments = 'LazyContextServiceTaskFilingDocuments'
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
      type: CellType
      label: string
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
        formKey?: string
        width?: number
        buttonSetting?: any
        booleanButton?: any[]
        rules?: any
        maxOutgoing?: number
        signature?: any
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
    validator?: (args: { attr_name: string; attr_id: string; extensionElements?: any; [key: string]: any }) => Promise<boolean>
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

/** 畫布節點通用 rect+image+text markup（workflowJson 轉圖與工具欄模板共用） */
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
  title: string,
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

  return {
    id: workflowNodeItem.id,
    markup: GRAPH_NODE_MARKUP,
    attrs: GenAttrs(title, workflowNodeItem.label, metadata.icon, bgColor, textColor),
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
      graphItemFromWorkflowNode(workflowNodeItem, 'Start Event', {
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
      graphItemFromWorkflowNode(workflowNodeItem, 'End Event', {
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
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const title = workflowNodeItem.metadata.type === CellType.signatureTask ? 'User Signature Task' : 'User Task'
      return graphItemFromWorkflowNode(workflowNodeItem, title)
    },
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
      {
        id: CellType.exclusiveGateway,
        icon: 'mdi:call-split',
        label: 'Exclusive',
        group: 'Gateway',
        order: 0
      },
      {
        id: CellType.parallelGateway,
        icon: 'mdi:axis-arrow',
        label: 'Parallel',
        group: 'Gateway',
        order: 0
      },
      {
        id: CellType.inclusiveGateway,
        icon: 'mdi:axis-arrow',
        label: 'Inclusive',
        group: 'Gateway',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem, workflowNodeItem.name),
    clickHandler: () => {},
    contextMenuComponent: () => {}
  },
  ServiceTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.conditionTask,
        icon: '/icons/condition.svg',
        label: 'Condition Task',
        group: '',
        order: 0
      },
      {
        id: CellType.subProcess,
        icon: 'pixelarticons:forwardburger',
        label: 'Sub Process',
        group: '',
        order: 0
      },
      {
        id: CellType.validateTask,
        icon: 'material-symbols:list-alt-check-outline',
        label: 'Validate Task',
        group: '',
        order: 0
      },
      {
        id: CellType.transformTask,
        icon: 'tabler:transform',
        label: 'Transform Task',
        group: '',
        order: 0
      },
      {
        id: CellType.messageTask,
        icon: 'material-symbols:chat-outline',
        label: 'Message Task',
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
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem, workflowNodeItem.name),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      return 'LazyContextServiceTask'
    }
  },
  HTTPRequestTask: {
    embed: false,
    toolbar: [
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
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => graphItemFromWorkflowNode(workflowNodeItem, workflowNodeItem.name),
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.type in contextMenuComponentType) {
        return contextMenuComponentType[workflowNodeItem.metadata.type as keyof typeof contextMenuComponentType]
      }
    }
  }
}

const DEFAULT_TASK_EXECUTION = { async: false, timeout_ms: 1000, priority: 0 }
const LONG_RUNNING_EXECUTION = { async: false, timeout_ms: 6000, priority: 1 }

function createNodeShell(
  id: string,
  title: string,
  paletteLabel: string,
  icon: string,
  width?: number,
  height?: number,
  bgColor? = '#fff',
  textColor? = '#000'
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
    ...createNodeShell('New_UserTask', 'User Task', 'New User Task', '/icons/form.svg'),
    data: {
      id: '',
      name: 'User Task',
      label: 'New User Task',
      documentation: '',
      type: CellType.userTask,
      inputSchema: '',
      outputSchema: '',
      config: {
        assignee: '',
        candidate_roles: [],
        candidate_groups: []
        // due_date: '',
        // input_mapping: {},
        // output_mapping: {}
      },
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.userTask,
        tags: WorkflowElementType.UserTask,
        icon: '/icons/form.svg',
        formKey: '',
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
    ...createNodeShell('New_SignatureTask', 'Signature Task', 'Signature Task', '/icons/form.svg'),
    data: {
      id: '',
      name: 'Signature Task',
      label: 'New Signature Task',
      documentation: '',
      type: CellType.userTask,
      inputSchema: '',
      outputSchema: '',
      config: {
        assignee: '',
        candidate_roles: [],
        candidate_groups: []
        // due_date: '',
        // input_mapping: {},
        // output_mapping: {}
      },
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.signatureTask,
        tags: WorkflowElementType.UserTask,
        icon: '/icons/form.svg',
        formKey: '',
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
    ...createNodeShell('New_ExclusiveGateway', 'Exclusive Gateway', 'New Exclusive Gateway', '/icons/condition.svg', 260, 64, '#c9ffb3', '#fff'),
    data: {
      id: '',
      name: 'Exclusive Gateway',
      label: 'New Exclusive Gateway',
      documentation: '',
      type: CellType.exclusiveGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.exclusiveGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        bgColor: '#c9ffb3',
        textColor: '#fff',
        maxOutgoing: 2
      }
    }
  },
  ParallelGateway: {
    ...createNodeShell('New_ParallelGateway', 'Parallel Gateway', 'New Parallel Gateway', '/icons/condition.svg', 260, 64, '#c9ffb3', '#fff'),
    data: {
      id: '',
      name: 'Parallel Gateway',
      label: 'New Parallel Gateway',
      documentation: '',
      type: CellType.parallelGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.parallelGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        bgColor: '#c9ffb3',
        textColor: '#fff',
        maxOutgoing: 50
      }
    }
  },
  InclusiveGateway: {
    ...createNodeShell('New_InclusiveGateway', 'Inclusive Gateway', 'New Inclusive Gateway', '/icons/condition.svg', 260, 64, '#c9ffb3', '#fff'),
    data: {
      id: '',
      name: 'Inclusive Gateway',
      label: 'New Inclusive Gateway',
      documentation: '',
      type: CellType.inclusiveGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.inclusiveGateway,
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        bgColor: '#c9ffb3',
        textColor: '#fff',
        maxOutgoing: 50
      }
    }
  },
  // Http Task
  HTTPTask: {
    ...createNodeShell('New_HTTPTask', 'HTTP Task', 'New HTTP Task', '/icons/http-task.svg'),
    data: {
      id: '',
      name: 'HTTP Task',
      label: 'New HTTP Task',
      documentation: '',
      type: CellType.HTTPTask,
      execution: { ...DEFAULT_TASK_EXECUTION },
      config: {
        method: 'GET',
        url: '',
        headers: {},
        body: {},
        output_mapping: {}
      },
      metadata: {
        type: CellType.HTTPTask,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/icons/http-task.svg'
      },
      celCondition: '',
      inputSchema: '',
      outputSchema: ''
    }
  },
  UniqueIdGenerator: {
    ...createNodeShell('New_UniqueIdGenerator', 'Unique Id Generator', 'New Unique Id Generator', '/icons/numeric.svg'),
    data: {
      id: '',
      name: 'Unique Id Generator',
      label: 'New Unique Id Generator',
      documentation: '',
      type: CellType.uniqueIdGenerator,
      execution: { ...DEFAULT_TASK_EXECUTION },
      config: getServiceTaskItemConfig[CellType.uniqueIdGenerator],
      metadata: {
        type: CellType.uniqueIdGenerator,
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/icons/numeric.svg'
      }
    }
  },
  // Service Task
  SubProcess: {
    ...createNodeShell('New_SubProcess', 'Sub Process', 'New Sub Process', '/icons/forwardburger.svg'),
    data: {
      id: '',
      name: 'New Sub Process',
      label: 'New Sub Process',
      documentation: '',
      type: CellType.subProcess,
      config: getServiceTaskItemConfig[CellType.subProcess],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.subProcess,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/forwardburger.svg'
      }
    }
  },
  ValidateTask: {
    ...createNodeShell('New_ValidateTask', 'Validate Task', 'Validate Task', '/icons/list-alt-check-outline.svg'),
    data: {
      id: '',
      name: 'Validate Task',
      label: 'New Validate Task',
      documentation: '',
      type: CellType.validateTask,
      config: getServiceTaskItemConfig[CellType.validateTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        type: CellType.validateTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/list-alt-check-outline.svg'
      }
    }
  },
  TransformTask: {
    ...createNodeShell('New_TransformTask', 'Transform Task', 'New Transform Task', '/icons/transform.svg'),
    data: {
      id: '',
      name: 'Transform Task',
      label: 'New Transform Task',
      documentation: '',
      type: CellType.transformTask,
      implementation: 'data.transform',
      config: {
        mapping: {}
      },
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.transformTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/transform.svg'
      }
    }
  },
  MessageTask: {
    ...createNodeShell('New_MessageTask', 'Message Task', 'New Message Task', '/icons/message.svg'),
    data: {
      id: '',
      name: 'Message Task',
      label: 'New Message Task',
      documentation: '',
      type: CellType.messageTask,
      config: getServiceTaskItemConfig[CellType.messageTask],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.messageTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/message.svg'
      }
    }
  },
  UploadFile: {
    ...createNodeShell('New_UploadFileTask', 'Upload File', 'New Upload File', '/icons/uploadFile.svg'),
    data: {
      id: '',
      name: 'Upload File',
      label: 'New Upload File',
      documentation: '',
      type: CellType.uploadFile,
      config: getServiceTaskItemConfig[CellType.uploadFile],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.uploadFile,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/uploadFile.svg'
      }
    }
  },
  DocumentGenerationTask: {
    ...createNodeShell('New_DocumentGenerationTask', 'Document Generation Task', 'New Document Generation Task', '/icons/document.svg', 260),
    data: {
      id: '',
      name: 'Document Generation Task',
      label: 'New Document Generation Task',
      documentation: '',
      type: CellType.documentGenerationTask,
      config: getServiceTaskItemConfig[CellType.documentGenerationTask],
      input_mapping: {},
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.documentGenerationTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/document.svg',
        width: 250
      }
    }
  },
  FilingDocuments: {
    ...createNodeShell('New_FilingDocuments', 'Filing Documents Task', 'New Filing Documents Task', '/icons/cabinet-filing.svg', 260),
    data: {
      id: '',
      name: 'Filing Documents Task',
      label: 'New Filing Documents Task',
      documentation: '',
      type: CellType.serviceTask,
      config: getServiceTaskItemConfig[CellType.filingDocuments],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        type: CellType.filingDocuments,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/cabinet-filing.svg',
        width: 260
      }
    }
  },
  ServiceTask: {
    ...createNodeShell('New_ServiceTask', 'Service Task', 'New Service Task', '/icons/form.svg', 260),
    data: {
      id: '',
      name: 'Service Task',
      label: 'New Service Task',
      documentation: '',
      type: CellType.serviceTask,
      config: {},
      metadata: {
        type: CellType.serviceTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/form.svg'
      }
    }
  },
  ConditionTask: {
    ...createNodeShell('New_ConditionTask', 'Condition Task', 'New Condition Task', '/icons/condition.svg', 200, 64, '#0F2037', '#fff'),
    data: {
      id: '',
      name: 'Condition Task',
      label: 'New Condition Task',
      documentation: '',
      type: CellType.conditionTask,
      config: getServiceTaskItemConfig[CellType.conditionTask],
      metadata: {
        type: CellType.conditionTask,
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/condition.svg',
        maxOutgoing: 2,
        width: 200,
        bgColor: '#0F2037',
        textColor: '#fff',
        graphLabel: {
          successLabel: 'Success',
          failureLabel: 'Failure'
        }
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
