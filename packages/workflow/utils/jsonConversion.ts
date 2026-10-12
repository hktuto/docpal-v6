import { Graph } from '@antv/x6'
import { CellType, getWorkflowElementTypeByCellType, workflowElement, WorkflowElementType } from './workflowElement'

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
  const workflowConfigData = workflowConfig.getData?.() ?? workflowConfig.data ?? {}
  // Update workflow name
  workflowJson.name = workflowConfigData.name
  try {
    // Update edges（从画布边同步 source/target/ports/vertices；缺字段时用旧 edges 回填）
    workflowJson.edges = x6EdgesToWorkflowJsonEdges(edges, workflowJson.edges)

    // Update variables（必须用 getData，避免读到过期的 data 快照）
    workflowJson.variables = workflowConfigData.variables ?? {}
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
  return getWorkflowElementTypeByCellType(type) || getWorkflowElementTypeByCellType(nodeItem.metadata?.type as string)
}

/**
 * 补齐缺失的 metadata，避免后端/外部 JSON 缺字段时整图转换中断
 */
function ensureNodeMetadata(nodeItem: NodeItem): NodeItem {
  const meta = nodeItem.metadata || ({} as Metadata)
  const taskType = (nodeItem.type || meta.type || CellType.jsonEdit) as string
  const metadataType: string = meta.type || taskType || CellType.jsonEdit

  const isGateway: boolean = GATEWAY_TYPES.has(taskType) || GATEWAY_TYPES.has(metadataType)
  const resolvedTags =
    (meta.tags && meta.tags in workflowElement ? meta.tags : null) ||
    getWorkflowElementTypeByCellType(metadataType) ||
    getWorkflowElementTypeByCellType(taskType) ||
    (isGateway ? WorkflowElementType.Gateway : WorkflowElementType.HTTPRequestTask)

  let maxOutgoing: number = meta.maxOutgoing ?? 3
  if (taskType === 'ExclusiveGateway' || taskType === 'ConditionTask' || metadataType === 'ExclusiveGateway' || metadataType === 'ConditionTask') {
    maxOutgoing = meta.maxOutgoing ?? 2
  } else if (
    taskType === 'ParallelGateway' ||
    taskType === 'InclusiveGateway' ||
    metadataType === 'ParallelGateway' ||
    metadataType === 'InclusiveGateway'
  ) {
    maxOutgoing = meta.maxOutgoing ?? 50
  }

  return {
    ...nodeItem,
    metadata: {
      ...meta,
      type: metadataType,
      tags: resolvedTags as WorkflowElementType,
      x: meta.x ?? 60,
      y: meta.y ?? 60,
      width: meta.width ?? (isGateway ? 200 : 120),
      height: meta.height ?? 64,
      icon: meta.icon ?? (isGateway ? '/workflowIcons/condition.svg' : undefined),
      bgColor: meta.bgColor ?? (isGateway ? '#ff8f31' : '#fff'),
      textColor: meta.textColor ?? (isGateway ? '#fff' : '#000'),
      maxOutgoing
    }
  }
}

export const workflowJsonToX6Node = function (workflowJson: WorkflowJson) {
  const cells: any = []

  ;(workflowJson.nodes || []).forEach((nodeItem: NodeItem) => {
    try {
      const normalizedNode = ensureNodeMetadata(nodeItem)
      const type = resolveWorkflowElementType(normalizedNode)
      if (type && type in workflowElement) {
        const graphData = workflowElement[type].workflowDataToGraphData(normalizedNode)
        if (graphData) cells.push(graphData)
      } else {
        console.warn('workflowJsonToX6Node: skip unknown node type', nodeItem?.id, nodeItem?.type, nodeItem?.metadata)
      }
    } catch (e) {
      console.error('workflowJsonToX6Node: failed to convert node', nodeItem?.id, e)
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

function x6EdgesToWorkflowJsonEdges(edges: any[], oldEdges: any[] = []) {
  const oldById = new Map((oldEdges || []).filter((e) => e?.id).map((e) => [e.id, e]))

  return edges
    .map((edge: any) => {
      const data = edge.getData?.() ?? edge.data
      if (!data || typeof data !== 'object') return null

      const sourceId = edge.getSourceCellId?.() ?? edge.source?.cell ?? data.source_node_id
      const targetId = edge.getTargetCellId?.() ?? edge.target?.cell ?? data.target_node_id
      if (!sourceId || !targetId) return null

      const sourcePort = edge.getSourcePortId?.() ?? edge.source?.port ?? data.metadata?.sourcePort
      const targetPort = edge.getTargetPortId?.() ?? edge.target?.port ?? data.metadata?.targetPort
      const vertices = edge.getVertices?.() ?? edge.vertices ?? data.metadata?.vertices ?? []
      const id = data.id || `edge-${edge.id}`
      const old = oldById.get(id)

      // 画布 data 残缺时用旧边业务字段回填，避免拖线后保存丢掉 flow_control 等
      return {
        ...(old || {}),
        ...data,
        id,
        source_node_id: sourceId,
        target_node_id: targetId,
        flow_control: data.flow_control ?? old?.flow_control,
        label: data.label ?? old?.label,
        metadata: {
          ...(old?.metadata || {}),
          ...(data.metadata || {}),
          sourcePort,
          targetPort,
          vertices
        }
      }
    })
    .filter(Boolean)
}

function x6NodesToWorkflowJsonNodes(x6Nodes: any[]) {
  const nodes: any[] = []
  x6Nodes.forEach((x6Node: any) => {
    // 拷贝后再删 version，避免直接 mutate 画布上的 node.data
    const data = { ...(x6Node.getData?.() ?? x6Node.data ?? {}) }
    if (data.type === 'process') return

    delete data.version

    const { x, y } = x6Node.getPosition()
    const { width, height } = x6Node.getSize()
    nodes.push({
      ...data,
      metadata: {
        ...(data.metadata || {}),
        x,
        y,
        width,
        height
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
