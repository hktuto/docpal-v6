<script setup lang="ts">
import type { Node } from '@antv/x6'
import { newAdminApi, newClientApi } from 'api'
import type { VariableItem } from '@packages/workflow/composables/useWorkflowVariables'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { getVariablesByDisplayTypes } = useVariablesProvide()
const databaseId = ref<string>('')
const tableId = ref<string>('')
const returnRecordList = ref<string>('')
const dataList = ref<string>('')
const recordId = ref<string>('')
const dataBaseList = ref<
  {
    id: string
    name: string
  }[]
>([])
const tableList = ref<
  {
    id: string
    name: string
  }[]
>([])
const tableFieldList = ref<
  {
    id: string
    name: string
    value: string
    type: string
    field_type: string
    isRequired: boolean
    isUnique: boolean
  }[]
>([])
const arrayVariables = computed(() => {
  return getVariablesByDisplayTypes(['array'], true)
})
const arrayVariableOption = ref<any[]>([])
const fieldsList = ref<string[]>([])
const updateFieldsList = computed(() => {
  return fieldsList.value.map((fieldId: string) => tableFieldList.value.find((item: any) => item.id === fieldId)).filter(Boolean)
})

function getArrayVariables(field_type: string) {
  let displayTypeList: string[]
  switch (field_type) {
    case 'varchar':
      displayTypeList = ['text', 'date']
      break
    case 'numeric':
      displayTypeList = ['number']
      break
    case 'timestamp':
      displayTypeList = ['timestamp']
      break
    case 'array':
      displayTypeList = ['array']
      break
    default:
      displayTypeList = []
  }
  return arrayVariableOption.value.filter((item: any) => displayTypeList.includes(item.display_type))
}

async function init() {
  const data = node.getData()
  fieldsList.value = []
  tableFieldList.value = []
  recordId.value = ''
  dataList.value = ''
  databaseId.value = data.metadata.databaseId
  if (databaseId.value !== '') {
    await getTableList()
  }

  const { pathname } = new URL(data.config.http_request.url)
  const match = pathname.match(/\/table\/([^\/]+)\/record\/batch-transactional\/?$/)
  tableId.value = match ? match[1] : ''

  if (tableId.value !== '') {
    await getTableConfig()
    const body = data.config.http_request.body
    recordId.value = body.mapping['id'] || ''
    dataList.value = body.data
    getArrayVariablesOption()

    tableFieldList.value = tableFieldList.value.map((item: any) => {
      if (item.id in body.mapping) {
        item.value = body.mapping[item.id]
      }
      return item
    })

    fieldsList.value = Object.keys(body.mapping).filter((item) => item !== 'id')
  }

  const keys = Object.keys(data.config.output_mapping)
  if (keys.length > 0) {
    keys.forEach((key: string) => {
      if (data.config.output_mapping[key] == '${data.insertedData}') {
        returnRecordList.value = key
      }
    })
  } else {
    returnRecordList.value = ''
  }
}

const path = ref('/apis/v1/dynamic-db/table/{tableID}/record/batch-transactional')

function update() {
  graphProvider?.graph.value?.startBatch('batch-update-dynamic-database-data')

  const nodeData = node.getData()
  const origin = new URL(nodeData.config.http_request.url).origin
  const newUrl = origin + path.value.replace('{tableID}', tableId.value)

  const mapping: any = {
    id: recordId.value
    // id: '${id}'
  }

  updateFieldsList.value.forEach((item: any) => {
    if (item.value !== '') {
      mapping[item.id] = item.value
    }
  })

  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      http_request: {
        ...nodeData.config.http_request,
        url: newUrl,
        body: {
          mapping: mapping,
          data: dataList.value
        }
      },
      input_mapping: {},
      output_mapping: {}
    },
    metadata: {
      ...nodeData.metadata,
      databaseId: databaseId.value
    },
    version: (nodeData.version || 0) + 1
  }

  if (!!returnRecordList.value && returnRecordList.value !== '') {
    newData.config.output_mapping = {
      [returnRecordList.value]: '${data.insertedData}'
    }
  }

  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('batch-update-dynamic-database-data')
}

