<script lang="ts" setup>
import { adminApi, clientApi } from 'api'
import type { UserDTO } from 'api/src/generate/admin'
import { userProviderDetailKey } from "~/util/userProvider";
const { id } = defineProps<{
  id: string;
}>();
const routerProvider = inject(MenuRouterKey)
if( !routerProvider) {
    throw new Error('MenuRouterKey is not provided')
}
const state = reactive<{
  curUser: UserDTO | null;
}>({
  curUser: null,
})
defineOptions({
  name: 'AdminUserDetailDead'
})
function openUserList(openInNewTab: boolean = false){
    // TODO: open detail page
    const newItem: any = {
        menuKey: routerProvider?.menuSymbol,
        id: "admin-user",
        name: "admin-user-list",
        icon: 'lucide:user',
        label: 'Admin User',
        component: 'LazyAdminUserList',
        props: {
        }
    }        
    routerProvider?.navigateTo({...newItem}, openInNewTab)
}
async function getUser() {
  const res = await adminApi.api.getNuxeoUserUserid(id);
  if(!res.data) return
  console.log("res.data", res.data)
  res.data.status = res.data.status === "A" ? "A" : "D";
  state.curUser = res.data;
}
provide(userProviderDetailKey, {
  SetUserStatusApi: (params:any) => {
    return adminApi.api.putNuxeoUserStatus(params)
  },
  BatchActiveUserApi: (params:any) => {
    return adminApi.api.postNuxeoUserBatchActive(params)
  },
  BatchDeleteUserApi: (params:any) => {
    return adminApi.api.postNuxeoIdentityUsersBatchDelete(params)
  },
  PatchUserPasswordApi: (params: any) => {
    return adminApi.api.patchNuxeoIdentityUserPassword(params)
  },
  MemberGroupGetApi: (params: any) => {
    return adminApi.api.postNuxeoIdentityMembergroup(params)
  },
  BatchUserRemoveGroupsApi: (params: any) => {
    return adminApi.api.postNuxeoIdentityUserBatchRemoveGroups(params)
  },
  BatchUserAddGroupsApi: (params: any) => {
    return adminApi.api.postNuxeoIdentityUserBatchAddGroups(params)
  },
  GetGroupListApi : async() => {
    return await clientApi.api.postUcenterGroups().then(r => r.data)
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
    <UserInfo
      class="info"
      :user="state.curUser"
      @refresh="getUser"
    ></UserInfo>
    <UserGroupTable class="group" :user="state.curUser">group</UserGroupTable>
    <!-- <UserVirtualFolder v-if="state.curUser" class="virtualFolder" :userOrGroup="state.curUser" mode="userAllowList">virtualFolder</UserVirtualFolder> -->
  </div>
</template>
<style lang="scss" scoped>
.userDetailSection{
  height: 100%;
  padding: var(--app-space-s);
  display : grid;
  grid-template-columns: minmax(min-content, 400px) 1fr ;
  grid-template-rows: 1fr;
  gap: var(--app-space-xs);
  grid-template-areas:
    'list topArea topArea'
    'list group virtualFolder';
  height: 100%;
  overflow: hidden;
  :deep(.el-card){
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
