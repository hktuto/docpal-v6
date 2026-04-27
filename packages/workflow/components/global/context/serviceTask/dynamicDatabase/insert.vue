<script setup lang="ts">
import { newClientApi } from 'api'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { getVariablesByType } = useVariablesProvide()

function getVariables(status: string) {
  return getVariablesByType([...status])
}
const Variables = computed(()=>{
  return getVariablesByType([...status])
})


const formData = ref<{
  databaseId: string
  tableId: string
  tableConfig: any[]
}>({
  databaseId: '',
  tableId: '',
  tableConfig: []
})

const dataBaseList = ref([])
const tableList = ref([])
const tableFieldList = ref([])

async function getDataBaseList() {
  try {
    formData.value.tableId = ''
    const parms = {
      pageNum: 0,
      pageSize: 1000
    }
    const data = await newClientApi.postDynamicDbCaseTypesPage(parms).then((r: any) => r.data)
    dataBaseList.value = data.entryList
  } catch (e) {
    console.log(e)
  }
}

async function getTableList() {
  try {
    formData.value.tableConfig = []
    const pageParams = {
      tableId: formData.value.databaseId,
      pageNum: 0,
      pageSize: 1000
    }
    // const data = await newClientApi.getDynamicDbTableList(pageParams).then((r: any) => r.data)
    const data = await newClientApi.postDynamicDbTablePage(pageParams).then((r: any) => r.data)
    tableList.value = data.entryList
  } catch (e) {
    console.log(e)
  }
}

async function getTableConfig() {
  try {
    const data = await newClientApi
      .getDocpalMasterTableUserConfig({
        tableId: formData.value.tableId,
        userId: 'master'
      })
      .then((r: any) => r.data)

    tableFieldList.value = data.tableFields.map((item: any) => ({
      id: item.field_name,
      name: item.field_name_alias,
      type: conversionType(item.field_type),
      isRequired: item.is_required,
      isUnique: item.is_unique
    }))
  } catch (e) {
    console.log(e)
  }
}

function conversionType(type: string) {
  let status

  switch (type) {
    case 'varchar':
      status = 'string'
      break
    default:
      status = 'string'
  }

  return status
}

onMounted(async () => {
  await getDataBaseList()
})
</script>

<template>
  <el-form label-position="top">
    <el-form-item label="DataBase">
      <el-select v-model="formData.databaseId" @change="getTableList" filterable>
        <el-option v-for="item in dataBaseList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Table">
      <el-select v-model="formData.tableId" @change="getTableConfig" filterable>
        <el-option v-for="item in tableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />

    <template v-for="item in tableFieldList">
      <el-form-item :label="item.name">
        <el-select v-model="item.value" filterable clearable>
          <el-option v-for="item in getVariables(item.type)" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
