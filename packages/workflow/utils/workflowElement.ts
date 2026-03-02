import { Cell, CellView, Graph } from '@antv/x6'

export enum WorkflowElementType {
  StartEvent = 'StartEvent',
  EndEvent = 'EndEvent',
  UserTask = 'UserTask',
  exclusiveGateway = 'exclusiveGateway',
  serviceTask = 'serviceTask',
  boundaryEvent = 'boundaryEvent',
  scriptTask = 'scriptTask',
  sequenceFlow = 'sequenceFlow'
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
    workflowDataToGraphData: (workflowNodeItem: any) => {}
    clickHandler: (args: { node: Cell; view: Cell }) => void
    contextMenuComponent?: string | Function
    validator?: (args: {
      attr_name: string,
      attr_id: string,
      extensionElements?: any,
      [key: string]: any
    }) => Promise<boolean>
  }
}


export const workflowElement: WorkflowElement = {
  StartEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: any) => {
      const graph = {
        id: workflowNodeItem.id,
        type: workflowNodeItem.type,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: {
          body: {
            stroke: '#ddd',
            strokeWidth: 1,
            fill: '#fff',
            rx: 8,
            ry: 8,
            refWidth: 1,
            refHeight: 1,
            filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.2))'
          },
          image: {
            'xlink:href': '/bpmn/icons/close.svg',
            width: 24,
            height: 24,
            x: 12,
            y: 12
          },
          title: {
            text: workflowNodeItem.name.split(/(?=[A-Z])/).join(' '),
            refX: 46,
            refY: 12,
            fill: '#000',
            fontSize: 14,
            fontWeight: 'bold',
            'text-anchor': 'start'
          },
          text: {
            refX: 46,
            refY: 30,
            fontSize: 12,
            fill: '#000',
            textAnchor: 'start',
            textVerticalAnchor: 'top',
            textWrap: {
              width: -52, // 宽度减少 10px
              height: '70%', // 高度减少 10px
              ellipsis: true,  // 文本超出显示范围时，自动添加省略号
              breakWord: false // 是否截断单词
            }
          }
        },
        shape: '',
        view: '',
        zIndex: 1,
        visible: true,
        parent: '',
        children: [],
        tools: [],
        data: {}
      }

      // if (!!workflowNodeItem.metadata) {
      //   graph
      // }


      return graph
    },
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextStartEvent'
  },
  EndEvent: {
    embed: false,
    toolbar: [],
    workflowDataToGraphData: (workflowNodeItem: any) => {
      const graph = {
        id: workflowNodeItem.id,
        type: workflowNodeItem.type,
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'image', selector: 'image' },
          { tagName: 'text', selector: 'title' },
          { tagName: 'text', selector: 'text' }
        ],
        attrs: {
          body: {
            stroke: '#ddd',
            strokeWidth: 1,
            fill: '#fff',
            rx: 8,
            ry: 8,
            refWidth: 1,
            refHeight: 1,
            filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.2))'
          },
          image: {
            'xlink:href': '/bpmn/icons/close.svg',
            width: 24,
            height: 24,
            x: 12,
            y: 12
          },
          title: {
            text: workflowNodeItem.name.split(/(?=[A-Z])/).join(' '),
            refX: 46,
            refY: 12,
            fill: '#000',
            fontSize: 14,
            fontWeight: 'bold',
            'text-anchor': 'start'
          },
          text: {
            refX: 46,
            refY: 30,
            fontSize: 12,
            fill: '#000',
            textAnchor: 'start',
            textVerticalAnchor: 'top',
            textWrap: {
              width: -52, // 宽度减少 10px
              height: '70%', // 高度减少 10px
              ellipsis: true,  // 文本超出显示范围时，自动添加省略号
              breakWord: false // 是否截断单词
            }
          }
        },
        shape: '',
        view: '',
        zIndex: 1,
        visible: true,
        parent: '',
        children: [],
        tools: [],
        data: {}
      }
      return graph
    },
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextEndEvent'
  }
  // UserTask: {}
}