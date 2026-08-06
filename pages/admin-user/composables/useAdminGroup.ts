import { gatewayApi, newAdminApi } from 'api'

/**
 * Admin 用户组相关 API / 导航。
 * 替代原先 group list/detail 的 provide。
 */
export function useAdminGroup() {
  const routerProvider = inject(MenuRouterKey, null)

  async function fetchGroupsPage(params: Record<string, any> = {}) {
    const res: any = await gatewayApi.groups.postGroupsPage(params)
    return res?.data as { list?: any[]; total?: number }
  }

  function deleteGroup(id: string) {
    return gatewayApi.groups.deleteGroupsId(id)
  }

  function createGroup(params: any) {
    return gatewayApi.groups.postGroupsCreate(params)
  }

  function updateGroup(params: any) {
    return gatewayApi.groups.putGroupsUpdate(params)
  }

  async function fetchGroupMembers(params: Record<string, any>) {
    const res: any = await gatewayApi.groups.postGroupsUsers(params)
    return res?.data as { list?: any[]; total?: number }
  }

  function removeUsersFromGroup(params: any) {
    return newAdminApi.postUcenterGroupBatchRemoveUsers(params)
  }

  function assignUsersToGroup(params: any) {
    return newAdminApi.postUcenterGroupBatchAddUsers(params)
  }

  async function fetchUserList() {
    return await newAdminApi.postUcenterUsers({}).then((res) => res.data)
  }

  function openGroupDetail(data: any, openInNewTab = false) {
    if (!routerProvider) {
      throw new Error('MenuRouterKey is not provided')
    }
    routerProvider.navigateTo(
      {
        id: 'group-detail-' + Date.now(),
        name: 'group-detail-' + data.id,
        icon: 'lucide:user',
        label: data.groupName ?? data.name,
        component: 'LazyGroupDetail',
        props: {
          id: data.id ?? data.groupId,
          name: data.groupName ?? data.name,
          isCanModified: data.isCanModified
        }
      },
      openInNewTab
    )
  }

  function openGroupList(openInNewTab = false) {
    if (!routerProvider) {
      throw new Error('MenuRouterKey is not provided')
    }
    routerProvider.navigateTo(
      {
        menuKey: routerProvider.menuSymbol,
        id: 'admin-group',
        name: 'admin-group-list',
        icon: 'mingcute:group-line',
        label: 'Admin Group',
        component: 'LazyGroupList',
        props: {}
      },
      openInNewTab
    )
  }

  return {
    fetchGroupsPage,
    deleteGroup,
    createGroup,
    updateGroup,
    fetchGroupMembers,
    removeUsersFromGroup,
    assignUsersToGroup,
    fetchUserList,
    openGroupDetail,
    openGroupList
  }
}
