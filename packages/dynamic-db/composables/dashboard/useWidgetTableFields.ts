import { useTableFields } from './useTableFields'
import { useSingleDatabaseContext } from '../useSignleDatabase'

export function useWidgetTableFields() {
  const { menuState } = useSingleDatabaseContext()
  const { getFields, loading: fieldsLoading } = useTableFields()

  const tableOptions = computed(() => {
    const items = menuState.value.items || []
    const tables: any[] = []
    function collect(items: any[]) {
      for (const item of items) {
        if (item.item_type === 'master_table' && item.item_id) tables.push(item)
        if (item.children?.length) collect(item.children)
      }
    }
    collect(items)
    return tables
  })

  const fields = ref<any[]>([])

  async function loadFields(tableId: string) {
    if (tableId) {
      fields.value = await getFields(tableId)
    } else {
      fields.value = []
    }
  }

  const numericFields = computed(() =>
    fields.value.filter((f: any) =>
      f.business_type === '2' || f.business_type === 'number' ||
      f.business_type === '12' || f.business_type === 'rating' ||
      f.business_type === '16' || f.business_type === 'formula'
    )
  )

  const dateFields = computed(() =>
    fields.value.filter((f: any) =>
      f.business_type === '5' || f.business_type === 'date' ||
      f.business_type === '21' || f.business_type === 'createdTime' ||
      f.business_type === '22' || f.business_type === 'lastModifiedTime'
    )
  )

  const categoricalFields = computed(() =>
    fields.value.filter((f: any) => !numericFields.value.includes(f))
  )

  function getFieldLabel(fieldName: string): string {
    const field = fields.value.find((f: any) => f.field_name === fieldName)
    return field?.field_name_alias || fieldName
  }

  function isDateField(fieldName: string): boolean {
    return dateFields.value.some((f: any) => f.field_name === fieldName)
  }

  return {
    tableOptions,
    fields,
    fieldsLoading,
    loadFields,
    numericFields,
    dateFields,
    categoricalFields,
    getFieldLabel,
    isDateField
  }
}
