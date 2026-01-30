<script lang="ts" setup>
import { newAdminApi } from 'api'
import { groupProviderKey } from '~/util/userProvider'
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
function openGroupDetail(data: any, openInNewTab = false) {
  // TODO: open detail page
  const newItem: any = {
    id: 'group-detail-' + new Date().getTime(),
    name: 'group-detail-' + data.id,
    icon: 'lucide:user',
    label: data.name,
    component: 'LazyGroupDetail',
    props: {
      id: data.id,
      name: data.name,
      isCanModified: data.isCanModified
    }
  }
  routerProvider?.navigateTo({ ...newItem }, openInNewTab)
}

provide(groupProviderKey, {
  openGroupDetail,
  GetGroupListApi: async () => {
    return await newAdminApi.postAdminucenterGroups().then((r) => r.data)
  },
  DeleteGroupApi: (params: any) => {
    return newAdminApi.deleteAdminucenterGroup(params)
  },
  CreateGroupApi: (params: any) => {
    return newAdminApi.postAdminucenterGroup(params)
  }
})
</script>

<template>
  <div class="pageContainer">
    <GroupTable ref="tableRef"></GroupTable>
  </div>
</template>
<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  overflow: hidden;
}
</style>
