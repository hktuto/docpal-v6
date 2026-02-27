<template>
  <div class="group-detail">
    <div class="topArea">
      <div class="flex-x-center">
        {{ state.name }}
        <SvgIcon class="el-icon--right" id="UserGroupList__Info__EditUserGroup" :content="$t('user_editGroup')" src="/icons/edit.svg" @click="handleEdit" />
      </div>
      <SvgIcon
        class="el-icon--right"
        id="UserGroupList__Info__DeleteUserGroup"
        :content="$t('user_deleteGroup')"
        src="/icons/delete.svg"
        @click="handleDelete"
      />
    </div>
    <GroupUserTable class="group" :group="{ id, name, isCanModified }"></GroupUserTable>
    <GroupEditDialog
      ref="GroupEditDialogRef"
      :group="{
        id,
        name: state.name,
        isCanModified
      }"
      @refresh="handleEditRefresh"
    ></GroupEditDialog>
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'
import { groupProviderDetailKey } from '~/util/userProvider'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { id, name, isCanModified } = defineProps<{
  id: string
  name: string
  isCanModified: boolean
}>()
const state = reactive<any>({
  id: id,
  name: name
})
const { t } = useI18n()
async function handleDelete() {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    const res = await newAdminApi.deleteUcenterGroup({ groupId: id })
    if (!!res) openGroupList()
  } catch (error) {
    console.log(error)
  }
}

const GroupEditDialogRef = ref()

function handleEdit() {
  GroupEditDialogRef.value.handleOpen()
}

function openGroupList(openInNewTab: boolean = false) {
  // TODO: open detail page
  const newItem: any = {
    menuKey: routerProvider?.menuSymbol,
    id: 'admin-group',
    name: 'admin-group-list',
    icon: 'mingcute:group-line',
    label: 'Admin Group',
    component: 'LazyGroupList',
    props: {}
  }
  routerProvider?.navigateTo({ ...newItem }, openInNewTab)
}

function handleEditRefresh(group: any) {
  state.name = group.name
}

provide(groupProviderDetailKey, {
  DeleteGroupApi: (params: any) => {
    return newAdminApi.deleteUcenterGroup(params)
  },
  GetMemberListApi: (params: any) => {
    return newAdminApi.postUcenterMember(params)
  },
  BatchGroupRemoveUsersApi: (params: any) => {
    return newAdminApi.postUcenterGroupBatchRemoveUsers(params)
  },
  BatchGroupAddUsersApi: (params: any) => {
    return newAdminApi.postUcenterGroupBatchAddUsers(params)
  },
  PatchGroupApi: (params: any) => {
    return newAdminApi.patchUcenterGroup(params)
  },
  getUserListApi: async () => {
    return await newAdminApi.postUcenterUsers({}).then((res) => res.data)
  }
})
watch(
  () => name,
  () => {
    state.name = name
  }
)
</script>
<style lang="scss" scoped>
.group-detail {
  padding: var(--app-space-s);

  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-s);
}

.topArea {
  --icon-size: var(--app-space-m);
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.flex-x-center {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
</style>
