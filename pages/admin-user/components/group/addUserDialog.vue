<template>
  <el-dialog v-model="state.visible" :title="$t('user_addUsersToUserGroup')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserGroupList__Info__AddUsersToUserGroup__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './addUserDialog.vform.json'
import type { UserDTO, GroupDTO } from 'api/src/generate/admin'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { assignUsersToGroup, fetchUserList } = useAdminGroup()
const props = defineProps<{
  group: GroupDTO,
}>()
const emits = defineEmits([
  'refresh'
])
const state = reactive<{
  loading: boolean,
  visible: boolean,
  userList: UserDTO[],
}>({
  loading: false,
  visible: false,
  userList: []
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    const param = {
      groupId: props.group.id,
      userIds: data.id
    }
    await assignUsersToGroup(param)
    setTimeout(() => {
      state.visible = false
    }, 300)
    ElMessage.success(t('user_addUserGroupSuccessMsg'))

    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {

  }
  state.loading = false
}

function handleOpen(exitList: UserDTO[]) {
  state.visible = true
  setTimeout(() => {
    handleOptions(exitList)
  }, 100)
}

async function handleOptions(exitList: UserDTO[]) {
  try {
    console.log(exitList)
    if (!state.userList || state.userList.length === 0) state.userList = await fetchUserList()
    const idRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('id')

    const options = userListFilter()

    idRef.loadOptions(options)

    function userListFilter() {
      return state.userList.reduce((prev: any[], item: UserDTO & any) => {
        const index = exitList.findIndex(exitItem => exitItem.userId === item.userId)
        if (index === -1 && item.userId) {
          item.value = item.userId
          item.label = item.username
          prev.push(item)
        }
        return prev
      }, [])
    }
  } catch (e) {
    console.log(e)
  }
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
