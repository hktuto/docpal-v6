<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const { mapping } = defineProps<{
  mapping: any
}>()

interface OutputMappingRow {
  key: string
  value: string
}
const tableData = ref<OutputMappingRow[]>([])
const emits = defineEmits(['update'])
const { t } = useI18n()
const dialogVisible = ref(false)
const createMapping = ref<{
  key: string
}>({
  key: ''
})
const { getVariablesByDisplayTypes } = useVariablesProvide()
const allFields = computed(() => {
  const set = new Set(tableData.value.filter((item: any) => item.value !== '').map((item: any) => item.value))
  return getVariablesByDisplayTypes([]).filter((item: any) => !item.id.startsWith('__system__') && !set.has(item.id))
})

function open() {
  tableData.value = Object.entries(mapping).map(([value, key]) => {
    const m = String(key).match(/^\$\{(.+)\}$/)
    const inner = m?.[1] ?? key
    return { value, key: inner }
  })

  dialogVisible.value = true
}

function handleCreate() {
  const key = createMapping.value.key.trim()
  if (!key || key === '') return

  const find = tableData.value.find((item: any) => item.key === key)
  if (!!find) {
    routerProvider?.message.error('Key already exists')
    return
  }

  tableData.value.push({
    key: key,
    value: ''
  })
  createMapping.value.key = ''
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

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="t('Add Mapping')" append-to-body :close-on-click-modal="false">
    <div>
      <el-input v-model="createMapping.key" style="max-width: 600px" placeholder="Please input Response Key">
        <template #append>
          <el-button @click="handleCreate" style="background-color: #1dd6c3; color: #ffffff">Add Response Key</el-button>
        </template>
      </el-input>

      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column :label="t('Response Key')" prop="key">
          <template #default="{ row, $index }">
            {{ row.key }}
          </template>
        </el-table-column>
        <el-table-column :label="t('Response Value')" prop="value">
          <template #default="{ row, $index }">
            <el-select v-model="row.value">
              <el-option v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
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
