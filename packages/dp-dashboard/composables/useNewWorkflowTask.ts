export type NewWorkflowTaskRequest = {
  id: string
  data: any
}

export const useNewWorkflowTask = () => useState<NewWorkflowTaskRequest | null>('new-workflow-task', () => null)
