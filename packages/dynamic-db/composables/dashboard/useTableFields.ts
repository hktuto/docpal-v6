import { newClientApi } from 'api'

const cache = new Map<string, any[]>()

export function useTableFields() {
  const loading = ref(false)

  async function getFields(tableId: string): Promise<any[]> {
    if (cache.has(tableId)) {
      return cache.get(tableId) || []
    }
    loading.value = true
    try {
      const data: any = await newClientApi.getDocpalMasterTableUserConfig({
        tableId,
        userId: 'master'
      })
      const fields = data?.data?.tableFields || []
      cache.set(tableId, fields)
      return fields
    } catch (error) {
      console.error('Failed to fetch table fields:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  function getNumericFields(tableId: string): Promise<any[]> {
    return getFields(tableId).then((fields) =>
      fields.filter((f: any) => f.business_type === '2' || f.business_type === 'number')
    )
  }

  return {
    loading,
    getFields,
    getNumericFields
  }
}
