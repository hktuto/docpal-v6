<script lang="ts" setup>
import { clientApi } from 'api'
import { userProviderKey } from '~/util/userProvider'

const routerProvider = inject(MenuRouterKey)

if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

function openUserDetail(data: any, openInNewTab = false) {
  // TODO: open detail page
  const newItem: any = {
    menuKey: routerProvider?.menuSymbol,
    id: 'user-detail-' + new Date().getTime(),
    name: 'user-detail-' + data.id,
    icon: 'lucide:user',
    label: data.username,
    component: 'LazyAdminUserDetail',
    props: {
      id: data.userId
    }
  }
  routerProvider?.navigateTo({ ...newItem }, openInNewTab)
}

async function sendInvitation(data: any) {
  console.log('sendInvitation', data)
  if (!data.registered) {
    throw new Error('only non-register user can be invitate')
  }
  try {
    const response = await clientApi.admin.getAdminucenterSendInitPasswordEmailUserid(data.userId).then(r => r.data)
    console.log('response', response)
    routerProvider?.message.success('Invitation sent successfully')
  } catch (error) {
    // TODO : handle error
    console.error(error)
  }

}

// #region module:
let userTableFilter = {}
const tableRef = ref()

function handleFilterChange(filter: any) {
  userTableFilter = { ...filter }
  tableRef?.value?.reload()
}

// #endregion
provide(userProviderKey, {
  getAllUsersApi: async (params: any) => {
    const res: any = await clientApi.admin.postAdminucenterGetAllUsers({
      ...params,
      ...userTableFilter
    })
    const { conditions, page } = res.data
    tableRef?.value.getFilter(conditions, userTableFilter)
    return { data: page }
  },
  SetUserStatusApi: (params: any) => {
    return clientApi.api.putUcenterStatus(params)
  },
  BatchActiveUserApi: (params: any) => {
    return clientApi.api.postUcenterBatchActive(params)
  },
  BatchDeleteUserApi: (params: any) => {
    return clientApi.admin.postAdminucenterUsersBatchDelete(params)
  },
  getAllUserAndActiveCountApi: async () => {
    const res = await clientApi.admin.postAdminucenterGetLicenseUserNumAndActiveCount()
    return res.data
  },

  BatchUsersToGroupsApi: (params: any) => {
    return clientApi.admin.postAdminucenterUsersBatchAddGroups(params)
  },
  GetGroupListApi: async () => {
    return await clientApi.api.postUcenterGroups().then(r => r.data)
  },
  sendInvitation,
  openUserDetail
})
</script>

<template>
  <div class="pageContainer">
    <UserTable
      ref="tableRef"
      @filter-change="handleFilterChange"
    ></UserTable>
  </div>
</template>
<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  overflow: hidden;
}
</style>
