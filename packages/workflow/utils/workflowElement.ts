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
  // Gateway
  ExclusiveGateway = 'LazyContextExclusiveGateway',
  ParallelGateway = 'LazyContextParallelGateway',
  InclusiveGateway = 'LazyContextInclusiveGateway',
  // Http Task
  HTTPTask = 'LazyContextHttpTask',
  TransformTask = 'LazyContextTransformTask',
  UniqueIdGenerator = 'LazyContextUniqueIdGenerator',
  // Service
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
        tags: WorkflowElementType
        icon: string
        formKey?: string
        width?: number
        buttonSetting?: any
        booleanButton?: any[]
        rules?: any
        maxOutgoing?: number
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
    defaultWidth?: number
    defaultHeight?: number
    ports?: { items: portsItems[] }
    dataExtra?: Record<string, unknown>
  }
): GraphItem {
  const meta = workflowNodeItem.metadata
  const dw = options?.defaultWidth ?? 120
  const dh = options?.defaultHeight ?? 64
  return {
    id: workflowNodeItem.id,
    markup: GRAPH_NODE_MARKUP,
    attrs: GenAttrs(title, workflowNodeItem.label, workflowNodeItem.metadata.icon),
    shape: 'bpmn-node',
    zIndex: 1,
    visible: true,
    position: {
      x: meta.x || 60,
      y: meta.y || 60
    },
    size: {
      width: meta.width || dw,
      height: meta.height || dh
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
      }
      // {
      //   id: CellType.signatureTask,
      //   label: 'User Signature Task',
      //   icon: 'lucide:user-round-pen',
      //   group: '',
      //   order: 0
      // }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const title = workflowNodeItem.type === CellType.signatureTask ? 'User Signature Task' : 'User Task'
      return graphItemFromWorkflowNode(workflowNodeItem, title)
    },
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.tags === CellType.signatureTask) {
        return 'LazyContextSignature'
      }
      return 'LazyContextUserTask'
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
    workflowDataToGraphData: (workflowNodeItem: NodeItem) =>
      graphItemFromWorkflowNode(workflowNodeItem, workflowNodeItem.name, {
        defaultWidth: workflowNodeItem.metadata.width
      }),
    clickHandler: () => {},
    contextMenuComponent: () => {}
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
        id: CellType.validateTask,
        icon: 'material-symbols-light:list-alt-check-outline',
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
      if (workflowNodeItem.type in contextMenuComponentType) {
        return contextMenuComponentType[workflowNodeItem.type as keyof typeof contextMenuComponentType]
      }
    }
  }
}

export function getUrlOrigin() {
  return 'https://sit-v3.wclsolution.com'
  // return window?.location?.origin || ''
}

const DEFAULT_TASK_EXECUTION = { async: false, timeout_ms: 1000, priority: 0 }
const LONG_RUNNING_EXECUTION = { async: false, timeout_ms: 6000, priority: 1 }

interface ShellOpts {
  id: string
  paletteLabel: string
  title?: string
  icon: string
  width?: number
  height?: number
}

function createNodeShell(opts: ShellOpts) {
  const { id, paletteLabel, title = paletteLabel, icon, width = 200, height = 64 } = opts
  return {
    id: `${id}_${Date.now()}`,
    label: paletteLabel,
    width,
    height,
    shape: 'bpmn-node',
    attrs: GenAttrs(title, title, icon),
    markup: GRAPH_NODE_MARKUP,
    ports: GenDefPorts()
  }
}

function createGatewayShell(id: string, title: string, icon: string, width?: number, height?: number) {
  return {
    id: `${id}${Date.now()}`,
    label: title,
    width: width || 200,
    height: height || 64,
    // shape: 'custom-polygon',
    shape: 'bpmn-node',
    attrs: GenAttrs(title, title, icon, '#0F2037', '#fff'),
    markup: GRAPH_NODE_MARKUP,
    ports: GenDefPorts()
  }
}

