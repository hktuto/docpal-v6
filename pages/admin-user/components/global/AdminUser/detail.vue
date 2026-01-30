<script lang="ts" setup>
import { newClientApi, newAdminApi } from 'api'
import type { UserDTO } from 'api/src/generate/admin'
import { userProviderDetailKey } from '~/util/userProvider'

const { id } = defineProps<{
  id: string
}>()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const state = reactive<{
  curUser: UserDTO | null
}>({
  curUser: null
})
defineOptions({
  name: 'AdminUserDetailDead'
})

function openUserList(openInNewTab: boolean = false) {
  // TODO: open detail page
  const newItem: any = {
    menuKey: routerProvider?.menuSymbol,
    id: 'admin-user',
    name: 'admin-user-list',
    icon: 'lucide:user',
    label: 'Admin User',
    component: 'LazyAdminUserList',
    props: {}
  }
  routerProvider?.navigateTo({ ...newItem }, openInNewTab)
}

async function getUser() {
  const data: any = await newAdminApi.getAdminucenterUserUserid(id).then((r) => r.data)
  if (!data) return
  console.log('user info', data)
  data.status = data.status === 'A' ? 'A' : 'D'
  state.curUser = data
}

provide(userProviderDetailKey, {
  SetUserStatusApi: (params: any) => {
    return newClientApi.putUcenterStatus(params)
  },
  BatchActiveUserApi: (params: any) => {
    return newClientApi.postUcenterBatchActive(params)
  },
  BatchDeleteUserApi: (params: any) => {
    return newAdminApi.postAdminucenterUsersBatchDelete(params)
  },
  PatchUserPasswordApi: (params: any) => {
    return newAdminApi.patchAdminucenterUserPassword(params)
  },
  MemberGroupGetApi: (params: any) => {
    return newAdminApi.postAdminucenterMemberGroup(params)
  },
  BatchUserRemoveGroupsApi: (params: any) => {
    return newAdminApi.postAdminucenterUserBatchRemoveGroups(params)
  },
  BatchUserAddGroupsApi: (params: any) => {
    return newAdminApi.postAdminucenterUserBatchAddGroups(params)
  },
  GetGroupListApi: async () => {
    return await newAdminApi.postAdminucenterGroups().then((r) => r.data)
  },
  getUser,
  openUserList
})

onMounted(() => {
  getUser()
})
</script>
<template>
  <div class="userDetailSection" v-if="state.curUser">
    <UserInfo class="info" :user="state.curUser" @refresh="getUser"></UserInfo>
    <UserGroupTable class="group" :user="state.curUser">group</UserGroupTable>
  </div>
</template>
<style lang="scss" scoped>
.userDetailSection {
  height: 100%;
  padding: var(--app-space-s);
  display: grid;
  grid-template-columns: minmax(min-content, 400px) 1fr;
  grid-template-rows: 1fr;
  gap: var(--app-space-xs);
  grid-template-areas:
    'list topArea topArea'
    'list group virtualFolder';
  height: 100%;
  overflow: hidden;

  :deep(.el-card) {
    height: 100%;
    overflow: hidden;
  }

  :deep(.el-card__header) {
    min-height: 45px !important;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;

    > * {
      width: 100%;
    }
  }
}
</style>
