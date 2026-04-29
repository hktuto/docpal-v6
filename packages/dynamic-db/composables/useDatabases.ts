import type { DatabaseItem } from "../utils/databaseType"
import { newClientApi } from 'api'

export const useDatabases = () => {
  const databases = shallowRef<DatabaseItem[]>([])
  const loading = ref(false)

  /**
   * Get all workspaces (case types)
   */
  async function getDatabases(params: any = { pageNum: 0, pageSize: 100 }): Promise<DatabaseItem[]> {
    loading.value = true
    // TODO: need to add pagination
    try {
      const {
        data: { entryList, totalSize }
      }: any = await newClientApi.postDynamicDbCaseTypesPage(params)
      databases.value = entryList
      return entryList
    } finally {
      loading.value = false
    }
  }

  async function deleteDatabase(id: string): Promise<boolean> {
    const { data }: any = await newClientApi.deleteDynamicDbCaseTypesId(id)
    if(!data) {
      throw new Error('Failed to delete workspace')
    }
    databases.value = databases.value.filter((workspace) => workspace.id !== id)
    return data
  }

  async function createDatabase(workspace: Partial<any>): Promise<any> {
    const now = new Date().toISOString()
    const currentUserId = workspace.createdBy || useUserId()
    if (workspace.name == null || workspace.name === '') {
      throw new Error('Workspace name is required')
    }
    const dto: any = {
      name: workspace.name,
      type: 'case_type',
      description: workspace.description ?? undefined,
    }
    if (workspace.icon) {
      dto.metadata = {
        icon: workspace.icon
      }
    }
    const { data }: any = await newClientApi.postDynamicDbCaseTypes(dto)

    databases.value = [...databases.value, data]

    return data
  }




  return {
    loading,
    databases,
    getDatabases,
    deleteDatabase,
    createDatabase,
  }
}