/**
 * Default graph element template.
 */
const workflowCellElementTemplate: CellTypeItem = {
  UserTask: {
    ...createNodeShell({ id: 'New_UserTask', paletteLabel: 'User Task', icon: '/icons/form.svg' }),
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
        tags: WorkflowElementType.UserTask,
        icon: '/icons/form.svg',
        formKey: '',
        buttonSetting: {
          showSumBitButton: true,
          submitButtonLabel: 'Submit',
          showSaveDraft: false,
          saveDraftLabel: 'Save Draft'
        },
        booleanButton: []
      }
    }
  },
  SignatureTask: {
    ...createNodeShell({ id: 'New_SignatureTask', paletteLabel: 'Signature Task', icon: '/icons/form.svg' }),
    data: {
      id: '',
      name: 'Signature Task',
      label: 'New Signature Task',
      documentation: '',
      type: CellType.signatureTask,
      inputSchema: '',
      outputSchema: '',
      config: {
        assignee: '',
        candidate_roles: [],
        candidate_groups: [],
        due_date: '',
        input_mapping: {},
        output_mapping: {}
      },
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.UserTask,
        icon: '/icons/form.svg',
        formKey: '',
        buttonSetting: {},
        booleanButton: []
      }
    }
  },
  ExclusiveGateway: {
    ...createGatewayShell('New_ExclusiveGateway', 'New Exclusive Gateway', '/icons/condition.svg', 260),
    data: {
      id: '',
      name: 'Exclusive Gateway',
      label: 'New Exclusive Gateway',
      documentation: '',
      type: CellType.exclusiveGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        rules: {
          success: {
            label: 'success',
            condition: {},
            style: ''
          },
          failure: {
            label: 'failure',
            condition: {},
            style: ''
          }
        },
        maxOutgoing: 2
      }
    }
  },
  ParallelGateway: {
    ...createGatewayShell('New_ParallelGateway', 'Parallel Gateway', '/icons/condition.svg', 260),
    data: {
      id: '',
      name: 'Parallel Gateway',
      label: 'New Parallel Gateway',
      documentation: '',
      type: CellType.parallelGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        maxOutgoing: 50
      }
    }
  },
  InclusiveGateway: {
    ...createGatewayShell('New_InclusiveGateway', 'Inclusive Gateway', '/icons/condition.svg', 260),
    data: {
      id: '',
      name: 'Inclusive Gateway',
      label: 'New Inclusive Gateway',
      documentation: '',
      type: CellType.inclusiveGateway,
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.Gateway,
        icon: '/icons/condition.svg',
        width: 250,
        maxOutgoing: 50
      }
    }
  },
  // Http Task
  HTTPTask: {
    ...createNodeShell({ id: 'New_HTTPTask', title: 'HTTP Task', paletteLabel: 'HTTP Task', icon: '/icons/http-task.svg' }),
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
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/icons/http-task.svg'
      },
      celCondition: '',
      inputSchema: '',
      outputSchema: ''
    }
  },
  UniqueIdGenerator: {
    ...createNodeShell({ id: 'New_UniqueIdGenerator', title: 'Unique Id Generator', paletteLabel: 'New Unique Id Generator', icon: '/icons/form.svg' }),
    data: {
      id: '',
      name: 'Unique Id Generator',
      label: 'New Unique Id Generator',
      documentation: '',
      type: CellType.uniqueIdGenerator,
      execution: { ...DEFAULT_TASK_EXECUTION },
      config: {
        method: 'POST',
        url: `${getUrlOrigin()}/api/dms/facade/id-template/generate`,
        headers: generatorHTTPRequestTaskHeaders(),
        body: {
          templateId: '',
          variables: {}
        },
        output_mapping: {}
      },
      metadata: {
        tags: WorkflowElementType.HTTPRequestTask,
        icon: '/icons/transform.svg'
      }
    }
  },
  // Service Task
  SubProcess: {
    ...createNodeShell({ id: 'New_SubProcess', title: 'Sub Process', paletteLabel: 'New Sub Process', icon: '/icons/form.svg' }),
    data: {
      id: '',
      name: 'New Sub Process',
      label: 'New Sub Process',
      documentation: '',
      type: CellType.subProcess,
      config: getServiceTaskItemConfig[CellType.subProcess],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/transform.svg'
      }
    }
  },
  ValidateTask: {
    ...createNodeShell({ id: 'New_ValidateTask', title: 'Validate Task', paletteLabel: 'Validate Task', icon: '/icons/form.svg' }),
    data: {
      id: '',
      name: 'Validate Task',
      label: 'New Validate Task',
      documentation: '',
      type: CellType.validateTask,
      config: getServiceTaskItemConfig[CellType.validateTask],
      execution: { ...LONG_RUNNING_EXECUTION },
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/form.svg'
      }
    }
  },
  TransformTask: {
    ...createNodeShell({ id: 'New_TransformTask', title: 'Transform Task', paletteLabel: 'New Transform Task', icon: '/icons/transform.svg' }),
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
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/transform.svg'
      }
    }
  },
  MessageTask: {
    ...createNodeShell({ id: 'New_MessageTask', title: 'Message Task', paletteLabel: 'New Message Task', icon: '/icons/message.svg' }),
    data: {
      id: '',
      name: 'Message Task',
      label: 'New Message Task',
      documentation: '',
      type: CellType.messageTask,
      config: getServiceTaskItemConfig[CellType.messageTask],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/message.svg'
      }
    }
  },
  UploadFile: {
    ...createNodeShell({ id: 'New_UploadFileTask', title: 'Upload File', paletteLabel: 'New Upload File', icon: '/icons/uploadFile.svg' }),
    data: {
      id: '',
      name: 'Upload File',
      label: 'New Upload File',
      documentation: '',
      type: CellType.uploadFile,
      config: getServiceTaskItemConfig[CellType.uploadFile],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/uploadFile.svg'
      }
    }
  },
  DocumentGenerationTask: {
    ...createNodeShell({
      id: 'New_DocumentGenerationTask',
      title: 'Document Generation Task',
      paletteLabel: 'New Document Generation Task',
      icon: '/icons/document.svg',
      width: 260
    }),
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
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/document.svg',
        width: 250
      }
    }
  },
  FilingDocuments: {
    ...createNodeShell({
      id: 'New_FilingDocuments',
      title: 'Filing Documents Task',
      paletteLabel: 'New Filing Documents Task',
      icon: '/icons/form.svg',
      width: 260
    }),
    data: {
      id: '',
      name: 'Filing Documents Task',
      label: 'New Filing Documents Task',
      documentation: '',
      type: CellType.filingDocuments,
      config: getServiceTaskItemConfig[CellType.filingDocuments],
      execution: { ...DEFAULT_TASK_EXECUTION },
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/form.svg',
        width: 250
      }
    }
  },
  ServiceTask: {
    ...createNodeShell({ id: 'New_ServiceTask', paletteLabel: 'New Service Task', icon: '/icons/form.svg', width: 260 }),
    data: {
      id: '',
      name: 'Service Task',
      label: 'New Service Task',
      documentation: '',
      type: CellType.serviceTask,
      config: {},
      metadata: {
        tags: WorkflowElementType.ServiceTask,
        icon: '/icons/form.svg'
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

// TODO get config setting
function generatorHTTPRequestTaskHeaders() {
  return {
    ServerName: 'docpal-api',
    ServerKey: '14ecdf56081AGSDghw',
    'x-api-key': 'bf77bd45b0a82691b911054d2f9ca50d3b70dc964782b419456e7fdd9ddc0a5ca19b0638d42662a0e22c4734ce8d787c',
    'Content-Type': 'application/json'
  }
}
