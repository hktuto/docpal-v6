<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" :model="state.setting" label-position="top">
      <el-form-item :label="$t('common_title')" prop="title">
        <el-input v-model="state.setting.title" />
      </el-form-item>
    </el-form>

    <div style="height: 50vh; overflow: hidden">
      <DragSelect layout="lr" itemKey="name" showDragTip joiner="" :dragList="state.WorkflowCandidateList" :dropList="form.workflowList">
        <template #buttons="{ element, index }">
          <SvgIcon class="cursor-pointer el-icon--right" src="/icons/file/edit.svg" @click="handleEdit(element, index)" />
        </template>
      </DragSelect>
    </div>
    <PersonalWorkflowCreateTitleDialog ref="titleDialogRef" @refresh="handleSubmit" />
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
const props = defineProps(['setting', 'workflowList', 'WorkflowCandidateList'])
const emits = defineEmits(['refresh', 'delete'])

const state = reactive({
  loading: false,
  visible: false,
  setting: {
    title: ''
  },
  icon: '',
  WorkflowCandidateList: []
})
const form = ref({
  workflowList: []
})
const titleDialogRef = ref()
function handleEdit(element: any, index: number) {
  titleDialogRef.value.handleOpen(element)
}
const formRef = ref()
async function handleSubmit() {
  try {
    state.loading = true
    const valid = await formRef.value.validate()
    if (!valid) return
    const workflowList = form.value.workflowList.reduce((prev, item) => {
      prev.push({
        key: item.key,
        title: item.title,
        versionId: item.versionId,
        name: item.name,
        type: item.type || 'primary'
      })
      return prev
    }, [])
    emits('refresh', { workflowList, title: state.setting.title })
    state.visible = false
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

function handleOpen(setting) {
  state.visible = true
  state.loading = true
  setTimeout(async () => {
    await formRef.value.resetFields()
    state.setting = setting
    const workflowList: any[] = props.workflowList ? [...props.workflowList] : []
    if (!setting.workflowKeys) setting.workflowKeys = []
    form.value.workflowList = workflowList
    state.loading = false
    state.WorkflowCandidateList = props.WorkflowCandidateList.filter((item: any) => !setting.workflowKeys.includes(item.key))
  })
}
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
