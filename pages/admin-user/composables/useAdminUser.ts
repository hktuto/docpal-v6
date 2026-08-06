import { newAdminApi, newClientApi, gatewayApi } from 'api'
import { ElMessage } from 'element-plus'

/**
 * Admin 用户列表相关 API / 导航。
 * 替代原先 list.vue 的 provide(userProviderKey)。
 */
export function useAdminUser() {
  const routerProvider = inject(MenuRouterKey, null)

  async function fetchUsersPage(params: Record<string, any>) {
    const res: any = await gatewayApi.users.postUsersPage(params)
    return res?.data as { conditions?: any[]; page?: any }
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
    const res = await newAdminApi.postUcenterGetLicenseUserNumAndActiveCount()
    return res.data as { ActiveCount?: number; licenseUserNum?: number }
  }

  /** 单个用户添加多个 group */
  function batchUserAddGroups(params: any) {
    return newAdminApi.postUcenterUserBatchAddGroups(params)
  }

  /** 多个用户批量加入 groups */
  function batchUsersToGroups(params: any) {
    return newAdminApi.postUcenterUsersBatchAddGroups(params)
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

  async function sendInvitation(data: any) {
    if (!data.registered) {
      throw new Error('only non-register user can be invite')
    }
    // TODO: 接入真实邀请接口
    ElMessage.success('Invitation sent successfully')
  }

  return {
    fetchUsersPage,
    setUserStatus,
    batchActiveUsers,
    batchDeleteUsers,
    fetchLicenseUserCount,
    batchUserAddGroups,
    batchUsersToGroups,
    fetchGroupList,
    openUserDetail,
    sendInvitation
  }
}
