import { newClientApi } from 'api'
import { ColumnFieldType } from '../../types/column-types'
// For table's relation config
export const useVirtualColumn = (relationTableId: string, businessType: ColumnFieldType) => {
  const { database, databaseMenuRouteParams } = useSingleDatabaseContext()
  const { updateColumn } = useMDTableInject()
  const { tableFields } = inject<any>('viewTools')
  const menus = ref([])
  const menuIdPaths = ref<string[]>([])
  const relationTables = ref<any[]>([])
  const isAgg = computed(() => businessType === ColumnFieldType.AggVirtualColumn)
  function getRelationTables() {
    return tableFields.value.filter((field: any) => field.business_type === ColumnFieldType.Relation)
  }
  async function getMenuFromDb() {
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: database.value.id
    })
    let list = res.data ?? []
    if (databaseMenuRouteParams.value.detailId) {
      list = getRelationTree(list, relationTables.value)
    }
    menus.value = list
  }
  async function getTableFields(tableId: string) {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId, userId: 'master' })
    if (isAgg.value) {
      return res.data.tableFields.filter((field: any) => field.business_type === ColumnFieldType.Number)
    }
    return res.data.tableFields
  }
  function updateRelationField(formData: any) {
    const relationTableId = formData.relation_table_id
    const relationTable = relationTables.value.find((table: any) => table.display_structure?.relation_table_id === relationTableId)
    formData.relation_field_name = relationTable.field_name
    // formData.relation_field_name = relationTable.field_name

    // 重新获取relationTable中的displayFields
    const displayFieldIds = JSON.parse(JSON.stringify(relationTable.display_structure?.display_field_ids))
    const displayFieldNames = JSON.parse(JSON.stringify(relationTable.display_structure?.display_field_names))
    const virtualColumns = tableFields.value.filter((field: any) => field.business_type === ColumnFieldType.VirtualColumn)
    virtualColumns.forEach((column: any) => {
      const tableId = column.display_structure?.relation_table_id
      if (tableId === relationTableId && !displayFieldNames.includes(column.display_structure?.display_field_name)) {
        displayFieldNames.push(column.display_structure?.display_field_name)
        displayFieldIds.push(column.display_structure?.display_field_id)
      }
    })

    if (!areArraysEqualIgnoreOrder(displayFieldIds, relationTable.display_structure?.display_field_ids)) {
      updateColumn(relationTable.field_name, {
        display_field_ids: displayFieldIds,
        relation_table_id: relationTableId,
        business_type: relationTable.business_type,
        display_structure: {
          ...relationTable.display_structure,
          display_field_ids: displayFieldIds,
          display_field_names: displayFieldNames
        }
      })
    }
  }
  onMounted(async () => {
    console.log('relationTableId', relationTableId)
    relationTables.value = getRelationTables()
    await getMenuFromDb()
    if (relationTableId) menuIdPaths.value = findPath(menus.value, relationTableId)
    console.log(relationTables.value)
  })
  return {
    isAgg,
    menus,
    menuIdPaths,
    relationTables,
    getTableFields,
    updateRelationField
  }
}
function areArraysEqualIgnoreOrder(arr1: string[], arr2: string[]) {
  if (arr1.length !== arr2.length) return false

  const sorted1 = [...arr1].sort()
  const sorted2 = [...arr2].sort()

  return sorted1.every((item, index) => item === sorted2[index])
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

export function findPath(tree: any[], targetId: string, currentPath: string[] = []): string[] {
  for (const node of tree) {
    // 当前路径加上当前节点的 id
    const newPath = [...currentPath, node.id]

    // 如果当前节点就是目标
    if (node.id === targetId || node.item_id === targetId) {
      return newPath
    }

    // 如果有 children，递归查找
    if (node.children && node.children.length) {
      const result = findPath(node.children, targetId, newPath)
      if (result) return result
    }
  }
  return []
}
