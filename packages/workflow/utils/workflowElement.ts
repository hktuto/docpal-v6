import { Cell, CellView, Graph } from '@antv/x6'
import type { NodeItem } from './jsonConversion'

export enum WorkflowElementType {
  StartEvent = 'StartEvent',
  EndEvent = 'EndEvent',
  Gateway = 'Gateway',
  UserTask = 'UserTask',
  HTTPTask = 'HTTPTask'
  // exclusiveGateway = 'exclusiveGateway',
  // ServiceTask = 'serviceTask',
  // boundaryEvent = 'boundaryEvent',
  // scriptTask = 'scriptTask',
  // sequenceFlow = 'sequenceFlow'
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
  exclusive = 'ExclusiveGateway',
  parallel = 'ParallelGateway',
  inclusive = 'InclusiveGateway',
  HTTPTask = 'HTTPTask'
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
      type: WorkflowElementType
      label: string
      documentation: string
      inputSchema?: string
      outputSchema?: string
      config?: any
      execution?: {
        async: boolean
        timeout_ms: number
        priority: number
      }
      metadata: {
        tags: CellType
        formKey?: string
        buttonSetting?: any
        booleanButton?: any[]
        rules?: any
      }
    }
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
 */
function GenAttrs(title: string, textAnchor: string, icon?: string) {
  return {
    text: {
      fontSize: 12,
      fill: '#000',
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
      fill: '#fff',
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
      fill: '#000',
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
 * Node => workflowElement
 * Cell => Element Item
 */
export const workflowElement: WorkflowElement = {
  StartEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const node: GraphItem = {
        id: workflowNodeItem.id,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: GenAttrs('Start Event', workflowNodeItem.name, workflowNodeItem.metadata.icon),
        shape: 'bpmn-node',
        zIndex: 1,
        visible: true,
        position: {
          x: workflowNodeItem.metadata.x || 60,
          y: workflowNodeItem.metadata.y || 60
        },
        size: {
          width: workflowNodeItem.metadata.width || 120,
          height: workflowNodeItem.metadata.height || 64
        },
        data: {
          ...workflowNodeItem,
          version: 0
        },
        ports: {
          items: [
            {
              id: 'to',
              group: 'to'
            }
          ]
        },
        _order: 0
      }
      return node
    },
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextStartEvent'
  },
  EndEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const graph: GraphItem = {
        id: workflowNodeItem.id,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: GenAttrs('End Event', workflowNodeItem.name, workflowNodeItem.metadata.icon),
        shape: 'bpmn-node',
        zIndex: 1,
        visible: true,
        position: {
          x: workflowNodeItem.metadata.x || 60,
          y: workflowNodeItem.metadata.y || 60
        },
        size: {
          width: workflowNodeItem.metadata.width || 120,
          height: workflowNodeItem.metadata.height || 64
        },
        data: {
          ...workflowNodeItem,
          version: 0
        },
        ports: {
          items: [
            {
              id: 'from',
              group: 'from'
            }
          ]
        },
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextEndEvent'
  },
  Gateway: {
    embed: false,
    toolbar: [
      {
        id: CellType.exclusive,
        icon: 'mdi:call-split',
        label: 'Exclusive',
        group: 'Gateway',
        order: 0
      },
      {
        id: CellType.parallel,
        icon: 'mdi:axis-arrow',
        label: 'Parallel',
        group: 'Gateway',
        order: 0
      },
      {
        id: CellType.inclusive,
        icon: 'mdi:axis-arrow',
        label: 'Inclusive',
        group: 'Gateway',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      let title
      switch (workflowNodeItem.metadata.tags) {
        case 'ParallelGateway':
          title = 'Parallel Gateway'
          break
        case 'InclusiveGateway':
          title = 'Inclusive Gateway'
          break
        default:
          title = 'Exclusive Gateway'
      }

      const attrs = GenAttrs(title, workflowNodeItem.name, workflowNodeItem.metadata.icon)

      const graph: GraphItem = {
        id: workflowNodeItem.id,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: attrs,
        shape: 'bpmn-node',
        zIndex: 1,
        visible: true,
        position: {
          x: workflowNodeItem.metadata.x || 60,
          y: workflowNodeItem.metadata.y || 60
        },
        size: {
          width: workflowNodeItem.metadata.width || 120,
          height: workflowNodeItem.metadata.height || 64
        },
        data: {
          ...workflowNodeItem
        },
        ports: GenDefPorts(),
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {}
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
      let title = 'User Task'
      if (workflowNodeItem.metadata.tags === 'SignatureTask') {
        title = 'User Signature Task'
      }
      const attrs = GenAttrs(title, workflowNodeItem.name, workflowNodeItem.metadata.icon)

      const graph: GraphItem = {
        id: workflowNodeItem.id,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: attrs,
        shape: 'bpmn-node',
        zIndex: 1,
        visible: true,
        position: {
          x: workflowNodeItem.metadata.x || 60,
          y: workflowNodeItem.metadata.y || 60
        },
        size: {
          width: workflowNodeItem.metadata.width || 120,
          height: workflowNodeItem.metadata.height || 64
        },
        data: {
          ...workflowNodeItem
        },
        ports: GenDefPorts(),
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (workflowNodeItem.metadata.tags === 'SignatureTask') {
        return 'LazyContextSignature'
      }
      return 'LazyContextUserTask'
    }
  },
  // ServiceTask: {
  //
  // },
  HTTPTask: {
    embed: false,
    toolbar: [
      {
        id: CellType.HTTPTask,
        icon: 'mdi:web',
        label: 'HTTP Task',
        group: '',
        order: 0
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const graph: GraphItem = {
        id: workflowNodeItem.id,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: GenAttrs('HTTP Task', workflowNodeItem.name, workflowNodeItem.metadata.icon),
        shape: 'bpmn-node',
        zIndex: 1,
        visible: true,
        position: {
          x: workflowNodeItem.metadata.x || 60,
          y: workflowNodeItem.metadata.y || 60
        },
        size: {
          width: workflowNodeItem.metadata.width || 120,
          height: workflowNodeItem.metadata.height || 64
        },
        data: {
          ...workflowNodeItem
        },
        ports: GenDefPorts(),
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: () => {
      return 'ContextHttpTask'
    }
  }
}

// #region toolbar
/**
 * Default graph element template.
 */
const workflowCellElementTemplate: CellTypeItem = {
  UserTask: {
    id: `New_UserTask_${Date.now()}`,
    label: 'User Task',
    width: 200,
    height: 64,
    shape: 'bpmn-node',
    attrs: GenAttrs('User Task', 'User Task', '/icons/form.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New User Task',
      label: 'New User Task',
      documentation: '',
      type: WorkflowElementType.UserTask,
      inputSchema: '',
      outputSchema: '',
      config: {
        formKey: '',
        assignee: '',
        candidate_roles: [],
        candidate_groups: [],
        due_date: '',
        input_mapping: {},
        output_mapping: {}
      },
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      metadata: {
        tags: CellType.userTask,
        formKey: '',
        buttonSetting: {},
        booleanButton: []
      }
    }
  },
  SignatureTask: {
    id: `New_SignatureTask_${Date.now()}`,
    label: 'Signature Task',
    shape: 'bpmn-node',
    width: 200,
    height: 64,
    attrs: GenAttrs('Signature Task', 'Signature Task', '/icons/form.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New Signature Task',
      label: 'New Signature Task',
      documentation: '',
      type: WorkflowElementType.UserTask,
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
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      metadata: {
        tags: CellType.signatureTask,
        formKey: '',
        buttonSetting: {},
        booleanButton: []
      }
    }
  },
  ExclusiveGateway: {
    id: `New_ExclusiveGateway_${Date.now()}`,
    label: 'Exclusive Gateway',
    shape: 'custom-polygon',
    width: 200,
    height: 64,
    attrs: GenAttrs('Exclusive Gateway', 'Exclusive Gateway', '/icons/form.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New Exclusive Gateway',
      label: 'New Exclusive Gateway',
      documentation: '',
      type: WorkflowElementType.Gateway,
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      metadata: {
        tags: CellType.exclusive,
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
        }
      }
    }
  },
  ParallelGateway: {
    id: `New_ParallelGateway_${Date.now()}`,
    label: 'Parallel Gateway',
    shape: 'custom-polygon',
    width: 200,
    height: 64,
    attrs: GenAttrs('Parallel Gateway', 'Parallel Gateway', '/icons/a.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New Parallel Gateway',
      label: 'New Parallel Gateway',
      documentation: '',
      type: WorkflowElementType.Gateway,
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      metadata: {
        tags: CellType.parallel
      }
    }
  },
  InclusiveGateway: {
    id: `New_InclusiveGateway_${Date.now()}`,
    label: 'Inclusive Gateway',
    shape: 'custom-polygon',
    width: 200,
    height: 64,
    attrs: GenAttrs('Inclusive Gateway', 'Inclusive Gateway', '/icons/form.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New Inclusive Gateway',
      label: 'New Inclusive Gateway',
      documentation: '',
      type: WorkflowElementType.Gateway,
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      metadata: {
        tags: CellType.inclusive
      }
    }
  },
  HTTPTask: {
    id: `New_HTTPTask_${Date.now()}`,
    label: 'HTTP Task',
    shape: 'bpmn-node',
    width: 200,
    height: 64,
    attrs: GenAttrs('HTTP Task', 'HTTP Task', '/icons/http-task.svg'),
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'image' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'text' }
    ],
    ports: {
      items: [
        { id: 'from', group: 'from' },
        { id: 'to', group: 'to' },
        { id: 'left', group: 'left' },
        { id: 'right', group: 'right' }
      ]
    },
    data: {
      id: '',
      name: 'New HTTP Task',
      label: 'New HTTP Task',
      documentation: '',
      type: WorkflowElementType.HTTPTask,
      execution: { async: false, timeout_ms: 1000, priority: 0 },
      config: {
        method: 'GET',
        url: '',
        headers: {},
        body: {},
        output_mapping: {},
        celCondition: {},
        inputSchema: {},
        outputSchema: {}
      },
      metadata: {
        tags: CellType.HTTPTask
      }
    }
  }
}

/**
 * Get the Workflow component.
 * 根據組件模板生成一個新的graph
 */
export const workflowCellElement = {
  ...workflowCellElementTemplate,
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
// #endregion
