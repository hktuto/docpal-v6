<template>
  <div style="height: 100%; overflow: auto" v-if="masterTableDetail">
    <div class="tableHeader">
      <el-button id="MasterTable__Tables__Detail__Schema__Add" type="primary" @click="handleSingleSchemaAdd">
        {{ $t('common_add') }}
      </el-button>
    </div>
    <VxeGrid ref="tableRef" v-bind="tableConfig">
      <template #columnName="{ row }">
        <div class="masterTable-columnName">
          <span>{{ row.columnName }}</span>
          <div v-if="row.unique && !isDefault(row)" class="column-dynamic" style="--column-color: #0099ff">
            <div class="column-dynamic-point"></div>
            {{ $t('marsterTable.unique') }}
          </div>
          <div v-else-if="row.required && !isDefault(row)" class="column-dynamic" style="--column-color: #7b61ff">
            <div class="column-dynamic-point"></div>
            {{ $t('marsterTable.required') }}
          </div>
        </div>
      </template>
      <template #dataType="{ row }">
        {{
          row.dataType === 'varchar' && row.length === 4000 ? $t(`marsterTable.type.${row.dataType}:${row.length}`) : $t(`marsterTable.type.${row.dataType}`)
        }}
        <template v-if="row.relationTable">
          -
          <el-tag round> {{ row.relationTable }}</el-tag>
          -
          <el-tag round> {{ row.relationField }}</el-tag>
          <!-- - <el-tag> {{ row.displayField }}</el-tag> -->
        </template>
      </template>
    </VxeGrid>
    <MasterTableNewSchemaDialog ref="schemaDialogRef" type="again" disabledUniqueList="" @add="handleAddSchama" />
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { getIgnoreSchemas } from '~/utils/masterTableProvider'

const emits = defineEmits(['refresh'])
const props = defineProps(['masterTableDetail', 'tableId'])
const state = reactive<any>({
  dataTypeList: []
})

const defaultList = getIgnoreSchemas()

function isDefault(row: any) {
  return defaultList.includes(row.columnName)
}

const schemaDialogRef = ref()

function handleSingleSchemaAdd() {
  schemaDialogRef.value.handleOpen()
}

const tableConfig = ref<any>({
  id: 'masterTableTableSetting',
  columns: [
    {
      field: 'columnName',
      title: 'masterTable.columnName',
      fixed: 'left',
      slots: {
        default: 'columnName'
      }
    },
    {
      field: 'dataType',
      title: 'masterTable.dataType',
      slots: {
        default: 'dataType'
      }
    }
  ]
})

async function handleAddSchama(schema: any) {
  try {
    await clientApi.api.postDmsMasterTableColumnAdd({
      id: props.tableId,
      ...schema
    })
    emits('refresh')
    
  } catch (error) {
    
  }
}

watch(
  () => props.masterTableDetail,
  (newVal) => {
    if (!newVal) return
    tableConfig.value.data = newVal.fields
  }
)
defineExpose({})
</script>

<style lang="scss" scoped>
:deep(.tableHeader) {
  width: 100%;
  display: flex;
  margin-bottom: 10px;
  justify-content: flex-end;
}

.masterTable-columnName {
  display: flex;
  gap: var(--app-space-xs);
}

.column-dynamic {
  color: var(--column-color);
  display: flex;
  align-items: center;

  &-point {
    width: 8px;
    height: 8px;
    margin-left: 3px;
    border-radius: 50%;
    background-color: var(--column-color);
  }
}
</style>
