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

  const SYSTEM_DATE_FIELDS = [
    { field_name: 'createdTime', field_name_alias: 'Created At', business_type: '21', display_structure: {} },
    { field_name: 'lastModifiedTime', field_name_alias: 'Updated At', business_type: '22', display_structure: {} }
  ]

  async function loadFields(tableId: string) {
    if (tableId) {
      const apiFields = await getFields(tableId)
      const hasCreatedTime = apiFields.some((f: any) => f.field_name === 'createdTime' || f.business_type === '21')
      const hasLastModifiedTime = apiFields.some((f: any) => f.field_name === 'lastModifiedTime' || f.business_type === '22')
      const injected = [
        ...(hasCreatedTime ? [] : [SYSTEM_DATE_FIELDS[0]]),
        ...(hasLastModifiedTime ? [] : [SYSTEM_DATE_FIELDS[1]])
      ]
      fields.value = [...apiFields, ...injected]
    } else {
      fields.value = []
    }
  }

  const numericFields = computed(() =>
    fields.value.filter((f: any) => {
      const bt = String(f.business_type || '')
      return bt === '2' || bt === 'number' ||
        bt === '12' || bt === 'rating' ||
        bt === '16' || bt === 'formula' ||
        bt === '27' || bt === 'aggVirtualColumn'
    })
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
