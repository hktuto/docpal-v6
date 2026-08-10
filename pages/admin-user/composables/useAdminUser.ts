import { gatewayApi } from 'api'
import { ElMessage } from 'element-plus'

/** 统一抽出 groupId / id / value，并去重 */
function toIds(list: any = []): string[] {
  return [...new Set(
    (Array.isArray(list) ? list : [list])
      .map((item) => (typeof item === 'string' ? item : item?.groupId ?? item?.id ?? item?.value))
      .filter(Boolean)
  )]
}

/**
 * Admin 用户相关 API / 导航。
 * 替代原先 list/detail 的 provide。
 */
export function useAdminUser() {
  const routerProvider = inject(MenuRouterKey, null)

  async function fetchUsersPage(params: Record<string, any>) {
    const res: any = await gatewayApi.users.postUsersPage({
      ...params,
      page: params.pageNum + 1,
      pageSize: params.pageSize
    })
    return {
      entryList: res?.data?.list ?? [],
      totalSize: res?.data?.total ?? 0
    }
  }

  async function fetchUserById(userId: string) {
    return await gatewayApi.users.getUsersBizBizid(userId).then((r) => r.data)
  }

  function createUser(params: any) {
    return gatewayApi.users.postUsers(params)
  }

  function updateUser(params: any) {
    return gatewayApi.users.putUsersUpdate(params)
  }

  function batchActiveUsers(params: { userIds: string[]; status: 'A' | 'I' | 'L' | 'D' }) {
    return gatewayApi.users.postUsersBatchStatus(params)
  }

  async function batchDeleteUsers(params: any) {
    return await gatewayApi.users.postUsersBatchDelete(params).then((r) => r.data)
  }

  async function fetchLicenseUserCount() {
    const res: any = await gatewayApi.users.getUsersStats()
    return res?.data as {
      totalActive?: number
      licenseUserNum?: number
      activeEssential?: number
      activePremium?: number
      activeStandard?: number
      essential?: number
      premium?: number
      standard?: number
    }
  }

  /**
   * 用户列表页：批量给用户分配 groups。
   * POST /users/assign-groups
   */
  function batchAddGroup(params: { userIds: string[]; groupIds: string | string[] }) {
    return gatewayApi.users.postUsersAssignGroups({
      userIds: toIds(params.userIds),
      groupIds: toIds(params.groupIds)
    })
  }

  /**
   * 用户详情页：从用户移除 groups。
   * POST /users/remove-groups
   */
  function batchUserRemoveGroups(params: { userId: string; groupIds: string | string[] }) {
    return gatewayApi.users.postUsersRemoveGroups({
      userIds: [params.userId],
      groupIds: toIds(params.groupIds)
    })
  }

  async function fetchUserGroups(userId: string) {
    return await gatewayApi.users.getUsersUseridGroups(userId).then((r) => r.data ?? [])
  }

  function updateUserPassword(params: any) {
    return gatewayApi.password.postPasswordReset(params)
  }

  async function fetchGroupList() {
    return await gatewayApi.groups.getGroupsSelect().then((r) => r.data ?? [])
  }

  function openUserDetail(data: any, openInNewTab = false) {
    if (!routerProvider) {
      throw new Error('MenuRouterKey is not provided')
    }
    routerProvider.navigateTo(
      {
        menuKey: routerProvider.menuSymbol,
        id: 'user-detail-' + Date.now(),
        name: 'user-detail-' + data.id,
        icon: 'lucide:user',
        label: data.username,
        component: 'LazyAdminUserDetail',
        props: {
          id: data.userId
        }
      },
      openInNewTab
    )
  }

  function openUserList(openInNewTab = false) {
    if (!routerProvider) {
      throw new Error('MenuRouterKey is not provided')
    }
    routerProvider.navigateTo(
      {
        menuKey: routerProvider.menuSymbol,
        id: 'admin-user',
        name: 'admin-user-list',
        icon: 'lucide:user',
        label: 'Admin User',
        component: 'LazyAdminUserList',
        props: {}
      },
      openInNewTab
    )
  }

  async function sendInvitation(data: any) {
    if (!data.registered) {
      throw new Error('only non-register user can be invite')
    }
    // TODO: 接入真实邀请接口
    ElMessage.success('Invitation sent successfully')
  }

  return {
    fetchUsersPage,
    fetchUserById,
    createUser,
    updateUser,
    batchActiveUsers,
    batchDeleteUsers,
    fetchLicenseUserCount,
    batchAddGroup,
    batchUserRemoveGroups,
    fetchUserGroups,
    updateUserPassword,
    fetchGroupList,
    openUserDetail,
    openUserList,
    sendInvitation
  }
}
