import { newClientApi } from 'api'
import { ColumnFieldType } from '../../types/column-types'
// For table's relation config
export const useVirtualColumn = () => {
  const { workspace, workspaceRouteParams } = useSingleWorkspaceContext()
  const { updateColumn } = useMDTableInject()
  const { tableFields } = inject<any>('viewTools')
  const menus = ref([])
  const relationTables = ref<any[]>([])
  function getRelationTables() {
    return tableFields.value.filter((field: any) => field.business_type === ColumnFieldType.Relation)
  }
  async function getMenuFromDb() {
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: workspace.value.id
    })
    let list = res.data ?? []
    if (workspaceRouteParams.value.detailId) {
      list = getRelationTree(list, relationTables.value)
    }
    menus.value = list
  }
  async function getTableFields(tableId: string) {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId })
    return res.data.tableFields
  }
  function updateRelationField(formData: any) {
    const relationTableId = formData.table_id_paths[formData.table_id_paths.length - 1]
    const relationTable = relationTables.value.find((table: any) => table.display_structure?.relation_table_id === relationTableId)
    formData.virtual_field_name = relationTable.field_name + '.' + formData.display_field_name
    // formData.relation_field_name = relationTable.field_name

    // 重新获取relationTable中的displayFields
    const displayFieldIds = JSON.parse(JSON.stringify(relationTable.display_structure?.display_field_ids))
    const displayFieldNames = JSON.parse(JSON.stringify(relationTable.display_structure?.display_field_names))
    const virtualColumns = tableFields.value.filter((field: any) => field.business_type === ColumnFieldType.VirtualColumn)
    virtualColumns.forEach((column: any) => {
      const tableId = column.table_id_paths.pop()
      if (tableId === relationTableId && !displayFieldNames.includes(column.display_structure?.display_field_name)) {
        displayFieldNames.push(column.display_structure?.display_field_name)
        displayFieldIds.push(column.display_structure?.display_field_id)
      }
    })

    if (displayFieldIds.length !== relationTable.display_structure?.display_field_ids.length) {
      updateColumn(relationTable.field_name, {
        display_structure: {
          ...relationTable.display_structure,
          display_field_ids: displayFieldIds,
          display_field_names: displayFieldNames
        }
      })
    }
  }
  onMounted(() => {
    getMenuFromDb()
    relationTables.value = getRelationTables()
    console.log(relationTables.value)
  })
  return {
    menus,
    relationTables,
    getTableFields,
    updateRelationField
  }
}

function getRelationTree(menus: any[], relationTables: any[]): any[] {
  return menus
    .map((menu: any) => {
      const children = Array.isArray(menu.children) ? getRelationTree(menu.children, relationTables) : []
      menu.menuId = menu.id
      if (menu.item_id) menu.id = menu.item_id
      const menuItemId = menu.item_id
      const hasMatchedSelf = relationTables.find((table: any) => table.display_structure?.relation_table_id === menuItemId)
      const hasMatchedChild = children.length > 0
      if (!hasMatchedSelf && !hasMatchedChild) return null
      return {
        ...menu,
        children
      }
    })
    .filter(Boolean)
}