async function changeDataBase() {
  tableId.value = ''
  tableFieldList.value = []
  await getTableList()
  update()
}

async function changeTable() {
  await getTableConfig()
  update()
}

async function getDataBaseList() {
  try {
    const parms = {
      status: 'A',
      pageNum: 0,
      pageSize: 1000
    }
    const data: any = await newAdminApi.postDynamicDbCaseTypesPage(parms).then((r: any) => r.data)
    dataBaseList.value = data.entryList
  } catch (e) {
    console.log(e)
  }
}

async function getTableList() {
  try {
    const pageParams = {
      status: 'A',
      filters: {
        entity_id: databaseId.value
      },
      pageNum: 0,
      pageSize: 1000
    }
    tableList.value = await newClientApi.getDynamicDbTableList(pageParams).then((r: any) => r.data)
  } catch (e) {
    console.log(e)
  }
}

async function getTableConfig() {
  try {
    const data = await newClientApi
      .getDocpalMasterTableUserConfig({
        tableId: tableId.value,
        userId: 'master'
      })
      .then((r: any) => r.data)

    tableFieldList.value = data.tableFields
      .map((item: any) => ({
        id: item.field_name,
        name: item.field_name_alias,
        type: item.validation_rules.type,
        field_type: item.field_type,
        isRequired: item.is_required,
        isUnique: item.is_unique,
        value: ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (e) {
    console.log(e)
  }
}

function handleDataListChange() {
  getArrayVariablesOption()
  update()
}

function getArrayVariablesOption() {
  if (!dataList.value) return

  const anyObject = arrayVariables.value.find((item: any) => item.id === dataList.value) as VariableItem

  if (!!anyObject && anyObject?.items?.type === 'object') {
    // 移除 'field.name' 為 'id' 的字段
    arrayVariableOption.value = Object.entries(anyObject.items.properties)
      // .filter(([, field]) => field.name !== 'id')
      .map(([id, field]) => ({
        id,
        name: field.name,
        type: field.type,
        display_type: field.display_type,
        required: field.required
      }))
  }
}

onMounted(async () => {
  await getDataBaseList()
})

watch(
  () => node,
  async () => {
    if (node) {
      await init()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top">
    <el-form-item label="DataBase">
      <el-select v-model="databaseId" filterable @change="changeDataBase">
        <el-option v-for="item in dataBaseList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Table">
      <el-select v-model="tableId" filterable @change="changeTable">
        <el-option v-for="item in tableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <!--    <el-form-item label="Return Record List">-->
    <!--      <el-select v-model="returnRecordList" filterable clearable @change="update">-->
    <!--        <el-option v-for="item in recoderVariables" :key="item.id" :label="item.name" :value="item.id" />-->
    <!--      </el-select>-->
    <!--    </el-form-item>-->
    <el-form-item label="Data List">
      <el-select v-model="dataList" filterable clearable @change="handleDataListChange">
        <el-option v-for="item in arrayVariables" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-divider />

    <el-form-item label="Recoder ID">
      <el-select v-model="recordId" filterable clearable @change="update">
        <el-option v-for="item in getArrayVariables('varchar')" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item label="Add Fields">
      <el-select v-model="fieldsList" :placeholder="t('common_selectOccupancyContent')" multiple collapse-tags collapse-tags-tooltip filterable>
        <el-option v-for="item in tableFieldList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider v-if="updateFieldsList.length > 0" />

    <template v-for="field in updateFieldsList">
      <el-form-item :label="field.name">
        <el-select v-model="field.value" filterable clearable @change="update">
          <el-option v-for="item in getArrayVariables(field.field_type)" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
