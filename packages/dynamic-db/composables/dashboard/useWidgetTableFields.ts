import { useTableFields } from './useTableFields'
import { useSingleDatabaseContext } from '../useSignleDatabase'

const SYSTEM_DATE_FIELD_NAMES: Record<string, string> = {
  createdTime: 'created_at',
  lastModifiedTime: 'updated_at'
}

const SYSTEM_DATE_FIELD_NAMES_BY_TYPE: Record<string, string> = {
  '21': 'created_at',
  '22': 'updated_at'
}

export function normalizeSystemDateFieldName(fieldName: string): string {
  return SYSTEM_DATE_FIELD_NAMES[fieldName] ?? fieldName
}

export function normalizeSystemDateField(field: any) {
  const systemFieldName = SYSTEM_DATE_FIELD_NAMES_BY_TYPE[String(field?.business_type ?? '')]
  const fieldName = systemFieldName ?? normalizeSystemDateFieldName(field?.field_name)
  return fieldName === field?.field_name ? field : { ...field, field_name: fieldName }
}

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
    { field_name: 'created_at', field_name_alias: 'Created At', business_type: '21', display_structure: {} },
    { field_name: 'updated_at', field_name_alias: 'Updated At', business_type: '22', display_structure: {} }
  ]

  async function loadFields(tableId: string) {
    if (tableId) {
      const apiFields = await getFields(tableId)
      const normalizedApiFields = apiFields.map(normalizeSystemDateField)
      const hasCreatedTime = normalizedApiFields.some((f: any) => f.field_name === 'created_at' || f.business_type === '21')
      const hasLastModifiedTime = normalizedApiFields.some((f: any) => f.field_name === 'updated_at' || f.business_type === '22')
      const injected = [
        ...(hasCreatedTime ? [] : [SYSTEM_DATE_FIELDS[0]]),
        ...(hasLastModifiedTime ? [] : [SYSTEM_DATE_FIELDS[1]])
      ]
      fields.value = [...normalizedApiFields, ...injected]
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
    const normalizedFieldName = normalizeSystemDateFieldName(fieldName)
    const field = fields.value.find((f: any) => f.field_name === normalizedFieldName)
    return field?.field_name_alias || normalizedFieldName
  }

  function isDateField(fieldName: string): boolean {
    const normalizedFieldName = normalizeSystemDateFieldName(fieldName)
    return dateFields.value.some((f: any) => f.field_name === normalizedFieldName)
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
