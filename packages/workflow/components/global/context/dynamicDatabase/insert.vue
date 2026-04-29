<script setup lang="ts">
import { newAdminApi, newClientApi } from 'api'
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { getVariablesByType } = useVariablesProvide()
const databaseId = ref<string>('')
const tableId = ref<string>('')
const dataId = ref<string>('')
const dataBaseList = ref([])
const tableList = ref([])
const tableFieldList = ref([])
const outputMapping = ref({
  [dataId.value]: '${data}'
})

function getVariables(status: string) {
  let type: VariableItemType
  switch (status) {
    case 'integer':
      type = 'number'
      break
    case 'number':
      type = 'number'
      break
    default:
      type = 'string'
  }
  return getVariablesByType([type], true)
}

async function init() {
  const data = node.getData()
  databaseId.value = data.metadata.databaseId
  if (databaseId.value !== '') {
    await getTableList()
  }

  const { pathname } = new URL(data.config.url)
  const match = pathname.match(/\/table\/([^/]+)\/record\/?$/)
  tableId.value = match ? match[1] : ''
  if (tableId.value != '') {
    await getTableConfig()
  }

  // Set tableFieldList data
  if (tableId.value !== '') {
    const dataVariable = data.config.body.data
    tableFieldList.value = tableFieldList.value.map((item: any) => {
      if (item.id in dataVariable) {
        item.value = dataVariable[item.id]
      }
      return item
    })
  }

  if (!!data.config.output_mapping) {
    outputMapping.value = Object.fromEntries(Object.entries(data.config?.output_mapping).map(([k, v]) => [v, k]))
  }
}

const path = ref('/apis/v1/dynamic-db/table/{tableID}/record')

function update() {
  graphProvider?.graph.value?.startBatch('update-insert-dynamic-database-data')
  const nodeData = node.getData()
  const origin = new URL(nodeData.config.url).origin
  const newUrl = origin + path.value.replace('{tableID}', tableId.value)

  const data: any = {}

  tableFieldList.value.forEach((item: any) => {
    data[item.id] = item.value
  })

  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      url: newUrl,
      body: { data: data },
      output_mapping: Object.fromEntries(Object.entries(outputMapping.value).map(([k, v]) => [v, k]))
    },
    metadata: {
      ...nodeData.metadata,
      databaseId: databaseId.value
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-insert-dynamic-database-data')
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
    const data = await newAdminApi.postDynamicDbCaseTypesPage(parms).then((r: any) => r.data)
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
    const data = await newAdminApi.postDynamicDbTablePage(pageParams).then((r: any) => r.data)
    tableList.value = data.entryList
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

    tableFieldList.value = data.tableFields.map((item: any) => ({
      id: item.field_name,
      name: item.field_name_alias,
      type: item.validation_rules.type,
      isRequired: item.is_required,
      isUnique: item.is_unique,
      value: ''
    }))
  } catch (e) {
    console.log(e)
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
    <el-form-item label="Return Recorde Id">
      <el-select v-model="dataId" filterable clearable>
        <el-option v-for="item in getVariables('string')" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-divider />

    <template v-for="item in tableFieldList">
      <el-form-item :label="item.name">
        <el-select v-model="item.value" filterable clearable @change="update">
          <el-option v-for="item in getVariables(item.type)" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
