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

/**
 * node Style
 * @const type 類型
 * @const tags 標簽
 * @const x X坐標
 * @const y Y坐標
 * @const width graph的寬度
 * @const height graph的高度
 * @const icon graph的包含的Icon
 */
interface Metadata {
  type: string
  tags: WorkflowElementType
  x: number
  y: number
  width: number
  height: number
  icon?: string
  bgColor?: string
  textColor?: string
  formKey?: string
  buttonSetting?: any
  signature?: any
  rules?: any
  maxOutgoing?: number
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

export const x6NodeToWorkflowJson = function (graph: Graph, oldJson: WorkflowJson) {
  const workflowJson = JSON.parse(JSON.stringify(oldJson))

  const x6Nodes = graph.getNodes()
  const edges = graph.getEdges()
  console.log('-- x6Nodes: ', x6Nodes)
  console.log('-- edges: ', edges)

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
    workflowJson.nodes = x6NodesToWorkflowJsonNodes(addFlowForChildNodes(x6Nodes, workflowJson.edges) || [])
    workflowJson.version += 1

    console.log('---- workflowJson', workflowJson)
    return workflowJson
  } catch (e) {
    console.log(e)
  }
}

const GATEWAY_TYPES = new Set(['ParallelGateway', 'ExclusiveGateway', 'InclusiveGateway', 'Gateway'])

function resolveWorkflowElementType(nodeItem: NodeItem): WorkflowElementType | null {
  const tags = nodeItem.metadata?.tags
  if (tags && tags in workflowElement) {
    return tags as WorkflowElementType
  }

  const type = (nodeItem.type || nodeItem.metadata?.type) as string
  if (GATEWAY_TYPES.has(type)) {
    return WorkflowElementType.Gateway
  }
  if (type && type in workflowElement) {
    return type as WorkflowElementType
  }
  return null
}

/**
 * 补齐缺失的 metadata，避免后端/外部 JSON 缺字段时整图转换中断
 */
function ensureNodeMetadata(nodeItem: NodeItem): NodeItem {
  const taskType: CellType = nodeItem.type
  const metadataType: string = nodeItem.metadata?.type || CellType.jsonEdit

  const isGateway: boolean = GATEWAY_TYPES.has(taskType)
  const tags = (nodeItem.metadata?.tags || (isGateway ? WorkflowElementType.Gateway : WorkflowElementType.HTTPRequestTask)) as WorkflowElementType

  let maxOutgoing: number = 3
  if (taskType === 'ExclusiveGateway' || taskType === 'ConditionTask') maxOutgoing = 2
  else if (taskType === 'ParallelGateway' || taskType === 'InclusiveGateway') maxOutgoing = 50

  // 手動配置的node
  let x6Node: NodeItem = {
    ...nodeItem,
    metadata: {
      ...nodeItem.metadata,
      type: metadataType,
      tags: tags,
      x: 60,
      y: 60,
      width: isGateway ? 200 : 120,
      height: 64,
      icon: isGateway ? '/workflowIcons/condition.svg' : undefined,
      bgColor: isGateway ? '#ff8f31' : '#fff',
      textColor: isGateway ? '#fff' : '#000',
      maxOutgoing
    }
  }

  // 已存在的 TaskNode
  if (metadataType === 'StartEvent' || metadataType === 'EndEvent' || Object.values(CellType).includes(metadataType as CellType)) {
    x6Node = { ...nodeItem }
  }

  return x6Node
}

export const workflowJsonToX6Node = function (workflowJson: WorkflowJson) {
  const cells: any = []

  workflowJson.nodes.forEach((nodeItem: NodeItem) => {
    const normalizedNode = ensureNodeMetadata(nodeItem)
    const type = resolveWorkflowElementType(normalizedNode)
    if (type && type in workflowElement) {
      const graphData = workflowElement[type].workflowDataToGraphData(normalizedNode)
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

    if ('version' in x6Node.data) {
      delete x6Node.data.version
    }

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

function addFlowForChildNodes(x6Nodes: any[], edges: any[]) {
  try {
    const flowMap = edges.reduce(
      (acc, edge) => {
        const { source_node_id: src, target_node_id: tgt } = edge

        if (!acc[src]) acc[src] = { incoming: [], outgoing: [], rawEdges: [] }
        if (!acc[tgt]) acc[tgt] = { incoming: [], outgoing: [], rawEdges: [] }

        acc[tgt].incoming.push(src)
        acc[src].outgoing.push(tgt)

        acc[src].rawEdges.push(edge)

        return acc
      },
      {} as Record<string, { incoming: string[]; outgoing: string[]; rawEdges: any[] }>
    )

    return x6Nodes.map((node) => {
      const nodeData = node.data || {}
      if (nodeData.type === 'process') return node

      const nodeId = node.id
      const meta = node.getData()?.metadata || {}
      const flows = flowMap[nodeId] || { incoming: [], outgoing: [], rawEdges: [] }

      let finalOutgoing: string[] = flows.outgoing

      // 處理 conditionTask 的特殊排序邏輯
      if (meta.type === CellType.conditionTask) {
        if (flows.rawEdges.length > 0) {
          const successEdge: any = flows.rawEdges.find((e: any) => e.metadata?.conditionStatus === 'success')
          const failureEdge: any = flows.rawEdges.find((e: any) => e.metadata?.conditionStatus === 'failure')

          finalOutgoing = [successEdge?.target_node_id ?? '', failureEdge?.target_node_id ?? '']
        }
      }

      node.updateData(
        {
          flow: {
            incoming: flows.incoming,
            outgoing: finalOutgoing,
            join_type: joinType(nodeData.type),
            split_type: 'XOR'
          }
        },
        { ignoreHistory: true }
      )

      return node
    })
  } catch (e) {
    console.error('AddFlowForChildNodes Error:', e)
    return x6Nodes
  }
}

function joinType(type: string) {
  switch (type) {
    case CellType.parallelGateway:
      return 'AND'
    case CellType.inclusiveGateway:
      return 'XOR'
    default:
      return 'XOR'
  }
}

export function workflowResponseHelper(res: any) {
  if (!res || !res.data || (res.data.code !== 200 && res.data.code !== 201)) throw Error(res.data.message || res.data.data.err_resp || 'server error')
  return res.data.data
}
