<template>
  <el-dialog v-model="state.visible" :title="$t('user_addGroups')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserList__Info__AssignUserGroup__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './addGroupDialog.vform.json'
import { ElMessage } from 'element-plus'
const { t } = useI18n()
const { batchAddGroup } = useAdminUser()
const props = defineProps<{
  user: any
}>()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,
  exitGroupIds: [] as string[],
  userIds: [] as string[]
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    const groupIds = Array.isArray(data.id) ? data.id : [data.id]
    await batchAddGroup({
      userIds: state.userIds && state.userIds.length > 0 ? state.userIds : [props.user.userId],
      groupIds
    })
    ElMessage.success(t('user_userGroupsAssignedSuccessMsg'))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }
}

function handleOpen(exitList: any[] = [], userIds: string[] = []) {
  state.exitGroupIds = (exitList || []).map((item: any) => item.groupId ?? item.id ?? item.value).filter(Boolean)
  state.userIds = userIds
  state.visible = true
  nextTick(() => {
    setTimeout(() => {
      handleOptions()
    }, 100)
  })
}

async function handleOptions() {
  const idRef = FormRendererRef.value?.vFormRenderRef?.getWidgetRef('id')
  if (!idRef) return
  const groupList = idRef.getOptionItems()
  const exitIds = new Set(state.exitGroupIds)
  const options = groupList
    .reduce((prev: any[], item: any) => {
      const value = item.value ?? item.id
      if (!value) return prev
      prev.push({
        value,
        label: item.label ?? item.name ?? value,
        disabled: exitIds.has(value)
      })
      return prev
    }, [])
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
  idRef.loadOptions(options)
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
