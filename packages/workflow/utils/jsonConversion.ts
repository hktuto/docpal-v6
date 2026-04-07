import { Graph } from '@antv/x6'
import { CellType, workflowElement, WorkflowElementType } from './workflowElement'

interface Flow {
  incoming: string[]
  outgoing: string[]
  join_type: string
  split_type: string
}

interface Execution {
  async: boolean
  timeout_ms: number
  priority: number
}

interface Config {
  trigger_type?: string
  result?: string
}

interface Markup {
  tagName: string
  selector: string
}

/**
 * node Style
 * @const tags 類型
 * @const x X坐標
 * @const y Y坐標
 * @const width graph的寬度
 * @const height graph的高度
 * @const icon graph的包含的Icon
 */
interface Metadata {
  tags?: string
  x: number
  y: number
  width: number
  height: number
  icon?: string
}

/**
 * Node base type. There are differences between tasks
 */
export interface NodeItem {
  id: string
  label: string
  name: string
  type: CellType
  flow: Flow
  execution: Execution
  config: Config
  metadata: Metadata
}

interface EdgeItem {
  id: string
  source_node_id: string
  target_node_id: string
  flow_control: {
    type: string
  }
}

interface Variable {
  [key: string]: {
    type: string
    required: boolean
  }
}

interface MetadataDetails {
  created_date: string
  version: string
  author: string
  purpose: string
  status: string
  tags: string[]
}

export interface WorkflowJson {
  id: string
  key: string
  name: string
  type: string
  version: number
  description: string
  nodes: NodeItem[]
  edges: EdgeItem[]
  variables: Variable
  metadata: MetadataDetails
}

export const x6NodeToWorkflowJson = function (graphProvider: any) {
  const graph: Graph = graphProvider.graph.value
  if (!graph) {
    throw new Error('graph is undefined')
  }
  const oldJson: WorkflowJson = graphProvider.workflowJson.value
  const workflowJson = JSON.parse(JSON.stringify(oldJson))

  const x6Nodes = graph.getNodes()
  const edges = graph.getEdges()
  console.log('-- x6Nodes: ', x6Nodes)
  console.log('-- edges: ', edges)
  // console.log('-- workflowJson: ', oldJson)

  const workflowConfig: any = graph.getCellById(workflowJson.id)
  if (!workflowConfig) {
    throw new Error('workflow Config is undefined')
  }
  // Update workflow name
  workflowJson.name = workflowConfig.data.name
  try {
    // Update edges
    if (edges.length === 0) {
      workflowJson.edges = []
    } else {
      const edgeList: any[] = []
      edges.forEach((item: any) => {
        if (!!item.data) {
          edgeList.push(item.data)
        }
      })
      workflowJson.edges = edgeList
    }

    // Update variables
    workflowJson.variables = workflowConfig.data.variables
    // Update Nodes
    const nodes: any[] = AddFlowForChildNodes(x6Nodes, workflowJson.edges)
    workflowJson.nodes = x6NodesToWorkflowJsonNodes(nodes)

    console.log('---- workflowJson', workflowJson)
    return workflowJson
  } catch (e) {
    console.log(e)
  }
}

export const workflowJsonToX6Node = function (workflowJson: WorkflowJson) {
  const cells: any = []

  workflowJson.nodes.forEach((nodeItem: NodeItem) => {
    const type = nodeItem.metadata.tags as WorkflowElementType
    if (type in workflowElement) {
      const graphData = workflowElement[type].workflowDataToGraphData(nodeItem)
      cells.push(graphData)
    }
  })

  // 不包含workflow id的node時創建, 該node用於存放variables
  if (!cells.find((node: any) => node.id === workflowJson.id)) {
    cells.push({
      id: workflowJson.id ? workflowJson.id : Date.now(),
      shape: 'invisible-node',
      label: workflowJson.name,
      type: 'process',
      data: {
        name: workflowJson.name,
        type: 'process',
        version: 0,
        variables: workflowJson.variables
      }
    })
  }

  return {
    cells
  }
}

function x6NodesToWorkflowJsonNodes(x6Nodes: any[]) {
  const nodes: any[] = []
  x6Nodes.forEach((x6Node: any) => {
    if (x6Node.data.type === 'process') return

    const { x, y } = x6Node.getPosition()
    const { width, height } = x6Node.getSize()
    nodes.push({
      ...x6Node.data,
      metadata: {
        ...x6Node.data.metadata,
        x: x,
        y: y,
        width: width,
        height: height
      }
    })
  })
  return nodes
}

function AddFlowForChildNodes(x6Nodes: any[], edges: any[]) {
  try {
    const flowMap = edges.reduce(
      (acc, item) => {
        if (!acc[item.target_node_id]) {
          acc[item.target_node_id] = { incoming: [], outgoing: [] }
        }
        acc[item.target_node_id].incoming.push(item.source_node_id)

        if (!acc[item.source_node_id]) {
          acc[item.source_node_id] = { incoming: [], outgoing: [] }
        }
        acc[item.source_node_id].outgoing.push(item.target_node_id)

        return acc
      },
      {} as Record<string, { incoming: string[]; outgoing: string[] }>
    )

    // 遍历节点并根据 flowMap 设置 flow 属性
    x6Nodes.forEach((x6Node: any) => {
      if (x6Node.data.type === 'process') return
      const { incoming = [], outgoing = [] } = flowMap[x6Node.id] || {}
      x6Node.data.flow = {
        incoming,
        outgoing,
        join_type: 'XOR',
        split_type: 'XOR'
      }
    })
    return x6Nodes
  } catch (e) {
    console.log(e)
  }
}
