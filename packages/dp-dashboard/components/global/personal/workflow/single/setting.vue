<script lang="ts" setup>
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'

const platform = useAppPlatform()
const { t } = useI18n()
const { state, handleSubmit, handleOpen } = useDashboardSetting({
  beforeOpen
})
type Columns = {
  field: string
  title: string
}
const workflowList = await getWorkflowList()
const workflowColumns = ref<Columns[]>([])
const availableSteps = ref<any[]>([])

async function handleWorkflowChange(workflowId: string) {
  state.setting.columns = []
  state.setting.steps = []
  const selectedWorkflowData = workflowList.find((item: any) => item.id === workflowId)
  if (!selectedWorkflowData) return

  const data = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${workflowId}`).then((r: any) => r.data)
  const workflowJson = data.content
  const userNodes: any[] = workflowJson.nodes.filter((node: any) => node.type === CellType.userTask)
  availableSteps.value = userNodes

  const allFormInfo = new Map()
  userNodes.reduce((prev: any[], item: any) => {
    item.config.human_task.form_fields.forEach((f: any) => {
      allFormInfo.set(f.id, f)
    })
    return prev
  }, [])
  workflowColumns.value = Array.from(allFormInfo.values())
}

async function beforeOpen(setting) {
  state.setting = deepCopy(setting)

  if (!setting.columns) setting.columns = []
  if (setting.selectedWorkflow) {
    await handleWorkflowChange(setting.selectedWorkflow)
  }
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="Title">
        <ElInput v-model="state.setting.title" placeholder="Title" clearable />
      </el-form-item>
      <el-form-item label="workflow">
        <el-select v-model="state.setting.selectedWorkflow" filterable clearable allow-create @change="handleWorkflowChange">
          <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Steps">
        <el-select v-model="state.setting.steps" filterable clearable allow-create multiple>
          <el-option v-for="item in availableSteps" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Columns">
        <div class="listContainer">
          <div class="row">
            <div>Title</div>
            <div>Field</div>
          </div>
          <div v-for="(row, index) in state.setting.columns" :key="index" class="row">
            <ElInput v-model="row.title" placeholder="Title" />
            <el-select v-model="row.field" multiple clearable filterable allow-create>
              <el-option v-for="item in workflowColumns" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <ElButton text @click="state.setting.columns.splice(index, 1)">remove</ElButton>
          </div>
          <div class="add-row">
            <el-button text @click="state.setting.columns.push({ field: '', title: '' })">Add Column</el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button id="WorkPanel__DetailTask__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.listContainer {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  width: 100%;
  .row {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 60px;
    grid-column-gap: var(--app-space-xs);
  }
}
.add-row {
  width: 100%;
  display: grid;
  place-items: center;
}
</style>
