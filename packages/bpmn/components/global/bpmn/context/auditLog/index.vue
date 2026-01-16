<script setup lang="ts">
import type { Node } from '@antv/x6'
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule
const caseList = ref([])

async function getCaseLise() {
  try {
    const data: any = await clientApi.api.getCaseTypes({ deployed: true }).then((r: any) => r.data)
    caseList.value = data.map((item: any) => {
      return {
        id: item.id,
        name: item.name
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const masterTableList = ref([])

function handelFieldOrValue(status: string) {
  if ('activities' === status) {
    form.value.activities.value = ''
  } else {
    form.value.status.value = ''
  }
}

async function getMasterTableList() {
  const data = await clientApi.api.postDmsMasterTablePage({ pageSize: 1000 }).then(r => r.data)
  masterTableList.value = data.entryList.map((item: any) => ({
    id: item.id,
    name: item.name
  }))
}

const tableData = ref<any[]>([])

const categoryFields = ref([
  { id: 'case', name: 'Case' },
  { id: 'masterTable', name: 'Master Table' }
])

const allFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const form = ref<any>({
  activities: {
    status: '',
    value: ''
  },
  status: {
    status: '',
    value: ''
  }
})

const list = ['userId', 'uniqueIdentifier', 'category', 'id']

function init() {
  const fields = node.getData().data.extensionElements['flowable:field']
  fields.forEach((item: any) => {
    if (!list.includes(item.attr_name)) {
      form.value[item.attr_name] = {
        status: item.attr_status === 'field',
        value: item['flowable:expression'].__cdata
      }

      tableData.value.push({
        id: item.attr_name,
        name: item.attr_label
      })
    } else {
      form.value[item.attr_name] = item['flowable:expression'].__cdata
    }
  })
}

function handelCategoryChange() {
  form.value.id = ''
  form.value.uniqueIdentifier = ''
  updateData()
}

const showDialog = ref(false)

function openAddColumnsDialog() {
  showDialog.value = true
}

const newColumnName = ref('')

function handleAddColumns() {
  if (!newColumnName.value || '' === newColumnName.value) {
    return
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(newColumnName.value)) {
    ElMessage.error('Only English letters, numbers and single space are allowed')
    return
  }

  if (/\s{2,}/.test(newColumnName.value) || (newColumnName.value.match(/ /g) || []).length > 1) {
    ElMessage.error('Only one space is allowed')
    return
  }

  const index = tableData.value.findIndex((item: any) => item.name === newColumnName.value)
  if (index !== -1) {
    ElMessage.error('Column name already exists')
    return
  }

  const name = newColumnName.value.trim()
  const camelCaseId = name.includes(' ')
    ? name.split(' ').filter((w) => w).map((word, i) =>
      i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('')
    : name.toLowerCase()
  const id = `${camelCaseId}${Date.now()}`
  tableData.value.push({
    id: id,
    name: newColumnName.value
  })
  newColumnName.value = ''

  form.value[id] = ''
  updateData()
}

function deleteRow(index: number) {
  delete form.value[tableData.value[index].id]
  tableData.value.splice(index, 1)
  updateData()
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-auditLog-field-data')
  const nodeData = node.getData()

  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    data: {
      ...nodeData.data,
      extensionElements: {
        ...nodeData.data.extensionElements
      }
    }
  }

  const fields = newData.data.extensionElements['flowable:field']

  // update and insert
  Object.keys(form.value).forEach((key: any) => {
    const field = fields.find((item: any) => item.attr_name === key)
    if (field) {
      if (!list.includes(field.attr_name)) {
        field.attr_status = form.value[key].status ? 'field' : 'value'
        field['flowable:expression'].__cdata = form.value[key].value
      } else {
        field['flowable:expression'].__cdata = form.value[key]
      }
    }
    // else {
    //     const label = tableData.value.find((item: any) => item.id == key).name
    //     fields.push({
    //       attr_name: key,
    //       attr_label: label,
    //       'flowable:expression': {
    //         __cdata: form.value[key]
    //       }
    //     })
    //   }
  })
  // delete
  // fields.forEach((item: any) => {
  //   if (!Object.keys(form.value).includes(item.attr_name)) {
  //     fields.splice(fields.indexOf(item), 1)
  //   }
  // })

  newData.data.extensionElements['flowable:field'] = fields

  node.setData(newData, {
    overwrite: true,
    deep: true
  })

  graphProvider?.graph.value?.stopBatch('update-auditLog-field-data')
}

watch(() => node, async () => {
  init()
}, {
  immediate: true,
  deep: true
})

onMounted(async () => {
  await getCaseLise()
  await getMasterTableList()
  init()
})
</script>

<template>
  <BpmnSidebarEditLabel :node="node" />

  <h4>Audit Log</h4>
  <el-form label-position="top" :disabled="editorProvider.readonly.value">
    <el-form-item label="Operator" required>
      <el-select v-model="form.userId" filterable :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Category">
      <el-select v-model="form.category" :placeholder="t('common_selectedIsRequiredMsg')"
                 @change="handelCategoryChange">
        <el-option v-for="item in categoryFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item v-if="form.category=='case'" label="Case ID" required>
      <el-select v-model="form.uniqueIdentifier" @change="updateData">
        <el-option v-for="item in caseList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="form.category=='masterTable'" label="Master Table ID" required>
      <el-select v-model="form.uniqueIdentifier">
        <el-option v-for="item in masterTableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item :label="form.category === 'case' ? 'Case Record ID' : 'Master Table Record ID'" required>
      <el-select v-model="form.id" filterable :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />

    <el-form-item>
      <template #label>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <label class="label"> {{ t('Activities') }}</label>
          <el-switch v-model="form.activities.status" size="small" active-text="Field" inactive-text="Value"
                     @change="handelFieldOrValue('activities')" />
        </div>
      </template>
      <el-select v-if="form.activities.status" v-model="form.activities.value" filterable @change="updateData"
                 :placeholder="t('common_selectOccupancyContent')">
        <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-input v-else v-model="form.activities.value" @change="updateData" />
    </el-form-item>
    <el-form-item>
      <template #label>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <label class="label"> {{ t('Status') }}</label>
          <el-switch v-model="form.status.status" size="small" active-text="Field" inactive-text="Value"
                     @change="handelFieldOrValue('status')" />
        </div>
      </template>
      <el-select v-if="form.status.status" v-model="form.status.value" filterable @change="updateData"
                 :placeholder="t('common_selectOccupancyContent')">
        <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-input v-else v-model="form.status.value" @change="updateData" />
    </el-form-item>

    <!--    <div style="display: flex; justify-content: space-between; align-items: center;">-->
    <!--      <h4>Columns</h4>-->
    <!--      <el-button @click="openAddColumnsDialog" type="primary">Create Column</el-button>-->
    <!--    </div>-->
    <!--    <template v-for="item in tableData" :key="item.id">-->
    <!--      <el-form-item :label="item.name">-->
    <!--        <el-select v-model="form[item.id]" clearable filterable :placeholder="t('common_selectOccupancyContent')"-->
    <!--                   @change="updateData">-->
    <!--          <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />-->
    <!--        </el-select>-->
    <!--      </el-form-item>-->
    <!--    </template>-->
  </el-form>

  <!--  <el-dialog v-model="showDialog" calss="big" :label="t('Add Columns')" append-to-body>-->
  <!--    <template #header>-->
  <!--      <h4>Add Columns Name</h4>-->
  <!--    </template>-->

  <!--    <el-form-item label="Column Name">-->
  <!--      <div style="width: 100%; display: flex;  align-items: center;">-->
  <!--        <el-input v-model="newColumnName" />-->
  <!--        <el-button type="primary" @click="handleAddColumns">Add Column</el-button>-->
  <!--      </div>-->
  <!--    </el-form-item>-->

  <!--    <el-table :data="tableData" style="width: 100%" max-height="300">-->
  <!--      <el-table-column prop="id" label="ID" width="220" />-->
  <!--      <el-table-column prop="name" label="Name" width="220" />-->
  <!--      <el-table-column fixed="right" label="Operations" min-width="120">-->
  <!--        <template #default="scope">-->
  <!--          <el-button link type="primary" size="small" @click.prevent="deleteRow(scope.$index)">-->
  <!--            Remove-->
  <!--          </el-button>-->
  <!--        </template>-->
  <!--      </el-table-column>-->
  <!--    </el-table>-->
  <!--  </el-dialog>-->
</template>

<style scoped lang="scss">
.label::before {
  content: "*";
  color: var(--el-color-danger);
  margin-right: 4px;
}

:deep .el-form-item--label-top {
  .el-form-item__label {
    width: 100%;
  }
}
</style>
