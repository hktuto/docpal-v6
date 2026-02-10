<script setup lang="ts">
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const state = reactive({
  id: '',
  loading: false,
  visible: false,
  title: t('masterTable.newRow')
})
const FromVariablesRendererRef = ref()
const MasterTableVariableFormRef = ref()
const isWorkflowForm = ref(false)
const primaryForm = ref<any>()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)

async function handleOpen(id: string, caseDetail: any) {
  try {
    state.id = id
    const startForm = await newClientApi.getCaseInstanceCasetypeidStarttask(id).then(r => r.data)
    if (!startForm) {
      throw new Error('no data')
    }
    // get cmmn xml
    primaryForm.value = startForm
    const form = await newClientApi.getDmsFormPropertiesQuery({
      processKey: caseDetail.caseDefinitionKey,
      userTaskId: startForm[0].key,
      versionId: caseDetail.productionVersionId
    })
    state.visible = true
    state.loading = true
    // if form is not empty
    if (form.data[0]) {
      isWorkflowForm.value = true
      const json = JSON.parse(form.data[0].jsonValue || '{}')
      state.title = startForm?.[0]?.name
      nextTick(() => {
        FromVariablesRendererRef.value.setForm(json, [])

      })
      return
    }
    isWorkflowForm.value = false
    // other, use old form
    if (!startForm) throw new Error('no data')
    const first = startForm[0]
    state.title = first.name

    const fields = first.fields?.reduce((prev, item) => {
      prev.push({
        ...item,
        name: item.id,
        label: item.name,
        required: item.required || false,
        dataType: item.type
      })
      return prev
    }, [])
    const initData = first.fields?.reduce((prev, item) => {
      if (item.value) prev[item.id] = item.value
      return prev
    }, {})
    setTimeout(() => {
      if (!!fields) MasterTableVariableFormRef.value.init(fields, initData)
    })
  } catch (error) {
    ElMessage.error('no data')
    state.visible = false
  } finally {
    state.loading = false
  }
}

const emits = defineEmits([
  'refresh', 'delete'
])

async function handleSubmit() {
  state.loading = true
  try {
    let data: any
    if (isWorkflowForm.value) {
      data = await FromVariablesRendererRef.value.getFormData(true)
    } else {
      data = await MasterTableVariableFormRef.value.getData(true)
    }
    const startResponse = await newClientApi.postCaseInstanceStart({
      caseTypeId: state.id,
      parameters: data
    }).then(res => res.data)
    if (startResponse) {
      // console.log(primaryForm.value)
      const newItem = caseManageDashboardPage({
        ...startResponse,
        instanceId: startResponse.variables.case_id,
        versionId: startResponse.variables.cmmnVersionId
      })
      routerProvider?.navigateTo(newItem)
    }
    state.visible = false
    emits('refresh')
  } catch (error) {
    state.loading = false
  }
  state.loading = false
}

const props = withDefaults(defineProps<{
  ignoreList?: string[],
  label?: string,
}>(), {
  ignoreList: []
})

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog
    v-model="state.visible" :title="label || state.title"
    class="scroll-dialog big"
    append-to-body
    :fullscreen="isFullScreen"
    :close-on-click-modal="false"
    @close="isFullScreen = false"
    destroy-on-close>
    <template #header>
      <div class="float-right">
        <Icon name="mdi:fullscreen" class="cursor-pointer" @click="isFullScreen = !isFullScreen" />
      </div>
    </template>
    <WorkflowDetailFormRender v-if="isWorkflowForm" ref="FromVariablesRendererRef" />
    <MasterTableVariableForm v-else ref="MasterTableVariableFormRef" :ignoreList="ignoreList" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="CaseManagement__Detail__AddNewRow__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.float-right {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 10px;
}
</style>
