import { newAdminApi, newClientApi, gatewayApi } from 'api'
import { ElMessage } from 'element-plus'

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
    return await newAdminApi.getUcenterUserUserid(userId).then((r) => r.data)
  }

  function createUser(params: any) {
    return gatewayApi.users.postUsers(params)
  }

  function setUserStatus(params: any) {
    return newClientApi.putUcenterStatus(params)
  }

  function batchActiveUsers(params: any) {
    return newClientApi.postUcenterBatchActive(params)
  }

  function batchDeleteUsers(params: any) {
    return newAdminApi.postUcenterUsersBatchDelete(params)
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

  /** 单个用户添加多个 group */
  function batchUserAddGroups(params: any) {
    return newAdminApi.postUcenterUserBatchAddGroups(params)
  }

  /** 多个用户批量加入 groups */
  function batchUsersToGroups(params: any) {
    return newAdminApi.postUcenterUsersBatchAddGroups(params)
  }

  function batchUserRemoveGroups(params: any) {
    return newAdminApi.postUcenterUserBatchRemoveGroups(params)
  }

  function fetchUserGroups(params: any) {
    return newAdminApi.postUcenterMemberGroup(params)
  }

  function updateUserPassword(params: any) {
    return gatewayApi.password.postPasswordReset(params)
  }

  async function fetchGroupList() {
    return await newAdminApi.postUcenterGroups().then((r) => r.data)
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
    setUserStatus,
    batchActiveUsers,
    batchDeleteUsers,
    fetchLicenseUserCount,
    batchUserAddGroups,
    batchUsersToGroups,
    batchUserRemoveGroups,
    fetchUserGroups,
    updateUserPassword,
    fetchGroupList,
    openUserDetail,
    openUserList,
    sendInvitation
  }
}
