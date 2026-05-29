<template>
  <el-dropdown trigger="click" placement="top" @command="handleMethodSelect" @click.stop>
    <div class="footer-count">
      <template v-if="selectedCountMethod !== 'none'">
        <span class="method-name">{{ t(`mdTable.countMethod.${selectedCountMethod}`) }}</span>
        <span class="count-value">{{ getCount(column.field, selectedCountMethod) }}</span>
        <el-icon class="dropdown-icon">
          <CaretBottom />
        </el-icon>
      </template>
      <template v-else>
        <span class="count-value--none">
          <span class="method-name">{{ t('mdTable.countMethod.statistics') }}</span>
          <el-icon class="dropdown-icon">
            <CaretBottom />
          </el-icon>
        </span>
      </template>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="method in availableMethods"
          :key="method.value"
          :command="method.value"
          :class="{ 'is-active': selectedCountMethod === method.value }"
        >
          <span class="method-label">{{ t(`mdTable.countMethod.${method.value}`) }}</span>
          <el-icon v-if="selectedCountMethod === method.value" class="check-icon">
            <Check />
          </el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import { Check, CaretBottom } from '@element-plus/icons-vue'
import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'
import { useMDTableInject } from '../../composables/useMDTable'
import type { CountMethod } from '../../types/count-type'

const { t } = useI18n()

interface Props {
  column: ColumnConfig
  row?: any
}

const props = defineProps<Props>()

// 统计方法配置
interface MethodOption {
  value: CountMethod
  numericOnly?: boolean // 仅数字类型可用
}
const { getAgg, getCount } = useCountInject()
// 所有统计方法
const allMethods = computed<MethodOption[]>(() => [
  { value: 'none' },
  { value: 'SUM', numericOnly: true },
  { value: 'MAX', numericOnly: true },
  { value: 'MIN', numericOnly: true },
  { value: 'AVG', numericOnly: true },
  { value: 'COUNT' },
  { value: 'BLANK_COUNT' },
  { value: 'FILLED_COUNT' },
  { value: 'UNIQUE_COUNT' },
  { value: 'BLANK_RATIO' },
  { value: 'FILLED_RATIO' },
  { value: 'UNIQUE_RATIO' }
])
const mdTable = useMDTableInject()
const gridRef = mdTable.gridRef
// Inject gridRef 来获取表格数据
// 判断是否为数字类型
const isNumericType = computed(() => {
  const type = props.column.business_type
  return [ColumnFieldType.Number, ColumnFieldType.Currency, ColumnFieldType.Percent, ColumnFieldType.AutoNumber, ColumnFieldType.Rating].includes(type)
})

// 根据列类型获取可用的统计方法
const availableMethods = computed(() => {
  if (isNumericType.value) {
    return allMethods.value
  } else {
    return allMethods.value.filter((method) => !method.numericOnly)
  }
})

function makeFlatData(data: any[], childKey: string) {
  let result: any = []
  data.forEach((item) => {
    if (item[childKey] && item[childKey].length > 0) {
      const child = makeFlatData(item[childKey], childKey)
      result.push(...child)
    }
    result.push(item)
  })
  return result
}
// 获取表格数据列表
const getTableData = (): any[] => {
  if (gridRef?.value) {
    try {
      const result = (gridRef.value as any).getTableData()

      return makeFlatData(result?.fullData || [], '_X_ROW_CHILD')
    } catch (error) {
      console.error(t('mdTable.countMethod.getDataError'), error)
      return []
    }
  }
  return []
}

const selectedCountMethod = computed<CountMethod>(() => {
  if (!props.column) {
    return
  }
  const viewColumns = mdTable.columns.value
  const viewColumn = viewColumns.find((item: any) => String(item.field_name) === String(props.column.field))
  return (viewColumn?.countMethod || 'none') as CountMethod
})

// 处理统计方法选择
const handleMethodSelect = async (method: CountMethod) => {
  if (!props.column) {
    return
  }
  if (!props.column.field) {
    return
  }
  const fullColumn = mdTable.columns.value.find((col: any) => String(col.field_name) === String(props.column.field))
  if (!fullColumn?.id) {
    return
  }
  await mdTable.updateViewColumnCountMethod?.(fullColumn.id, method)
  mdTable.updateExpandedRows?.()
  await mdTable.refreshTableData?.({ silent: true, keepPage: true })
  await getAgg({ silent: true })
}
</script>

<style scoped lang="scss">
.footer-count {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  min-width: 0;

  .method-name {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }

  .count-value {
    font-weight: 500;
    color: #606266;
    flex-shrink: 0;
  }

  .count-value--none {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-weight: 500;
    color: #606266;
    width: 100%;
    opacity: 0;
    min-width: 0;

    .method-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 1;
      min-width: 0;
    }

    .dropdown-icon {
      flex-shrink: 0;
    }
  }

  .dropdown-icon {
    font-size: 12px;
    color: #909399;
    transition: transform 0.2s;
    flex-shrink: 0;
  }
}
.el-dropdown {
  width: 100%;
  .footer-count {
    width: 100%;
    text-align: right;
    &:hover {
      .count-value--none {
        opacity: 1;
      }
    }
  }
}
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;

  &.is-active {
    background-color: #ecf5ff;
    color: #409eff;

    .method-label {
      font-weight: 500;
    }
  }

  .method-label {
    flex: 1;
    font-size: 14px;
  }

  .check-icon {
    color: #409eff;
    font-size: 16px;
    margin-left: 8px;
  }
}
</style>
