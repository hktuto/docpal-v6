import { newClientApi } from 'api'
import { ColumnFieldType } from '../../types/column-types'
// For table's relation config
export const useRelation = () => {
  const { workspace, workspaceRouteParams } = useSingleWorkspaceContext()
  const { tableFields } = inject<any>('viewTools')
  const menus = ref([])
  function getRelationTableIds() {
    return tableFields.value
      .filter((field: any) => field.business_type === ColumnFieldType.Relation)
      .map((field: any) => field.display_structure?.relation_table_id)
  }
  async function getMenuFromDb() {
    const relationTableIds = getRelationTableIds()
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: workspace.value.id
    })
    let list = res.data ?? []
    if (workspaceRouteParams.value.detailId) {
      list = getRelationTree(list, workspaceRouteParams.value.detailId, relationTableIds)
    }
    menus.value = list
  }
  async function getTop5Fields(tableId: string) {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId })
    const configStr = res.data.tableConfig
    const config = configStr ? JSON.parse(configStr) : []
    const displayFieldsInFirstView = config.length > 0 ? config[0].columns : res.data.tableFields
    const visibleFields = displayFieldsInFirstView.filter((field: any) => field.hidden !== true)
    return visibleFields.slice(0, 5)
  }
  onMounted(() => {
    getMenuFromDb()
  })
  return {
    menus,
    getTop5Fields
  }
}

function getRelationTree(menus: any[], menuId: string, relationTableIds: string[]): any[] {
  const result = menus.filter((menu) => {
    if (menu.children) {
      menu.children = getRelationTree(menu.children, menuId, relationTableIds)
    }
    menu.leaf = menu.item_type === 'master_table'
    menu.menuId = menu.id
    if (menu.item_id) menu.id = menu.item_id
    menu.disabled = relationTableIds.includes(menu.id)
    return menu.menuId !== menuId && ['folder', 'master_table'].includes(menu.item_type)
  })
  return result
}
