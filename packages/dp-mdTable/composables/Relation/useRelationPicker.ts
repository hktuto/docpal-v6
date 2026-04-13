import { newClientApi, postDynamicActions } from 'api'
export const useRelationPicker = (tableId: string, displayFieldIds: string[]) => {
  const options = ref<any[]>([])
  const fields = ref<any[]>([]) // 不允许子组件修改fields，否则会导致options和fields不一致
  const searchKeyword = ref('')
  const pageParams = ref<any>({
    pageSize: 100,
    pageNum: 1
  })
  async function getRelationPickerOptions(tableId: string) {
    const { data } = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      pagination: pageParams.value
    })
    options.value = data.data
  }
  async function getFields(tableId: string) {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId })
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
    getRelationPickerOptions(tableId)
    fields.value = await getFields(tableId)
    console.log('fields', fields.value)
  })
  return {
    options,
    fields,
    searchKeyword
  }
}
