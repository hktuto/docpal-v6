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
  async function getRelationPickerOptions() {
    const params: any = {}
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
  async function getFields(tableId: string) {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId, userId: 'master' })
    const tableFields = res.data.tableFields
    return tableFields
      .filter((field: any) => displayFieldIds.includes(field.id))
      .map((field: any) => ({
        id: field.id,
        name: field.field_name,
        label: field.field_name_alias,
        type: field.business_type
      }))
  }
  onMounted(async () => {
    fields.value = await getFields(tableId)
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
  const conditions: any[] = [
    {
      type: 'OR',
      value: []
    }
  ]
  const LIKE_FIELDS = [ColumnFieldType.Text, ColumnFieldType.MultiText, ColumnFieldType.Email, ColumnFieldType.URL, ColumnFieldType.Phone, ColumnFieldType.User]
  fields.forEach((field: any) => {
    if (!!key) {
      if (LIKE_FIELDS.includes(field.type)) {
        conditions[0].value.push({
          column: field.name,
          type: 'LIKE',
          value: `%${key}%`
        })
      }
    }
  })
  return conditions[0].value.length > 0 ? conditions : null
}
