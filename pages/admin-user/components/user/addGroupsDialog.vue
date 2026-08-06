<template>
  <el-dialog
    class="dialog-footer--between"
    v-model="state.visible"
    :title="$t('user_addGroups')"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserList__AssignUserGroup__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import formJson from './addGroupsDialog.vform.json'

const { t } = useI18n()
const { batchUsersToGroups, fetchGroupList } = useAdminUser()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,
  groupList: [] as any[],
  setting: {} as Record<string, any>
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    await batchUsersToGroups({
      groupIds: data.id,
      ...state.setting
    })
    ElMessage.success(t('dpMsg_success'))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {
  }
  state.loading = false
}

function handleOpen(exitList: any, setting: any) {
  state.visible = true
  state.setting = setting
  setTimeout(() => {
    handleOptions(exitList)
  })
}

async function handleOptions(exitList: any) {
  const idRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('id')
  idRef.setWidgetOption('multiple', true)
  state.groupList = (await fetchGroupList()) as any[]
  if (!exitList) exitList = []
  const options = state.groupList.reduce((prev: any[], item: any) => {
    const index = exitList.findIndex((exitItem: any) => exitItem.id === item.id)
    if (index === -1) {
      item.value = item.id
      item.label = item.name
      if (!item.isCanModified) item.disabled = true
      prev.push(item)
    }
    return prev
  }, [])
  idRef.loadOptions(options)
}

defineExpose({ handleOpen })
</script>

<style lang="scss" scoped></style>
<style lang="scss">
.dialog-footer--between {
  .el-dialog__body {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
