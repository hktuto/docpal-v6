import { ElMessage } from 'element-plus'
import { workflowElement } from './workflowElement'

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
 */
interface Metadata {
  x?: string
  y?: string
  width: string
  height: string
  icon: string
  attrs: {
    body: any
    image: any
    title: any
    text: any
  }
  markup: Markup[]
  shape: 'bpmn-node'
  ports: {
    items: []
  }
}

interface Node {
  id: string
  name: string
  type: string
  flow: Flow
  execution: Execution
  config: Config
  metadata?: Metadata
}

interface Edge {
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

interface WorkflowJson {
  id: string
  key: string
  name: string
  type: string
  version: number
  description: string
  nodes: Node[]
  edges: Edge[]
  variables: Variable
  metadata: MetadataDetails
}

export const workflowJsonToX6Node = function(workflowJson: WorkflowJson) {
  const result = {
    nodes: [],
    edges: []
  } as {
    nodes: any[]
    edges: any[]
  }

  workflowJson.nodes.forEach((nodeItem: Node) => {
    const type = nodeItem.type
    const graphData = workflowElement[type].workflowDataToGraphData(nodeItem)
    result.nodes.push(graphData)
  })
  // Set edges
  result.edges = workflowJson.edges

  return result
}
