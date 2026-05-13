<script lang="ts" setup>
const { workflowList, WorkflowCandidateList } = defineProps<{
  workflowList: any[]
  WorkflowCandidateList: any
}>()
const emits = defineEmits(['refresh', 'delete'])

const state = reactive({
  visible: false,
  setting: {
    title: ''
  },
  WorkflowCandidateList: []
})
const form = ref({
  workflowList: []
})
const titleDialogRef = ref()
function handleEdit(element: any) {
  titleDialogRef.value.handleOpen(element)
}
const formRef = ref()
async function handleSubmit() {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    const workflowList = form.value.workflowList.reduce((prev: any, item: any) => {
      prev.push({
        id: item.id,
        key: item.key,
        name: item.name,
        type: item.type || '#13C3AEFF'
      })
      return prev
    }, [])

    emits('refresh', { workflowList, title: state.setting.title })
    state.visible = false
  } catch (error) {
    console.error(error)
  }
}

function handleOpen(setting: any) {
  state.visible = true
  setTimeout(async () => {
    await formRef.value.resetFields()
    state.setting = setting
    form.value.workflowList = workflowList
    const idSet = new Set(workflowList.map((item: any) => item.id))
    state.WorkflowCandidateList = WorkflowCandidateList.filter((item: any) => !idSet.has(item.id))
  })
}
defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" :model="state.setting" label-position="top">
      <el-form-item :label="$t('common_title')" prop="title">
        <el-input v-model="state.setting.title" />
      </el-form-item>
    </el-form>

    <div style="height: 50vh; overflow: hidden">
      <DragSelect layout="lr" itemKey="name" showDragTip joiner="" :dropList="form.workflowList" :dragList="state.WorkflowCandidateList">
        <template #buttons="{ element, index }">
          <SvgIcon class="cursor-pointer el-icon--right" src="/icons/file/edit.svg" @click="handleEdit(element)" />
        </template>
      </DragSelect>
    </div>

    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <PersonalWorkflowCreateTitleDialog ref="titleDialogRef" @refresh="handleSubmit" />
</template>

<style lang="scss" scoped></style>
