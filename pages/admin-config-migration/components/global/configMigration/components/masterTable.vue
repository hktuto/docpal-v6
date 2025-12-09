<script setup lang="ts">
import { adminApi } from 'api'

const props = defineProps<{
  masterTableList: any[]
}>()

function handleOpenEditDialog(item: any) {
  console.log('item', item)
}

type masterTableItem = {
  oldId: string,
  newId: string,
  fields: any[]
}

const masterTableList = ref<masterTableItem[]>([])

async function handleCreateMasterTable() {

  for (const item of Object.values(props.masterTableList)) {
    const createFields = item.fields.map((fieldItem: any) => {
      const fieldName = fieldItem.columnName
      let dataType

      switch (fieldItem.dataType) {
        case 'varchar':
          dataType = `${fieldItem.dataType}:${fieldItem.length}`
          break
        case 'text':
          dataType = 'clob'
          break
        case  'longtext':
          dataType = 'clob'
          break
        case 'timestamp':
          dataType = fieldItem.dataType
          break
        case 'bit':
          dataType = 'boolean'
          break
        case 'bigint':
          dataType = 'bigint'
          break
        case 'json':
          dataType = 'json'
          break
        case 'decimal':
          dataType = 'decimal'
          break
        default:
          dataType = fieldItem.dataType
          break
      }

      return {
        fieldName,
        dataType,
        required: fieldItem.required,
        unique: fieldItem.unique
      }
    })

    const data = await adminApi.api.postMasterTables({
      name: item.name,
      fields: createFields
    }).then(r => r.data)

    masterTableList.value.push({
      oldId: item.id,
      newId: data.id,
      fields: createFields
    })
  }

  return masterTableList.value
}

defineExpose({
  handleCreateMasterTable
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.masterTableList" :key="item.key">
      <el-col :span="5">
        <el-card style="min-height: 200px; max-height: 200px;" @dblclick="handleOpenEditDialog(item)">
          <template #header>
            <div class="card-header">
              <h4>{{ item.name }}</h4>
            </div>
          </template>
          <div class="tag-container">
            <el-tag v-for="fieldItem in item.fields" :key="fieldItem.label" size="small">
              {{ fieldItem.columnName }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.tag-container {
  display: flex;
  flex-wrap: wrap;
  max-height: 130px;
  overflow-y: auto;
  gap: 2px;
}

.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}

.tableContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}
</style>
