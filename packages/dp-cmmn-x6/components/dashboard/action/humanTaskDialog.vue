<template>
  <el-dialog v-model="state.visible" :title="state.title" class="scroll-dialog" append-to-body
    :close-on-click-modal="false" destroy-on-close @close="handleClose">
    <WorkflowDetailFormRender v-if="isWorkflowForm" ref="FromVariablesRendererRef" />
    <MasterTableVariableForm v-else ref="MasterTableVariableFormRef" :ignoreList="ignoreList"/>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { emitBus, EventType } from 'eventbus'
import { globalApi, clientApi } from 'api'
const props = withDefaults(defineProps<{
  ignoreList: string[],
}>(), {
  ignoreList: []
})
const emits = defineEmits([
  'refresh', 'delete', 'submit'
])
const { t } = useI18n()
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: {},
  fields: [],
  edit: false,
  title: t('masterTable.newRow')
})
const CMDProvider = inject(CaseManagementDashboardKey)
async function handleSubmit() {
  state.loading = true
  try {
    let data:any;
        if(isWorkflowForm.value) {
            data = await FromVariablesRendererRef.value.getFormData(true)
        }else {
            data = await MasterTableVariableFormRef.value.getData(true)
        }
    await globalApi.api.postCaseInstanceTasksComplete({
      caseInstanceId: state.setting.caseInstanceId,
      taskId: state.setting.referenceId,
      variables: data
    })
    
    state.visible = false
    emitBus(EventType.CASE_NEED_REFRESH, {
      caseId: CMDProvider?.instanceId?.value
    })
    console.log("emitBus", CMDProvider?.instanceId?.value)
    emits('submit')
  } catch (error) {
    state.loading = false
  }
  state.loading = false
}
const FromVariablesRendererRef = ref()
const MasterTableVariableFormRef = ref()
const isWorkflowForm = ref(false)
async function handleOpen(taskId, actionItem, actionList) {
  state.visible = true
  state.loading = true
  state.title = actionItem.name
  state.setting = actionItem
  const { data } = await globalApi.api.getCaseInstanceTasksTaskidForm(taskId) as any
  // console.log(taskId,actionItem,CMDProvider?.versionId)
        // get cmmn xml
  const fields = data.fields.reduce((prev: any,item: any) => {
    prev.push({
      ...item,
      name: item.id,
      label: item.name,
      required: item.required || false,
      dataType: item.type
    })
    return prev
  }, [])
  const initData = data.rows.reduce((prev: any,item: any) => {
    if(item.value) prev[item.id] = item.value
    return prev
  }, {})
  const form = await clientApi.api.getDmsFormPropertiesQuery({
      processKey: CMDProvider?.caseDefinitionKey.value,
      userTaskId: actionItem.planItemDefinitionId,
      versionId: CMDProvider?.versionId.value
  })
  if(form.data[0]) {
      isWorkflowForm.value = true
      const json = JSON.parse(form.data[0].jsonValue || "{}")
      const formData = data.rows.reduce((prev: any, item: any) => {
        if(item.value) prev[item.id] = item.value
        return prev
      }, {})
      state.loading = false
      nextTick(() => {
          console.log("form", json, FromVariablesRendererRef.value)
          FromVariablesRendererRef.value.setForm(json, formData)
          
      })
      return;
  }
  isWorkflowForm.value = false

  state.loading = false
  nextTick(() => {
    if(!!fields) MasterTableVariableFormRef.value.init(fields, initData)
  })
}
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
