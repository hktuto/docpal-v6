import { newClientApi } from 'api'
export const useVirtualColumn = () => {
  const { workspace } = useSingleWorkspaceContext()
  const menus = ref([])
  async function getMenuFromDb() {
    console.log('getMenuFromDb', workspace.value)
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: workspace.value.id
    })
    const list = res.data ?? []
    menus.value = list
  }
  onMounted(() => {
    getMenuFromDb()
  })
  return {
    menus,
  }
}
