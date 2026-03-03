import { Cell, CellView, Graph } from '@antv/x6'
import type { NodeItem } from './jsonConversion'

export enum WorkflowElementType {
  StartEvent = 'StartEvent',
  EndEvent = 'EndEvent',
  UserTask = 'UserTask'
  // exclusiveGateway = 'exclusiveGateway',
  // ServiceTask = 'serviceTask',
  // boundaryEvent = 'boundaryEvent',
  // scriptTask = 'scriptTask',
  // sequenceFlow = 'sequenceFlow'
}

export type WorkflowElement = {
  [key in WorkflowElementType]: {
    embed?: boolean
    embeddingValidateRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    connectable?: boolean
    connectRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    toolbar: {
      icon: string
      label: string
      group: string
      order: number
      dropData: any
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

interface Graph {
  id: string
  markup: Markup[]
  attrs: Attrs
  shape: string
  zIndex: number
  visible: boolean
  position: Position
  size: Size
  data: any
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

/**
 * Node => workflowElement
 * Cell => Element Item
 */
export const workflowElement: WorkflowElement = {
  StartEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const graph: Graph = {
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
          id: workflowNodeItem.id,
          name: workflowNodeItem.name,
          type: workflowNodeItem.type,
          version: 0
        },
        _order: 0
      }

      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextStartEvent'
  },
  EndEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      const graph: Graph = {
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
          id: workflowNodeItem.id,
          name: workflowNodeItem.name,
          type: workflowNodeItem.type,
          version: 0
        },
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: 'LazyContextEndEvent'
  },
  UserTask: {
    embed: false,
    toolbar: [
      {
        icon: 'bpmn:form',
        label: 'UserForm',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          label: 'New User Task',
          data: {}
        })
      },
      {
        icon: 'bpmn:signature',
        label: 'User Signature Task',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          label: 'New Signature',
          data: {}
        })
      }
    ],
    workflowDataToGraphData: (workflowNodeItem: NodeItem) => {
      let title = 'User Task'
      if (!!workflowNodeItem.metadata.tags && workflowNodeItem.metadata.tags === 'signature') {
        title = 'User Signature Task'
      }
      const attrs = GenAttrs(title, workflowNodeItem.name, workflowNodeItem.metadata.icon)

      const graph: Graph = {
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
          id: workflowNodeItem.id,
          name: workflowNodeItem.name,
          type: workflowNodeItem.type,
          version: 0
        },
        _order: 0
      }
      return graph
    },
    clickHandler: () => {},
    contextMenuComponent: (workflowNodeItem: NodeItem) => {
      if (!!workflowNodeItem.metadata.tags && workflowNodeItem.metadata.tags === 'signature') {
        return 'LazyContextSignature'
      }
      return 'LazyContextUserTask'
    }
  }
  // ServiceTask: {
  //
  // }
}
