import type { Cell, Edge, Graph, Node } from '@antv/x6'

export const WORKFLOW_PROVIDER: InjectionKey<WorkflowProvider> = Symbol('WORKFLOW_PROVIDER_KEY')
export interface WorkflowProvider {
  init: (workflowJson: any) => void
  graph: Ref<Graph | undefined>
  graphJson: Ref<any | {}>
  workflowJson: Ref<any | {}>
  flatGraphObject: any
  allFormField: Ref<any>
  key: symbol
}

export const WORKFLOW_EDITOR_PROVIDER: InjectionKey<WorkflowEditorProvider> = Symbol('Workflow_EDITOR_PROVIDER_KEY')
export interface WorkflowEditorProvider {
  graph: Ref<Graph | undefined>
  workflowJson: Ref<any | {}>
  openSidebar: (component: string, node: Node | Edge | Cell) => void
  pasteForm: (node:Node) => void,
  copyForm: (node:Node, obj:any) => void
  copyKey: Ref<string | undefined>
  readonly: Ref<boolean>,
  getFormByNode: (node:Node) => Promise<Object>,
}
