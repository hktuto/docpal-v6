<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElSwitch } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const { t } = useI18n()
const props = defineProps<{ modelValue: { columns: any[]; rows: string[][] } }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: { columns: any[]; rows: string[][] }): void }>()
const bordered = ref<boolean>(props.modelValue?.bordered ?? true)
const striped = ref<boolean>(props.modelValue?.striped ?? false)
const stripedColor = ref<string>(props.modelValue?.StripedColor ?? '#C0C6C8')
const sort = ref<string>(props.modelValue?.sort ?? 'Default')
const sortBy = ref<boolean>(props.modelValue?.sortBy ?? true)
const columns = ref<any[]>(
  props.modelValue?.columns
    ? [...props.modelValue.columns]
    : [
        {
          name: 'Column 1',
          align: 'left',
          color: '#d3dbde',
          width: '',
          key: 'Col_1'
        }
      ]
)
const sortColumns = ref<any[]>(
  props.modelValue?.columns
    ? [...[{ name: 'Default', key: 'Default' }], ...props.modelValue.columns]
    : [
        { name: 'Default', key: 'Default' },
        { name: 'Column 1', key: 'Col_1' }
      ]
)

const rows = ref(props.modelValue?.rows ? props.modelValue.rows.map((r) => [...r]) : [[]])
const alignOptions = ref(['left', 'center', 'right'])
watch(
  () => props.modelValue,
  (v) => {
    columns.value = v?.columns
      ? [...v.columns]
      : [
          {
            name: 'Column 1',
            align: 'left',
            color: '#d3dbde',
            width: '',
            key: 'Col_1'
          }
        ]
    rows.value = v?.rows ? v.rows.map((r) => [...r]) : [[]]
  }
)

function addColumn() {
  const newCol = {
    name: `Column ${columns.value.length + 1}`,
    align: 'left',
    color: '#d3dbde',
    width: '',
    key: `Col_${columns.value.length + 1}`
  }
  columns.value.push(newCol)
  sortColumns.value.push(newCol)
  rows.value.forEach((row) => row.push(''))
  emitValue()
}

function removeColumn(idx: number) {
  if (columns.value.length === 1) return
  columns.value.splice(idx, 1)
  sortColumns.value.splice(idx, 1)
  rows.value.forEach((row) => row.splice(idx, 1))
  emitValue()
}

function moveColumn(idx: number, direction: number) {
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= columns.value.length) return
  // Swap columns
  const tempCol = columns.value[idx]
  columns.value[idx] = columns.value[newIdx]
  columns.value[newIdx] = tempCol
  rows.value.forEach((row) => {
    const tempCell = row[idx]
    row[idx] = row[newIdx]
    row[newIdx] = tempCell
  })
  emitValue()
}

function addRow() {
  rows.value.push(Array(columns.value.length).fill(''))
  emitValue()
}

function removeRow(idx: number) {
  rows.value.splice(idx, 1)
  emitValue()
}

watch(sort, (newValue, oldValue) => {
  if (newValue === 'Default') {
    return
  }

  if (newValue !== oldValue) {
    let index = columns.value.findIndex((column) => column.key === newValue)

    rows.value.sort((a, b) => {
      const aValue = a[index]
      const bValue = b[index]

      // 檢查兩個值是否都是數字
      const isANumber = typeof aValue === 'number'
      const isBNumber = typeof bValue === 'number'

      if (isANumber && isBNumber) {
        return !sortBy.value ? aValue - bValue : bValue - aValue
      } else {
        return !sortBy.value ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
    })
  }
})

watch(sortBy, (newValue, oldValue) => {
  if (sort.value === 'Default') {
    return
  }

  let index = columns.value.findIndex((column) => column.key === sort.value)

  rows.value.sort((a, b) => {
    const aValue = a[index]
    const bValue = b[index]

    // 檢查兩個值是否都是數字
    const isANumber = typeof aValue === 'number'
    const isBNumber = typeof bValue === 'number'

    if (isANumber && isBNumber) {
      return !newValue ? aValue - bValue : bValue - aValue
    } else {
      return !newValue ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
  })
})

function emitValue() {
  emit('update:modelValue', {
    columns: columns.value,
    rows: rows.value,
    bordered: bordered.value,
    striped: striped.value,
    stripedColor: stripedColor.value,
    sort: sort.value,
    sortBy: sortBy.value
  })
}
</script>

<template>
  <div class="table-editor">
    <div class="switch-container">
      <el-switch
        v-model="bordered"
        :active-text="t('docTemplate.variable.bordered')"
        :inactive-text="t('docTemplate.variable.borderless')"
        @change="emitValue"
      />
      <el-divider direction="vertical" />
      <el-switch v-model="striped" :active-text="t('docTemplate.variable.striped')" :inactive-text="t('docTemplate.variable.notStriped')" @change="emitValue" />
      <el-color-picker v-if="striped" v-model="stripedColor" color-format="hex" />
      <el-divider direction="vertical" />

      <div>
        {{ t('vxe.custom.setting.colSort') }}
        <el-select v-model="sort" style="width: 120px">
          <el-option v-for="(col, index) in sortColumns" :key="col.key" :label="col.name" :value="col.key" @change="emitValue">
            {{ col.name }}
          </el-option>
        </el-select>
      </div>
      <el-divider direction="vertical" />

      <el-switch v-model="sortBy" :active-text="t('docTemplate.variable.desc')" :inactive-text="t('docTemplate.variable.asc')" @change="emitValue" />
    </div>
    <div class="table-scroll-wrapper">
      <el-table :data="rows" class="table-scroll-wrapper__table">
        <el-table-column v-for="(col, colIdx) in columns" :key="colIdx" width="350px">
          <template #header>
            <div class="col-header">
              <el-input v-model="columns[colIdx].name" @input="emitValue" size="small" style="width: 130%" />
              <el-input v-model="columns[colIdx].key" size="small" />
              <el-select v-model="columns[colIdx].align" placeholder="Select" size="small" style="width: 120%">
                <el-option v-for="(item, index) in alignOptions" :key="index" :label="item" :value="item" />
              </el-select>
              <el-button :icon="ArrowLeft" @click="moveColumn(colIdx, -1)" circle size="small" v-tooltip="'Move left'" :disabled="colIdx === 0" />
              <el-button
                :icon="ArrowRight"
                @click="moveColumn(colIdx, 1)"
                circle
                size="small"
                v-tooltip="'Move right'"
                :disabled="colIdx === columns.length - 1"
              />
              <el-button icon="el-icon-delete" @click="removeColumn(colIdx)" circle size="small" v-tooltip="'Remove column'" :disabled="columns.length === 1" />
            </div>
          </template>
          <template #default="{ row, $index }">
            <el-input v-model="rows[$index][colIdx]" @input="emitValue" />
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="80">
          <template #default="{ $index }">
            <el-button icon="el-icon-delete" @click="removeRow($index)" circle size="small" v-tooltip="'Remove row'" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="table-controls">
      <el-button @click="addColumn" size="small" v-tooltip="t('docTemplate.variable.addColumn')">
        {{ t('docTemplate.variable.addColumn') }}
      </el-button>
      <el-button @click="addRow" size="small" v-tooltip="t('docTemplate.variable.addRow')">
        {{ t('docTemplate.variable.addRow') }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.switch-container {
  display: flex;
  align-items: center;
  gap: 22px;
}

.table-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.table-scroll-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;

  &__table {
    width: max-content;
    min-width: 100%;
  }

  :deep(.el-table__inner-wrapper::before) {
    content: none;
  }
}

.table-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
