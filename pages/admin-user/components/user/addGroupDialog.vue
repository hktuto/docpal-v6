<template>
  <el-dialog v-model="state.visible" :title="$t('user_addGroups')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserList__Info__AssignUserGroup__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './addGroupDialog.vform.json'
import { ElMessage } from 'element-plus'
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { batchUserAddGroups, fetchGroupList } = useAdminUser()
const props = defineProps<{
  user: object,
}>()
const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false,
  groupList: []
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    const param = {
      groupIds: data.id,
      userId: props.user.userId
    }
    await batchUserAddGroups(param)
    ElMessage.success(t('user_userGroupsAssignedSuccessMsg'))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {

  }
  state.loading = false
}

function handleOpen(exitList: any) {
  state.visible = true
  setTimeout(async () => {
    state.groupList = await fetchGroupList()
    handleOptions(exitList)
  })
}

function handleOptions(exitList: any) {
  const idRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('id')
  const options = userListFilter()
  console.log(options)
  idRef.loadOptions(options)

  function userListFilter() {
    return state.groupList.reduce((prev: any, item: any) => {
      const index = exitList.findIndex((exitItem: any) => exitItem.id === item.id)
      if (index === -1) {
        item.value = item.id
        item.label = item.name || item.username
        if (!item.isCanModified) item.disabled = true
        prev.push(JSON.parse(JSON.stringify(item)))
      }
      return prev
    }, [])
  }
}

onMounted(async () => {
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
