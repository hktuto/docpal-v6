import { workflowElement, WorkflowElementType } from './workflowElement'

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
 * @const tags 子類型  User Task => [User Task, Signature Task]. Server Task => ['Document Task', 'Email Task', ...]
 * @const x X坐標
 * @const y Y坐標
 * @const width graph的寬度
 * @const height graph的高度
 * @const icon graph的包含的Icon
 */
interface Metadata {
  tags?: 'signature' | 'document'
  x: number
  y: number
  width: number
  height: number
  icon?: string
}

export interface NodeItem {
  id: string
  label: string
  name: string
  type: string
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

export const x6NodeToWorkflowJson = function (x6NodeJson: any) {
  const workflowJson = {
    id: '',
    name: '',
    type: ''
  }

  return workflowJson
}

export const workflowJsonToX6Node = function (workflowJson: WorkflowJson) {
  const cells: any = []

  workflowJson.nodes.forEach((nodeItem: NodeItem) => {
    const type = nodeItem.type as WorkflowElementType
    if (type in workflowElement) {
      const graphData = workflowElement[type].workflowDataToGraphData(nodeItem)
      cells.push(graphData)
    }
  })

  // 不包含workflow id的node時創建, 該node用於存放variables
  if (!cells.find((node: any) => node.id === workflowJson.id)) {
    cells.push({
      id: workflowJson.id,
      shape: 'invisible-node',
      label: workflowJson.name,
      type: 'process',
      data: {
        name: workflowJson.name,
        version: 0,
        variables: workflowJson.variables
      }
    })
  }

  return {
    cells
  }
}
