import { newClientApi, postDynamicActions } from 'api'
import { ColumnFieldType } from '../../types/column-types'
export const useRelationPicker = (tableId: string, displayFieldIds: string[]) => {
  const options = ref<any[]>([])
  const fields = ref<any[]>([]) // 不允许子组件修改fields，否则会导致options和fields不一致
  const searchKeyword = ref('')
  const pageParams = ref<any>({
    pageSize: 100,
    pageNum: 1
  })
  const viewTools: any = inject('viewTools')

  async function getRelationPickerOptions() {
    const params: any = {}
    console.log('fields', fields.value,searchKeyword.value)
    const filterRules = getFilterRules(searchKeyword.value, fields.value)
    if (filterRules) {
      params.conditions = filterRules
    }
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      pagination: pageParams.value,
      ...params
    })
    options.value = data.data
  }
  function getFields(tableId: string) {
    const _fields: any[] = []
    displayFieldIds.forEach((displayFieldId: string) => {
      const relationFieldConfig = viewTools?.getRelationFieldConfig(tableId, displayFieldId)
      _fields.push({
        ...relationFieldConfig,
        id: displayFieldId,
      })
    })
    return _fields
  }
  onMounted(async () => {
    fields.value = getFields(tableId)
    getRelationPickerOptions()
    console.log('fields', fields.value)
  })
  return {
    options,
    fields,
    searchKeyword,
    refresh: getRelationPickerOptions
  }
}
function getFilterRules(key: string, fields: any[]) {
  console.log('fields', fields,key)
  const conditions: any[] = [
    {
      type: 'OR',
      value: []
    }
  ]
  const LIKE_FIELDS = [ColumnFieldType.Text, ColumnFieldType.MultiText, ColumnFieldType.Email, ColumnFieldType.URL, ColumnFieldType.Phone, ColumnFieldType.User]
  fields.forEach((field: any) => {
    if (!!key) {
      if (LIKE_FIELDS.includes(field.business_type)) {
        conditions[0].value.push({
          column: field.field_name,
          type: 'LIKE',
          value: `%${key}%`
        })
      }
    }
  })
  return conditions[0].value.length > 0 ? conditions : null
}
