import type { WorkspaceType } from '../utils/db/schema/workspaces';
import type { WorkspaceSchema } from '../utils/db/schema/workspaces.zod'

export const SingleWorkspaceContextKey: InjectionKey<WorkspaceContext> = Symbol('SingleWorkspaceContext')

export interface WorkspaceContext {
  workspace: Ref<WorkspaceType | null>
  menuActionsRef: Ref<any | null>
  getWorkspaceById: (id: string) => Promise<void>
  saveWorkspaceToDb: (workspace: WorkspaceType) => Promise<void>
  openMenuItemActions: (data: {item: MenuItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) => void
}

export function useSingleWorkspaceContext() {
  const context = inject(SingleWorkspaceContextKey)
  if (!context) {
    throw new Error('SingleWorkspaceContext is not provided')
  }
  return context
}

export function useSingleWorkspace() {
  const { query } = usePglite()
  const workspace = ref<WorkspaceType | null>(null)
  const menuActionsRef = ref()
  function openMenuItemActions(data: {item: MenuItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) {
    
    menuActionsRef.value?.open(data, target, highlight)
  }
  async function getWorkspaceById(id: string) {
    const data = await query(`SELECT * FROM workspaces WHERE id = $1`, [id])
    if(!data || data.length === 0) {
      workspace.value = null
      return
    }
    console.log('menuActionsRef', data[0])
    workspace.value =  data[0] as WorkspaceType
  }

  async function saveWorkspaceToDb(workspace: WorkspaceType) {
    await query(`UPDATE workspaces SET name = $1, slug = $2, icon = $3, description = $4 WHERE id = $5`, [workspace.name, workspace.slug, workspace.icon, workspace.description, workspace.id])
  }

  provide(SingleWorkspaceContextKey, {
    workspace,
    menuActionsRef,
    getWorkspaceById,
    saveWorkspaceToDb,
    openMenuItemActions,
  })

  return {
    getWorkspaceById,
    saveWorkspaceToDb,
    workspace,
    menuActionsRef,
    openMenuItemActions
  }
}
