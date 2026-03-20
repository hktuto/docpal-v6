<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const { mapping } = defineProps<{
  mapping: any
}>()

const mappingTypeList = ref([
  { label: 'String', value: 'string' },
  { label: 'Array', value: 'array' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object', value: 'object' }
])

interface OutputMappingRow {
  key: string
  value: string
  // type: string
}

const tableData = ref<OutputMappingRow[]>([])
const emits = defineEmits(['update'])
const { t } = useI18n()
const dialogVisible = ref(false)
const createMapping = ref<{
  key: string
  // type: string
}>({
  key: '',
  // type: 'string'
})
const { getVariablesByType } = useVariablesProvide()
const stringFields = computed(() => {
  return getVariablesByType('string')
})

function open() {
  tableData.value = Object.entries(mapping).map(([key, value]) => ({
    key,
    value,
    // type: 'string'
  }))
  dialogVisible.value = true
}

function handleCreate() {
  const key = createMapping.value.key.trim()
  if (!key || key === '') return

  const find = tableData.value.find((item: any) => item.key === `${key}_budget`)
  if (!!find) {
    routerProvider?.message.error('Key already exists')
    return
  }

  tableData.value.push({
    key: `${key}_budget`,
    value: '',
    // type: createMapping.value.type
  })
  createMapping.value.key = ''
  createMapping.value.type = 'string'
}

function handleDelete(index: number) {
  tableData.value.splice(index, 1)
}

function handleSubmit() {
  const filter = tableData.value.filter((item: any) => item.value === '')
  if (filter.length > 0) {
    routerProvider?.message.error('Value Cannot be empty')
    return
  }

  const result = tableData.value.reduce((acc, { key, value }) => {
    acc[key] = value
    return acc
  }, {})
  emits('update', result)
  dialogVisible.value = false
}

function handleKey(key: string) {
  return key.replace(/_budget$/, '')
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="t('Add Mapping')" append-to-body :close-on-click-modal="false">
    <div>
      <el-input v-model="createMapping.key" style="max-width: 600px" placeholder="Please input Key">
<!--        <template #prepend>-->
<!--          <el-select v-model="createMapping.type" style="width: 115px">-->
<!--            <el-option v-for="item in mappingTypeList" :key="item.value" :label="item.label" :value="item.value" />-->
<!--          </el-select>-->
<!--        </template>-->
        <template #append>
          <el-button @click="handleCreate" style="background-color: #1dd6c3; color: #ffffff">Add Mapping</el-button>
        </template>
      </el-input>

      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column :label="t('Key')" prop="key">
          <template #default="{ row, $index }">
            {{ handleKey(row.key) }}
          </template>
        </el-table-column>
<!--        <el-table-column :label="t('Type')" prop="type">-->
<!--          <template #default="{ row, $index }">-->
<!--            {{ row.type }}-->
<!--          </template>-->
<!--        </el-table-column>-->
        <el-table-column :label="t('Value')" prop="value">
          <template #default="{ row, $index }">
            <el-select v-model="row.value">
              <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column align="right" :label="t('dpTable_actions')">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleDelete(scope.$index)">
              {{ t('common_delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleSubmit"> {{ t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
