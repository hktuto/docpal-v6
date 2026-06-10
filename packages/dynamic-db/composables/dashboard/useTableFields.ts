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
      fields.filter((f: any) => {
        const bt = String(f.business_type || '')
        return bt === '2' || bt === 'number' ||
          bt === '12' || bt === 'rating' ||
          bt === '16' || bt === 'formula' ||
          bt === '27' || bt === 'aggVirtualColumn'
      })
    )
  }

  return {
    loading,
    getFields,
    getNumericFields
  }
}
