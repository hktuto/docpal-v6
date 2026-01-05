<script lang="ts" setup>
import { clientApi } from 'api'
import type { Node } from '@antv/x6'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
if (!graphProvider) {
  throw new Error('Missing provider')
}
const editorProvider = inject(EDITOR_PROVIDER)
const { setBpmnRules, getBpmnRuleType, bpmnGlobalRules } = editorProvider.BpmnRule
const masterTableFields = ref([])
const allFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.map((item) => {
    return {
      name: item.name,
      id: item.id
    }
  })
})

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item) => {
    return {
      name: item.name,
      id: item.id
    }
  })
})

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}

const allMasterTables = ref([])

async function getMasterTableList() {
  const data = await clientApi.api.postDmsMasterTablePage({ pageSize: 100 }).then(r => r.data)
  allMasterTables.value = data.entryList.map((item) => ({
    id: item.id,
    name: item.name
  }))
}

const form = ref({
  attr_allowUpdate: '',
  attr_masterTableId: '',
  attr_workflowInfo: '',
  attr_tableColumn: '',
  attr_masterTableReturnId: '',
  attr_formProperty: '',
  field: []
})

async function refreshData() {
  const data = node.getData()
  if (data.data.extensionElements['flowable:mastertableRecord']) {
    form.value = data.data.extensionElements['flowable:mastertableRecord']
  }

  const find = allMasterTables.value.find((item: any) => item.id == form.value.attr_masterTableId)
  if (!find) {
    return
  }

  if (form.value.attr_masterTableId) {
    const data = await clientApi.api.getDmsMasterTableId(form.value.attr_masterTableId).then(r => r.data)
    allColumnInMasterTable.value = data.fields
  }
}

const ignoreList = ['id', 'created_date', 'created_by', 'modified_date', 'status', 'modified_by']
const allColumnInMasterTable = ref([])

async function masterTableIdChange(newId) {
  if (newId) {
    // get all columns from master table
    const data = await clientApi.api.getDmsMasterTableId(newId).then(r => r.data)
    masterTableFields.value = data.fields
    const fields = [...data.fields].filter((item) => !ignoreList.includes(item.columnName))
    form.value.field = fields.map((column) => {
      return {
        attr_formProperty: '',
        attr_tableColumn: column.columnName
      }
    })
  } else {
    form.value.field = []
    allColumnInMasterTable.value = []
  }
  refreshData()
}

async function getMasterTableFields() {
  const data = await clientApi.api.getDmsMasterTableId(form.value.attr_masterTableId).then(r => r.data)
  masterTableFields.value = data.fields
  return data
}

function updateData() {
  const data = node.getData()
  const newData = {
    ...data,
    version: data.version + 1 || 1,
    data: {
      ...data.data,
      extensionElements: {
        ...data.data.extensionElements,
        'flowable:mastertableRecord': form.value
      }
    }
  }
  node.setData(newData, { overwrite: true, deep: true })
}

async function importFields() {
  if (masterTableFields.value.length === 0) {
    await getMasterTableFields()
  }
  const defaultFields = ['id', 'modified_by', 'modified_date', 'created_by', 'created_date', 'status']
  const rules = masterTableFields.value
    .filter((item) => !defaultFields.includes(item.columnName))
    .filter((item) => bpmnGlobalRules.value.findIndex((rule) => rule.id === item.columnName) === -1)
    .map((item) => {
      const params: any = {}
      if (item.relationTable) {
        params.masterTableName = item.relationTable
        params.displayColumn = item.displayField
        params.valueColumn = item.relationField
        params.type = 'mastertable'
        params.isMultiple = false
      }
      if (item.maxLength) {
        params.maxLength = item.maxLength
      }
      return {
        id: item.columnName,
        name: item.columnName,
        type: getType(item.type),
        ...params
      }
    })
  if (rules.length === 0) {
    ElMessage.info(t('dpMsg_noDataUpdate'))
    return
  }
  await setBpmnRules(rules)
  form.value.field = bpmnGlobalRules.value.map((column) => {
    return {
      attr_formProperty: column.id,
      attr_tableColumn: column.id
    }
  })

  await refreshData()

  function getType(type: string) {
    switch (type) {
      case 'timestamp':
      case 'date':
        return 'date'
      case 'boolean':
        return 'boolean'
      case 'bigint':
      case 'decimal':
      case 'number':
        return 'long'
      default:
        return 'text'
    }
  }
}

watch(() => node, async () => {
  await refreshData()
}, {
  immediate: true,
  deep: true
})

onMounted(async () => {
  await getMasterTableList()
  setUpListener()
  await refreshData()
})
</script>

<template>
  <div class="formContainer">
    <BpmnSidebarEditLabel :node="node" />
    <div class="formContainer">
      <ElForm :model="form" label-position="top" ref="formRef" :disabled="editorProvider.readonly.value">
        <ElFormItem label="Allow Update">
          <ElSwitch v-model="form.attr_allowUpdate" @change="updateData"></ElSwitch>
        </ElFormItem>
        <ElFormItem label="Master Table:">
          <ElSelect v-model="form.attr_masterTableId" placeholder="Master Table" @change="masterTableIdChange">
            <ElOption v-for="item in allMasterTables" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Workflow Info">
          <ElSelect v-model="form.attr_workflowInfo" placeholder="Workflow Info" @change="updateData">
            <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Record Column">
          <ElSelect v-model="form.attr_tableColumn" :placeholder="t('common_selectOccupancyContent')"
                    @change="updateData">
            <ElOption v-for="item in allColumnInMasterTable" :key="item.columnName" :label="item.columnName"
                      :value="item.columnName" />
          </ElSelect>
        </ElFormItem>
        <el-form-item label="Return Column ID">
          <el-select v-model="form.attr_masterTableReturnId" :placeholder="t('common_selectOccupancyContent')"
                     @change="updateData">
            <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <ElDivider />
        <h4>
          Fields
          <el-button v-if="form.attr_masterTableId" size="small" type="primary" @click="importFields">Auto Import
          </el-button>
        </h4>
        <ElFormItem v-for="item in form.field" :key="item.attr_tableColumn" :label="item.attr_tableColumn">
          <ElSelect v-model="item.attr_formProperty" placeholder="Field" @change="updateData" filterable>
            <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>
