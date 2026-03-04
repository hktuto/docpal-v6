import type { Cell, Edge, Graph, Node } from '@antv/x6'

export const WORKFLOW_PROVIDER: InjectionKey<WorkflowProvider> = Symbol('WORKFLOW_PROVIDER_KEY')
export interface WorkflowProvider {
  init: (workflowJson: any) => void
  graph: Ref<Graph | undefined>
  graphJson: Ref<any | {}>
  flatGraphObject: any
  allFormField: Ref<any>
  key: symbol
}

export const WORKFLOW_EDITOR_PROVIDER: InjectionKey<EditorProvider> = Symbol('Workflow_EDITOR_PROVIDER_KEY')
export interface EditorProvider {
  openSidebar: (component: string, node: Node | Edge | Cell) => void
  variables: Ref<any>
  readonly: Ref<boolean>
}
