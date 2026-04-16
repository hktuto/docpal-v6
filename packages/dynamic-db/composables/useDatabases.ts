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




  return {
    loading,
    databases,
    getDatabases,
    deleteDatabase,
  }
}
