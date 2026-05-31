<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'

const routerProvider = inject(MenuRouterKey)
const isAction = ref<boolean>(true)
const isShowAction = ref<boolean>(false)
const { formData, tableFields } = defineProps<{
  formData: any
  tableFields: any
}>()
const actionData = ref<any>()
const actionId = ref<string>('email')
const actionComponent = ref()
const fields = computed(() => {
  return tableFields.map((item: any) => ({
    id: item.field_name,
    name: item.field_name_alias,
    key: item.field_name
  }))
})
const actionList = ref([
  {
    id: 'email',
    name: 'Send Email',
    component: 'LazyDatabaseSettingAutomationWrokflowComponentsSendEmail',
    data: {
      templateId: '',
      tos: '',
      ccs: '',
      variables: {}
    }
  },
  {
    id: 'document',
    name: 'Document G',
    component: '',
    data: {}
  }
])

function init() {
  // console.log(123,formData)
}

function handleChangeActionId() {

}

function updateData(data: any) {
  console.log(12312313, data)
}

function handleCreateAction() {
  isShowAction.value = true
  const find = actionList.value.find((item: any) => item.id === actionId.value)
  if (!find) {
    actionData.value = {}
    actionComponent.value = ''
    return
  }

  actionData.value = find.data
  actionComponent.value = find.component
}

function handleDeleteAction() {
  isShowAction.value = false
  formData.workflow_id = ''
  formData.map_workflow_parameters = {}
}

onMounted(async () => {
  handleChangeActionId()
  init()
})
watch(() => actionData, () => {
  // console.log(111, formData.value)
}, { deep: true })
</script>

<template>
  <div v-if="!isShowAction">
    <div class="select-button-action-card">
      <el-select v-model="actionId" size="small" @change="handleChangeActionId">
        <el-option v-for="action in actionList" :key="action.id" :label="action.name" :value="action.id" />
      </el-select>
      <el-button size="small" type="primary" @click="handleCreateAction">Create Action</el-button>
    </div>

    <el-button size="small" type="success" style="width: 100%; margin-top: 10px">Create Workflow</el-button>
  </div>

  <template v-else>
    <div class="workflow-action-panel">
      <div class="workflow-switch-icon-card">
        <el-icon @click="handleDeleteAction">
          <Delete />
        </el-icon>
      </div>

      <template v-if="isAction">
        <component
          v-if="actionComponent"
          :is="actionComponent"
          :data="actionData"
          :tableFields="fields"
          @update="updateData"
        />
      </template>

      <template v-else>
        <DatabaseSettingAutomationWrokflowComponentsWorkflow :data="formData" :tableFields="fields" />
      </template>
    </div>
  </template>
</template>

<style scoped lang="scss">
.select-button-action-card{
  display: flex;
}

.workflow-action-panel {
  position: relative;
  padding-top: 24px;
}

.workflow-switch-icon-card {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  cursor: pointer;
}

</style>
